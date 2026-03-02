package eu.hxreborn.amznkiller.xposed.injector

import android.app.Activity
import android.webkit.WebView
import eu.hxreborn.amznkiller.prefs.PrefsSnapshot
import eu.hxreborn.amznkiller.util.Logger
import eu.hxreborn.amznkiller.xposed.bridge.ChartMode
import eu.hxreborn.amznkiller.xposed.bridge.ChartOverlay
import eu.hxreborn.amznkiller.xposed.bridge.KeepaDataScraper
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
        val activity = webView.context as? Activity
        if (activity == null) {
            Logger.logDebug("PriceChartsInjector: overlay no activity")
            return
        }
        Logger.logDebug("PriceChartsInjector: auto-opening overlay")
        val dark = prefs.forceDarkWebview
        activity.runOnUiThread {
            ChartOverlay.show(activity, asin, keepaId, dark)
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
        val activity = webView.context as? Activity
        if (activity == null) {
            Logger.logDebug("PriceChartsInjector: no activity context")
            injectStatic(
                webView,
                prefs,
                asin,
                domain,
                keepaId,
                camelLocale,
            )
            return
        }

        KeepaDataScraper.scrape(activity, asin, keepaId) { json ->
            if (json == null) {
                Logger.logDebug("PriceChartsInjector: scraper timeout")
                injectStatic(
                    webView,
                    prefs,
                    asin,
                    domain,
                    keepaId,
                    camelLocale,
                )
                return@scrape
            }

            Logger.logDebug("PriceChartsInjector: injecting uPlot")
            val keepaValue =
                org.json.JSONTokener(json).nextValue()
            val args =
                JSONObject().apply {
                    put("asin", asin)
                    put("domain", domain)
                    put("keepaId", keepaId)
                    put("dark", prefs.forceDarkWebview)
                    put("defaultRange", prefs.chartDefaultRange)
                    put("keepaData", keepaValue)
                }
            val script =
                ScriptRepository.get(ScriptId.UPLOT_LIB) +
                    "\n" +
                    ScriptRepository.get(ScriptId.CHARTS_UPLOT) +
                    "\n" +
                    "window.AmznKiller.injectUplotChart($args);"
            WebViewJsExecutor.evaluate(
                webView,
                script,
                "PriceChartsInjector:uplot",
            ) {
                Logger.logDebug("PriceChartsInjector uplot: $it")
            }
        }
    }
}
