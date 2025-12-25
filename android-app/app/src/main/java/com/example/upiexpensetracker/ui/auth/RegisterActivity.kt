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
import com.example.upiexpensetracker.R
import com.example.upiexpensetracker.data.api.ApiClient
import com.example.upiexpensetracker.data.local.PreferenceManager
import com.example.upiexpensetracker.data.local.database.AppDatabase
import com.example.upiexpensetracker.data.repository.AuthRepository
import com.example.upiexpensetracker.ui.auth.viewmodels.AuthViewModel
import com.example.upiexpensetracker.ui.auth.viewmodels.AuthViewModelFactory
import com.example.upiexpensetracker.ui.dashboard.DashboardActivity

class RegisterActivity : AppCompatActivity() {

    private lateinit var viewModel: AuthViewModel
    private lateinit var tilName: com.google.android.material.textfield.TextInputLayout
    private lateinit var etName: EditText
    private lateinit var tilEmail: com.google.android.material.textfield.TextInputLayout
    private lateinit var etEmail: EditText
    private lateinit var tilPhone: com.google.android.material.textfield.TextInputLayout
    private lateinit var etPhone: EditText
    private lateinit var tilPassword: com.google.android.material.textfield.TextInputLayout
    private lateinit var etPassword: EditText
    private lateinit var btnRegister: Button
    private lateinit var progressBar: ProgressBar
    private lateinit var tvGoToLogin: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_register)

        initViews()
        setupViewModel()
        setupObservers()
        setupListeners()
    }

    private fun initViews() {
        tilName = findViewById(R.id.tilName)
        etName = findViewById(R.id.etName)
        tilEmail = findViewById(R.id.tilEmail)
        etEmail = findViewById(R.id.etEmail)
        tilPhone = findViewById(R.id.tilPhone)
        etPhone = findViewById(R.id.etPhone)
        tilPassword = findViewById(R.id.tilPassword)
        etPassword = findViewById(R.id.etPassword)
        btnRegister = findViewById(R.id.btnRegister)
        progressBar = findViewById(R.id.progressBar)
        tvGoToLogin = findViewById(R.id.tvGoToLogin)
    }

    private fun setupViewModel() {
        val database = AppDatabase.getDatabase(this)
        val apiService = ApiClient.getApiService(this)
        val preferenceManager = PreferenceManager(this)
        val repository = AuthRepository(apiService, database.userDao(), preferenceManager)
        val factory = AuthViewModelFactory(repository)
        viewModel = ViewModelProvider(this, factory)[AuthViewModel::class.java]
    }

    private fun setupObservers() {
        viewModel.registerResult.observe(this) { result ->
            result.onSuccess {
                Toast.makeText(this, "Registration Successful", Toast.LENGTH_SHORT).show()
                startActivity(Intent(this, DashboardActivity::class.java))
                finish()
            }.onFailure { e ->
                Toast.makeText(this, "Registration Failed: ${e.message}", Toast.LENGTH_LONG).show()
            }
        }

        viewModel.isLoading.observe(this) { isLoading ->
            progressBar.visibility = if (isLoading) View.VISIBLE else View.GONE
            btnRegister.isEnabled = !isLoading
        }
    }

    private fun setupListeners() {
        btnRegister.setOnClickListener {
            val name = etName.text.toString().trim()
            val email = etEmail.text.toString().trim()
            val phone = etPhone.text.toString().trim()
            val password = etPassword.text.toString().trim()

            if (name.isNotEmpty() && email.isNotEmpty() && password.isNotEmpty()) {
                viewModel.register(name, email, password, phone)
            } else {
                Toast.makeText(this, "Please fill all fields", Toast.LENGTH_SHORT).show()
            }
        }

        tvGoToLogin.setOnClickListener {
            startActivity(Intent(this, LoginActivity::class.java))
            finish()
        }

        // Clear errors on typing
        val textWatcher = object : android.text.TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                tilName.error = null
                tilEmail.error = null
                tilPhone.error = null
                tilPassword.error = null
            }
            override fun afterTextChanged(s: android.text.Editable?) {}
        }
        etName.addTextChangedListener(textWatcher)
        etEmail.addTextChangedListener(textWatcher)
        etPhone.addTextChangedListener(textWatcher)
        etPassword.addTextChangedListener(textWatcher)
    }
}
