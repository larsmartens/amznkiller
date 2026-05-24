package eu.hxreborn.amznkiller.prefs

import android.app.Application
import android.content.SharedPreferences
import android.content.res.Configuration
import android.util.Log
import eu.hxreborn.amznkiller.selectors.SelectorSanitizer
import eu.hxreborn.amznkiller.util.Logger
import io.github.libxposed.api.XposedInterface

data class PrefsSnapshot(
    val selectors: List<String>,
    val injectionEnabled: Boolean,
    val webviewDebugging: Boolean,
    val forceDarkMode: ForceDarkMode,
    val forceDarkWebview: Boolean,
    val priceChartsEnabled: Boolean,
    val chartDefaultRange: String,
    val chartInteractiveEnabled: Boolean,
    val chartMode: String,
)

object PrefsManager {
    @Volatile
    var remotePrefs: SharedPreferences? = null
        private set

    @Volatile
    private var cachedSelectors: List<String> = emptyList()

    val selectors: List<String>
        get() = cachedSelectors

    @Volatile
    private var cachedDebugLogs: Boolean = Prefs.DEBUG_LOGS.default

    val debugLogs: Boolean
        get() = cachedDebugLogs

    @Volatile
    private var cachedInjectionEnabled: Boolean = Prefs.INJECTION_ENABLED.default

    val injectionEnabled: Boolean
        get() = cachedInjectionEnabled

    @Volatile
    private var cachedWebviewDebugging: Boolean = Prefs.WEBVIEW_DEBUGGING.default

    val webviewDebugging: Boolean
        get() = cachedWebviewDebugging

    @Volatile
    private var cachedForceDarkMode: ForceDarkMode = ForceDarkMode.OFF

    val forceDarkMode: ForceDarkMode
        get() = cachedForceDarkMode

    val forceDarkWebview: Boolean
        get() = cachedForceDarkMode.isActive(systemInDarkMode())

    @Volatile
    private var cachedPriceChartsEnabled: Boolean = Prefs.PRICE_CHARTS_ENABLED.default

    val priceChartsEnabled: Boolean
        get() = cachedPriceChartsEnabled

    @Volatile
    var chartDefaultRange: String = Prefs.CHART_DEFAULT_RANGE.default
        private set

    @Volatile
    var chartInteractiveEnabled: Boolean = Prefs.CHART_INTERACTIVE_ENABLED.default
        private set

    @Volatile
    var chartMode: String = Prefs.CHART_MODE.default
        private set

    @Volatile
    var hideRufus: Boolean = Prefs.HIDE_RUFUS.default
        private set

    fun init(xposed: XposedInterface) {
        runCatching {
            remotePrefs = xposed.getRemotePreferences(Prefs.GROUP)
            refreshCache()
            Logger.debug { "PrefsManager initialized" }
        }.onFailure { Logger.log(Log.ERROR, "PrefsManager.init() failed", it) }
    }

    private fun refreshCache() {
        runCatching {
            remotePrefs?.let { prefs ->
                val raw = Prefs.CACHED_SELECTORS.read(prefs)
                selectors = SelectorSanitizer.sanitize(raw.lineSequence())
                debugLogs = Prefs.DEBUG_LOGS.read(prefs)
                injectionEnabled = Prefs.INJECTION_ENABLED.read(prefs)
                webviewDebugging = Prefs.WEBVIEW_DEBUGGING.read(prefs)
                forceDarkMode = Prefs.readForceDarkMode(prefs)
                priceChartsEnabled = Prefs.PRICE_CHARTS_ENABLED.read(prefs)
                chartDefaultRange = Prefs.CHART_DEFAULT_RANGE.read(prefs)
                chartInteractiveEnabled = Prefs.CHART_INTERACTIVE_ENABLED.read(prefs)
                chartMode = Prefs.CHART_MODE.read(prefs)
                hideRufus = Prefs.HIDE_RUFUS.read(prefs)
            }
        }.onFailure { Logger.log(Log.ERROR, "refreshCache() failed", it) }
    }

    fun snapshot() =
        PrefsSnapshot(
            selectors = selectors,
            injectionEnabled = injectionEnabled,
            webviewDebugging = webviewDebugging,
            forceDarkMode = forceDarkMode,
            forceDarkWebview = forceDarkMode.isActive(systemInDarkMode()),
            priceChartsEnabled = priceChartsEnabled,
            chartDefaultRange = chartDefaultRange,
            chartInteractiveEnabled = chartInteractiveEnabled,
            chartMode = chartMode,
        )
    }

    private fun systemInDarkMode(): Boolean {
        val uiMode = currentApplication()?.resources?.configuration?.uiMode ?: return false
        return uiMode and Configuration.UI_MODE_NIGHT_MASK == Configuration.UI_MODE_NIGHT_YES
    }

    fun setFallbackSelectors(fallback: List<String>) {
        cachedSelectors = fallback
    }

    fun isStale(): Boolean {
        val fetched =
            runCatching {
                remotePrefs?.let { Prefs.LAST_FETCHED.read(it) }
            }.getOrNull() ?: 0L
        return System.currentTimeMillis() - fetched > Prefs.STALE_THRESHOLD_MS
    }

    private inline fun <T> readRemote(
        fallback: T,
        read: (SharedPreferences) -> T,
        cache: (T) -> Unit,
    ): T {
        val value =
            runCatching {
                remotePrefs?.let(read)
            }.getOrNull() ?: return fallback
        cache(value)
        return value
    }
}

private fun currentApplication(): Application? =
    runCatching {
        Class
            .forName("android.app.ActivityThread")
            .getMethod("currentApplication")
            .invoke(null) as? Application
    }.getOrNull()
