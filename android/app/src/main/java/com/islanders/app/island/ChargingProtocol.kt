package com.islanders.app.island

import android.os.BatteryManager

/**
 * Best-effort fast-charge tier labelling based purely on instantaneous wattage.
 * ColorOS devices don't expose protocol negotiation via public API; we
 * approximate using the published thresholds for SUPERVOOC / VOOC / USB-PD / QC.
 */
object ChargingProtocol {
    fun classify(watts: Double, plugged: Int): String = when {
        plugged == BatteryManager.BATTERY_PLUGGED_WIRELESS -> "Wireless"
        watts >= 60.0 -> "SuperVOOC"
        watts >= 27.0 -> "VOOC"
        watts >= 18.0 -> "USB-PD"
        watts >= 7.5  -> "QC"
        watts >= 2.5  -> "USB"
        plugged == BatteryManager.BATTERY_PLUGGED_AC -> "AC"
        else -> "Unknown"
    }
}
