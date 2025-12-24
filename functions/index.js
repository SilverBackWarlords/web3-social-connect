const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { VertexAI } = require("@google-cloud/vertexai");
const axios = require("axios");

const GOLD_API_KEY = "goldapi-cvc4msmjj9sapo-io";

const vertex_ai = new VertexAI({ project: "web3-social-connect", location: "us-central1" });

const getGoldPrice = async () => {
  try {
    const response = await axios.get("https://www.goldapi.io/api/XAU/USD", {
      headers: { "x-access-token": GOLD_API_KEY, "Content-Type": "application/json" }
    });
    return `The current spot price of Gold (XAU) is $${response.data.price} USD per ounce.`;
  } catch (error) {
    return "I am currently unable to fetch live market rates.";
  }
};

const generativeModel = vertex_ai.getGenerativeModel({
  model: "gemini-1.5-flash",
  systemInstruction: "You are the Gemini Sovereign Agent for RCS Distribution & Retail, LLC."
});

exports.researchAgent = onCall(async (request) => {
  const prompt = request.data.query || "";
  let marketContext = "";
  if (prompt.toLowerCase().includes("gold") || prompt.toLowerCase().includes("price")) {
    marketContext = await getGoldPrice();
  }
  try {
    const result = await generativeModel.generateContent(`${marketContext}\n\nUser Question: ${prompt}`);
    const response = await result.response;
    return { answer: response.candidates[0].content.parts[0].text };
  } catch (error) {
    throw new HttpsError("internal", "AI Logic Error");
  }
});