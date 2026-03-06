
const { createClient } = require("@google/genai");
const fs = require('fs');
const path = require('path');

function getApiKey() {
  try {
    const envContent = fs.readFileSync('.env.local', 'utf8');
    const match = envContent.match(/GEMINI_API_KEY=(.*)/);
    return match ? match[1].trim() : null;
  } catch (e) {
    return null;
  }
}

async function testEmbedding() {
  const apiKey = getApiKey();
  console.log("Using API Key starting with:", apiKey ? apiKey.substring(0, 5) : "UNDEFINED");

  if (!apiKey) {
    console.error("No API key found in .env.local");
    process.exit(1);
  }

  const ai = createClient({
    apiKey: apiKey,
    apiVersion: "v1"
  });

  try {
    console.log("Attempting to generate embedding for 'Test text'...");
    const result = await ai.models.embedContent({
      model: "text-embedding-004",
      contents: [{
        parts: [{ text: "Test text" }]
      }]
    });
    console.log("Success! Embedding length:", result.embedding.values.length);
  } catch (error) {
    console.error("FAILED to generate embedding.");
    console.error("Error Name:", error.name);
    console.error("Error Message:", error.message);
    // Log the whole error for inspection
    console.error("Full Error:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    process.exit(1);
  }
}

testEmbedding();
