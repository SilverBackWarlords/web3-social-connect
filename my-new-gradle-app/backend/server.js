const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const axios = require('axios'); // For making HTTP requests to PayPal

// Import the PayPal configuration and functions from config/paypal.js
const paypal = require('./config/paypal');
const { handleWebhook } = require('./utils/paypal_webhook_handler');

// Import the Winston logger
const logger = require('./utils/logger'); // Add this line

// Initialize Express app
const app = express();
const port = process.env.PORT || 3001;

// Middleware to parse JSON request bodies
app.use(express.json());

// MongoDB Connection
const uri = process.env.MONGO_URI;
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function connectToMongo() {
    try {
        await client.connect();
        await client.db("admin").command({ ping: 1 });
        logger.info("Successfully connected to MongoDB!"); // Changed to logger.info
    } catch (error) {
        logger.error("Failed to connect to MongoDB:", error); // Changed to logger.error
        process.exit(1); // Exit process if MongoDB connection fails
    }
}
connectToMongo();

// Graceful shutdown
process.on('SIGINT', async () => {
    logger.info('\nClosing MongoDB connection...'); // Changed to logger.info
    await client.close();
    logger.info('MongoDB connection closed. Server shutting down.'); // Changed to logger.info
    process.exit(0);
});

// Middleware for JWT verification
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        logger.warn('Auth attempt without token'); // Added logging
        return res.status(401).json({ message: 'No token provided.' });
    }

    const token = authHeader.split(' ')[1]; // Expects "Bearer TOKEN"
    if (!token) {
        logger.warn('Auth attempt with malformed token'); // Added logging
        return res.status(401).json({ message: 'Token format is "Bearer <token>".' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        req.username = decoded.username; // Attach username to request
        next();
    } catch (error) {
        logger.error('JWT verification error:', error.message); // Changed to logger.error
        return res.status(403).json({ message: 'Failed to authenticate token.', error: error.message });
    }
};

// --- Routers ---
const authRouter = express.Router();
const productsRouter = express.Router();
const cartRouter = express.Router();
const paypalRouter = express.Router();
const ordersRouter = express.Router();

// --- Auth Routes ---
authRouter.post('/register', async (req, res, next) => { // Added next
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const db = client.db('rcsonline');
        const usersCollection = db.collection('users');
        const result = await usersCollection.insertOne({ username, password: hashedPassword, cart: { items: [] } });
        logger.info(`User registered: ${username}`); // Added logging
        res.status(201).json({ message: 'User registered successfully!', userId: result.insertedId });
    } catch (error) {
        logger.error('Registration error:', error.message); // Changed to logger.error
        next(error); // Pass error to global handler
    }
});

authRouter.post('/login', async (req, res, next) => { // Added next
    const { username, password } = req.body;
    try {
        const db = client.db('rcsonline');
        const usersCollection = db.collection('users');
        const user = await usersCollection.findOne({ username });

        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials.' });
        }

        const token = jwt.sign({ userId: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
        logger.info(`User logged in: ${username}`); // Added logging
        res.status(200).json({ message: 'Logged in successfully!', token });
    } catch (error) {
        logger.error('Login error:', error.message); // Changed to logger.error
        next(error); // Pass error to global handler
    }
});

// --- Product Routes ---
productsRouter.get('/', async (req, res, next) => { // Added next
    try {
        const db = client.db('rcsonline');
        const productsCollection = db.collection('products');
        const products = await productsCollection.find({}).toArray();
        logger.info('Products fetched successfully.'); // Added logging
        res.status(200).json(products);
    } catch (error) {
        logger.error('Error fetching products:', error.message); // Changed to logger.error
        next(error); // Pass error to global handler
    }
});

// --- Cart Routes ---
cartRouter.post('/add', verifyToken, async (req, res, next) => { // Added next
    const { productId, quantity } = req.body;
    const userId = req.userId;

    if (!productId || quantity == null || quantity <= 0) {
        return res.status(400).json({ message: 'Invalid product ID or quantity.' });
    }

    try {
        const db = client.db('rcsonline');
        const productsCollection = db.collection('products');
        const usersCollection = db.collection('users');

        const product = await productsCollection.findOne({ _id: new ObjectId(productId) });
        if (!product) {
            logger.warn(`Attempt to add non-existent product ID ${productId} to cart for user ${userId}`); // Added logging
            return res.status(404).json({ message: 'Product not found.' });
        }

        if (product.stock < quantity) {
            logger.warn(`Insufficient stock for product ${productId}. Requested: ${quantity}, Available: ${product.stock}`); // Added logging
            return res.status(400).json({ message: 'Not enough stock for this product.' });
        }

        // Add item to user's cart
        await usersCollection.updateOne(
            { _id: new ObjectId(userId) },
            {
                $addToSet: {
                    'cart.items': {
                        productId: new ObjectId(productId),
                        name: product.name, // Store product name for easier display
                        price: product.price, // Store price at time of adding
                        quantity: quantity
                    }
                }
            },
            { upsert: true } // Creates the cart field if it doesn't exist
        );

        logger.info(`Item ${productId} (qty: ${quantity}) added to cart for user ${userId}.`); // Added logging
        res.status(200).json({ message: 'Item added to cart successfully.' });
    } catch (error) {
        logger.error('Error adding item to cart:', error.message); // Changed to logger.error
        next(error); // Pass error to global handler
    }
});

// --- PayPal Routes ---
paypalRouter.post('/create-order', verifyToken, async (req, res, next) => { // Added next
    try {
        const userId = req.userId; // Get userId from the decoded JWT token
        const db = client.db('rcsonline');
        const usersCollection = db.collection('users');

        // Fetch user's cart
        const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
        if (!user || !user.cart || user.cart.items.length === 0) {
            logger.warn(`User ${userId} attempted to create PayPal order with empty or missing cart.`); // Added logging
            return res.status(404).json({ message: 'Cart not found or is empty.' });
        }

        const cart = user.cart;

        // Map cart items to the PayPal format
        const items = cart.items.map(item => ({
            name: item.name,
            unit_amount: {
                currency_code: 'USD',
                value: item.price.toFixed(2),
            },
            quantity: item.quantity.toString(),
        }));

        // Calculate the total value of all items in the cart
        const totalValue = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2);

        // PayPal API call to create the order
        const requestBody = {
            intent: 'CAPTURE',
            purchase_units: [{
                items: items,
                amount: {
                    currency_code: 'USD',
                    value: totalValue,
                    breakdown: {
                        item_total: {
                            currency_code: 'USD',
                            value: totalValue,
                        },
                    },
                },
                // For a more complete integration, you'd add shipping_details and other info here
            }],
            application_context: {
                return_url: 'http://localhost:3000/success', // Placeholder for your frontend success page
                cancel_url: 'http://localhost:3000/cancel', // Placeholder for your frontend cancel page
            }
        };

        const order = await paypal.createOrder(requestBody); // Use paypal.createOrder from imported module
        logger.info(`PayPal order created for user ${userId}: ${order.id}`); // Added logging
        res.status(200).json({
            orderID: order.id,
            approveLink: order.links.find(link => link.rel === 'approve').href
        });

    } catch (error) {
        logger.error('Error creating PayPal order:', error); // Changed to logger.error (pass full error)
        next(error); // Pass error to global handler
    }
});

