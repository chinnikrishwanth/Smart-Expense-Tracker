package com.example.upiexpensetracker.ui.settings

import androidx.lifecycle.ViewModel
import com.example.upiexpensetracker.data.local.PreferenceManager

class SettingsViewModel(private val preferenceManager: PreferenceManager) : ViewModel() {

    fun logout() {
        preferenceManager.clear()
        // Here you might also clear database tables via repository if needed
    }
}
