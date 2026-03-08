require('dotenv').config();
const mongoose = require('mongoose');
const expenseController = require('../controllers/expenseController');

async function testController() {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/expense_tracker');

    const req = {
        body: {
            smsBody: "You have paid Rs. 150 to Swiggy UPI ref 987654321 on 15/03/2026. HDFC Bank."
        },
        user: { id: new mongoose.Types.ObjectId() } // mock user ID
    };

    const res = {
        status: function (code) {
            this.statusCode = code;
            return this;
        },
        json: function (data) {
            console.log('Status:', this.statusCode);
            console.log('Response:', data);
        }
    };

    // Mock checking user preference
    const User = require('../models/user');
    User.findById = async () => ({ autoCategorize: true });

    await expenseController.processSMS(req, res);

    mongoose.disconnect();
}

testController().catch(console.error);
