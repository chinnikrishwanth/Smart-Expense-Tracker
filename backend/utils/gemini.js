require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

const analyzeExpense = async (prompt) => {
  const result = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt
  });
  return result.text;
};

const parseSMSWithGemini = async (smsBody) => {
  const prompt = `
    You are an expert AI financial assistant. Your task is to accurately extract transaction details from the following bank, credit card, or UPI SMS and format it strictly as a JSON object.
    Do not include markdown formatting blocks like \`\`\`json, just return the raw JSON object.
    
    If the text is NOT a transaction SMS (e.g., OTP, promotional message), return exact JSON: {"isValid": false}
    
    If it IS a transaction SMS, extract the data and return exact JSON with the following fields:
    - isValid (boolean): true
    - amount (number): the transaction amount strictly as a number
    - merchant (string): the name of the entity the money was sent to or received from (please clean up the name, remove "UPI", "Ref", "at", "to", "VPA" etc.)
    - transactionType (string): "Debit" if money left the account, "Credit" if money entered the account.
    - bankName (string): the name of the bank or "Unknown Bank"
    - upiTransactionId (string or null): the UPI reference number or transaction ID if it exists, otherwise null
    - category (string): categorize the merchant into one of these exactly: "Food & Dining", "Shopping", "Transportation", "Entertainment", "Bills & Utilities", "Healthcare", "Education", "Personal Care", "Travel", "Groceries", "Investments", "Gifts & Donations", "Other"
    
    SMS Body:
    "${smsBody}"
  `;
  try {
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });
    let text = result.text.trim();
    // In case the model still includes markdown formatting, strip it
    text = text.replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '').trim();
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini SMS parse failed:", error);
    return { isValid: false };
  }
};

module.exports = { analyzeExpense, parseSMSWithGemini };