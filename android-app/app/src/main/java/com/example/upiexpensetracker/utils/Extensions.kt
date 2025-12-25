package com.example.upiexpensetracker.utils

import android.view.View

object Extensions {
    fun View.visible() {
        this.visibility = View.VISIBLE
    }

    fun View.gone() {
        this.visibility = View.GONE
    }
}
