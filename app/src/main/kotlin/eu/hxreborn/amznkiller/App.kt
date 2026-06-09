package eu.hxreborn.amznkiller

import android.app.Application
import android.content.Context
import android.util.Log
import eu.hxreborn.amznkiller.prefs.Prefs
import eu.hxreborn.amznkiller.prefs.PrefsRepository
import io.github.libxposed.service.XposedService
import io.github.libxposed.service.XposedServiceHelper
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

data class XposedState(
    val active: Boolean = false,
    val frameworkVersion: String? = null,
)

class App :
    Application(),
    XposedServiceHelper.OnServiceListener {
    @Volatile
    private var mService: XposedService? = null

    lateinit var prefsRepository: PrefsRepository
        private set

    private val _xposedState = MutableStateFlow(XposedState())
    val xposedState: StateFlow<XposedState> = _xposedState.asStateFlow()

class App :
    Application(),
    XposedServiceHelper.OnServiceListener {
    @Volatile
    var mService: XposedService? = null
        private set

    lateinit var prefsRepository: PrefsRepository
        private set

    private val listeners = CopyOnWriteArrayList<XposedServiceHelper.OnServiceListener>()

    override fun onCreate() {
        super.onCreate()
        val local = getSharedPreferences(Prefs.GROUP, MODE_PRIVATE)
        prefsRepository =
            PrefsRepository(local) {
                runCatching { mService?.getRemotePreferences(Prefs.GROUP) }.getOrNull()
            }
        XposedServiceHelper.registerListener(this)
    }

    override fun onServiceBind(service: XposedService) {
        Log.i(TAG, "service bound: ${service.frameworkName} v${service.frameworkVersion}")
        mService = service
        prefsRepository.syncToRemote()
        listeners.forEach { it.onServiceBind(service) }
    }

    override fun onServiceDied(service: XposedService) {
        Log.w(TAG, "service died")
        mService = null
        listeners.forEach { it.onServiceDied(service) }
    }

    fun addServiceListener(listener: XposedServiceHelper.OnServiceListener) {
        listeners.add(listener)
        mService?.let { listener.onServiceBind(it) }
    }

    fun removeServiceListener(listener: XposedServiceHelper.OnServiceListener) {
        listeners.remove(listener)
    }

    companion object {
        private const val TAG = "AmznKiller"

        fun from(context: Context): App = context.applicationContext as App
    }
}
