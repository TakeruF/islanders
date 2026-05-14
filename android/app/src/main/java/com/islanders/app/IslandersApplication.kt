package com.islanders.app

import android.app.Application
import com.islanders.app.island.IslandNotificationChannels

class IslandersApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        IslandNotificationChannels.ensure(this)
    }
}
