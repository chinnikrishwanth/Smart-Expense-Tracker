package com.example.upiexpensetracker.ui.expenses

import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.ViewModelProvider
import com.example.upiexpensetracker.R
import com.example.upiexpensetracker.data.api.ApiClient
import com.example.upiexpensetracker.data.local.database.AppDatabase
import com.example.upiexpensetracker.data.repository.ExpenseRepository
import com.example.upiexpensetracker.ui.expenses.viewmodels.ExpenseViewModel
import com.example.upiexpensetracker.ui.expenses.viewmodels.ExpenseViewModelFactory

class AddExpenseActivity : AppCompatActivity() {

    private lateinit var viewModel: ExpenseViewModel
    private lateinit var etAmount: EditText
    private lateinit var etDescription: EditText
    private lateinit var etCategory: EditText
    private lateinit var btnAddExpense: Button

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_add_expense)

        initViews()
        setupViewModel()
        setupListeners()
        setupObservers()
    }

    private fun initViews() {
        etAmount = findViewById(R.id.etAmount)
        etDescription = findViewById(R.id.etDescription)
        etCategory = findViewById(R.id.etCategory)
        btnAddExpense = findViewById(R.id.btnAddExpense)
    }

    private fun setupViewModel() {
        val database = AppDatabase.getDatabase(this)
        val apiService = ApiClient.apiService
        val repository = ExpenseRepository(database.expenseDao(), apiService)
        val factory = ExpenseViewModelFactory(repository)
        viewModel = ViewModelProvider(this, factory)[ExpenseViewModel::class.java]
    }

    private fun setupObservers() {
        viewModel.statusMessage.observe(this) { message ->
            Toast.makeText(this, message, Toast.LENGTH_SHORT).show()
            if (message.contains("successfully", ignoreCase = true)) {
                finish()
            }
        }
    }

    private fun setupListeners() {
        btnAddExpense.setOnClickListener {
            val amountStr = etAmount.text.toString()
            val description = etDescription.text.toString()
            val category = etCategory.text.toString()

            if (amountStr.isNotEmpty() && description.isNotEmpty()) {
                val amount = amountStr.toDoubleOrNull() ?: 0.0
                viewModel.addExpense(amount, description, category)
            } else {
                Toast.makeText(this, "Please fill required fields", Toast.LENGTH_SHORT).show()
            }
        }
    }
}
