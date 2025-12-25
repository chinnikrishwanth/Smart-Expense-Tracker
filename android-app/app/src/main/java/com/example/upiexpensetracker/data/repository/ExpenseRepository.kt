package com.example.upiexpensetracker.data.repository

import androidx.lifecycle.LiveData
import com.example.upiexpensetracker.data.api.ApiService
import com.example.upiexpensetracker.data.local.database.ExpenseDao
import com.example.upiexpensetracker.data.models.Expense
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class ExpenseRepository(
    private val expenseDao: ExpenseDao,
    private val apiService: ApiService
) {

    val allExpenses: LiveData<List<Expense>> = expenseDao.getAllExpenses()

    suspend fun refreshExpenses(userEmail: String? = null) = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getExpenses(userEmail)
            if (response.isSuccessful && response.body()?.success == true) {
                response.body()?.data?.let { expenses ->
                    expenseDao.insertExpenses(expenses)
                }
            }
        } catch (e: Exception) {
            // Handle offline or error scenario
            e.printStackTrace()
        }
    }
    
    suspend fun createExpense(expense: Map<String, Any>) = withContext(Dispatchers.IO) {
        try {
            val response = apiService.createExpense(expense)
            if (response.isSuccessful && response.body()?.success == true) {
                response.body()?.data?.let { expenseDao.insertExpense(it) }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    suspend fun addExpense(expense: Expense) = withContext(Dispatchers.IO) {
        expenseDao.insertExpense(expense)
        try {
            val response = apiService.syncExpenses(listOf(expense))
            if (!response.isSuccessful) {
                // Log failure or mark as unsynced in DB 
            }
        } catch (e: Exception) {
            // Log failure
        }
    }

    suspend fun deleteExpense(expense: Expense) = withContext(Dispatchers.IO) {
        expenseDao.deleteExpense(expense)
        try {
            if (expense.id.isNotEmpty()) {
                val response = apiService.deleteExpense(expense.id)
                if (!response.isSuccessful) {
                    // Log failure or mark for retry
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}
