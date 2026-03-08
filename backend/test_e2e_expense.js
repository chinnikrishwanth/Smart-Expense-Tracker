const mongoose = require('mongoose');
const User = require('./models/user');
require('dotenv').config();

const API_URL = 'http://localhost:5000/api';

async function generateTestToken() {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/expense_tracker');
    const jwt = require('jsonwebtoken');

    // Find a real user or use a mock ID
    const testUser = await User.findOne() || { _id: new mongoose.Types.ObjectId() };

    const token = jwt.sign(
        { id: testUser._id.toString() },
        process.env.JWT_SECRET || 'your_super_secret_key_here',
        { expiresIn: '1h' }
    );

    await mongoose.disconnect();
    return token;
}

async function runE2ETest() {
    try {
        console.log('Generating test token...');
        const token = await generateTestToken();
        console.log('Token generated');

        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        console.log('\n--- Test 1: Add Valid Manual Expense ---');
        try {
            const validRes = await fetch(`${API_URL}/expenses`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    amount: 85,
                    category: 'Food & Dining',
                    merchant: 'Cafe Mocha',
                    description: 'Testing valid enum via E2E'
                })
            });
            const data = await validRes.json();
            if (!validRes.ok) throw new Error(JSON.stringify(data));

            console.log('✅ Success:', validRes.status);
            console.log('Data saved:', data.data.category, '-', data.data.amount);
        } catch (err) {
            console.error('❌ Failed Valid Expense:', err.message);
        }

        console.log('\n--- Test 2: Add Invalid Manual Expense (Bad Enum) ---');
        try {
            const invalidRes = await fetch(`${API_URL}/expenses`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    amount: 30,
                    category: 'Food', // This should fail
                    merchant: 'Test Vendor',
                    description: 'Testing invalid enum'
                })
            });
            const data = await invalidRes.json();
            if (!invalidRes.ok) throw new Error(JSON.stringify(data));

            console.log('❌ Unexpected Success:', invalidRes.status);
        } catch (err) {
            console.log('✅ Successfully caught Validation Error');
            console.log('Error Data:', err.message);
        }

    } catch (error) {
        console.error('Fatal Test Error:', error.message);
    }
}

runE2ETest();
