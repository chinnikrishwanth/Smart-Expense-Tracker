require('dotenv').config();
const mongoose = require('mongoose');
const expenseController = require('../controllers/expenseController');

async function testManualExpense() {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/expense_tracker');

    const req = {
        body: {
            amount: 45,
            category: 'Food & Dining',
            merchant: 'Local Cafe',
            description: 'Morning Coffee'
        },
        user: { id: new mongoose.Types.ObjectId() } // mock user ID
    };

    const res = {
        status: function (code) {
            this.statusCode = code;
            return this;
        },
        json: function (data) {
            console.log('Status:', this.statusCode || 200);
            console.log('Response:', data);
        }
    };

    console.log("Testing manual expense creation...");
    await expenseController.createExpense(req, res);

    mongoose.disconnect();
}

testManualExpense().catch(console.error);
