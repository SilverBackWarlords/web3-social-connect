// Load environment variables from .env file
require('dotenv').config();

// Core Node.js and Express imports
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const axios = require('axios');
const jwt = require('jsonwebtoken');

// Create the Express application
const app = express();
const port = process.env.PORT || 3001;
const uri = process.env.MONGODB_URI;
let db;
let client;

// Middleware to parse JSON bodies
app.use(express.json());

// JWT Authentication Middleware
// This function verifies the JWT sent in the request header.
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) {
        // If no token is provided, return a 401 Unauthorized status
        return res.sendStatus(401); 
    }

    // Verify the token using the secret key from environment variables
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            // If the token is invalid or expired, return a 403 Forbidden status
            return res.sendStatus(403); 
        }
        // Attach the user information to the request object and proceed
        req.user = user;
        next();
    });
};

// Connect to MongoDB
// This function establishes a connection to your MongoDB database.
async function connectToDb() {
    client = new MongoClient(uri);
    try {
        await client.connect();
        // The database name is now explicitly set to a valid name without spaces
        const dbName = "rcs_one_database";
        db = client.db(dbName);
        console.log("Connected to MongoDB successfully!");

        // --- MOCK DATA SETUP ---
        // This is a simple setup for testing purposes.
        // In a real application, this would be managed differently.
        const productsCollection = db.collection('products');
        await productsCollection.deleteMany({}); // Clear existing mock products
        await productsCollection.insertMany([
            { _id: new ObjectId("689fd96516c1d5bff08fcedf"), name: "Super Cool Gadget", price: 49.99, description: "A fantastic gadget for all your needs." },
            { _id: new ObjectId("689fd96516c1d5bff08fcedc"), name: "Amazing Widget", price: 99.50, description: "The most amazing widget you'll ever own." }
        ]);
        console.log("Mock products created for testing.");
        // --- END MOCK DATA SETUP ---

    } catch (error) {
        console.error("Failed to connect to MongoDB:", error);
        process.exit(1); // Exit if the database connection fails
    }
}
connectToDb();

// --- AUTHENTICATION ENDPOINT ---
// This is a simple login endpoint for testing purposes.
// It creates a JWT for a hardcoded user.
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        // In a real app, you would validate credentials against a database
        if (username === 'testuser' && password === 'password123') {
            const user = { userId: "689fd96516c1d5bff08fce10", username: "testuser" };
            // Sign a new JWT with the user's information
            const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '1h' });
            res.status(200).json({ token });
        } else {
            res.status(401).send('Invalid credentials');
        }
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).send('Server error during login.');
    }
});

// --- PRODUCT ENDPOINTS ---
// This endpoint returns the list of mock products.
app.get('/api/products', async (req, res) => {
  try {
    const productsCollection = db.collection('products');
    const products = await productsCollection.find({}).toArray();
    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).send('Server error fetching products.');
  }
});

// --- CART ENDPOINTS ---
// This endpoint adds a product to the user's cart.
app.post('/api/cart/add', authenticateToken, async (req, res) => {
    try {
        const cartsCollection = db.collection('carts');
        const productsCollection = db.collection('products');
        const { productId, quantity } = req.body;
        const userId = req.user.userId;

        if (!ObjectId.isValid(productId)) {
            return res.status(400).send('Invalid product ID format.');
        }

        const product = await productsCollection.findOne({ _id: new ObjectId(productId) });
        if (!product) {
            return res.status(404).send('Product not found.');
        }

        const existingCart = await cartsCollection.findOne({ userId: new ObjectId(userId) });
        const itemToAdd = {
            productId: new ObjectId(productId),
            name: product.name,
            price: product.price,
            quantity: quantity,
        };

        if (existingCart) {
            // Find if the item already exists in the cart
            const itemIndex = existingCart.items.findIndex(item => item.productId.equals(new ObjectId(productId)));

            if (itemIndex > -1) {
                // Update the quantity if the item exists
                existingCart.items[itemIndex].quantity += quantity;
            } else {
                // Add the new item to the cart
                existingCart.items.push(itemToAdd);
            }
            await cartsCollection.updateOne(
                { userId: new ObjectId(userId) },
                { $set: { items: existingCart.items } }
            );
        } else {
            // Create a new cart for the user
            await cartsCollection.insertOne({
                userId: new ObjectId(userId),
                items: [itemToAdd]
            });
        }
        res.status(200).json({ message: 'Item added to cart successfully.' });

    } catch (error) {
        console.error('Error adding item to cart:', error);
        res.status(500).send('Server error adding item to cart.');
    }
});

