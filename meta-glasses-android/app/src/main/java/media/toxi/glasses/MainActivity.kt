package media.toxi.glasses

import android.Manifest
import android.os.Bundle
import android.widget.Button
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import androidx.activity.ComponentActivity
import androidx.activity.result.contract.ActivityResultContracts
import androidx.lifecycle.lifecycleScope
import com.meta.wearable.dat.camera.Camera
import com.meta.wearable.dat.camera.addCamera
import com.meta.wearable.dat.camera.types.PhotoData
import com.meta.wearable.dat.camera.types.StreamConfiguration
import com.meta.wearable.dat.camera.types.VideoQuality
import com.meta.wearable.dat.core.Wearables
import com.meta.wearable.dat.core.selectors.AutoDeviceSelector
import com.meta.wearable.dat.core.session.DeviceSession
import com.meta.wearable.dat.core.session.DeviceSessionState
import com.meta.wearable.dat.core.types.Permission
import com.meta.wearable.dat.core.types.PermissionStatus
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
    private lateinit var status: TextView
    private lateinit var preview: ImageView
    private var session: DeviceSession? = null
    private var camera: Camera? = null

    private val bluetoothLauncher =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
            if (granted) ensureCameraPermission() else show("Bluetooth permission denied")
        }

    // Camera permission is granted on the glasses side through the Meta AI app.
    private val glassesPermissionLauncher =
        registerForActivityResult(Wearables.RequestPermissionContract()) { result ->
            result
                .onSuccess { if (it == PermissionStatus.Granted) startSession() else show("Camera permission denied") }
                .onFailure { error, _ -> show(error.description) }
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        status = TextView(this).apply { text = "Not connected"; textSize = 16f }
        preview = ImageView(this).apply { adjustViewBounds = true }
        val connect = Button(this).apply {
            text = "1. Register with Meta AI"
            setOnClickListener { Wearables.startRegistration(this@MainActivity) }
        }
        val start = Button(this).apply {
            text = "2. Connect glasses"
            setOnClickListener { bluetoothLauncher.launch(Manifest.permission.BLUETOOTH_CONNECT) }
        }
        val photo = Button(this).apply {
            text = "3. Take photo"
            setOnClickListener { takePhoto() }
        }

        setContentView(
            LinearLayout(this).apply {
                orientation = LinearLayout.VERTICAL
                setPadding(48, 96, 48, 48)
                listOf(status, connect, start, photo, preview).forEach { addView(it) }
            }
        )

        lifecycleScope.launch {
            Wearables.registrationState.collect { show("Registration: $it") }
        }
    }

    private fun ensureCameraPermission() {
        lifecycleScope.launch {
            Wearables.checkPermissionStatus(Permission.CAMERA)
                .onSuccess {
                    if (it == PermissionStatus.Granted) startSession()
                    else glassesPermissionLauncher.launch(Permission.CAMERA)
                }
                .onFailure { error, _ -> show(error.description) }
        }
    }

    private fun startSession() {
        if (session != null) return
        Wearables.createSession(AutoDeviceSelector()).fold(
            onSuccess = { s ->
                session = s
                lifecycleScope.launch {
                    s.errors.collect { show("Session error: ${it.description}") }
                }
                lifecycleScope.launch {
                    s.state.collect { state ->
                        show("Session: $state")
                        if (state == DeviceSessionState.STARTED && camera == null) attachCamera(s)
                        if (state == DeviceSessionState.STOPPED) { session = null; camera = null }
                    }
                }
                s.start()
            },
            onFailure = { error, _ -> show(error.description) },
        )
    }

    private fun attachCamera(s: DeviceSession) {
        s.addCamera(StreamConfiguration(videoQuality = VideoQuality.MEDIUM, frameRate = 24)).fold(
            onSuccess = { cam ->
                camera = cam
                cam.stream.start().onFailure { error, _ -> show(error.description) }
                lifecycleScope.launch { cam.stream.state.collect { show("Stream: $it") } }
            },
            onFailure = { error, _ -> show(error.description) },
        )
    }

    private fun takePhoto() {
        val cam = camera ?: return show("Connect the glasses first")
        lifecycleScope.launch {
            cam.stream.capturePhoto()
                .onSuccess { data ->
                    when (data) {
                        is PhotoData.Bitmap -> preview.setImageBitmap(data.bitmap)
                        is PhotoData.HEIC -> show("Got HEIC photo (${data.data.remaining()} bytes)")
                    }
                }
                .onFailure { error, _ -> show(error.description) }
        }
    }

    private fun show(message: String) {
        status.text = message
    }

    override fun onDestroy() {
        camera?.stop()
        session?.stop()
        super.onDestroy()
    }
}
