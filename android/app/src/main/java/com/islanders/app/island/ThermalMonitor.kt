package com.islanders.app.island

import android.content.Context
import android.os.Build
import android.os.PowerManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import org.json.JSONObject
import java.io.File

/**
 * Reports the SoC die temperature and PowerManager thermal status. The SoC
 * reading uses the kernel's thermal_zone sysfs entries when readable — on
 * recent ColorOS this is gated, so we fall back to the battery temp from
 * BatteryMonitor.lastBatteryTempC.
 */
class ThermalMonitor(
    private val context: Context,
    private val pollMs: Long,
    private val getBatteryTempC: () -> Double?,
    private val onSnap: (JSONObject) -> Unit,
) {
    private val scope = CoroutineScope(Dispatchers.IO)
    private var job: Job? = null

    fun start() {
        if (job?.isActive == true) return
        val pm = context.getSystemService(Context.POWER_SERVICE) as PowerManager
        val thermalZones = discoverSocZones()

        job = scope.launch {
            while (isActive) {
                val soc = readSocTempC(thermalZones)
                val battery = getBatteryTempC()
                val status = if (Build.VERSION.SDK_INT >= 29) pm.currentThermalStatus else 0
                onSnap(JSONObject().apply {
                    put("socTempC", soc ?: battery ?: 0.0)
                    put("batteryTempC", battery ?: 0.0)
                    put("thermalStatus", status)
                    put("throttling", status >= PowerManager.THERMAL_STATUS_MODERATE)
                    put("timestamp", System.currentTimeMillis())
                })
                delay(pollMs)
            }
        }
    }

    fun stop() { job?.cancel(); job = null }

    private fun discoverSocZones(): List<File> {
        val base = File("/sys/class/thermal")
        if (!base.exists()) return emptyList()
        return base.listFiles { f -> f.name.startsWith("thermal_zone") }
            ?.filter { zone ->
                runCatching {
                    val type = File(zone, "type").readText().trim().lowercase()
                    type.contains("soc") || type.contains("cpu") || type.contains("tsens")
                }.getOrDefault(false)
            }
            .orEmpty()
    }

    private fun readSocTempC(zones: List<File>): Double? {
        if (zones.isEmpty()) return null
        val temps = zones.mapNotNull { zone ->
            runCatching {
                val raw = File(zone, "temp").readText().trim().toLong()
                if (raw > 1000) raw / 1000.0 else raw.toDouble()
            }.getOrNull()
        }
        return temps.maxOrNull()
    }
}
