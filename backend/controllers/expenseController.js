const Expense = require('../models/expense');
const User = require('../models/user');
const SMSParser = require('../utils/smsParser');

// @desc    Process SMS and create expense
// @route   POST /api/expenses/process-sms
// @access  Private
exports.processSMS = async (req, res) => {
  try {
    const { smsBody, timestamp } = req.body;
    
    // Validate input
    if (!smsBody) {
      return res.status(400).json({
        success: false,
        error: 'SMS body is required'
      });
    }
    
    const userId = req.user.id;
    
    // Check if SMS is a transaction
    if (!SMSParser.isTransactionSMS(smsBody)) {
      return res.status(200).json({
        success: true,
        message: 'SMS is not a transaction',
        isTransaction: false
      });
    }
    
    // Parse SMS
    const parsedData = SMSParser.parseTransaction(smsBody);
    
    if (!parsedData || !parsedData.isValid) {
      return res.status(200).json({
        success: true,
        message: 'Could not parse transaction from SMS',
        isTransaction: false
      });
    }
    
    // Check for duplicate transaction (within 5 minutes)
    const transactionDate = parsedData.transactionDate || new Date(timestamp || Date.now());
    
    const existingExpense = await Expense.findOne({
      user: userId,
      amount: parsedData.amount,
      merchant: parsedData.merchant,
      transactionDate: {
        $gte: new Date(transactionDate.getTime() - 5 * 60000),
        $lte: new Date(transactionDate.getTime() + 5 * 60000)
      }
    });
    
    if (existingExpense) {
      return res.status(200).json({
        success: true,
        message: 'Transaction already exists',
        isTransaction: false,
        data: existingExpense
      });
    }
    
    // Get user preferences for auto-categorization
    const user = await User.findById(userId);
    const autoCategorize = user.autoCategorize !== false;
    
    // Create new expense
    const expenseData = {
      user: userId,
      amount: parsedData.amount,
      date: transactionDate,
      transactionDate: transactionDate,
      merchant: parsedData.merchant,
      category: autoCategorize ? 
        SMSParser.categorizeExpense(parsedData.merchant) : 'Other',
      transactionType: parsedData.transactionType,
      description: `Auto-detected from SMS: ${smsBody.substring(0, 100)}...`,
      smsBody: smsBody,
      source: 'SMS',
      bankName: parsedData.bankName,
      upiTransactionId: parsedData.upiTransactionId,
      isProcessed: true
    };
    
    const expense = await Expense.create(expenseData);
    
    res.status(201).json({
      success: true,
      message: 'Transaction processed successfully',
      isTransaction: true,
      data: expense
    });
    
  } catch (error) {
    console.error('Error processing SMS:', error);
    res.status(500).json({
      success: false,
      error: 'Error processing SMS',
      details: error.message
    });
  }
};

// @desc    Get all expenses for user
// @route   GET /api/expenses
// @access  Private
exports.getExpenses = async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      category,
      transactionType,
      page = 1, 
      limit = 20 
    } = req.query;
    
    const userId = req.user.id;
    
    // Build query
    const query = { user: userId };
    
    // Date filter
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    // Category filter
    if (category) {
      query.category = category;
    }
    
    // Transaction type filter
    if (transactionType) {
      query.transactionType = transactionType;
    }
    
    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    // Execute query
    const expenses = await Expense.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limitNum);
    
    const total = await Expense.countDocuments(query);
    
    res.json({
      success: true,
      data: expenses,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
    
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching expenses',
      details: error.message
    });
  }
};

// @desc    Get single expense
// @route   GET /api/expenses/:id
// @access  Private
exports.getExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    
    if (!expense) {
      return res.status(404).json({
        success: false,
        error: 'Expense not found'
      });
    }
    
    // Check if user owns the expense
    if (expense.user.toString() !== req.user.id.toString()) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this expense'
      });
    }
    
    res.json({
      success: true,
      data: expense
    });
    
  } catch (error) {
    console.error('Error fetching expense:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching expense',
      details: error.message
    });
  }
};

// @desc    Create expense manually
// @route   POST /api/expenses
// @access  Private
exports.createExpense = async (req, res) => {
  try {
    // Validate required fields
    if (!req.body.amount || !req.body.category) {
      return res.status(400).json({
        success: false,
        error: 'Amount and category are required'
      });
    }
    
    const expenseData = {
      ...req.body,
      user: req.user.id,
      source: 'Manual'
    };
    
    // Ensure date is set
    if (!expenseData.date) {
      expenseData.date = new Date();
    }
    
    // Ensure transactionDate is in sync with date
    if (!expenseData.transactionDate) {
      expenseData.transactionDate = expenseData.date;
    }
    
    const expense = await Expense.create(expenseData);
    
    res.status(201).json({
      success: true,
      data: expense
    });
    
  } catch (error) {
    console.error('Error creating expense:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Error creating expense',
      details: error.message
    });
  }
};

// @desc    Update expense
// @route   PUT /api/expenses/:id
// @access  Private
exports.updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    
    if (!expense) {
      return res.status(404).json({
        success: false,
        error: 'Expense not found'
      });
    }
    
    // Check if user owns the expense
    if (expense.user.toString() !== req.user.id.toString()) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to update this expense'
      });
    }
    
    // Update expense
    const updatedExpense = await Expense.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    res.json({
      success: true,
      data: updatedExpense
    });
    
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({
      success: false,
      error: 'Error updating expense',
      details: error.message
    });
  }
};

