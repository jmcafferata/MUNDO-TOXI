package media.toxi.glasses

import android.app.Application
import android.util.Log
import com.meta.wearable.dat.core.Wearables

class MyApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        Wearables.initialize(this)
            .onFailure { error, _ -> Log.e("Glasses", "DAT init failed: ${error.description}") }
    }
}
