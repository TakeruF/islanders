package com.islanders.app

import android.os.Bundle
import com.getcapacitor.BridgeActivity
import com.islanders.app.plugin.IslanderBridgePlugin

class MainActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        registerPlugin(IslanderBridgePlugin::class.java)
        super.onCreate(savedInstanceState)
    }
}