// @desc    Delete expense
// @route   DELETE /api/expenses/:id
// @access  Private
exports.deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    
    if (!expense) {
      return res.status(404).json({
        success: false,
        error: 'Expense not found'
      });
    }
    
    // Check if user owns the expense
    if (expense.user.toString() !== req.user.id.toString()) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to delete this expense'
      });
    }
    
    await expense.deleteOne();
    
    res.json({
      success: true,
      message: 'Expense deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({
      success: false,
      error: 'Error deleting expense',
      details: error.message
    });
  }
};

// @desc    Get expense statistics
// @route   GET /api/expenses/stats/summary
// @access  Private
exports.getExpenseStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const userId = req.user.id;
    
    const matchQuery = { user: userId, transactionType: 'Debit' };
    
    if (startDate || endDate) {
      matchQuery.date = {};
      if (startDate) matchQuery.date.$gte = new Date(startDate);
      if (endDate) matchQuery.date.$lte = new Date(endDate);
    }
    
    // Overall statistics
    const stats = await Expense.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalSpent: { $sum: '$amount' },
          averageTransaction: { $avg: '$amount' },
          totalTransactions: { $sum: 1 },
          maxTransaction: { $max: '$amount' },
          minTransaction: { $min: '$amount' }
        }
      }
    ]);
    
    // Category statistics
    const categoryStats = await Expense.aggregate([
      { $match: matchQuery },
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
    
    res.json({
      success: true,
      data: {
        overall: stats[0] || {
          totalSpent: 0,
          averageTransaction: 0,
          totalTransactions: 0,
          maxTransaction: 0,
          minTransaction: 0
        },
        byCategory: categoryStats.map(cat => ({
          category: cat._id,
          total: cat.total,
          count: cat.count,
          average: cat.average
        }))
      }
    });
    
  } catch (error) {
    console.error('Error getting expense stats:', error);
    res.status(500).json({
      success: false,
      error: 'Error getting expense statistics',
      details: error.message
    });
  }
};

// @desc    Get expenses by category
// @route   GET /api/expenses/category/:category
// @access  Private
exports.getExpensesByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { startDate, endDate, page = 1, limit = 20 } = req.query;
    const userId = req.user.id;
    
    // Build query
    const query = { 
      user: userId,
      category: category 
    };
    
    // Date filter
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    // Execute query
    const expenses = await Expense.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limitNum);
    
    const total = await Expense.countDocuments(query);
    
    // Calculate total amount for this category
    const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    res.json({
      success: true,
      data: {
        category,
        totalAmount,
        expenses,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      }
    });
    
  } catch (error) {
    console.error('Error getting expenses by category:', error);
    res.status(500).json({
      success: false,
      error: 'Error getting expenses by category',
      details: error.message
    });
  }
};

// @desc    Get recent expenses
// @route   GET /api/expenses/recent
// @access  Private
exports.getRecentExpenses = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const userId = req.user.id;
    
    const expenses = await Expense.find({ user: userId })
      .sort({ date: -1 })
      .limit(parseInt(limit));
    
    res.json({
      success: true,
      data: expenses
    });
    
  } catch (error) {
    console.error('Error getting recent expenses:', error);
    res.status(500).json({
      success: false,
      error: 'Error getting recent expenses',
      details: error.message
    });
  }
};

// @desc    Sync expenses (for mobile app offline sync)
// @route   POST /api/expenses/sync
// @access  Private
exports.syncExpenses = async (req, res) => {
  try {
    const { expenses, lastSyncDate } = req.body;
    const userId = req.user.id;
    
    if (!expenses || !Array.isArray(expenses)) {
      return res.status(400).json({
        success: false,
        error: 'Expenses array is required'
      });
    }
    
    const results = {
      created: 0,
      updated: 0,
      failed: 0,
      errors: []
    };
    
    // Process each expense
    for (const expenseData of expenses) {
      try {
        // Add user ID to expense
        expenseData.user = userId;
        
        // Check if expense already exists (by ID or by transaction details)
        let existingExpense;
        
        if (expenseData._id) {
          existingExpense = await Expense.findById(expenseData._id);
        }
        
        if (existingExpense) {
          // Update existing expense
          await Expense.findByIdAndUpdate(expenseData._id, expenseData, { new: true });
          results.updated++;
        } else {
          // Create new expense
          await Expense.create(expenseData);
          results.created++;
        }
      } catch (error) {
        results.failed++;
        results.errors.push({
          expense: expenseData._id || 'unknown',
          error: error.message
        });
      }
    }
    
    // Get expenses updated since last sync
    let updatedExpenses = [];
    if (lastSyncDate) {
      updatedExpenses = await Expense.find({
        user: userId,
        updatedAt: { $gte: new Date(lastSyncDate) }
      }).sort({ updatedAt: -1 });
    }
    
    res.json({
      success: true,
      data: {
        syncResults: results,
        updatedExpenses: updatedExpenses,
        serverTime: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Error syncing expenses:', error);
    res.status(500).json({
      success: false,
      error: 'Error syncing expenses',
      details: error.message
    });
  }
};