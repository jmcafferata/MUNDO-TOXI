import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import * as ScreenOrientation from 'expo-screen-orientation';
import { CastButton, MediaStreamType, useRemoteMediaClient } from 'react-native-google-cast';
import { getCurrentSlot, setRemotePlaylist, TvItem, TvSlot } from './src/playlist';

const PLAYLIST_URL = 'https://toxi.media/api/playlist';

export default function App() {
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [currentTitle, setCurrentTitle]     = useState('');

  const currentIndexRef  = useRef<number>(-1);
  const currentSlotRef   = useRef<TvSlot | null>(null);
  const wasCastingRef    = useRef(false);
  const pendingSeekRef   = useRef<number | null>(null);
  const overlayTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const driftTimerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const castClient = useRemoteMediaClient();

  const player = useVideoPlayer(null, (p) => {
    p.loop = false;
  });

  // ── Overlay ───────────────────────────────────────────────────────────────

  const showOverlay = useCallback((title: string) => {
    setCurrentTitle(title);
    setOverlayVisible(true);
    if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);
    overlayTimerRef.current = setTimeout(() => setOverlayVisible(false), 5000);
  }, []);

  const toggleOverlay = useCallback(() => {
    if (overlayVisible) {
      if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);
      setOverlayVisible(false);
    } else {
      showOverlay(getCurrentSlot().item.title);
    }
  }, [overlayVisible, showOverlay]);

  // ── Carga de slot ─────────────────────────────────────────────────────────

  const loadSlotOnCast = useCallback(async (slot: TvSlot) => {
    if (!castClient) return;
    try {
      await castClient.loadMedia({
        autoplay: true,
        startTime: slot.offsetMs / 1000,
        mediaInfo: {
          contentUrl: `https://stream.mux.com/${slot.item.id}.m3u8`,
          contentType: 'application/x-mpegURL',
          streamType: MediaStreamType.BUFFERED,
          streamDuration: slot.item.duration,
          metadata: {
            type: 'movie',
            title: slot.item.title,
            subtitle: 'TOXI TV',
          },
        },
      });
    } catch {
      // Si falla el envio al Chromecast, la app sigue reproduciendo local.
    }
  }, [castClient]);

  const loadSlot = useCallback((slot: TvSlot) => {
    currentIndexRef.current = slot.index;
    currentSlotRef.current  = slot;

    if (castClient) {
      loadSlotOnCast(slot);
      player.pause();
    } else {
      pendingSeekRef.current  = slot.offsetMs / 1000;
      player.replace({ uri: `https://stream.mux.com/${slot.item.id}.m3u8` });
    }

    showOverlay(slot.item.title);
  }, [castClient, loadSlotOnCast, player, showOverlay]);

  // Seek al punto correcto una vez que el video está listo
  useEffect(() => {
    const sub = player.addListener('statusChange', ({ status }: { status: string }) => {
      if (status === 'readyToPlay' && pendingSeekRef.current !== null) {
        player.currentTime    = pendingSeekRef.current;
        pendingSeekRef.current = null;
        player.play();
      }
    });
    return () => sub.remove();
  }, [player]);

  // Al terminar un video cargar el siguiente slot
  useEffect(() => {
    const sub = player.addListener('playToEnd', () => {
      if (castClient) return;
      loadSlot(getCurrentSlot());
    });
    return () => sub.remove();
  }, [castClient, player, loadSlot]);

  // Si se conecta/desconecta Cast, cambia la salida entre TV remota y reproductor local.
  useEffect(() => {
    if (castClient) {
      wasCastingRef.current = true;
      const slot = currentSlotRef.current ?? getCurrentSlot();
      loadSlot(slot);
      return;
    }

    if (wasCastingRef.current) {
      wasCastingRef.current = false;
      loadSlot(getCurrentSlot());
    }
  }, [castClient, loadSlot]);

  // ── Inicio ────────────────────────────────────────────────────────────────

  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    activateKeepAwakeAsync();

    fetch(PLAYLIST_URL)
      .then(r => r.json())
      .then((data: TvItem[]) => {
        if (Array.isArray(data) && data.length > 0) setRemotePlaylist(data);
      })
      .catch(() => { /* usa playlist hardcodeada */ })
      .finally(() => {
        loadSlot(getCurrentSlot());

        // Corrección de drift cada 30 s (igual que la app Android y tv.html)
        driftTimerRef.current = setInterval(() => {
          const slot = getCurrentSlot();
          if (slot.index !== currentIndexRef.current) {
            loadSlot(slot);
          } else if (castClient) {
            // En Cast no forzamos seek continuo; solo resincronizamos por cambio de slot.
          } else {
            const diff = Math.abs(player.currentTime - slot.offsetMs / 1000);
            if (diff > 5) player.currentTime = slot.offsetMs / 1000;
          }
        }, 30_000);
      });

    return () => {
      if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);
      if (driftTimerRef.current)   clearInterval(driftTimerRef.current);
      deactivateKeepAwake();
    };
  }, [castClient, loadSlot, player]);

  // ── UI ────────────────────────────────────────────────────────────────────

  return (
    <TouchableWithoutFeedback onPress={toggleOverlay}>
      <View style={styles.container}>
        <VideoView
          player={player}
          style={styles.video}
          nativeControls={false}
          contentFit="cover"
          allowsFullscreen={false}
        />
        <CastButton style={styles.castButton} />
        {overlayVisible && (
          <View style={styles.overlay}>
            <Text style={styles.nowLabel}>AHORA</Text>
            <Text style={styles.title} numberOfLines={2}>{currentTitle}</Text>
          </View>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  video: {
    flex: 1,
  },
  castButton: {
    position: 'absolute',
    top: 18,
    right: 18,
    width: 32,
    height: 32,
    tintColor: '#ffffff',
    opacity: 0.92,
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.72)',
    paddingHorizontal: 28,
    paddingVertical: 18,
    paddingBottom: 26,
  },
  nowLabel: {
    color: '#888',
    fontSize: 11,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: 6,
    fontWeight: '600',
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    lineHeight: 28,
  },
});
