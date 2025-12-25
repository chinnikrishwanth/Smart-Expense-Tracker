async function testFlow() {
    const email = `test${Date.now()}@example.com`;
    const password = 'password123';

    console.log(`Testing with email: ${email}`);

    // 1. Register
    try {
        console.log('Registering...');
        const regRes = await fetch('http://localhost:5000/api/users/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const regData = await regRes.json();
        console.log('Register Status:', regRes.status);
        console.log('Register Data:', regData);

        if (regRes.status !== 200) return;

    } catch (error) {
        console.log('Register Error:', error.message);
        return;
    }

    // 2. Login
    try {
        console.log('Logging in...');
        const loginRes = await fetch('http://localhost:5000/api/users/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const loginData = await loginRes.json();
        console.log('Login Status:', loginRes.status);
        console.log('Login Data:', loginData);
    } catch (error) {
        console.log('Login Error:', error.message);
    }
}

testFlow();
