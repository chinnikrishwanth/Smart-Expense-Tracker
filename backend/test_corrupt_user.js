const mongoose = require('mongoose');
const User = require('./models/user');
require('dotenv').config();

async function testFix() {
    try {
        // 1. Connect to DB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        // 2. Create a user with NO password (bypassing mongoose validation if possible, or just using raw collection)
        const email = `corrupt${Date.now()}@example.com`;
        console.log(`Creating corrupt user: ${email}`);

        // Using collection.insertOne to bypass Mongoose 'required' validation
        await User.collection.insertOne({
            email: email,
            // password field missing entirely
        });

        // 3. Attempt to login via API
        console.log('Attempting login...');
        const response = await fetch('http://localhost:5000/api/users/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: 'any_password' })
        });

        const data = await response.json();
        console.log('Status:', response.status);
        console.log('Data:', data);

        if (response.status === 401 || response.status === 400) {
            console.log('SUCCESS: Handled gracefully.');
        } else if (response.status === 500) {
            console.log('FAILURE: Still returning 500.');
        } else {
            console.log('Unexpected status.');
        }

        // Cleanup
        await User.deleteOne({ email });
        await mongoose.disconnect();

    } catch (error) {
        console.error('Test Error:', error);
        if (mongoose.connection.readyState === 1) {
            await mongoose.disconnect();
        }
    }
}

testFix();
