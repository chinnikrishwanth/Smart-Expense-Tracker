package com.example.upiexpensetracker.data.models

data class ApiResponse<T>(
    val success: Boolean,
    val message: String?,
    val data: T?
)
