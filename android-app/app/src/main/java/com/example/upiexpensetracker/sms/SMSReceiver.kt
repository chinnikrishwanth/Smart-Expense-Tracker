package com.example.upiexpensetracker.sms

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.provider.Telephony
import android.telephony.SmsMessage
import android.util.Log
import androidx.core.content.ContextCompat
import com.example.upiexpensetracker.utils.NotificationHelper
import com.example.upiexpensetracker.data.local.PreferenceManager

class SMSReceiver : BroadcastReceiver() {
    
    companion object {
        private const val TAG = "SMSReceiver"
        
        // Keywords to identify transaction SMS
        private val TRANSACTION_KEYWORDS = listOf(
            "upi", "debited", "credited", "transaction", "bank", "account",
            "payment", "received", "sent", "paid", "transfer", "avl bal",
            "imps", "neft", "rtgs", "atm", "card", "vpa", "upi ref"
        )
    }
    
    override fun onReceive(context: Context, intent: Intent) {
        Log.d(TAG, "SMS received")
        
        // Check if SMS permissions are granted
        if (!PreferenceManager.areSMSPermissionsGranted(context)) {
            Log.w(TAG, "SMS permissions not granted")
            return
        }
        
        // Check if service is enabled
        if (!PreferenceManager.isServiceEnabled(context)) {
            Log.d(TAG, "Service is disabled")
            return
        }
        
        // Extract SMS messages
        val smsMessages = extractSMSMessages(intent)
        if (smsMessages.isEmpty()) {
            Log.w(TAG, "No SMS messages found")
            return
        }
        
        // Process each SMS
        for (sms in smsMessages) {
            processSMS(context, sms)
        }
    }
    
    private fun extractSMSMessages(intent: Intent): List<SmsMessage> {
        return try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
                Telephony.Sms.Intents.getMessagesFromIntent(intent)?.toList() ?: emptyList()
            } else {
                @Suppress("DEPRECATION")
                val pdus = intent.extras?.get("pdus") as? Array<*>
                pdus?.map { pdu ->
                    SmsMessage.createFromPdu(pdu as ByteArray)
                } ?: emptyList()
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error extracting SMS messages", e)
            emptyList()
        }
    }
    
    private fun processSMS(context: Context, sms: SmsMessage) {
        val messageBody = sms.messageBody ?: return
        val sender = sms.originatingAddress ?: "Unknown"
        val timestamp = System.currentTimeMillis()
        
        Log.d(TAG, "Processing SMS from: $sender")
        Log.d(TAG, "Message: ${messageBody.take(100)}...")
        
        // Check if it's a transaction SMS
        if (!isTransactionSMS(messageBody)) {
            Log.d(TAG, "Not a transaction SMS")
            return
        }
        
        // Show notification for testing
        NotificationHelper.showSMSReceivedNotification(
            context,
            "UPI Transaction Detected",
            "Processing transaction from SMS..."
        )
        
        // Start service to process SMS in background
        val serviceIntent = Intent(context, SMSService::class.java).apply {
            putExtra("sms_body", messageBody)
            putExtra("sender", sender)
            putExtra("timestamp", timestamp)
        }
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            ContextCompat.startForegroundService(context, serviceIntent)
        } else {
            context.startService(serviceIntent)
        }
    }
    
    private fun isTransactionSMS(message: String): Boolean {
        val lowerMessage = message.lowercase()
        return TRANSACTION_KEYWORDS.any { keyword ->
            lowerMessage.contains(keyword)
        }
    }
}