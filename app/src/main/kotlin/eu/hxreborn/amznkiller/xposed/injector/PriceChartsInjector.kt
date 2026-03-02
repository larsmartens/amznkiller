package eu.hxreborn.amznkiller.xposed.injector

import android.webkit.WebView
import eu.hxreborn.amznkiller.prefs.PrefsSnapshot
import eu.hxreborn.amznkiller.util.Logger
import eu.hxreborn.amznkiller.xposed.bridge.ChartMode
import eu.hxreborn.amznkiller.xposed.js.ScriptId
import eu.hxreborn.amznkiller.xposed.js.ScriptRepository
import eu.hxreborn.amznkiller.xposed.js.WebViewJsExecutor
import eu.hxreborn.amznkiller.xposed.runtime.AmazonUrlInfo
import org.json.JSONObject

object PriceChartsInjector {
    private val KEEPA_DOMAINS =
        mapOf(
            "amazon.com" to 1,
            "amazon.co.uk" to 2,
            "amazon.de" to 3,
            "amazon.fr" to 4,
            "amazon.co.jp" to 5,
            "amazon.ca" to 6,
            "amazon.it" to 8,
            "amazon.es" to 9,
            "amazon.in" to 10,
            "amazon.com.mx" to 11,
            "amazon.com.br" to 12,
            "amazon.com.au" to 13,
        )

    private val CAMEL_LOCALES =
        mapOf(
            "amazon.com" to "us",
            "amazon.co.uk" to "uk",
            "amazon.de" to "de",
            "amazon.fr" to "fr",
            "amazon.co.jp" to "jp",
            "amazon.ca" to "ca",
            "amazon.it" to "it",
            "amazon.es" to "es",
            "amazon.com.au" to "au",
        )

    fun inject(
        webView: WebView,
        prefs: PrefsSnapshot,
        amazon: AmazonUrlInfo,
    ) {
        if (!prefs.priceChartsEnabled) return
        if (!amazon.isProductPage) return
        val asin = amazon.asin ?: return
        val domain = amazon.domain ?: return
        val keepaId = KEEPA_DOMAINS[domain] ?: 1
        val camelLocale = CAMEL_LOCALES[domain] ?: "us"
        val mode = ChartMode.fromPref(prefs.chartMode)

        Logger.logDebug("PriceChartsInjector: $asin on $domain mode=$mode")

        when (mode) {
            ChartMode.STATIC -> {
                injectStatic(
                    webView,
                    prefs,
                    asin,
                    domain,
                    keepaId,
                    camelLocale,
                )
            }

            ChartMode.KEEPA_OVERLAY -> {
                injectKeepaOverlay(
                    webView,
                    prefs,
                    asin,
                    keepaId,
                )
            }

            ChartMode.CUSTOM -> {
                injectCustom(
                    webView,
                    prefs,
                    asin,
                    domain,
                    keepaId,
                    camelLocale,
                )
            }
        }
    }

    private fun injectStatic(
        webView: WebView,
        prefs: PrefsSnapshot,
        asin: String,
        domain: String,
        keepaId: Int,
        camelLocale: String,
        forceInteractive: Boolean = false,
    ) {
        val args =
            JSONObject().apply {
                put("asin", asin)
                put("domain", domain)
                put("keepaId", keepaId)
                put("camelLocale", camelLocale)
                put("dark", prefs.forceDarkWebview)
                put("defaultRange", prefs.chartDefaultRange)
                put(
                    "interactiveEnabled",
                    forceInteractive || prefs.chartInteractiveEnabled,
                )
            }
        val script =
            ScriptRepository.get(ScriptId.CHARTS) +
                "\n" +
                "window.AmznKiller.injectCharts($args);"
        WebViewJsExecutor.evaluate(
            webView,
            script,
            "PriceChartsInjector",
        ) {
            Logger.logDebug("PriceChartsInjector static: $it")
        }
    }

    private fun injectKeepaOverlay(
        webView: WebView,
        prefs: PrefsSnapshot,
        asin: String,
        keepaId: Int,
    ) {
        Logger.logDebug("PriceChartsInjector: injecting Keepa iframe inline")
        val args =
            JSONObject().apply {
                put("asin", asin)
                put("keepaId", keepaId)
                put("dark", prefs.forceDarkWebview)
            }
        val script =
            ScriptRepository.get(ScriptId.KEEPA_INLINE) +
                "\n" +
                "window.AmznKiller.injectKeepaInline($args);"
        WebViewJsExecutor.evaluate(
            webView,
            script,
            "PriceChartsInjector:keepa_inline",
        ) {
            Logger.logDebug("PriceChartsInjector keepa_inline: $it")
        }
    }

    private fun injectCustom(
        webView: WebView,
        prefs: PrefsSnapshot,
        asin: String,
        domain: String,
        keepaId: Int,
        camelLocale: String,
    ) {
        // Custom mode uses the static chart with interactive controls
        // enabled (range + type buttons). The previous KeepaDataScraper
        // approach is unreliable because Keepa's SPA requires
        // authentication and doesn't fire expected XHR calls in a
        // headless WebView context.
        Logger.logDebug(
            "PriceChartsInjector: custom mode -> static+interactive",
        )
        injectStatic(
            webView,
            prefs,
            asin,
            domain,
            keepaId,
            camelLocale,
            forceInteractive = true,
        )
    }
}
