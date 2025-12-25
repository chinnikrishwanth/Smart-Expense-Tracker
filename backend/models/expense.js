const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  amount: { 
    type: Number, 
    required: true,
    min: [0.01, 'Amount must be greater than 0']
  },
  date: { 
    type: Date, 
    required: true,
    default: Date.now
  },
  category: { 
    type: String,
    required: true,
    enum: [
      'Food & Dining',
      'Shopping',
      'Transportation',
      'Entertainment',
      'Bills & Utilities',
      'Healthcare',
      'Education',
      'Personal Care',
      'Travel',
      'Groceries',
      'Investments',
      'Gifts & Donations',
      'Other'
    ],
    default: 'Other'
  },
  description: { 
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  
  // New fields for SMS expense tracking
  merchant: {
    type: String,
    trim: true,
    required: function() {
      return this.source === 'SMS';
    }
  },
  transactionType: {
    type: String,
    enum: ['Debit', 'Credit', 'Transfer'],
    default: 'Debit'
  },
  transactionDate: {
    type: Date,
    default: Date.now
  },
  smsBody: {
    type: String,
    trim: true
  },
  source: {
    type: String,
    enum: ['SMS', 'Manual', 'Import'],
    default: 'Manual'
  },
  bankName: {
    type: String,
    trim: true
  },
  upiTransactionId: {
    type: String,
    trim: true
  },
  isProcessed: {
    type: Boolean,
    default: true
  },
  
  // Additional fields for better expense tracking
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    }
  },
  tags: [{
    type: String,
    trim: true
  }],
  receiptImage: {
    type: String
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurrencePattern: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly', null],
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
ExpenseSchema.index({ user: 1, date: -1 });
ExpenseSchema.index({ user: 1, category: 1 });
ExpenseSchema.index({ user: 1, transactionType: 1 });
ExpenseSchema.index({ user: 1, merchant: 1 });
ExpenseSchema.index({ date: -1 });

// Virtual property for formatted date
ExpenseSchema.virtual('formattedDate').get(function() {
  return this.date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
});

// Virtual property for formatted transaction date
ExpenseSchema.virtual('formattedTransactionDate').get(function() {
  return this.transactionDate.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
});

// Virtual property for formatted amount
ExpenseSchema.virtual('formattedAmount').get(function() {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(this.amount);
});

// Pre-save middleware to ensure date and transactionDate are in sync
ExpenseSchema.pre('save', function(next) {
  // If transactionDate is set but date is not, copy transactionDate to date
  if (this.transactionDate && !this.date) {
    this.date = this.transactionDate;
  }
  // If date is set but transactionDate is not, copy date to transactionDate
  if (this.date && !this.transactionDate) {
    this.transactionDate = this.date;
  }
  
  // For SMS expenses, ensure merchant is set
  if (this.source === 'SMS' && !this.merchant) {
    this.merchant = 'Unknown Merchant';
  }
  
  // Ensure description has a default value for SMS expenses
  if (this.source === 'SMS' && !this.description) {
    this.description = 'Auto-detected from SMS';
  }
  
  next();
});

// Static method to find expenses by date range
ExpenseSchema.statics.findByDateRange = function(userId, startDate, endDate) {
  return this.find({
    user: userId,
    date: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ date: -1 });
};

// Static method to get category summary
ExpenseSchema.statics.getCategorySummary = function(userId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        user: mongoose.Types.ObjectId(userId),
        date: { $gte: startDate, $lte: endDate },
        transactionType: 'Debit'
      }
    },
    {
      $group: {
        _id: '$category',
        total: { $sum: '$amount' },
        count: { $sum: 1 },
        average: { $avg: '$amount' }
      }
    },
    { $sort: { total: -1 } }
  ]);
};

// Static method to get monthly summary
ExpenseSchema.statics.getMonthlySummary = function(userId, year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);
  
  return this.aggregate([
    {
      $match: {
        user: mongoose.Types.ObjectId(userId),
        date: { $gte: startDate, $lte: endDate },
        transactionType: 'Debit'
      }
    },
    {
      $group: {
        _id: { $dayOfMonth: '$date' },
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id': 1 } }
  ]);
};

// Instance method to get expense details for API response
ExpenseSchema.methods.getDetails = function() {
  return {
    id: this._id,
    amount: this.amount,
    formattedAmount: this.formattedAmount,
    date: this.date,
    formattedDate: this.formattedDate,
    category: this.category,
    description: this.description,
    merchant: this.merchant,
    transactionType: this.transactionType,
    transactionDate: this.transactionDate,
    formattedTransactionDate: this.formattedTransactionDate,
    source: this.source,
    bankName: this.bankName,
    upiTransactionId: this.upiTransactionId,
    tags: this.tags,
    isRecurring: this.isRecurring,
    recurrencePattern: this.recurrencePattern,
    createdAt: this.createdAt
  };
};

// Method to check if expense is from today
ExpenseSchema.methods.isToday = function() {
  const today = new Date();
  return this.date.toDateString() === today.toDateString();
};

// Method to check if expense is from this month
ExpenseSchema.methods.isThisMonth = function() {
  const now = new Date();
  return this.date.getMonth() === now.getMonth() && 
         this.date.getFullYear() === now.getFullYear();
};

module.exports = mongoose.model('Expense', ExpenseSchema);