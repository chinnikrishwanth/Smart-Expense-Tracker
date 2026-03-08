const tesseract = require('tesseract.js');
const tf = require('@tensorflow/tfjs');
const { GoogleGenAI } = require('@google/genai');
const Expense = require('../models/expense');

const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

exports.uploadReceipt = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image provided' });
    }
    const buffer = req.file.buffer;

    // Tesseract OCR
    const result = await tesseract.recognize(buffer, 'eng');
    const text = result.data.text;

    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const amountMatch = text.match(/\$?\s?\d+\.\d{2}/);
    const amount = amountMatch ? parseFloat(amountMatch[0].replace('$', '').trim()) : null;
    const merchant = lines.length > 0 ? lines[0] : 'Unknown Merchant';

    res.json({
      success: true,
      data: { text, amount, merchant }
    });

  } catch (error) {
    console.error('OCR Error:', error);
    res.status(500).json({ success: false, error: 'Error processing receipt.' });
  }
};

exports.forecastBudget = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const expenses = await Expense.find({ user: userId }).sort({ date: 1 });

    const monthlyTotals = {};
    expenses.forEach(ex => {
      const d = new Date(ex.date);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      if (!monthlyTotals[key]) monthlyTotals[key] = 0;
      monthlyTotals[key] += ex.amount;
    });

    const dataSequence = Object.values(monthlyTotals);

    if (dataSequence.length < 3) {
      const avg = dataSequence.length > 0 ? dataSequence.reduce((a, b) => a + b, 0) / dataSequence.length : 0;
      return res.json({
        success: true,
        data: { forecast: avg, message: 'Not enough data for LSTM. Returning naive average.', history: dataSequence }
      });
    }

    const lookBack = 2;
    const X = [];
    const Y = [];
    for (let i = 0; i < dataSequence.length - lookBack; i++) {
      X.push(dataSequence.slice(i, i + lookBack));
      Y.push(dataSequence[i + lookBack]);
    }

    if (X.length === 0) {
      return res.json({
        success: true,
        data: { forecast: dataSequence[dataSequence.length - 1], history: dataSequence }
      });
    }

    const maxVal = Math.max(...dataSequence);
    const scale = (val) => val / maxVal;
    const unscale = (val) => val * maxVal;

    const xs = tf.tensor3d(X.map(row => row.map(v => [scale(v)])));
    const ys = tf.tensor2d(Y.map(v => [scale(v)]));

    const model = tf.sequential();
    model.add(tf.layers.lstm({ units: 8, inputShape: [lookBack, 1] }));
    model.add(tf.layers.dense({ units: 1 }));
    model.compile({ optimizer: 'adam', loss: 'meanSquaredError' });

    await model.fit(xs, ys, { epochs: 50, verbose: 0 });

    const lastSequence = dataSequence.slice(-lookBack);
    const inputForPrediction = tf.tensor3d([lastSequence.map(v => [scale(v)])]);
    const prediction = model.predict(inputForPrediction);
    const forecastScaled = prediction.dataSync()[0];
    const forecast = Math.max(0, unscale(forecastScaled));

    res.json({
      success: true,
      data: { forecast, history: dataSequence, message: 'Forecast generated using LSTM model.' }
    });

  } catch (error) {
    console.error('LSTM Forecast Error:', error);
    res.status(500).json({ success: false, error: 'Error generating forecast.' });
  }
};

exports.chat = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }

    const recentExpenses = await Expense.find({ user: userId }).sort({ date: -1 }).limit(20);

    let contextStr = "Recent transactions:\n";
    recentExpenses.forEach(ex => {
      contextStr += `- $${ex.amount} for ${ex.category} to ${ex.merchant} on ${new Date(ex.date).toDateString()}\n`;
    });

    const prompt = `You are a helpful Personal Finance Manager AI. You help users manage their budget, track expenses, and provide financial advice.
Based on the following recent user transactions:
${contextStr}

User Question: ${message}
Answer concisely and accurately based on their transactions if relevant.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });

    res.json({
      success: true,
      data: { reply: response.text }
    });

  } catch (error) {
    console.error('GenAI Chat Error:', error);
    res.status(500).json({ success: false, error: 'Failed to communicate with AI Chatbot.' });
  }
};
