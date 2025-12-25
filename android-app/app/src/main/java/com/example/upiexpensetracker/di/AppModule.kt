package com.example.upiexpensetracker.di

import android.content.Context
import com.example.upiexpensetracker.data.api.ApiClient
import com.example.upiexpensetracker.data.local.PreferenceManager
import com.example.upiexpensetracker.data.local.database.AppDatabase
import com.example.upiexpensetracker.data.repository.AuthRepository
import com.example.upiexpensetracker.data.repository.ExpenseRepository

object AppModule {

    private var database: AppDatabase? = null
    private var authRepository: AuthRepository? = null
    private var expenseRepository: ExpenseRepository? = null
    private var preferenceManager: PreferenceManager? = null

    fun provideDatabase(context: Context): AppDatabase {
        return database ?: synchronized(this) {
            AppDatabase.getDatabase(context).also { database = it }
        }
    }

    fun providePreferenceManager(context: Context): PreferenceManager {
        return preferenceManager ?: synchronized(this) {
            PreferenceManager(context).also { preferenceManager = it }
        }
    }

    fun provideAuthRepository(context: Context): AuthRepository {
        return authRepository ?: synchronized(this) {
            AuthRepository(
                ApiClient.getApiService(context),
                provideDatabase(context).userDao(),
                providePreferenceManager(context)
            ).also { authRepository = it }
        }
    }

    fun provideExpenseRepository(context: Context): ExpenseRepository {
        return expenseRepository ?: synchronized(this) {
            ExpenseRepository(
                provideDatabase(context).expenseDao(),
                ApiClient.getApiService(context)
            ).also { expenseRepository = it }
        }
    }
}
