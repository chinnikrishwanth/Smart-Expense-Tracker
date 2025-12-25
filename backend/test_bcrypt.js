const bcrypt = require('bcryptjs');

async function test() {
    try {
        console.log('Testing compare with undefined hash...');
        await bcrypt.compare('password', undefined);
        console.log('Did not throw');
    } catch (err) {
        console.log('Threw error:', err.message);
    }
}

test();
