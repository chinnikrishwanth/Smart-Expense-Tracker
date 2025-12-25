package com.example.upiexpensetracker.ui.expenses.viewmodels

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.upiexpensetracker.data.models.Expense
import com.example.upiexpensetracker.data.repository.ExpenseRepository
import kotlinx.coroutines.launch
import java.util.UUID

class ExpenseViewModel(private val repository: ExpenseRepository) : ViewModel() {

    val expenses: LiveData<List<Expense>> = repository.allExpenses

    private val _statusMessage = MutableLiveData<String>()
    val statusMessage: LiveData<String> = _statusMessage

    fun refreshExpenses() {
        viewModelScope.launch {
            repository.refreshExpenses()
        }
    }

    fun addExpense(amount: Double, description: String, category: String) {
        val expense = Expense(
            id = UUID.randomUUID().toString(),
            amount = amount,
            description = description,
            category = category,
            date = System.currentTimeMillis()
        )
        viewModelScope.launch {
            try {
                repository.addExpense(expense)
                _statusMessage.value = "Expense added successfully"
            } catch (e: Exception) {
                _statusMessage.value = "Failed to add expense: ${e.message}"
            }
        }
    }

    fun deleteExpense(expense: Expense) {
        viewModelScope.launch {
            try {
                repository.deleteExpense(expense)
                _statusMessage.value = "Expense deleted successfully"
            } catch (e: Exception) {
                _statusMessage.value = "Failed to delete expense: ${e.message}"
            }
        }
    }
}
