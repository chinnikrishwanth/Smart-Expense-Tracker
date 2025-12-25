package com.example.upiexpensetracker.ui.expenses

import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import com.example.upiexpensetracker.R

import androidx.lifecycle.ViewModelProvider
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.upiexpensetracker.data.api.ApiClient
import com.example.upiexpensetracker.data.local.database.AppDatabase
import com.example.upiexpensetracker.data.repository.ExpenseRepository
import com.example.upiexpensetracker.ui.expenses.viewmodels.ExpenseViewModel
import com.example.upiexpensetracker.ui.expenses.viewmodels.ExpenseViewModelFactory
import android.content.Intent
import android.widget.Toast

class ExpenseListActivity : AppCompatActivity() {

    private lateinit var viewModel: ExpenseViewModel
    private lateinit var adapter: ExpenseAdapter
    private lateinit var rvExpenses: RecyclerView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_expense_list)
        
        initViews()
        setupViewModel()
        setupObservers()
    }

    private fun initViews() {
        rvExpenses = findViewById(R.id.rvExpenses)
        rvExpenses.layoutManager = LinearLayoutManager(this)
        
        adapter = ExpenseAdapter(
            onExpenseClick = { expense ->
                val intent = Intent(this, com.example.upiexpensetracker.ui.expenses.ExpenseDetailActivity::class.java)
                intent.putExtra("EXPENSE_DATA", expense)
                startActivity(intent)
            },
            onDeleteClick = { expense ->
                viewModel.deleteExpense(expense)
            }
        )
        rvExpenses.adapter = adapter
    }

    private fun setupViewModel() {
        val database = AppDatabase.getDatabase(this)
        val apiService = ApiClient.getApiService(this)
        val repository = ExpenseRepository(database.expenseDao(), apiService)
        val factory = ExpenseViewModelFactory(repository)
        viewModel = ViewModelProvider(this, factory)[ExpenseViewModel::class.java]
        
        viewModel.refreshExpenses()
    }

    private fun setupObservers() {
        viewModel.expenses.observe(this) { expenses ->
            adapter.submitList(expenses)
        }
        
        viewModel.statusMessage.observe(this) { message ->
            if (message.isNotEmpty()) {
                Toast.makeText(this, message, Toast.LENGTH_SHORT).show()
            }
        }
    }
}
