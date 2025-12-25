const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  month: {
    type: String,
    required: true,
    match: [/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format']
  },
  amount: {
    type: Number,
    required: true,
    min: [0, 'Budget amount cannot be negative']
  },
  categories: [{
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
      ]
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Category budget cannot be negative']
    },
    spent: {
      type: Number,
      default: 0,
      min: [0, 'Spent amount cannot be negative']
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index for unique budget per user per month
budgetSchema.index({ user: 1, month: 1 }, { unique: true });

// Validation to ensure category budgets don't exceed total budget
budgetSchema.pre('save', function(next) {
  if (this.categories && this.categories.length > 0) {
    const totalCategoryBudget = this.categories.reduce((sum, cat) => sum + cat.amount, 0);
    if (totalCategoryBudget > this.amount) {
      return next(new Error('Total category budgets cannot exceed overall budget'));
    }
  }
  next();
});

// Virtual property for month name
budgetSchema.virtual('monthName').get(function() {
  const [year, month] = this.month.split('-').map(Number);
  return new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
});

// Method to update spent amount for a category
budgetSchema.methods.updateSpentAmount = async function(category, amount) {
  const categoryEntry = this.categories.find(cat => cat.category === category);
  if (categoryEntry) {
    categoryEntry.spent = (categoryEntry.spent || 0) + amount;
    await this.save();
  }
};

// Method to get budget utilization percentage
budgetSchema.methods.getUtilization = function() {
  if (this.amount === 0) return 0;
  
  if (this.categories && this.categories.length > 0) {
    const totalSpent = this.categories.reduce((sum, cat) => sum + (cat.spent || 0), 0);
    return (totalSpent / this.amount) * 100;
  }
  
  return 0;
};

const Budget = mongoose.model('Budget', budgetSchema);

module.exports = Budget;