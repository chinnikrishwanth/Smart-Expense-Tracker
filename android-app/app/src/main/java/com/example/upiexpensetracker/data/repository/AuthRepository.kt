package com.example.upiexpensetracker.data.repository

import android.content.Context
import com.example.upiexpensetracker.data.api.ApiService
import com.example.upiexpensetracker.data.local.PreferenceManager
import com.example.upiexpensetracker.data.local.database.UserDao
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class AuthRepository(
    private val apiService: ApiService,
    private val userDao: UserDao,
    private val preferenceManager: PreferenceManager
) {

    suspend fun login(email: String, password: String): Result<Boolean> = withContext(Dispatchers.IO) {
        try {
            val body = mapOf("email" to email, "password" to password)
            val response = apiService.login(body)
            if (response.isSuccessful && response.body()?.success == true) {
                val authData = response.body()
                authData?.token?.let { preferenceManager.saveToken(it) }
                // Backend returns token, email, name, id directly in response
                val user = com.example.upiexpensetracker.data.models.User(
                    id = authData?.id ?: "",
                    name = authData?.name ?: "",
                    email = authData?.email ?: email,
                    phone = ""
                )
                userDao.insertUser(user)
                Result.success(true)
            } else {
                val errorMsg = response.body()?.error ?: response.body()?.message ?: "Login failed"
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun register(name: String, email: String, password: String, phone: String): Result<Boolean> = withContext(Dispatchers.IO) {
        try {
            val body = mapOf(
                "name" to name,
                "email" to email,
                "password" to password,
                "phone" to phone
            )
            val response = apiService.register(body)
            if (response.isSuccessful && response.body()?.success == true) {
                val authData = response.body()
                authData?.token?.let { preferenceManager.saveToken(it) }
                // Backend returns token and user object
                val userData = authData?.user
                val user = com.example.upiexpensetracker.data.models.User(
                    id = userData?.id ?: "",
                    name = userData?.name ?: name,
                    email = userData?.email ?: email,
                    phone = userData?.phone ?: phone
                )
                userDao.insertUser(user)
                Result.success(true)
            } else {
                val errorMsg = response.body()?.error ?: response.body()?.message ?: "Registration failed"
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
