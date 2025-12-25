package com.example.upiexpensetracker.data.local

import android.content.Context
import android.content.SharedPreferences

class PreferenceManager(context: Context) {
    private val prefs: SharedPreferences = context.getSharedPreferences("upi_expense_prefs", Context.MODE_PRIVATE)

    fun saveToken(token: String) {
        prefs.edit().putString("auth_token", token).apply()
    }

    fun getToken(): String? {
        return prefs.getString("auth_token", null)
    }

    fun clear() {
        prefs.edit().clear().apply()
    }

    companion object {
        fun areSMSPermissionsGranted(context: Context): Boolean {
            return androidx.core.content.ContextCompat.checkSelfPermission(
                context,
                android.Manifest.permission.RECEIVE_SMS
            ) == android.content.pm.PackageManager.PERMISSION_GRANTED
        }

        fun isServiceEnabled(context: Context): Boolean {
            // Defaults to true for this MVP
            return true
        }
    }
}
