package com.example.upiexpensetracker.ui.dashboard

import androidx.lifecycle.LiveData
import androidx.lifecycle.Transformations
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.upiexpensetracker.data.repository.ExpenseRepository
import kotlinx.coroutines.launch
import java.text.NumberFormat
import java.util.Locale

class DashboardViewModel(repository: ExpenseRepository) : ViewModel() {

    val totalExpense: LiveData<String> = Transformations.map(repository.allExpenses) { expenses ->
        val total = expenses.sumOf { it.amount }
        NumberFormat.getCurrencyInstance(Locale("en", "IN")).format(total)
    }

    val recentTransactions = repository.allExpenses

    fun refreshExpenses() {
        // In a real app, handle loading state
        androidx.lifecycle.viewModelScope.launch {
            repository.refreshExpenses()
        }
    }
}
