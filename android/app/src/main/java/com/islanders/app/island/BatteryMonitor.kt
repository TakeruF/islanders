package com.islanders.app.island

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.BatteryManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import org.json.JSONObject
import kotlin.math.abs

/**
 * Polls BatteryManager + Intent.ACTION_BATTERY_CHANGED at `pollMs` cadence and
 * pushes a normalised snapshot to [onSnap]. Cheap: ~1 IPC per poll.
 */
class BatteryMonitor(
    private val context: Context,
    private val pollMs: Long,
    private val onSnap: (JSONObject) -> Unit,
) {
    private val scope = CoroutineScope(Dispatchers.Default)
    private var job: Job? = null
    private var lastIntent: Intent? = null

    private val receiver = object : BroadcastReceiver() {
        override fun onReceive(c: Context?, intent: Intent?) { lastIntent = intent }
    }

    fun start() {
        if (job?.isActive == true) return
        context.registerReceiver(receiver, IntentFilter(Intent.ACTION_BATTERY_CHANGED))
        job = scope.launch {
            val bm = context.getSystemService(Context.BATTERY_SERVICE) as BatteryManager
            while (isActive) {
                runCatching { onSnap(buildSnap(bm)) }
                delay(pollMs)
            }
        }
    }

    fun stop() {
        job?.cancel(); job = null
        runCatching { context.unregisterReceiver(receiver) }
    }

    private fun buildSnap(bm: BatteryManager): JSONObject {
        // BatteryManager: µA for current, capacity = 0..100
        val currentUa = bm.getIntProperty(BatteryManager.BATTERY_PROPERTY_CURRENT_NOW)
        val level = bm.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY)

        val sticky = lastIntent
        val voltageMv = sticky?.getIntExtra(BatteryManager.EXTRA_VOLTAGE, -1) ?: -1
        val tempDeci  = sticky?.getIntExtra(BatteryManager.EXTRA_TEMPERATURE, Int.MIN_VALUE) ?: Int.MIN_VALUE
        val plugged   = sticky?.getIntExtra(BatteryManager.EXTRA_PLUGGED, 0) ?: 0
        val statusInt = sticky?.getIntExtra(BatteryManager.EXTRA_STATUS, BatteryManager.BATTERY_STATUS_UNKNOWN)
            ?: BatteryManager.BATTERY_STATUS_UNKNOWN

        val currentMa = currentUa / 1000.0
        val voltageV  = if (voltageMv > 0) voltageMv / 1000.0 else 0.0
        val watts     = abs(currentMa / 1000.0) * voltageV

        return JSONObject().apply {
            put("watts", round(watts, 2))
            put("currentMa", round(currentMa, 0))
            put("voltageV", round(voltageV, 3))
            put("level", level)
            put("plugged", plugString(plugged))
            put("status", statusString(statusInt))
            put("protocol", ChargingProtocol.classify(watts, plugged))
            if (tempDeci != Int.MIN_VALUE) put("batteryTempC", tempDeci / 10.0)
            put("timestamp", System.currentTimeMillis())
        }
    }

    private fun plugString(p: Int) = when (p) {
        BatteryManager.BATTERY_PLUGGED_AC       -> "AC"
        BatteryManager.BATTERY_PLUGGED_USB      -> "USB"
        BatteryManager.BATTERY_PLUGGED_WIRELESS -> "WIRELESS"
        BatteryManager.BATTERY_PLUGGED_DOCK     -> "DOCK"
        else -> "NONE"
    }

    private fun statusString(s: Int) = when (s) {
        BatteryManager.BATTERY_STATUS_CHARGING     -> "charging"
        BatteryManager.BATTERY_STATUS_DISCHARGING  -> "discharging"
        BatteryManager.BATTERY_STATUS_FULL         -> "full"
        BatteryManager.BATTERY_STATUS_NOT_CHARGING -> "not_charging"
        else -> "unknown"
    }

    private fun round(v: Double, digits: Int): Double {
        val k = Math.pow(10.0, digits.toDouble())
        return Math.round(v * k) / k
    }
}
