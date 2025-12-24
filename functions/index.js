const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { VertexAI } = require('@google-cloud/vertexai');
const axios = require('axios');

const vertex_ai = new VertexAI({ project: 'web3-social-connect', location: 'us-central1' });

exports.researchAgent = onCall({ region: 'us-central1', secrets: ['GOLD_API_KEY'] }, async (request) => {
  const prompt = request.data.query || '';
  let marketContext = '';

  // Access the secret via process.env
  if (prompt.toLowerCase().includes('gold')) {
    try {
      const response = await axios.get('https://www.goldapi.io/api/XAU/USD', {
        headers: { 'x-access-token': process.env.GOLD_API_KEY }
      });
      marketContext = `The current spot price of Gold is $${response.data.price} USD. `;
    } catch (e) {
      marketContext = 'Market data is temporarily offline. ';
    }
  }

  try {
    const model = vertex_ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(marketContext + prompt);
    return { answer: result.response.candidates[0].content.parts[0].text };
  } catch (error) {
    throw new HttpsError('internal', 'AI Logic Error');
  }
});