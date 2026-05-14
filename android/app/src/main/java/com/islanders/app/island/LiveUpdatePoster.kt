package com.islanders.app.island

import android.app.Notification
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.annotation.RequiresApi
import com.islanders.app.MainActivity
import com.islanders.app.R
import org.json.JSONObject

/**
 * Builds and posts the per-module Live Update notification.
 *
 * Implementation notes (per Android Live Update guide):
 *   - Live Update notifications MUST NOT use setCustomContentView (RemoteViews) —
 *     we use the built-in [Notification.ProgressStyle] / standard styling.
 *   - We call [Notification.Builder.setRequestPromotedOngoing] on API 36+ so
 *     ColorOS / Android can render the status-bar chip ("流体云" / status chip).
 *   - [Notification.Builder.setShortCriticalText] supplies the chip text
 *     (max 7 chars displays whole; over ~12 chars truncates with icon).
 *   - setColorized(true) and IMPORTANCE_MIN channels are disallowed.
 *
 * 4 module IDs map to 4 distinct notification IDs so they coexist.
 */
class LiveUpdatePoster(private val context: Context) {

    private val nm by lazy {
        context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    }

    fun postCharging(snap: JSONObject) {
        val watts   = snap.optDouble("watts", 0.0)
        val level   = snap.optInt("level", 0)
        val proto   = snap.optString("protocol", "Charging")
        val current = snap.optDouble("currentMa", 0.0) / 1000.0
        val voltage = snap.optDouble("voltageV", 0.0)

        val short = "${"%.1f".format(watts)}W"  // 5 chars → full text on status chip
        val title = "$proto · ${"%.1f".format(watts)} W"
        val text  = "${level}%  ·  ${"%.2f".format(current)} A  ·  ${"%.2f".format(voltage)} V"

        val b = baseBuilder(CHANNEL_CHARGING, R.drawable.ic_island_bolt, title, text, short)
        if (Build.VERSION.SDK_INT >= 36) attachProgress(b, level)
        nm.notify(ID_CHARGING, b.build())
    }

    fun postThermal(snap: JSONObject) {
        val soc       = snap.optDouble("socTempC", 0.0)
        val status    = snap.optInt("thermalStatus", 0)
        val throttle  = snap.optBoolean("throttling", false)
        val statusLbl = listOf("NONE","LIGHT","MODERATE","SEVERE","CRITICAL","EMERGENCY","SHUTDOWN")
            .getOrElse(status) { "NONE" }

        val short = "${"%.0f".format(soc)}°"
        val title = "SoC ${"%.1f".format(soc)}°C"
        val text  = if (throttle) "Throttling · $statusLbl" else "Healthy · $statusLbl"

        val b = baseBuilder(CHANNEL_THERMAL, R.drawable.ic_island_thermal, title, text, short)
        if (Build.VERSION.SDK_INT >= 36) {
            // 20°C..80°C clamped to a 0..100 progress for the bar.
            val pct = ((soc.coerceIn(20.0, 80.0) - 20.0) / 60.0 * 100.0).toInt()
            attachProgress(b, pct)
        }
        nm.notify(ID_THERMAL, b.build())
    }

    fun postCalculator(snap: JSONObject) {
        val expr = snap.optString("expression", "")
        val res  = snap.optString("result", "—")
        val history = snap.optJSONArray("history")
        val historyText = buildString {
            if (history != null) for (i in 0 until history.length()) {
                if (i > 0) append('\n')
                append(history.optString(i))
            }
        }

        val short = res.take(7)
        val title = "= $res"
        val text  = if (historyText.isNotBlank()) historyText else expr

        val b = baseBuilder(CHANNEL_CALCULATOR, R.drawable.ic_island_calc, title, text, short)
            .setStyle(Notification.BigTextStyle().bigText(text))
        nm.notify(ID_CALCULATOR, b.build())
    }

    fun postCurrency(snap: JSONObject) {
        val base  = snap.optString("base")
        val quote = snap.optString("quote")
        val rate  = snap.optDouble("rate", 0.0)
        val change = snap.optDouble("change24h", 0.0)
        val arrow = when {
            change >  0.0005 -> "▲"
            change < -0.0005 -> "▼"
            else -> "·"
        }

        val short = "${"%.3f".format(rate)}"
        val title = "1 $base = ${"%.4f".format(rate)} $quote"
        val text  = "$arrow ${"%.2f".format(change * 100)}% · ${snap.optString("source", "")}"

        val b = baseBuilder(CHANNEL_CURRENCY, R.drawable.ic_island_currency, title, text, short)
        nm.notify(ID_CURRENCY, b.build())
    }

    fun cancel(module: String) {
        when (module) {
            "charging"   -> nm.cancel(ID_CHARGING)
            "thermal"    -> nm.cancel(ID_THERMAL)
            "calculator" -> nm.cancel(ID_CALCULATOR)
            "currency"   -> nm.cancel(ID_CURRENCY)
        }
    }

    private fun baseBuilder(
        channel: String,
        @androidx.annotation.DrawableRes icon: Int,
        title: String,
        text: String,
        statusChip: String,
    ): Notification.Builder {
        val pi = PendingIntent.getActivity(
            context, 0,
            Intent(context, MainActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
        )
        val b = Notification.Builder(context, channel)
            .setSmallIcon(icon)
            .setContentTitle(title)
            .setContentText(text)
            .setContentIntent(pi)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setShowWhen(false)
            .setCategory(Notification.CATEGORY_STATUS)

        if (Build.VERSION.SDK_INT >= 36) {
            // Live Update promotion (status-bar chip on Android 16+).
            // setShortCriticalText / setRequestPromotedOngoing are 36+ APIs.
            attachPromotion(b, statusChip)
        }
        return b
    }

    @RequiresApi(36)
    private fun attachPromotion(b: Notification.Builder, statusChip: String) {
        // Reflective bridging keeps the source compiling against older SDKs while
        // still calling into the API 36 surface at runtime. Replace with direct
        // calls once compileSdk = 36 is the project floor everywhere.
        runCatching {
            Notification.Builder::class.java
                .getMethod("setShortCriticalText", CharSequence::class.java)
                .invoke(b, statusChip)
            Notification.Builder::class.java
                .getMethod("setRequestPromotedOngoing", Boolean::class.javaPrimitiveType)
                .invoke(b, true)
        }
    }

    @RequiresApi(36)
    private fun attachProgress(b: Notification.Builder, percent: Int) {
        runCatching {
            val styleClass = Class.forName("android.app.Notification\$ProgressStyle")
            val style = styleClass.getConstructor().newInstance()
            styleClass.getMethod("setProgress", Int::class.javaPrimitiveType).invoke(style, percent)
            styleClass.getMethod("setProgressMax", Int::class.javaPrimitiveType).invoke(style, 100)
            Notification.Builder::class.java
                .getMethod("setStyle", Notification.Style::class.java)
                .invoke(b, style as Notification.Style)
        }
    }

    companion object {
        const val CHANNEL_CHARGING   = "island_charging"
        const val CHANNEL_THERMAL    = "island_thermal"
        const val CHANNEL_CALCULATOR = "island_calculator"
        const val CHANNEL_CURRENCY   = "island_currency"

        const val ID_CHARGING   = 1001
        const val ID_THERMAL    = 1002
        const val ID_CALCULATOR = 1003
        const val ID_CURRENCY   = 1004
    }
}
