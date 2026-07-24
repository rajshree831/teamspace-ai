require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function listModels() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // This is a special method to see what YOUR key can access
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${process.env.GEMINI_API_KEY}`);
    const data = await response.json();
    
    console.log("--- Available Models ---");
    if (data.models) {
      data.models.forEach(m => console.log(m.name));
    } else {
      console.log("No models found. Response:", data);
    }
  } catch (e) {
    console.error("Error:", e);
  }
}

listModels();