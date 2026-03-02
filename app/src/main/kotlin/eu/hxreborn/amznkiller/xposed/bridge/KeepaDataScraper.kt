package eu.hxreborn.amznkiller.xposed.bridge

import android.annotation.SuppressLint
import android.app.Activity
import android.os.Handler
import android.os.Looper
import android.view.View
import android.view.ViewGroup
import android.webkit.JavascriptInterface
import android.webkit.WebView
import android.webkit.WebViewClient
import eu.hxreborn.amznkiller.util.Logger
import eu.hxreborn.amznkiller.xposed.js.ScriptId
import eu.hxreborn.amznkiller.xposed.js.ScriptRepository

object KeepaDataScraper {
    private const val TIMEOUT_MS = 20_000L
    private val mainHandler = Handler(Looper.getMainLooper())

    @Volatile
    private var pendingCallback: ((String?) -> Unit)? = null

    @Volatile
    private var hiddenWebView: WebView? = null

    fun scrape(
        activity: Activity,
        asin: String,
        keepaId: Int,
        callback: (String?) -> Unit,
    ) {
        mainHandler.post {
            doScrape(activity, asin, keepaId, callback)
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun doScrape(
        activity: Activity,
        asin: String,
        keepaId: Int,
        callback: (String?) -> Unit,
    ) {
        cleanup()
        pendingCallback = callback

        val webView =
            WebView(activity).apply {
                layoutParams =
                    ViewGroup.LayoutParams(0, 0)
                visibility = View.GONE
                settings.javaScriptEnabled = true
                settings.domStorageEnabled = true
                settings.databaseEnabled = true
                addJavascriptInterface(ScraperBridge(), ChartBridge.BRIDGE_NAME)
                webViewClient =
                    object : WebViewClient() {
                        private var interceptorInjected = false

                        override fun onPageFinished(
                            view: WebView?,
                            url: String?,
                        ) {
                            Logger.logDebug(
                                "KeepaDataScraper: page finished $url",
                            )
                            injectInterceptor(view)
                        }

                        override fun onPageStarted(
                            view: WebView?,
                            url: String?,
                            favicon: android.graphics.Bitmap?,
                        ) {
                            interceptorInjected = false
                        }

                        private fun injectInterceptor(view: WebView?) {
                            if (interceptorInjected) return
                            interceptorInjected = true
                            Logger.logDebug(
                                "KeepaDataScraper: injecting interceptor",
                            )
                            val script =
                                ScriptRepository.get(ScriptId.KEEPA_INTERCEPTOR)
                            view?.evaluateJavascript(script, null)
                        }
                    }
            }

        hiddenWebView = webView

        // Attach to activity so it has a valid context for rendering
        val decorView = activity.window.decorView as? ViewGroup
        decorView?.addView(webView)

        val url = "https://keepa.com/#!product/$keepaId-$asin"
        Logger.logDebug("KeepaDataScraper: loading $url")
        webView.loadUrl(url)

        // Timeout fallback
        mainHandler.postDelayed({
            if (pendingCallback != null) {
                Logger.logDebug("KeepaDataScraper: timeout, falling back")
                val cb = pendingCallback
                pendingCallback = null
                cleanup()
                cb?.invoke(null)
            }
        }, TIMEOUT_MS)
    }

    fun onDataReceived(json: String) {
        mainHandler.post {
            Logger.logDebug("KeepaDataScraper: data received (${json.length} chars)")
            val cb = pendingCallback
            pendingCallback = null
            cleanup()
            cb?.invoke(json)
        }
    }

    private fun cleanup() {
        hiddenWebView?.let { wv ->
            (wv.parent as? ViewGroup)?.removeView(wv)
            wv.stopLoading()
            wv.destroy()
        }
        hiddenWebView = null
    }

    private class ScraperBridge {
        @JavascriptInterface
        fun onKeepaData(json: String) {
            onDataReceived(json)
        }

        @JavascriptInterface
        fun openInteractiveChart(
            asin: String,
            keepaId: Int,
        ) {
            // no-op in hidden webview
        }

        @JavascriptInterface
        fun dismissChart() {
            // no-op in hidden webview
        }

        @JavascriptInterface
        fun shareProduct(
            url: String,
            title: String,
        ) {
            // no-op in hidden webview
        }

        @JavascriptInterface
        fun getPrefs(): String = "{}"
    }
}
