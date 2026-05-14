package com.islanders.app.island

import android.app.Notification
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Binder
import android.os.Build
import android.os.IBinder
import com.islanders.app.MainActivity
import com.islanders.app.R

/**
 * specialUse foreground service that keeps the monitor threads alive while
 * any module is enabled. The service's own foreground notification is a
 * minimal "Islanders running" placeholder distinct from the module live
 * updates so it doesn't compete for the status-bar chip slot.
 */
class IslandLiveService : Service() {

    private val binder = LocalBinder()

    inner class LocalBinder : Binder() { fun service(): IslandLiveService = this@IslandLiveService }

    override fun onBind(intent: Intent?): IBinder = binder

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        startForegroundCompat()
        return START_STICKY
    }

    fun stopIfIdle() {
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    private fun startForegroundCompat() {
        val pi = PendingIntent.getActivity(
            this, 0, Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
        )
        val n: Notification = Notification.Builder(this, LiveUpdatePoster.CHANNEL_CHARGING)
            .setSmallIcon(R.drawable.ic_island_bolt)
            .setContentTitle("Islanders")
            .setContentText("Live Update 監視中")
            .setOngoing(true)
            .setContentIntent(pi)
            .build()
        if (Build.VERSION.SDK_INT >= 34) {
            startForeground(NOTIF_ID, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE)
        } else {
            @Suppress("DEPRECATION")
            startForeground(NOTIF_ID, n)
        }
    }

    companion object { const val NOTIF_ID = 999 }
}
