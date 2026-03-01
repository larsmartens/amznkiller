package eu.hxreborn.amznkiller.xposed.bridge

import android.annotation.SuppressLint
import android.app.Activity
import android.graphics.Color
import android.view.Gravity
import android.view.KeyEvent
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import android.widget.ImageButton
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView
import eu.hxreborn.amznkiller.util.Logger

object ChartOverlay {
    private var overlayView: View? = null
    private var overlayWebView: WebView? = null

    @SuppressLint("SetJavaScriptEnabled")
    fun show(activity: Activity, asin: String, keepaId: Int) {
        if (overlayView != null) dismiss()

        val density = activity.resources.displayMetrics.density
        val dp = { value: Int -> (value * density).toInt() }

        val container = FrameLayout(activity).apply {
            setBackgroundColor(Color.argb(128, 0, 0, 0))
            isClickable = true
            isFocusable = true
            isFocusableInTouchMode = true
            setOnClickListener { dismiss() }
            setOnKeyListener { _, keyCode, event ->
                if (keyCode == KeyEvent.KEYCODE_BACK && event.action == KeyEvent.ACTION_UP) {
                    dismiss()
                    true
                } else false
            }
        }

        val sheet = LinearLayout(activity).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(Color.WHITE)
            isClickable = true
            elevation = dp(8).toFloat()
        }

        val header = LinearLayout(activity).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding(dp(16), dp(12), dp(8), dp(12))
            setBackgroundColor(Color.parseColor("#F5F5F5"))
        }

        val titleView = TextView(activity).apply {
            text = "Keepa Price History"
            textSize = 16f
            setTextColor(Color.parseColor("#212121"))
            layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f)
        }
        header.addView(titleView)

        val closeButton = ImageButton(activity).apply {
            setBackgroundColor(Color.TRANSPARENT)
            setColorFilter(Color.parseColor("#757575"))
            contentDescription = "Close"
            setPadding(dp(12), dp(12), dp(12), dp(12))
            setOnClickListener { dismiss() }
        }
        // Use a simple X text instead of depending on a drawable
        val closeText = TextView(activity).apply {
            text = "\u2715"
            textSize = 20f
            setTextColor(Color.parseColor("#757575"))
            setPadding(dp(12), dp(8), dp(12), dp(8))
            setOnClickListener { dismiss() }
        }
        header.addView(closeText)
        sheet.addView(header)

        val progress = ProgressBar(activity, null, android.R.attr.progressBarStyleHorizontal).apply {
            isIndeterminate = true
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                dp(4),
            )
        }
        sheet.addView(progress)

        val webView = WebView(activity).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.cacheMode = WebSettings.LOAD_DEFAULT
            settings.useWideViewPort = true
            settings.loadWithOverviewMode = true
            settings.builtInZoomControls = true
            settings.displayZoomControls = false
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                0,
                1f,
            )
            webViewClient = object : WebViewClient() {
                override fun onPageFinished(view: WebView?, url: String?) {
                    progress.visibility = View.GONE
                }
            }
        }
        overlayWebView = webView
        sheet.addView(webView)

        val sheetParams = FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT,
        ).apply {
            topMargin = (activity.resources.displayMetrics.heightPixels * 0.15).toInt()
        }
        container.addView(sheet, sheetParams)

        val decorView = activity.window.decorView as? FrameLayout ?: return
        decorView.addView(
            container,
            FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT,
            ),
        )
        overlayView = container
        container.requestFocus()

        val url = "https://keepa.com/#!product/$keepaId-$asin"
        Logger.logDebug("ChartOverlay: loading $url")
        webView.loadUrl(url)
    }

    fun dismiss() {
        overlayWebView?.destroy()
        overlayWebView = null
        overlayView?.let { view ->
            (view.parent as? ViewGroup)?.removeView(view)
        }
        overlayView = null
    }
}
