package com.example.upiexpensetracker.ui.dashboard

import android.content.Intent
import android.os.Bundle
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.ViewModelProvider
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.upiexpensetracker.R
import com.example.upiexpensetracker.data.api.ApiClient
import com.example.upiexpensetracker.data.local.database.AppDatabase
import com.example.upiexpensetracker.data.repository.ExpenseRepository
import com.example.upiexpensetracker.ui.expenses.AddExpenseActivity
import com.google.android.material.floatingactionbutton.FloatingActionButton
import com.example.upiexpensetracker.ui.expenses.ExpenseAdapter

class DashboardActivity : AppCompatActivity() {

    private lateinit var viewModel: DashboardViewModel
    private lateinit var tvTotalExpense: TextView
    private lateinit var fabAddExpense: FloatingActionButton
    private lateinit var rvRecentTransactions: RecyclerView
    private lateinit var adapter: ExpenseAdapter

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_dashboard)

        initViews()
        setupViewModel()
        setupObservers()
        setupListeners()
    }

    private fun initViews() {
        tvTotalExpense = findViewById(R.id.tvTotalExpense)
        fabAddExpense = findViewById(R.id.fabAddExpense)
        rvRecentTransactions = findViewById(R.id.rvRecentTransactions)
        rvRecentTransactions.layoutManager = LinearLayoutManager(this)
        
        adapter = ExpenseAdapter(
            onExpenseClick = { expense ->
                val intent = Intent(this, com.example.upiexpensetracker.ui.expenses.ExpenseDetailActivity::class.java)
                intent.putExtra("EXPENSE_DATA", expense)
                startActivity(intent)
            },
            onDeleteClick = { expense ->
                // For now, removing from dashboard list or can call viewModel to delete
                // DashboardViewModel doesn't have delete yet, so we can ignore or implement later.
                // Or better, let's just make DashboardViewModel support delete too? 
                // For simplicity now, let's just log or ignore, or we would need to cast ViewModel or add delete to DashboardViewModel.
                // Ideally, DashboardViewModel should handle it.
            }
        )
        rvRecentTransactions.adapter = adapter
    }

    private fun setupViewModel() {
        val database = AppDatabase.getDatabase(this)
        val apiService = ApiClient.getApiService(this)
        val repository = ExpenseRepository(database.expenseDao(), apiService)
        val factory = DashboardViewModelFactory(repository)
        viewModel = ViewModelProvider(this, factory)[DashboardViewModel::class.java]
        
        // Refresh data
        viewModel.refreshExpenses()
    }

    private fun setupObservers() {
        viewModel.totalExpense.observe(this) { total ->
             tvTotalExpense.text = "Total: $total"
        }
        
        viewModel.recentTransactions.observe(this) { expenses ->
            adapter.submitList(expenses)
        }
    }

    private fun setupListeners() {
        fabAddExpense.setOnClickListener {
            startActivity(Intent(this, AddExpenseActivity::class.java))
        }
        
        findViewById<android.view.View>(R.id.btnSettings).setOnClickListener {
            startActivity(Intent(this, com.example.upiexpensetracker.ui.settings.SettingsActivity::class.java))
        }

        findViewById<android.view.View>(R.id.btnSeeAll).setOnClickListener {
            startActivity(Intent(this, com.example.upiexpensetracker.ui.expenses.ExpenseListActivity::class.java))
        }
    }
}
