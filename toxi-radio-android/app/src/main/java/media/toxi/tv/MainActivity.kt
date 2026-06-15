package media.toxi.radio

import android.content.ComponentName
import android.content.Intent
import android.content.ServiceConnection
import android.os.Build
import android.os.Bundle
import android.os.IBinder
import android.view.KeyEvent
import android.view.View
import android.view.WindowInsets
import android.view.WindowInsetsController
import android.view.WindowManager
import androidx.appcompat.app.AppCompatActivity
import androidx.media3.cast.CastPlayer
import androidx.media3.cast.SessionAvailabilityListener
import androidx.media3.common.MediaItem
import com.google.android.gms.cast.framework.CastButtonFactory
import com.google.android.gms.cast.framework.CastContext
import com.google.android.gms.cast.framework.CastState
import com.google.android.gms.cast.framework.CastStateListener
import media.toxi.radio.databinding.ActivityMainBinding

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private var radioService: RadioService? = null
    private var serviceBound = false
    private var castPlayer: CastPlayer? = null
    private var isCasting = false
    private var castStateListener: CastStateListener? = null

    private val serviceConnection = object : ServiceConnection {
        override fun onServiceConnected(name: ComponentName, binder: IBinder) {
            radioService = (binder as RadioService.RadioBinder).getService()
            serviceBound = true
            radioService!!.onTrackChanged = { title ->
                runOnUiThread { updateOverlay(title) }
            }
            updateOverlay(getCurrentSlot().item.title)
            setupCast()
        }

        override fun onServiceDisconnected(name: ComponentName) {
            serviceBound = false
            radioService = null
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)
        window.decorView.post { hideSystemUI() }

        val intent = Intent(this, RadioService::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(intent)
        } else {
            startService(intent)
        }
        bindService(intent, serviceConnection, BIND_AUTO_CREATE)
    }

    private fun setupCast() {
        val isTV = packageManager.hasSystemFeature(android.content.pm.PackageManager.FEATURE_LEANBACK)
        if (!isTV) {
            try {
                val castContext = CastContext.getSharedInstance(this)
                castPlayer = CastPlayer(castContext).apply {
                    setSessionAvailabilityListener(object : SessionAvailabilityListener {
                        override fun onCastSessionAvailable() {
                            try {
                                isCasting = true
                                val slot = getCurrentSlot()
                                radioService?.player?.pause()
                                setMediaItem(
                                    MediaItem.Builder()
                                        .setUri("https://stream.mux.com/${slot.item.id}.m3u8")
                                        .setMimeType("application/x-mpegURL")
                                        .build(),
                                    slot.offsetMs
                                )
                                prepare()
                                play()
                            } catch (e: Exception) {
                                android.util.Log.e("ToxiRadio", "Error al iniciar Cast: ${e.message}")
                                isCasting = false
                            }
                        }
                        override fun onCastSessionUnavailable() {
                            try {
                                isCasting = false
                                stop()
                                radioService?.loadSlot(getCurrentSlot())
                            } catch (e: Exception) {
                                android.util.Log.e("ToxiRadio", "Error al detener Cast: ${e.message}")
                            }
                        }
                    })
                }
                CastButtonFactory.setUpMediaRouteButton(applicationContext, binding.castButton)
                castStateListener = CastStateListener { state ->
                    binding.castButton.visibility =
                        if (state == CastState.NO_DEVICES_AVAILABLE) View.GONE else View.VISIBLE
                }.also { castContext.addCastStateListener(it) }
            } catch (e: Exception) {
                android.util.Log.w("ToxiRadio", "Cast no disponible: ${e.message}")
                binding.castButton.visibility = View.GONE
            }
        } else {
            binding.castButton.visibility = View.GONE
        }
    }

    private fun updateOverlay(title: String) {
        val svc = radioService ?: return
        binding.titleText.text = title
        binding.nowText.text = "RADIO TOXI"
        binding.nextText.text = getNextTitle(svc.currentIndex)
        binding.overlay.visibility = View.VISIBLE
    }

    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        return when (keyCode) {
            KeyEvent.KEYCODE_DPAD_CENTER,
            KeyEvent.KEYCODE_ENTER,
            KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE,
            KeyEvent.KEYCODE_DPAD_UP,
            KeyEvent.KEYCODE_DPAD_DOWN,
            KeyEvent.KEYCODE_DPAD_LEFT,
            KeyEvent.KEYCODE_DPAD_RIGHT -> true
            else -> super.onKeyDown(keyCode, event)
        }
    }

    override fun onResume() {
        super.onResume()
        hideSystemUI()
        if (isCasting || !serviceBound) return
        val svc = radioService ?: return
        val slot = getCurrentSlot()
        if (slot.index != svc.currentIndex) {
            svc.loadSlot(slot)
        } else {
            svc.player.seekTo(slot.offsetMs)
            svc.player.play()
        }
    }

    // onPause SIN player.pause() para que el audio siga en segundo plano

    override fun onDestroy() {
        super.onDestroy()
        if (serviceBound) {
            radioService?.onTrackChanged = null
            unbindService(serviceConnection)
            serviceBound = false
        }
        castStateListener?.let {
            try { CastContext.getSharedInstance(this).removeCastStateListener(it) } catch (_: Exception) {}
        }
        castPlayer?.setSessionAvailabilityListener(null)
        castPlayer?.release()
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) hideSystemUI()
    }

    private fun hideSystemUI() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            window.insetsController?.let {
                it.hide(WindowInsets.Type.statusBars() or WindowInsets.Type.navigationBars())
                it.systemBarsBehavior =
                    WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            }
        } else {
            @Suppress("DEPRECATION")
            window.decorView.systemUiVisibility = (
                View.SYSTEM_UI_FLAG_FULLSCREEN
                    or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                    or View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                )
        }
    }
}
