package eu.hxreborn.amznkiller.xposed.bridge

import android.app.Activity
import android.content.Intent
import android.webkit.JavascriptInterface
import android.webkit.WebView
import eu.hxreborn.amznkiller.prefs.PrefsManager
import eu.hxreborn.amznkiller.util.Logger
import org.json.JSONObject
import java.lang.ref.WeakReference

class ChartBridge(webView: WebView) {
    private val webViewRef = WeakReference(webView)

    @JavascriptInterface
    fun openInteractiveChart(asin: String, keepaId: Int) {
        Logger.logDebug("ChartBridge: openInteractiveChart asin=$asin keepaId=$keepaId")
        val webView = webViewRef.get() ?: return
        val activity = webView.context as? Activity ?: return
        activity.runOnUiThread {
            ChartOverlay.show(activity, asin, keepaId)
        }
    }

    @JavascriptInterface
    fun dismissChart() {
        Logger.logDebug("ChartBridge: dismissChart")
        val webView = webViewRef.get() ?: return
        val activity = webView.context as? Activity ?: return
        activity.runOnUiThread {
            ChartOverlay.dismiss()
        }
    }

    @JavascriptInterface
    fun shareProduct(url: String, title: String) {
        Logger.logDebug("ChartBridge: shareProduct url=$url")
        val webView = webViewRef.get() ?: return
        val context = webView.context
        val intent = Intent(Intent.ACTION_SEND).apply {
            type = "text/plain"
            putExtra(Intent.EXTRA_SUBJECT, title)
            putExtra(Intent.EXTRA_TEXT, url)
        }
        context.startActivity(Intent.createChooser(intent, "Share"))
    }

    @JavascriptInterface
    fun getPrefs(): String {
        val snap = PrefsManager.snapshot()
        return JSONObject().apply {
            put("defaultRange", snap.chartDefaultRange)
            put("interactiveEnabled", snap.chartInteractiveEnabled)
        }.toString()
    }

    companion object {
        const val BRIDGE_NAME = "AmznKillerBridge"
    }
}
