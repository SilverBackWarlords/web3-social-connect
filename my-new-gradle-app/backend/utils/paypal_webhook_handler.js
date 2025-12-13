const paypal = require('@paypal/checkout-server-sdk');
const client = require('../config/paypal').client;

async function handleWebhook(req, res) {
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;
    const request = new paypal.webhooks.WebhooksVerifySignatureRequest(webhookId);
    request.requestBody({
        auth_algo: req.headers['paypal-auth-algo'],
        cert_url: req.headers['paypal-cert-url'],
        transmission_id: req.headers['paypal-transmission-id'],
        transmission_sig: req.headers['paypal-transmission-sig'],
        transmission_time: req.headers['paypal-transmission-time'],
        webhook_event: req.body
    });

    try {
        const verification = await client.execute(request);
        if (verification.result.verification_status === 'SUCCESS') {
            // Process the webhook event
            console.log('Webhook event verified successfully:', req.body);
            res.status(200).send('Webhook received and verified.');
        } else {
            console.log('Webhook event verification failed.');
            res.status(400).send('Webhook verification failed.');
        }
    } catch (error) {
        console.error('Error verifying webhook:', error);
        res.status(500).send('Error verifying webhook.');
    }
}

module.exports = {
    handleWebhook
};