package com.islanders.app.plugin

import android.Manifest
import android.app.NotificationManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.ServiceConnection
import android.content.pm.PackageManager
import android.os.Build
import android.os.IBinder
import androidx.core.content.ContextCompat
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.getcapacitor.annotation.Permission
import com.getcapacitor.annotation.PermissionCallback
import com.islanders.app.island.BatteryMonitor
import com.islanders.app.island.HostDetect
import com.islanders.app.island.IslandLiveService
import com.islanders.app.island.IslandNotificationChannels
import com.islanders.app.island.LiveUpdatePoster
import com.islanders.app.island.ThermalMonitor
import org.json.JSONObject

@CapacitorPlugin(
    name = "IslanderBridge",
    permissions = [
        Permission(
            alias = "post-notifications",
            strings = [Manifest.permission.POST_NOTIFICATIONS],
        ),
    ],
)
class IslanderBridgePlugin : Plugin() {

    private lateinit var poster: LiveUpdatePoster

    private var battery: BatteryMonitor? = null
    private var thermal: ThermalMonitor? = null
    private var lastBatteryTempC: Double? = null
    private val activeModules = mutableSetOf<String>()

    private var serviceBinder: IslandLiveService.LocalBinder? = null
    private val serviceConn = object : ServiceConnection {
        override fun onServiceConnected(name: ComponentName?, b: IBinder?) {
            serviceBinder = b as? IslandLiveService.LocalBinder
        }
        override fun onServiceDisconnected(name: ComponentName?) { serviceBinder = null }
    }

    override fun load() {
        IslandNotificationChannels.ensure(context)
        poster = LiveUpdatePoster(context)
    }

    @PluginMethod
    fun getPromotionStatus(call: PluginCall) {
        val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val canPostPromoted = if (Build.VERSION.SDK_INT >= 36) {
            runCatching {
                NotificationManager::class.java
                    .getMethod("canPostPromotedNotifications")
                    .invoke(nm) as? Boolean
            }.getOrNull() ?: false
        } else false

        call.resolve(JSObject().apply {
            put("canPostPromoted", canPostPromoted)
            put("liveUpdateApi", HostDetect.hasLiveUpdateApi)
            put("colorOsHost", HostDetect.isColorOsHost)
        })
    }

    @PluginMethod
    fun requestNotificationPermission(call: PluginCall) {
        if (Build.VERSION.SDK_INT < 33) {
            call.resolve(JSObject().put("granted", true)); return
        }
        val granted = ContextCompat.checkSelfPermission(
            context, Manifest.permission.POST_NOTIFICATIONS,
        ) == PackageManager.PERMISSION_GRANTED
        if (granted) {
            call.resolve(JSObject().put("granted", true)); return
        }
        requestPermissionForAlias("post-notifications", call, "onPermResult")
    }

    @PermissionCallback
    private fun onPermResult(call: PluginCall) {
        val granted = getPermissionState("post-notifications").toString() == "GRANTED"
        call.resolve(JSObject().put("granted", granted))
    }

    @PluginMethod
    fun enableModule(call: PluginCall) {
        val module = call.getString("module") ?: return call.reject("module required")
        val pollMs = call.getLong("pollMs") ?: defaultPoll(module)
        ensureService()
        activeModules.add(module)
        when (module) {
            "charging" -> startCharging(pollMs)
            "thermal"  -> startThermal(pollMs)
            "calculator", "currency" -> { /* JS pushes via updateModule */ }
            else -> return call.reject("unknown module $module")
        }
        call.resolve()
    }

    @PluginMethod
    fun disableModule(call: PluginCall) {
        val module = call.getString("module") ?: return call.reject("module required")
        activeModules.remove(module)
        when (module) {
            "charging" -> { battery?.stop(); battery = null }
            "thermal"  -> { thermal?.stop(); thermal = null }
        }
        poster.cancel(module)
        if (activeModules.isEmpty()) stopService()
        call.resolve()
    }

    @PluginMethod
    fun updateModule(call: PluginCall) {
        val module = call.getString("module") ?: return call.reject("module required")
        val data = call.getObject("data") ?: return call.reject("data required")
        val json = JSONObject(data.toString())
        when (module) {
            "calculator" -> poster.postCalculator(json)
            "currency"   -> poster.postCurrency(json)
            "charging"   -> poster.postCharging(json)  // allow JS overrides
            "thermal"    -> poster.postThermal(json)
        }
        call.resolve()
    }

    // ---- internal ---------------------------------------------------------

    private fun defaultPoll(module: String): Long = when (module) {
        "charging" -> 1500
        "thermal"  -> 4000
        else -> 0
    }

    private fun startCharging(pollMs: Long) {
        battery?.stop()
        battery = BatteryMonitor(context, pollMs) { snap ->
            lastBatteryTempC = snap.optDouble("batteryTempC", Double.NaN).takeIf { !it.isNaN() }
            poster.postCharging(snap)
            notifyListeners("charging", JSObject(snap.toString()))
        }.also { it.start() }
    }

    private fun startThermal(pollMs: Long) {
        thermal?.stop()
        thermal = ThermalMonitor(context, pollMs, { lastBatteryTempC }) { snap ->
            poster.postThermal(snap)
            notifyListeners("thermal", JSObject(snap.toString()))
        }.also { it.start() }
    }

    private fun ensureService() {
        if (serviceBinder != null) return
        val intent = Intent(context, IslandLiveService::class.java)
        ContextCompat.startForegroundService(context, intent)
        context.bindService(intent, serviceConn, Context.BIND_AUTO_CREATE)
    }

    private fun stopService() {
        runCatching { context.unbindService(serviceConn) }
        serviceBinder = null
        context.stopService(Intent(context, IslandLiveService::class.java))
    }

    override fun handleOnDestroy() {
        battery?.stop(); thermal?.stop()
        stopService()
        super.handleOnDestroy()
    }
}
