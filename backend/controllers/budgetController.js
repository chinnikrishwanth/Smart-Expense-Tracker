const Budget = require('../models/budget');
const Expense = require('../models/expense');
const User = require('../models/user');

// Helper function to get user ID (supporting both email and JWT auth)
const getUserId = async (req) => {
  const { user: userEmail } = req.query;
  
  if (userEmail) {
    // Frontend sends user email (legacy support)
    const user = await User.findOne({ email: userEmail });
    if (!user) throw new Error('User not found');
    return user._id;
  } else if (req.user) {
    // JWT authentication - handle both id and _id
    if (req.user._id) {
      return req.user._id;
    } else if (req.user.id) {
      // Convert string id to ObjectId if needed, or use as-is
      return req.user.id;
    }
  }
  throw new Error('Unauthorized');
};

exports.getBudget = async (req, res) => {
  try {
    const { month } = req.query;
    
    if (!month) {
      return res.status(400).json({ 
        success: false,
        error: 'Month parameter is required (format: YYYY-MM)' 
      });
    }
    
    const userId = await getUserId(req);
    const budget = await Budget.findOne({ user: userId, month });
    
    res.json({ 
      success: true,
      budget: budget || { 
        amount: 0, 
        month, 
        user: userId,
        categories: [] 
      } 
    });
  } catch (err) {
    console.error('Get budget error:', err);
    
    if (err.message === 'User not found') {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }
    
    if (err.message === 'Unauthorized') {
      return res.status(401).json({ 
        success: false, 
        error: 'Unauthorized' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
};

exports.setBudget = async (req, res) => {
  try {
    const { month, amount, categories } = req.body;
    
    if (!month || amount === undefined) {
      return res.status(400).json({ 
        success: false,
        error: 'Month and amount are required' 
      });
    }
    
    const userId = await getUserId(req);
    const budgetAmount = parseFloat(amount);
    
    if (isNaN(budgetAmount) || budgetAmount < 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid amount' 
      });
    }
    
    // If categories provided, update category-wise budgets
    let updateData = { 
      user: userId, 
      month, 
      amount: budgetAmount 
    };
    
    if (categories && Array.isArray(categories)) {
      updateData.categories = categories.map(cat => ({
        category: cat.category,
        amount: parseFloat(cat.amount) || 0,
        spent: 0 // Initialize spent amount
      }));
    }
    
    const budget = await Budget.findOneAndUpdate(
      { user: userId, month },
      updateData,
      { 
        upsert: true, 
        new: true,
        runValidators: true 
      }
    );
    
    res.json({ 
      success: true, 
      message: 'Budget set successfully',
      budget 
    });
  } catch (err) {
    console.error('Set budget error:', err);
    
    if (err.message === 'User not found') {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }
    
    if (err.message === 'Unauthorized') {
      return res.status(401).json({ 
        success: false, 
        error: 'Unauthorized' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
};

exports.getReport = async (req, res) => {
  try {
    const { month, year } = req.query;
    
    let targetMonth, targetYear;
    // Handle YYYY-MM format from frontend
    if (month && month.includes('-')) {
      const [yearStr, monthStr] = month.split('-');
      targetYear = parseInt(yearStr);
      targetMonth = parseInt(monthStr) - 1; // JS months are 0-indexed
    } else if (month && year) {
      targetMonth = parseInt(month) - 1; // JS months are 0-indexed
      targetYear = parseInt(year);
    } else {
      const now = new Date();
      targetMonth = now.getMonth();
      targetYear = now.getFullYear();
    }
    
    const startDate = new Date(targetYear, targetMonth, 1);
    const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);
    
    const userId = await getUserId(req);
    
    // Get category-wise expenses
    const categoryReport = await Expense.aggregate([
      { 
        $match: { 
          user: userId,
          transactionDate: { $gte: startDate, $lte: endDate },
          transactionType: 'Debit' // Only include debits for expense report
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
    
    // Get daily spending trend
    const dailyTrend = await Expense.aggregate([
      { 
        $match: { 
          user: userId,
          transactionDate: { $gte: startDate, $lte: endDate },
          transactionType: 'Debit'
        } 
      },
      {
        $group: {
          _id: { $dayOfMonth: '$transactionDate' },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);
    
    // Get budget for the month
    const monthString = `${targetYear}-${(targetMonth + 1).toString().padStart(2, '0')}`;
    const budget = await Budget.findOne({ user: userId, month: monthString });
    
    // Calculate summary
    const totalExpenses = categoryReport.reduce((sum, item) => sum + item.total, 0);
    const totalBudget = budget ? budget.amount : 0;
    const remainingBudget = totalBudget - totalExpenses;
    const budgetUtilization = totalBudget > 0 ? (totalExpenses / totalBudget) * 100 : 0;
    
    res.json({ 
      success: true,
      report: {
        period: {
          month: targetMonth + 1,
          year: targetYear,
          startDate,
          endDate
        },
        summary: {
          totalBudget,
          totalExpenses,
          remainingBudget,
          budgetUtilization: Math.round(budgetUtilization * 100) / 100,
          averageDailyExpense: dailyTrend.length > 0 ? 
            totalExpenses / dailyTrend.length : 0
        },
        byCategory: categoryReport.map(item => ({
          category: item._id,
          total: item.total,
          count: item.count,
          average: Math.round(item.average * 100) / 100
        })),
        dailyTrend: dailyTrend.map(item => ({
          day: item._id,
          total: item.total,
          count: item.count
        })),
        budget: budget || null
      }
    });
  } catch (err) {
    console.error('Get report error:', err);
    
    if (err.message === 'User not found') {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }
    
    if (err.message === 'Unauthorized') {
      return res.status(401).json({ 
        success: false, 
        error: 'Unauthorized' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
};

exports.getDashboardSummary = async (req, res) => {
  try {
    const userId = await getUserId(req);
    
    // Get current month
    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7); // YYYY-MM format
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    
    // Get budget for current month
    const budget = await Budget.findOne({ user: userId, month: currentMonth });
    const budgetAmount = budget ? budget.amount : 0;
    
    // Get total expenses for current month
    const currentMonthExpenses = await Expense.aggregate([
      {
        $match: {
          user: userId,
          transactionDate: { $gte: start, $lte: end },
          transactionType: 'Debit'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);
    
    const totalExpenses = currentMonthExpenses[0]?.total || 0;
    const transactionCount = currentMonthExpenses[0]?.count || 0;
    
    // Get top categories for current month
    const topCategories = await Expense.aggregate([
      {
        $match: {
          user: userId,
          transactionDate: { $gte: start, $lte: end },
          transactionType: 'Debit'
        }
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } },
      { $limit: 5 }
    ]);
    
    // Get recent transactions
    const recentTransactions = await Expense.find({
      user: userId,
      transactionType: 'Debit'
    })
    .sort({ transactionDate: -1 })
    .limit(5)
    .select('amount merchant category transactionDate description')
    .lean();
    
    // Get monthly trend for last 6 months
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const monthlyTrend = await Expense.aggregate([
      {
        $match: {
          user: userId,
          transactionDate: { $gte: sixMonthsAgo, $lte: end },
          transactionType: 'Debit'
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$transactionDate' },
            month: { $month: '$transactionDate' }
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    
    // Calculate budget utilization
    const budgetUtilization = budgetAmount > 0 ? 
      Math.min((totalExpenses / budgetAmount) * 100, 100) : 0;
    
    // Daily average spending
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const currentDay = now.getDate();
    const averageDailySpending = currentDay > 0 ? totalExpenses / currentDay : 0;
    
    // Projected monthly spending
    const projectedSpending = averageDailySpending * daysInMonth;
    
    res.json({
      success: true,
      summary: {
        budget: budgetAmount,
        totalExpenses: Math.round(totalExpenses * 100) / 100,
        remainingBudget: Math.max(0, budgetAmount - totalExpenses),
        budgetUtilization: Math.round(budgetUtilization * 100) / 100,
        transactionCount,
        averageTransaction: transactionCount > 0 ? 
          Math.round((totalExpenses / transactionCount) * 100) / 100 : 0,
        averageDailySpending: Math.round(averageDailySpending * 100) / 100,
        projectedSpending: Math.round(projectedSpending * 100) / 100
      },
      topCategories: topCategories.map(cat => ({
        category: cat._id,
        total: Math.round(cat.total * 100) / 100,
        count: cat.count,
        percentage: totalExpenses > 0 ? 
          Math.round((cat.total / totalExpenses) * 100) : 0
      })),
      recentTransactions: recentTransactions.map(tx => ({
        ...tx,
        formattedDate: new Date(tx.transactionDate).toLocaleDateString('en-IN'),
        formattedAmount: `₹${tx.amount.toFixed(2)}`
      })),
      monthlyTrend: monthlyTrend.map(item => ({
        month: item._id.month,
        year: item._id.year,
        total: Math.round(item.total * 100) / 100,
        count: item.count
      }))
    });
  } catch (err) {
    console.error('Get dashboard summary error:', err);
    
    if (err.message === 'User not found') {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }
    
    if (err.message === 'Unauthorized') {
      return res.status(401).json({ 
        success: false, 
        error: 'Unauthorized' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
};

// New method: Delete budget
exports.deleteBudget = async (req, res) => {
  try {
    const { month } = req.body;
    
    if (!month) {
      return res.status(400).json({ 
        success: false,
        error: 'Month parameter is required' 
      });
    }
    
    const userId = await getUserId(req);
    const result = await Budget.deleteOne({ user: userId, month });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Budget not found' 
      });
    }
    
    res.json({ 
      success: true,
      message: 'Budget deleted successfully' 
    });
  } catch (err) {
    console.error('Delete budget error:', err);
    
    if (err.message === 'User not found') {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }
    
    if (err.message === 'Unauthorized') {
      return res.status(401).json({ 
        success: false, 
        error: 'Unauthorized' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
};

// New method: Get budget history
exports.getBudgetHistory = async (req, res) => {
  try {
    const { limit = 12 } = req.query;
    const userId = await getUserId(req);
    
    const budgets = await Budget.find({ user: userId })
      .sort({ month: -1 })
      .limit(parseInt(limit))
      .lean();
    
    // Get actual spending for each budget period
    const budgetsWithSpending = await Promise.all(
      budgets.map(async (budget) => {
        const [year, month] = budget.month.split('-').map(Number);
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);
        
        const spending = await Expense.aggregate([
          {
            $match: {
              user: userId,
              transactionDate: { $gte: startDate, $lte: endDate },
              transactionType: 'Debit'
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' }
            }
          }
        ]);
        
        const totalSpending = spending[0]?.total || 0;
        const utilization = budget.amount > 0 ? 
          Math.min((totalSpending / budget.amount) * 100, 100) : 0;
        
        return {
          ...budget,
          totalSpending: Math.round(totalSpending * 100) / 100,
          budgetUtilization: Math.round(utilization * 100) / 100,
          remainingBudget: Math.max(0, budget.amount - totalSpending),
          monthName: new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })
        };
      })
    );
    
    res.json({
      success: true,
      budgets: budgetsWithSpending
    });
  } catch (err) {
    console.error('Get budget history error:', err);
    
    if (err.message === 'User not found') {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }
    
    if (err.message === 'Unauthorized') {
      return res.status(401).json({ 
        success: false, 
        error: 'Unauthorized' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
};