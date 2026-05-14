package com.islanders.app.island

import android.os.Build

/** Identifies ColorOS / OxygenOS hosts that surface 流体云 capsule. */
object HostDetect {
    val isColorOsHost: Boolean by lazy {
        val brand = Build.BRAND.lowercase()
        val manuf = Build.MANUFACTURER.lowercase()
        brand.contains("oppo") || brand.contains("oneplus") || brand.contains("realme") ||
            manuf.contains("oppo") || manuf.contains("oneplus") || manuf.contains("realme")
    }

    /** Android 16 (API 36) introduced the official Live Update API. */
    val hasLiveUpdateApi: Boolean = Build.VERSION.SDK_INT >= 36

    /** Android 12+ exposes promoted-ongoing surfaces (status-bar chip). */
    val canStatusBarChip: Boolean = Build.VERSION.SDK_INT >= 31
}
