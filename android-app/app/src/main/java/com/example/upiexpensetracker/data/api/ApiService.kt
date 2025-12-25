package com.example.upiexpensetracker.data.api

import com.example.upiexpensetracker.data.models.ApiResponse
import com.example.upiexpensetracker.data.models.AuthResponse
import com.example.upiexpensetracker.data.models.Expense
import com.example.upiexpensetracker.data.models.SMSRequest
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Query

interface ApiService {

    @POST("users/login")
    suspend fun login(@Body body: Map<String, String>): Response<LoginResponse>

    @POST("users/register")
    suspend fun register(@Body body: Map<String, String>): Response<RegisterResponse>

    @GET("expenses")
    suspend fun getExpenses(@Query("user") user: String? = null): Response<ExpensesResponse>

    @POST("expenses")
    suspend fun createExpense(@Body expense: Map<String, Any>): Response<ExpenseResponse>

    @POST("expenses/sync")
    suspend fun syncExpenses(@Body expenses: List<Expense>): Response<ApiResponse<Boolean>>

    @POST("expenses/process-sms")
    suspend fun processUnknownSMS(@Body request: SMSRequest): Response<ApiResponse<String>>
    
    @GET("budget")
    suspend fun getBudget(@Query("user") user: String, @Query("month") month: String): Response<BudgetResponse>
    
    @POST("budget")
    suspend fun setBudget(@Body body: Map<String, Any>): Response<BudgetResponse>
    
    @GET("dashboard-summary")
    suspend fun getDashboardSummary(@Query("user") user: String): Response<DashboardResponse>
    
    @GET("reports/monthly")
    suspend fun getMonthlyReport(@Query("user") user: String, @Query("month") month: String): Response<ReportResponse>

    @retrofit2.http.DELETE("expenses/{id}")
    suspend fun deleteExpense(@retrofit2.http.Path("id") id: String): Response<ApiResponse<String>>
}

// Response models matching backend format
data class LoginResponse(
    val success: Boolean,
    val token: String?,
    val email: String?,
    val name: String?,
    val id: String?,
    val error: String?,
    val message: String?
)

data class RegisterResponse(
    val success: Boolean,
    val token: String?,
    val user: RegisterUser?,
    val error: String?,
    val message: String?
)

data class RegisterUser(
    val id: String?,
    val name: String?,
    val email: String?,
    val phone: String?
)

data class ExpensesResponse(
    val success: Boolean,
    val data: List<Expense>?,
    val error: String?,
    val message: String?
)

data class ExpenseResponse(
    val success: Boolean,
    val data: Expense?,
    val error: String?,
    val message: String?
)

data class BudgetResponse(
    val success: Boolean,
    val budget: BudgetData?,
    val amount: Double?,
    val error: String?,
    val message: String?
)

data class BudgetData(
    val amount: Double?,
    val month: String?,
    val user: String?
)

data class DashboardResponse(
    val success: Boolean,
    val summary: DashboardSummary?,
    val totalExpenses: Double?,
    val budget: Double?,
    val error: String?,
    val message: String?
)

data class DashboardSummary(
    val budget: Double?,
    val totalExpenses: Double?,
    val remainingBudget: Double?
)

data class ReportResponse(
    val success: Boolean,
    val report: ReportData?,
    val error: String?,
    val message: String?
)

data class ReportData(
    val byCategory: List<CategoryReport>?
)

data class CategoryReport(
    val category: String,
    val total: Double,
    val count: Int?
)
