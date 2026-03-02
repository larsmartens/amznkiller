package eu.hxreborn.amznkiller.xposed.js

enum class ScriptId(
    val path: String,
) {
    AD_BLOCK("payload/js/ad_block.js"),
    DARK_MODE("payload/js/dark_mode.js"),
    CHARTS("payload/js/charts.js"),
    UPLOT_LIB("payload/js/uplot.min.js"),
    CHARTS_UPLOT("payload/js/charts_uplot.js"),
    KEEPA_INLINE("payload/js/keepa_inline.js"),
    KEEPA_INTERCEPTOR("payload/js/keepa_interceptor.js"),
}
