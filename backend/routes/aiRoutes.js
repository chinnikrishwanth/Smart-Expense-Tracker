const express = require('express');
const router = express.Router();
const multer = require('multer');
const { uploadReceipt, forecastBudget, chat } = require('../controllers/aiController');

const upload = multer({ storage: multer.memoryStorage() });

// Parse receipts via OCR
router.post('/upload-receipt', upload.single('receipt'), uploadReceipt);

// Get budget forecast via LSTM
router.get('/forecast', forecastBudget);

// RAG GenAI Chatbot
router.post('/chat', chat);

module.exports = router;
