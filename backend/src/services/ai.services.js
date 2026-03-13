import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

const callAIforClassification = async (prompt) => {
  const result = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });

  return result.text;
};

const callAIforPlanning = async (prompt, history = []) => {
  // In the new SDK, systemInstruction and config are passed within the call
  const result = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [...history, { role: "user", parts: [{ text: prompt }] }],
    config: {
      systemInstruction: "You are a productivity coach. You provide JSON for schedules, but if the user asks questions, you respond conversationally.",
    }
  });

  return result.text;
};

const callAIforChatting = async (user_mssg,history = []) => {
  // In the new SDK, systemInstruction and config are passed within the call
  const result = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [...history, { role: "user", parts: [{ text: user_mssg }] }],
    config: {
      systemInstruction: `You are a helpful friendly assistant. 
      You answer questions and have conversations with the user.
      You can suggest, help, talk, listen to users, if required 
      comfort them, be playful, funny, sarcastic or serious as 
      per the user's tone. You can also provide productivity 
      advice if the user asks for it.`,
    }
  });

  return result.text;
};


export { 
  callAIforClassification,
  callAIforPlanning,
  callAIforChatting
};