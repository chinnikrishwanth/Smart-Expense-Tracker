package com.example.upiexpensetracker.ui.auth

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Button
import android.widget.EditText
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.ViewModelProvider
import com.example.upiexpensetracker.MainActivity
import com.example.upiexpensetracker.R
import com.example.upiexpensetracker.data.api.ApiClient
import com.example.upiexpensetracker.data.local.PreferenceManager
import com.example.upiexpensetracker.data.local.database.AppDatabase
import com.example.upiexpensetracker.data.repository.AuthRepository
import com.example.upiexpensetracker.ui.auth.viewmodels.AuthViewModel
import com.example.upiexpensetracker.ui.auth.viewmodels.AuthViewModelFactory
import com.example.upiexpensetracker.ui.dashboard.DashboardActivity

class LoginActivity : AppCompatActivity() {

    private lateinit var viewModel: AuthViewModel
    private lateinit var tilEmail: com.google.android.material.textfield.TextInputLayout
    private lateinit var etEmail: EditText
    private lateinit var tilPassword: com.google.android.material.textfield.TextInputLayout
    private lateinit var etPassword: EditText
    private lateinit var btnLogin: Button
    private lateinit var progressBar: ProgressBar
    private lateinit var tvGoToRegister: TextView
    private lateinit var preferenceManager: PreferenceManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_login)
        
        preferenceManager = PreferenceManager(this)
        
        // Auto-login check
        if (!preferenceManager.getToken().isNullOrEmpty()) {
            startActivity(Intent(this, DashboardActivity::class.java))
            finish()
            return
        }

        initViews()
        setupViewModel()
        setupObservers()
        setupListeners()
    }

    private fun initViews() {
        tilEmail = findViewById(R.id.tilEmail)
        etEmail = findViewById(R.id.etEmail)
        tilPassword = findViewById(R.id.tilPassword)
        etPassword = findViewById(R.id.etPassword)
        btnLogin = findViewById(R.id.btnLogin)
        progressBar = findViewById(R.id.progressBar)
        tvGoToRegister = findViewById(R.id.tvGoToRegister)
    }

    private fun setupViewModel() {
        val database = AppDatabase.getDatabase(this)
        val apiService = ApiClient.apiService
        val repository = AuthRepository(apiService, database.userDao(), preferenceManager)
        val factory = AuthViewModelFactory(repository)
        viewModel = ViewModelProvider(this, factory)[AuthViewModel::class.java]
    }

    private fun setupObservers() {
        viewModel.loginResult.observe(this) { result ->
            result.onSuccess {
                Toast.makeText(this, "Login Successful", Toast.LENGTH_SHORT).show()
                startActivity(Intent(this, DashboardActivity::class.java))
                finish()
            }.onFailure { e ->
                Toast.makeText(this, "Login Failed: ${e.message}", Toast.LENGTH_LONG).show()
            }
        }

        viewModel.isLoading.observe(this) { isLoading ->
            progressBar.visibility = if (isLoading) View.VISIBLE else View.GONE
            btnLogin.isEnabled = !isLoading
        }
    }

    private fun setupListeners() {
        btnLogin.setOnClickListener {
            val email = etEmail.text.toString().trim()
            val password = etPassword.text.toString().trim()

            if (email.isNotEmpty() && password.isNotEmpty()) {
                viewModel.login(email, password)
            } else {
                Toast.makeText(this, "Please fill all fields", Toast.LENGTH_SHORT).show()
            }
        }

        tvGoToRegister.setOnClickListener {
            startActivity(Intent(this, RegisterActivity::class.java))
            finish()
        }
        
        // Clear errors on typing
        val textWatcher = object : android.text.TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                tilEmail.error = null
                tilPassword.error = null
            }
            override fun afterTextChanged(s: android.text.Editable?) {}
        }
        etEmail.addTextChangedListener(textWatcher)
        etPassword.addTextChangedListener(textWatcher)
    }
}
