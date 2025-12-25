package com.example.upiexpensetracker.data.models

data class SMSRequest(
    val sender: String,
    val body: String,
    val timestamp: Long
)
