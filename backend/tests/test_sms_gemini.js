require('dotenv').config();
const { parseSMSWithGemini } = require('../utils/gemini');

async function test() {
    const sampleTrickySMS = "You have paid Rs. 450 to Zomato UPI ref 123456789 on 12/03/2026. HDFC Bank.";

    console.log("Testing tricky SMS:", sampleTrickySMS);
    const result = await parseSMSWithGemini(sampleTrickySMS);
    console.log("Result:", result);
}

test();
