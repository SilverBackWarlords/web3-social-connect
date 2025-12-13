const express = require('express');
const app = express();
const port = 3000;

app.use(express.static(__dirname));

app.post('/create-charge', (req, res) => {
    // In a real application, you would use the Coinbase Commerce API here
    // to create a charge.
    const dummyCharge = {
        id: 'DUMMY_CHARGE_ID',
        code: 'DUMMY_CHARGE_CODE',
        name: 'Test Item',
        description: 'This is a test item.',
        pricing: {
            local: {
                amount: '1.00',
                currency: 'USD'
            }
        }
    };

    res.json(dummyCharge);
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