app.delete('/api/cart/remove/:productId', authenticateToken, async (req, res) => {
  try {
    const cartsCollection = db.collection('carts');
    const userId = req.user.userId;
    const productId = req.params.productId;

    if (!ObjectId.isValid(productId)) {
      return res.status(400).send('Invalid product ID.');
    }

    const result = await cartsCollection.updateOne(
      { userId: new ObjectId(userId) },
      { $pull: { items: { productId: new ObjectId(productId) } } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).send('Item not found in cart to remove.');
    }
    res.status(200).json({ message: 'Item removed from cart successfully.' });
  } catch (error) {
    console.error('Error removing item from cart:', error);
    res.status(500).send('Server error removing item from cart.');
  }
});

app.delete('/api/cart/clear', authenticateToken, async (req, res) => {
  try {
    const cartsCollection = db.collection('carts');
    const userId = req.user.userId;

    const result = await cartsCollection.deleteOne({ userId: new ObjectId(userId) });

    if (result.deletedCount === 0) {
      return res.status(404).send('Cart not found or already empty.');
    }
    res.status(200).json({ message: 'Cart cleared successfully.' });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).send('Server error clearing cart.');
  }
});

// --- PAYPAL ENDPOINTS ---

// Helper to get PayPal access token
async function getPayPalAccessToken() {
    const paypalApiBase = process.env.PAYPAL_MODE === 'live'
        ? 'https://api.paypal.com'
        : 'https://api.sandbox.paypal.com';

    const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`).toString('base64');
    try {
        const response = await axios.post(
            `${paypalApiBase}/v1/oauth2/token`,
            'grant_type=client_credentials',
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Basic ${auth}`,
                },
            }
        );
        return response.data.access_token;
    } catch (error) {
        console.error('Error getting PayPal access token:', error.response ? error.response.data : error.message);
        throw new Error('Failed to get PayPal access token.');
    }
}

// Create PayPal Order
app.post('/api/paypal/create-order', authenticateToken, async (req, res) => {
    try {
        const cartsCollection = db.collection('carts');
        const userId = req.user.userId;
        const userCart = await cartsCollection.findOne({ userId: new ObjectId(userId) });

        if (!userCart || userCart.items.length === 0) {
            return res.status(400).send('Cart is empty.');
        }

        const totalAmount = userCart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        // Ensure totalAmount is a string with 2 decimal places, as required by PayPal
        const formattedTotalAmount = totalAmount.toFixed(2);

        const accessToken = await getPayPalAccessToken();
        const paypalApiBase = process.env.PAYPAL_MODE === 'live'
            ? 'https://api.paypal.com'
            : 'https://api.sandbox.paypal.com';

        const orderResponse = await axios.post(
            `${paypalApiBase}/v2/checkout/orders`,
            {
                intent: 'CAPTURE',
                purchase_units: [{
                    amount: {
                        currency_code: 'USD',
                        value: formattedTotalAmount,
                    },
                    description: `Order from RCS Online for user ${req.user.username}`,
                    items: userCart.items.map(item => ({
                        name: item.name,
                        unit_amount: {
                            currency_code: 'USD',
                            value: item.price.toFixed(2), // Ensure item price is also 2 decimal places
                        },
                        quantity: item.quantity,
                    })),
                }],
                application_context: {
                    return_url: `${process.env.CLIENT_URL}/paypal-success`, // Client-side URL for successful payment
                    cancel_url: `${process.env.CLIENT_URL}/paypal-cancel`,  // Client-side URL for cancelled payment
                    brand_name: 'RCS Online Store',
                    landing_page: 'NO_PREFERENCE',
                    shipping_preference: 'NO_SHIPPING', // Adjust if you plan to handle shipping
                    user_action: 'PAY_NOW', // Required for immediate payment flow
                }
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                },
            }
        );

        res.json({
            orderID: orderResponse.data.id,
            // Send back the approve link for the client to redirect to PayPal
            approveLink: orderResponse.data.links.find(link => link.rel === 'approve').href
        });

    } catch (error) {
        console.error('Error creating PayPal order:', error.response ? error.response.data : error.message);
        res.status(500).send('Server error creating PayPal order.');
    }
});