paypalRouter.post('/capture-order', verifyToken, async (req, res, next) => { // Added next
    try {
        const { orderID } = req.body;
        const userId = req.userId;

        if (!orderID) {
            return res.status(400).json({ message: 'Order ID is required.' });
        }

        const capture = await paypal.captureOrder(orderID); // Use paypal.captureOrder from imported module

        // Check if the payment was successfully captured by PayPal
        if (capture.status === 'COMPLETED' || capture.status === 'APPROVED') {
            logger.info(`PayPal payment captured successfully for order ID: ${orderID}, status: ${capture.status}`); // Added logging

            // Get user's current cart to create the order in MongoDB
            const db = client.db('rcsonline');
            const usersCollection = db.collection('users');
            const ordersCollection = db.collection('orders');
            const productsCollection = db.collection('products');

            const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
            if (!user || !user.cart || user.cart.items.length === 0) {
                logger.warn(`User ${userId} cart was empty during capture for PayPal Order ID: ${orderID}. Order not saved.`); // Added logging
                // This scenario should ideally not happen if create-order worked and user didn't clear cart
                return res.status(404).json({ message: 'Cart is empty, cannot create order.' });
            }

            const orderItems = user.cart.items;
            const totalAmount = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

            // Create new order document
            const newOrder = {
                userId: new ObjectId(userId),
                items: orderItems,
                totalAmount: totalAmount,
                paypalOrderId: orderID,
                status: 'completed', // Or 'pending' if further actions are needed
                createdAt: new Date(),
            };

            const orderResult = await ordersCollection.insertOne(newOrder);
            logger.info(`Order created in DB for user ${userId} with MongoDB ID: ${orderResult.insertedId}`); // Added logging

            // Clear the user's cart after successful order creation
            await usersCollection.updateOne(
                { _id: new ObjectId(userId) },
                { $set: { 'cart.items': [] } }
            );
            logger.info(`Cart cleared for user ${userId}`); // Added logging

            // Update product stock
            for (const item of orderItems) {
                await productsCollection.updateOne(
                    { _id: item.productId },
                    { $inc: { stock: -item.quantity } } // Decrement stock
                );
                logger.info(`Decremented stock for product ${item.productId} by ${item.quantity}.`); // Added logging
            }

            res.status(200).json({ message: 'Payment captured and order created successfully!', captureData: capture });
        } else {
            logger.error(`PayPal capture not completed for order ID ${orderID}. Status: ${capture.status}`); // Added logging
            res.status(400).json({ message: 'Payment not completed by PayPal.', captureData: capture });
        }

    } catch (error) {
        logger.error('Error capturing PayPal order:', error); // Changed to logger.error (pass full error)
        next(error); // Pass error to global handler
    }
});

paypalRouter.post('/webhook', handleWebhook);

// --- Orders Routes ---
ordersRouter.get('/', verifyToken, async (req, res, next) => { // Added next
    try {
        const userId = req.userId;
        const db = client.db('rcsonline');
        const ordersCollection = db.collection('orders');
        const orders = await ordersCollection.find({ userId: new ObjectId(userId) }).toArray();
        logger.info(`Orders fetched for user ${userId}.`); // Added logging
        res.status(200).json(orders);
    } catch (error) {
        logger.error('Error fetching orders:', error.message); // Changed to logger.error
        next(error); // Pass error to global handler
    }
});


// --- Apply Routers to app ---
app.use('/api/auth', authRouter);
app.use('/api/products', productsRouter);
app.use('/api/cart', cartRouter);
app.use('/api/paypal', paypalRouter);
app.use('/api/orders', ordersRouter);

// --- Global Error Handling Middleware ---
// This should be the last middleware added before starting the server
app.use((err, req, res, next) => {
    logger.error('Unhandled Error:', err); // Log the full error for debugging

    // Send a generic error response to the client
    res.status(err.status || 500).json({
        message: err.message || 'An unexpected error occurred.',
        // In production, avoid sending `err.stack` to client
        // stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});


// Start the server
app.listen(port, () => {
    logger.info(`Server running on port ${port}`); // Changed to logger.info
});
