package com.example.upiexpensetracker.ui.settings

import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import com.example.upiexpensetracker.R
import com.example.upiexpensetracker.data.local.PreferenceManager
import com.example.upiexpensetracker.data.local.database.AppDatabase
import com.example.upiexpensetracker.ui.auth.LoginActivity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class SettingsActivity : AppCompatActivity() {

    private lateinit var preferenceManager: PreferenceManager
    private lateinit var btnLogout: Button
    private lateinit var tvUserEmail: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_settings)

        preferenceManager = PreferenceManager(this)
        
        initViews()
        loadUserData()
        setupListeners()
    }

    private fun initViews() {
        btnLogout = findViewById(R.id.btnLogout)
        tvUserEmail = findViewById(R.id.tvUserEmail)
    }

    private fun loadUserData() {
        val database = AppDatabase.getDatabase(this)
        // Fetch user data from Room
        CoroutineScope(Dispatchers.IO).launch {
            val user = database.userDao().getUser()
            withContext(Dispatchers.Main) {
                if (user != null) {
                    tvUserEmail.text = user.email
                } else {
                    // Fallback if no user in DB (rare if logged in)
                    tvUserEmail.text = "User"
                }
            }
        }
    }

    private fun setupListeners() {
        btnLogout.setOnClickListener {
            // Clearing data
            preferenceManager.clearToken()
            
            val database = AppDatabase.getDatabase(this)
            CoroutineScope(Dispatchers.IO).launch {
                database.clearAllTables() // Clear local DB on logout
                withContext(Dispatchers.Main) {
                    val intent = Intent(this@SettingsActivity, LoginActivity::class.java)
                    intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                    startActivity(intent)
                    finish()
                }
            }
        }
    }
}
