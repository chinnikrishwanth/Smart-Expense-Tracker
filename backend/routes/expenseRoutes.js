const express = require('express');
const router = express.Router();
const {
  processSMS,
  getExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseStats,
  getExpensesByCategory,
  getRecentExpenses,
  syncExpenses
} = require('../controllers/expenseController');
const { authenticate } = require('../middlewares/authenticate');

// All routes are protected
router.use(authenticate);

// SMS Processing
router.post('/process-sms', processSMS);

// Expense CRUD operations
router.post('/sync', syncExpenses);

router.route('/')
  .get(getExpenses)
  .post(createExpense);

router.route('/:id')
  .get(getExpense)
  .put(updateExpense)
  .delete(deleteExpense);

// Additional expense routes
router.get('/stats/summary', getExpenseStats);
router.get('/category/:category', getExpensesByCategory);
router.get('/recent', getRecentExpenses);

module.exports = router;