package com.example.upiexpensetracker.ui.expenses

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.example.upiexpensetracker.R
import com.example.upiexpensetracker.data.models.Expense
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class ExpenseAdapter(
    private val onExpenseClick: (Expense) -> Unit,
    private val onDeleteClick: (Expense) -> Unit
) : RecyclerView.Adapter<ExpenseAdapter.ExpenseViewHolder>() {

    private var expenses: List<Expense> = emptyList()

    fun submitList(newList: List<Expense>) {
        expenses = newList
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ExpenseViewHolder {
        val view = LayoutInflater.from(parent.context).inflate(R.layout.item_expense, parent, false)
        return ExpenseViewHolder(view)
    }

    override fun onBindViewHolder(holder: ExpenseViewHolder, position: Int) {
        holder.bind(expenses[position], onExpenseClick, onDeleteClick)
    }

    override fun getItemCount(): Int = expenses.size

    class ExpenseViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        private val tvDescription: TextView = itemView.findViewById(R.id.tvDescription)
        private val tvAmount: TextView = itemView.findViewById(R.id.tvAmount)
        private val tvDate: TextView = itemView.findViewById(R.id.tvDate)
        private val btnDelete: android.widget.ImageButton = itemView.findViewById(R.id.btnDelete)

        fun bind(expense: Expense, onClick: (Expense) -> Unit, onDelete: (Expense) -> Unit) {
            tvDescription.text = expense.description
            tvAmount.text = "₹${expense.amount}"
            val sdf = SimpleDateFormat("dd MMM yyyy", Locale.getDefault())
            tvDate.text = sdf.format(Date(expense.date))
            
            itemView.setOnClickListener { onClick(expense) }
            btnDelete.setOnClickListener { onDelete(expense) }
        }
    }
}
