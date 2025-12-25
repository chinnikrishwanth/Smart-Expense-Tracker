package com.example.upiexpensetracker.ui.expenses

import android.os.Bundle
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import com.example.upiexpensetracker.R
import com.example.upiexpensetracker.data.models.Expense
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class ExpenseDetailActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_expense_detail)

        val expense = intent.getSerializableExtra("EXPENSE_DATA") as? Expense

        if (expense != null) {
            findViewById<TextView>(R.id.tvDetailAmount).text = "₹${expense.amount}"
            findViewById<TextView>(R.id.tvDetailDescription).text = expense.description
            findViewById<TextView>(R.id.tvDetailCategory).text = expense.category
            
            val sdf = SimpleDateFormat("dd MMM yyyy, hh:mm a", Locale.getDefault())
            findViewById<TextView>(R.id.tvDetailDate).text = sdf.format(Date(expense.date))
        }
    }
}
