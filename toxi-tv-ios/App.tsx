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
import { getCurrentSlot, setRemotePlaylist, TvItem, TvSlot } from './src/playlist';

const PLAYLIST_URL = 'https://toxi.media/api/playlist';

export default function App() {
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [currentTitle, setCurrentTitle]     = useState('');

  const currentIndexRef  = useRef<number>(-1);
  const pendingSeekRef   = useRef<number | null>(null);
  const overlayTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const driftTimerRef    = useRef<ReturnType<typeof setInterval> | null>(null);

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

  const loadSlot = useCallback((slot: TvSlot) => {
    currentIndexRef.current = slot.index;
    pendingSeekRef.current  = slot.offsetMs / 1000;
    player.replace({ uri: `https://stream.mux.com/${slot.item.id}.m3u8` });
    showOverlay(slot.item.title);
  }, [player, showOverlay]);

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
      loadSlot(getCurrentSlot());
    });
    return () => sub.remove();
  }, [player, loadSlot]);

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
  }, [loadSlot]);

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
