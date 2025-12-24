const { onCall, onRequest } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore"); // New import
const { getStorage } = require("firebase-admin/storage");
const { VertexAI } = require('@google-cloud/vertexai');
const pdf = require('pdf-parse');
const logger = require("firebase-functions/logger");

initializeApp();
const db = getFirestore(); // New initialization

exports.researchAgent = onCall({ region: "us-central1" }, async (request) => {
    const vertexAI = new VertexAI({project: process.env.GCLOUD_PROJECT, location: 'us-central1'});
    const generativeModel = vertexAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    try {
        const bucket = getStorage().bucket("web3-social-connect-research-vault");
        const [files] = await bucket.getFiles({ prefix: 'research/' });
        
        const targetFile = files.find(f => f.name.endsWith('.pdf') || f.name.endsWith('.txt'));

        if (!targetFile) return { status: "error", message: "Vault is empty. Please upload a PDF or TXT." };

        const [content] = await targetFile.download();
        let textToAnalyze = "";

        if (targetFile.name.endsWith('.pdf')) {
            const pdfData = await pdf(content);
            textToAnalyze = pdfData.text;
        } else {
            textToAnalyze = content.toString();
        }
        
        const prompt = "Analyze this document for RCS DISTRIBUTION AND RETAIL, LLC and provide a 3-point Sovereign Intelligence summary: " + textToAnalyze.substring(0, 10000);
        const result = await generativeModel.generateContent(prompt);
        const response = await result.response;

        return {
            status: "success",
            fileName: targetFile.name,
            summary: response.candidates[0].content.parts[0].text
        };
    } catch (error) {
        return { status: "error", message: error.message };
    }
});

/**
 * Mastodon Webhook Receiver
 * This function listens for POST requests from Mastodon's webhook service.
 */
exports.mastodonWebhook = onRequest(async (req, res) => { // Changed to async
  // 1. Security Check: Only allow POST requests
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  try {
    const payload = req.body;
    const eventType = payload.event; // e.g., "status.created"
    
    logger.info(`Received ${eventType} from Mastodon`);

    // 2. The Parser: Focus on status updates (Your Posts)
    if (eventType === 'status.created' || eventType === 'status.updated') {
      const statusData = payload.object;
      
      const refinedPost = {
        postId: statusData.id,
        content: statusData.content, // This contains your Web3/Gold knowledge
        url: statusData.url,
        createdAt: statusData.created_at,
        account: statusData.account.username,
        tags: statusData.tags || [],
        processedAt: new Date().toISOString()
      };

      // 3. Store in Firestore for the UI to "See"
      await db.collection('sovereign_feed').doc(statusData.id).set(refinedPost);
      
      logger.info("Successfully parsed and saved Mastodon post to Firestore.");
    }

    res.status(200).send('Successfully Parsed');
  } catch (error) {
    logger.error("Parsing Error:", error);
    res.status(500).send('Internal Server Error');
  }
});

// --- Advanced Logic Exports ---
const advancedLogic = require('./advanced-logic');

exports.handleKYC = advancedLogic.handleKYC;
exports.bloggingService = advancedLogic.bloggingService;
exports.streamingService = advancedLogic.streamingService;
exports.gamingService = advancedLogic.gamingService;