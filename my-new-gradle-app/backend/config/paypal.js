const paypal = require('@paypal/checkout-server-sdk');

// Creating an environment
// Use PAYPAL_CLIENT_ID and PAYPAL_SECRET from .env for both sandbox and live
const environment = process.env.PAYPAL_MODE === 'live'
    ? new paypal.core.LiveEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_SECRET)
    : new paypal.core.SandboxEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_SECRET);

// Creating a client for the PayPal API
const client = new paypal.core.PayPalHttpClient(environment);

// Function to create an order
async function createOrder(requestBody) {
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody(requestBody);
    const response = await client.execute(request);
    return response.result;
}

// Function to capture an order
async function captureOrder(orderId) {
    const request = new paypal.orders.OrdersCaptureRequest(orderId);
    request.prefer("return=representation");
    const response = await client.execute(request);
    return response.result;
}

module.exports = {
    createOrder,
    captureOrder
};