// Capture PayPal Order
app.post('/api/paypal/capture-order', authenticateToken, async (req, res) => {
    try {
        const { orderID } = req.body;
        if (!orderID) {
            return res.status(400).send('PayPal Order ID is required.');
        }

        const accessToken = await getPayPalAccessToken();
        const paypalApiBase = process.env.PAYPAL_MODE === 'live'
            ? 'https://api.paypal.com'
            : 'https://api.sandbox.paypal.com';

        const captureResponse = await axios.post(
            `${paypalApiBase}/v2/checkout/orders/${orderID}/capture`,
            {}, // Empty body for capture
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                },
            }
        );

        if (captureResponse.data.status === 'COMPLETED') {
            console.log(`PayPal payment captured successfully for order ID: ${orderID}`);
            
            // --- Order Fulfillment Logic ---
            const cartsCollection = db.collection('carts');
            const ordersCollection = db.collection('orders');
            const userId = req.user.userId;
            const userCart = await cartsCollection.findOne({ userId: new ObjectId(userId) });

            if (userCart && userCart.items.length > 0) {
                const newOrder = {
                    userId: new ObjectId(userId),
                    items: userCart.items,
                    totalAmount: parseFloat(captureResponse.data.purchase_units[0].payments.captures[0].amount.value), // Convert back to number
                    paypalOrderId: orderID,
                    status: 'completed',
                    createdAt: new Date()
                };
                await ordersCollection.insertOne(newOrder);
                console.log(`Order created for user ${userId} via PayPal capture.`);

                // Clear the user's cart after successful payment and order creation
                await cartsCollection.deleteOne({ userId: new ObjectId(userId) });
                console.log(`Cart cleared for user ${userId}`);
            } else {
                console.warn(`PayPal capture completed but cart was empty for user ${userId}. No order created.`);
            }
            // --- End Order Fulfillment Logic ---

            res.status(200).json({ message: 'Payment captured and order created successfully!', captureData: captureResponse.data });
        } else {
            console.warn(`PayPal payment capture status: ${captureResponse.data.status}`);
            res.status(400).json({ message: 'Payment not completed or failed.', captureData: captureResponse.data });
        }

    } catch (error) {
        console.error('Error capturing PayPal order:', error.response ? error.response.data : error.message);
        res.status(500).send('Server error capturing PayPal order.');
    }
});


// --- ORDER ENDPOINTS ---

app.get('/api/orders', authenticateToken, async (req, res) => {
  try {
    const ordersCollection = db.collection('orders');
    const userId = req.user.userId;

    const userOrders = await ordersCollection.find({ userId: new ObjectId(userId) }).toArray();
    res.status(200).json(userOrders);
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).send('Server error fetching orders.');
  }
});

app.get('/api/orders/:id', authenticateToken, async (req, res) => {
  try {
    const ordersCollection = db.collection('orders');
    const orderId = req.params.id;
    const userId = req.user.userId;

    if (!ObjectId.isValid(orderId)) {
      return res.status(400).send('Invalid order ID format.');
    }

    const order = await ordersCollection.findOne({ _id: new ObjectId(orderId), userId: new ObjectId(userId) });

    if (!order) {
      return res.status(404).send('Order not found or you do not have permission to view it.');
    }
    res.status(200).json(order);
  } catch (error) {
    console.error('Error fetching order by ID:', error);
    res.status(500).send('Server error fetching order.');
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Closing MongoDB connection...');
  await client.close();
  console.log('MongoDB connection closed. Server shutting down.');
  process.exit(0);
});
