require('dotenv').config();
const mongoose = require('mongoose');
const aiController = require('../controllers/aiController');

async function testChat() {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/expense_tracker');

    const req = {
        body: {
            message: "How much did I spend on food recently?"
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

    await aiController.chat(req, res);

    mongoose.disconnect();
}

testChat().catch(console.error);
