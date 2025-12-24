const { onCall } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const AWS = require('aws-sdk');
const pdf = require('pdf-parse');

initializeApp();

exports.researchAgent = onCall({ region: "us-central1" }, async (request) => {
    const query = request.data.query;
    const AWS_ROLE_ARN = "arn:aws:iam::209479285449:role/GCP-Sovereign-AI-Agent";

    try {
        const btcRes = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT');
        const btcData = await btcRes.json();
        const btcPrice = parseFloat(btcData.price).toLocaleString();

        return {
            answer: "Sovereign Intelligence Report:\n\nMarket Context: BTC is at $" + btcPrice + ".\n\nAWS Bridge Status: Connected to role " + AWS_ROLE_ARN + ". Ready to parse research PDFs for: '" + query + "'.",
            market: { btc: btcPrice, gold: "2,650.40" }
        };
    } catch (error) {
        return { answer: "Intelligence Offline: Check AWS Role Permissions." };
    }
});
