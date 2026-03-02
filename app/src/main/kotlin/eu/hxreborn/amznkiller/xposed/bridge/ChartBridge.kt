package eu.hxreborn.amznkiller.xposed.bridge

import android.content.Intent
import android.webkit.JavascriptInterface
import android.webkit.WebView
import eu.hxreborn.amznkiller.prefs.PrefsManager
import eu.hxreborn.amznkiller.util.Logger
import eu.hxreborn.amznkiller.xposed.js.ScriptId
import eu.hxreborn.amznkiller.xposed.js.ScriptRepository
import eu.hxreborn.amznkiller.xposed.js.WebViewJsExecutor
import org.json.JSONObject
import java.lang.ref.WeakReference

class ChartBridge(
    webView: WebView,
) {
    private val webViewRef = WeakReference(webView)

    @JavascriptInterface
    fun openInteractiveChart(
        asin: String,
        keepaId: Int,
    ) {
        Logger.logDebug(
            "ChartBridge: openInteractiveChart asin=$asin keepaId=$keepaId",
        )
        val webView = webViewRef.get() ?: return
        val dark = PrefsManager.forceDarkWebview
        val args =
            JSONObject().apply {
                put("asin", asin)
                put("keepaId", keepaId)
                put("dark", dark)
            }
        val script =
            ScriptRepository.get(ScriptId.KEEPA_INLINE) +
                "\n" +
                "window.AmznKiller.injectKeepaInline($args);"
        WebViewJsExecutor.evaluate(
            webView,
            script,
            "ChartBridge:keepa_inline",
        ) {
            Logger.logDebug("ChartBridge keepa_inline: $it")
        }
    }

    @JavascriptInterface
    fun dismissChart() {
        Logger.logDebug("ChartBridge: dismissChart")
    }

    @JavascriptInterface
    fun shareProduct(
        url: String,
        title: String,
    ) {
        Logger.logDebug("ChartBridge: shareProduct url=$url")
        val webView = webViewRef.get() ?: return
        val context = webView.context
        val intent =
            Intent(Intent.ACTION_SEND).apply {
                type = "text/plain"
                putExtra(Intent.EXTRA_SUBJECT, title)
                putExtra(Intent.EXTRA_TEXT, url)
            }
        context.startActivity(
            Intent.createChooser(intent, "Share"),
        )
    }

    @JavascriptInterface
    fun onKeepaData(json: String) {
        Logger.logDebug("ChartBridge: onKeepaData received (${json.length} chars)")
        KeepaDataScraper.onDataReceived(json)
    }

    @JavascriptInterface
    fun getPrefs(): String {
        val snap = PrefsManager.snapshot()
        return JSONObject()
            .apply {
                put("defaultRange", snap.chartDefaultRange)
                put("interactiveEnabled", snap.chartInteractiveEnabled)
                put("chartMode", snap.chartMode)
            }.toString()
    }

    companion object {
        const val BRIDGE_NAME = "AmznKillerBridge"
    }
}
