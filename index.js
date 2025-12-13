const { App, LogLevel } = require('@slack/bolt');
const { initializeApp } = require('firebase/app');
<<<<<<< HEAD
const { getFirestore, doc, getDoc, collection, getDocs } = require('firebase/firestore');
const axios = require('axios');
=======
const { getFirestore } = require('firebase/firestore');
require('dotenv').config();
>>>>>>> 08d13ee0ed1db22b3af0bf253927d6380e55cb20

// --- CONFIGURATION ---

// 1. Firebase Configuration (Loaded from environment variables)
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

// 2. Environment Variables Check
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET;
<<<<<<< HEAD
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const WALLET_ADDRESS = process.env.WALLET_ADDRESS;

if (!SLACK_BOT_TOKEN || !SLACK_SIGNING_SECRET || !GEMINI_API_KEY) {
  console.error('CRITICAL ERROR: One or more required tokens (SLACK_BOT, SIGNING, GEMINI) are missing from the environment. Check your .env file.');
  process.exit(1);
=======
const GEMINI_API_KEY = process.env.GEMINI_API_KEY; // Retaining for Gemini functionality
const WALLET_ADDRESS = process.env.WALLET_ADDRESS;

if (!SLACK_BOT_TOKEN || !SLACK_SIGNING_SECRET || !GEMINI_API_KEY) {
  console.error('CRITICAL ERROR: One or more required tokens (SLACK_BOT, SIGNING, GEMINI) are missing from the environment. Check your environment variables.');
>>>>>>> 08d13ee0ed1db22b3af0bf253927d6380e55cb20
}

// --- INITIALIZATION ---

// Initialize Firebase
<<<<<<< HEAD
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
=======
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);
>>>>>>> 08d13ee0ed1db22b3af0bf253927d6380e55cb20

// Initialize Slack App in HTTP (Web Hook) Mode
const boltApp = new App({
  token: SLACK_BOT_TOKEN,
  signingSecret: SLACK_SIGNING_SECRET,
<<<<<<< HEAD
  // FIX: Added 'new' to correctly instantiate the ExpressReceiver class
  receiver: new (require('@slack/bolt').ExpressReceiver)({
    signingSecret: SLACK_SIGNING_SECRET,
    // The path where Slack sends the events
=======
  receiver: new (require('@slack/bolt').ExpressReceiver)({
    signingSecret: SLACK_SIGNING_SECRET,
>>>>>>> 08d13ee0ed1db22b3af0bf253927d6380e55cb20
    endpoints: {
      events: '/slack/events',
    },
  }),
  logLevel: LogLevel.INFO,
});


// --- HANDLERS ---

<<<<<<< HEAD
// Helper function to get Gemini response
async function getGeminiResponse(prompt) {
    // This is a placeholder API call structure. You would use the 'prompt' here.
=======
async function getGeminiResponse(prompt) {
    // This is the core function where you integrate the Gemini API
>>>>>>> 08d13ee0ed1db22b3af0bf253927d6380e55cb20
    return `[Gemini Integration Placeholder]: You asked about "${prompt}". The API is ready to call the Gemini model with your query.`;
}


// Listen for a mention of the bot (e.g., @BotName help)
boltApp.event('app_mention', async ({ event, say }) => {
  try {
<<<<<<< HEAD
    const text = event.text.replace(/<@.*?>/, '').trim(); // Remove mention tag
=======
    const text = event.text.replace(/<@.*?>/, '').trim(); 
>>>>>>> 08d13ee0ed1db22b3af0bf253927d6380e55cb20

    if (text.toLowerCase().startsWith('help')) {
      await say({
        text: `Hello, I'm the Gemini Bot Protocol. I can help with Web3 lookups and AI generation.
\n*Commands:*
• \`help\`: Shows this message.
• \`balance\`: Returns the current Web3 wallet address and status (Currently set to ${WALLET_ADDRESS}).
<<<<<<< HEAD
• Any question: Ask me any general question, and I will use the Gemini AI to respond. (e.g., \`@Gemini Bot Protocol What is the Nexus blockchain status?\`)`,
=======
• Any question: Ask me any general question, and I will use the Gemini AI to respond.`,
>>>>>>> 08d13ee0ed1db22b3af0bf253927d6380e55cb20
        channel: event.channel,
      });
      return;
    }

    if (text.toLowerCase().startsWith('balance')) {
      await say({
        text: `*Web3 Wallet Status:*
Wallet Address: \`${WALLET_ADDRESS || 'Not Set'}\`
Balance: Placeholder (Web3 calls are ready to be integrated).
*Deployment Status:* Firebase configuration loaded.`,
        channel: event.channel,
      });
      return;
    }

    // Default: Send query to Gemini AI Placeholder
    const geminiResponse = await getGeminiResponse(text);
    await say({
      text: geminiResponse,
      channel: event.channel,
    });

  } catch (error) {
    console.error('Error processing app_mention event:', error);
    await say({ text: `Oops! Encountered an error while trying to process your request: ${error.message}` });
  }
});


// --- START APP ---

(async () => {
<<<<<<< HEAD
  const port = process.env.PORT || 3000;
=======
  // CRITICAL FIX: Use the port provided by Cloud Run (process.env.PORT) or default to 8080
  const port = process.env.PORT || 8080; 
>>>>>>> 08d13ee0ed1db22b3af0bf253927d6380e55cb20
  await boltApp.start(port);
  console.log(`⚡️ Nexus Slack Bot is listening for HTTP requests on port ${port}!`);
  console.log(`Starting bot for Wallet: ${WALLET_ADDRESS}`);
})();
