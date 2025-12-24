const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { VertexAI } = require("@google-cloud/vertexai");

const vertex_ai = new VertexAI({ project: 'web3-social-connect', location: 'us-central1' });
const generativeModel = vertex_ai.getGenerativeModel({
  model: 'gemini-1.5-flash',
  systemInstruction: {
    role: 'system',
    parts: [{
      text: "You are the Gemini Sovereign Agent for RCS Distribution & Retail, LLC. You handle legal research, wallet resolution, and customer service. Always be professional and prioritize user sovereignty."
    }]
  }
});

exports.researchAgent = onCall(async (request) => {
  const prompt = request.data.query;
  if (!prompt) throw new HttpsError("invalid-argument", "Query required.");

  try {
    const result = await generativeModel.generateContent(prompt);
    const response = await result.response;
    return { answer: response.candidates[0].content.parts[0].text };
  } catch (error) {
    console.error("AI Error:", error);
    throw new HttpsError("internal", "AI Node Busy.");
  }
});
