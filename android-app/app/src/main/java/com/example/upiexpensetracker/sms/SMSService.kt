package com.example.upiexpensetracker.sms

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import com.example.upiexpensetracker.R
import com.example.upiexpensetracker.data.api.ApiClient
import com.example.upiexpensetracker.data.models.SMSRequest
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class SMSService : Service() {
    
    companion object {
        private const val TAG = "SMSService"
        private const val NOTIFICATION_CHANNEL_ID = "sms_processing_channel"
        private const val NOTIFICATION_ID = 101
    }
    
    override fun onBind(intent: Intent?): IBinder? = null
    
    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }
    
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val notification = createNotification()
        startForeground(NOTIFICATION_ID, notification)
        
        val smsBody = intent?.getStringExtra("sms_body")
        val sender = intent?.getStringExtra("sender")
        val timestamp = intent?.getLongExtra("timestamp", System.currentTimeMillis()) ?: System.currentTimeMillis()
        
        if (smsBody != null && sender != null) {
            processSMS(sender, smsBody, timestamp)
        } else {
            stopSelf()
        }
        
        return START_NOT_STICKY
    }
    
    private fun processSMS(sender: String, body: String, timestamp: Long) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val request = SMSRequest(sender, body, timestamp)
                val response = ApiClient.apiService.processUnknownSMS(request)
                if (response.isSuccessful && response.body()?.success == true) {
                    Log.d(TAG, "SMS processed successfully")
                } else {
                    Log.e(TAG, "Failed to process SMS: ${response.message()}")
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error processing SMS", e)
            } finally {
                stopSelf()
            }
        }
    }
    
    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                NOTIFICATION_CHANNEL_ID,
                "SMS Processing Service",
                NotificationManager.IMPORTANCE_LOW
            )
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }
    
    private fun createNotification(): Notification {
        return NotificationCompat.Builder(this, NOTIFICATION_CHANNEL_ID)
            .setContentTitle("Processing Transaction")
            .setContentText("Analyzing incoming SMS...")
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .build()
    }
}