package eu.hxreborn.amznkiller.prefs

import eu.hxreborn.amznkiller.xposed.hook.cachedChartDefaultRange
import eu.hxreborn.amznkiller.xposed.hook.cachedChartInteractiveEnabled
import eu.hxreborn.amznkiller.xposed.hook.cachedChartMode
import eu.hxreborn.amznkiller.xposed.hook.cachedForceDarkMode
import eu.hxreborn.amznkiller.xposed.hook.cachedInjectionEnabled
import eu.hxreborn.amznkiller.xposed.hook.cachedPriceChartsEnabled
import eu.hxreborn.amznkiller.xposed.hook.cachedSelectors
import eu.hxreborn.amznkiller.xposed.hook.cachedWebviewDebugging
import eu.hxreborn.amznkiller.xposed.hook.forceDarkWebview as hookForceDarkWebview

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

// Compatibility for fork chart consumers; installHookPrefs owns and refreshes the cache.
object PrefsManager {
    val forceDarkWebview: Boolean
        get() = hookForceDarkWebview

    fun snapshot() =
        PrefsSnapshot(
            selectors = cachedSelectors,
            injectionEnabled = cachedInjectionEnabled,
            webviewDebugging = cachedWebviewDebugging,
            forceDarkMode = cachedForceDarkMode,
            forceDarkWebview = forceDarkWebview,
            priceChartsEnabled = cachedPriceChartsEnabled,
            chartDefaultRange = cachedChartDefaultRange,
            chartInteractiveEnabled = cachedChartInteractiveEnabled,
            chartMode = cachedChartMode,
        )
}
