const express = require('express');
const router = express.Router();
const {
  getBudget,
  setBudget,
  getReport,
  getDashboardSummary,
  deleteBudget,
  getBudgetHistory
} = require('../controllers/budgetController');
const { authenticate } = require('../middlewares/authenticate');

// All budget routes are protected
router.use(authenticate);

// Budget CRUD operations
router.get('/budget', getBudget);
router.post('/budget', setBudget);
router.delete('/budget', deleteBudget);

// Reports and summaries
router.get('/report', getReport);
router.get('/dashboard-summary', getDashboardSummary);
router.get('/history', getBudgetHistory);

module.exports = router;