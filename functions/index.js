const { onCall } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getStorage } = require("firebase-admin/storage");
const { VertexAI } = require('@google-cloud/vertexai');
const pdf = require('pdf-parse');

initializeApp();

exports.researchAgent = onCall({ region: "us-central1" }, async (request) => {
    const vertexAI = new VertexAI({project: process.env.GCLOUD_PROJECT, location: 'us-central1'});
    const generativeModel = vertexAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    try {
        const bucket = getStorage().bucket("web3-social-connect-research-vault");
        const [files] = await bucket.getFiles({ prefix: 'research/' });
        
        // Find EITHER a PDF or a TXT file
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
