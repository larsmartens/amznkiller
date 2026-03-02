package eu.hxreborn.amznkiller.xposed.bridge

enum class ChartMode(val value: String) {
    STATIC("static"),
    CUSTOM("custom"),
    KEEPA_OVERLAY("keepa_overlay"),
    ;

    companion object {
        fun fromPref(pref: String) = entries.firstOrNull { it.value == pref } ?: STATIC
    }
}
