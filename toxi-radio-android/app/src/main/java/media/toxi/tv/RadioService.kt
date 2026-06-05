package media.toxi.radio

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Binder
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import androidx.core.app.NotificationCompat
import androidx.media3.common.C
import androidx.media3.common.MediaItem
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.exoplayer.trackselection.DefaultTrackSelector

class RadioService : Service() {

    inner class RadioBinder : Binder() {
        fun getService(): RadioService = this@RadioService
    }

    private val binder = RadioBinder()

    lateinit var player: ExoPlayer
        private set

    var currentIndex = -1
        private set

    var onTrackChanged: ((String) -> Unit)? = null

    private val handler = Handler(Looper.getMainLooper())

    private val driftRunnable = object : Runnable {
        override fun run() {
            val slot = getCurrentSlot()
            when {
                slot.index != currentIndex -> loadSlot(slot)
                Math.abs(player.currentPosition - slot.offsetMs) > 5_000 ->
                    player.seekTo(slot.offsetMs)
            }
            handler.postDelayed(this, 30_000)
        }
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()

        val trackSelector = DefaultTrackSelector(this).apply {
            setParameters(
                buildUponParameters()
                    .setTrackTypeDisabled(C.TRACK_TYPE_VIDEO, true)
            )
        }
        player = ExoPlayer.Builder(this)
            .setTrackSelector(trackSelector)
            .build()
        player.clearVideoSurface()

        player.addListener(object : Player.Listener {
            override fun onPlaybackStateChanged(state: Int) {
                if (state == Player.STATE_ENDED) {
                    loadSlot(getCurrentSlot())
                }
            }

            override fun onIsPlayingChanged(isPlaying: Boolean) {
                updateNotification(currentTitle())
            }
        })

        val notification = buildNotification("Radio Toxi")
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK)
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }

        loadSlot(getCurrentSlot())
        handler.postDelayed(driftRunnable, 30_000)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_TOGGLE_PLAYBACK -> togglePlayback()
            ACTION_STOP -> stopPlaybackService()
        }
        return START_STICKY
    }

    override fun onBind(intent: Intent): IBinder = binder

    override fun onDestroy() {
        super.onDestroy()
        handler.removeCallbacksAndMessages(null)
        player.release()
    }

    fun loadSlot(slot: TvSlot) {
        currentIndex = slot.index
        player.playWhenReady = true
        player.setMediaItem(
            MediaItem.Builder()
                .setUri("https://stream.mux.com/${slot.item.id}.m3u8")
                .setMimeType("application/x-mpegURL")
                .build()
        )
        player.seekTo(slot.offsetMs)
        player.prepare()
        updateNotification(slot.item.title)
        onTrackChanged?.invoke(slot.item.title)
    }

    private fun togglePlayback() {
        if (player.isPlaying) {
            player.pause()
        } else {
            player.play()
        }
        updateNotification(currentTitle())
    }

    private fun stopPlaybackService() {
        handler.removeCallbacksAndMessages(null)
        player.stop()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            stopForeground(STOP_FOREGROUND_REMOVE)
        } else {
            @Suppress("DEPRECATION")
            stopForeground(true)
        }
        stopSelf()
    }

    private fun updateNotification(title: String) {
        val nm = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
        nm.notify(NOTIFICATION_ID, buildNotification(title))
    }

    private fun buildNotification(title: String): Notification {
        val activityIntent = Intent(this, MainActivity::class.java)
        val contentIntent = PendingIntent.getActivity(
            this, 0, activityIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        val toggleIntent = PendingIntent.getService(
            this,
            1,
            Intent(this, RadioService::class.java).setAction(ACTION_TOGGLE_PLAYBACK),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        val stopIntent = PendingIntent.getService(
            this,
            2,
            Intent(this, RadioService::class.java).setAction(ACTION_STOP),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        val toggleLabel = if (player.isPlaying) "Pausa" else "Reanudar"
        val toggleIcon = if (player.isPlaying) android.R.drawable.ic_media_pause else android.R.drawable.ic_media_play
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Radio Toxi")
            .setContentText(title)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentIntent(contentIntent)
            .setOngoing(player.isPlaying)
            .setOnlyAlertOnce(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .addAction(toggleIcon, toggleLabel, toggleIntent)
            .addAction(android.R.drawable.ic_menu_close_clear_cancel, "Stop", stopIntent)
            .setSilent(true)
            .build()
    }

    private fun currentTitle(): String {
        return RADIO_PLAYLIST.getOrNull(currentIndex)?.title ?: "Radio Toxi"
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID, "Radio Toxi",
                NotificationManager.IMPORTANCE_LOW
            ).apply { description = "Reproducción de Radio Toxi en segundo plano" }
            (getSystemService(NOTIFICATION_SERVICE) as NotificationManager)
                .createNotificationChannel(channel)
        }
    }

    companion object {
        const val CHANNEL_ID = "radio_toxi_channel"
        const val NOTIFICATION_ID = 1
        const val ACTION_TOGGLE_PLAYBACK = "media.toxi.radio.action.TOGGLE_PLAYBACK"
        const val ACTION_STOP = "media.toxi.radio.action.STOP"
    }
}
