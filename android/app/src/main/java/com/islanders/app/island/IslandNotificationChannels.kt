package com.islanders.app.island

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import com.islanders.app.R

/**
 * Live Update notifications must NOT use IMPORTANCE_MIN. We use HIGH so the
 * status-bar chip ("status chip") is eligible for promotion on Android 16+.
 */
object IslandNotificationChannels {
    fun ensure(ctx: Context) {
        val nm = ctx.getSystemService(NotificationManager::class.java) ?: return
        listOf(
            triple(R.string.channel_charging_id,   R.string.channel_charging_name),
            triple(R.string.channel_thermal_id,    R.string.channel_thermal_name),
            triple(R.string.channel_calculator_id, R.string.channel_calculator_name),
            triple(R.string.channel_currency_id,   R.string.channel_currency_name),
        ).forEach { (id, name) ->
            if (nm.getNotificationChannel(ctx.getString(id)) == null) {
                nm.createNotificationChannel(
                    NotificationChannel(
                        ctx.getString(id),
                        ctx.getString(name),
                        NotificationManager.IMPORTANCE_HIGH,
                    ).apply {
                        setShowBadge(false)
                        enableVibration(false)
                        setSound(null, null)
                    },
                )
            }
        }
    }

    private fun triple(id: Int, name: Int) = Pair(id, name)
}
