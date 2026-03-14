package eu.hxreborn.amznkiller.xposed.bridge

import android.app.Activity
import android.content.Intent
import android.webkit.JavascriptInterface
import android.webkit.WebView
import eu.hxreborn.amznkiller.prefs.PrefsManager
import eu.hxreborn.amznkiller.util.Logger
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
            "ChartBridge: openInteractiveChart " +
                "asin=$asin keepaId=$keepaId",
        )
        val webView = webViewRef.get() ?: return
        val activity = webView.context as? Activity
        if (activity == null) {
            Logger.logDebug(
                "ChartBridge: no activity context",
            )
            return
        }
        val dark = PrefsManager.forceDarkWebview
        activity.runOnUiThread {
            ChartOverlay.show(activity, asin, keepaId, dark)
        }
    }

    @JavascriptInterface
    fun dismissChart() {
        Logger.logDebug("ChartBridge: dismissChart")
        ChartOverlay.dismiss()
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
        Logger.logDebug(
            "ChartBridge: onKeepaData received " +
                "(${json.length} chars)",
        )
        KeepaDataScraper.onDataReceived(json)
    }

    @JavascriptInterface
    fun getPrefs(): String {
        val snap = PrefsManager.snapshot()
        return JSONObject()
            .apply {
                put("defaultRange", snap.chartDefaultRange)
                put(
                    "interactiveEnabled",
                    snap.chartInteractiveEnabled,
                )
                put("chartMode", snap.chartMode)
            }.toString()
    }

    companion object {
        const val BRIDGE_NAME = "AmznKillerBridge"
    }
}
