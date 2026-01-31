import { GoogleGenerativeAI } from "@google/generative-ai";

// 1. Initialize the API with your Key
const genAI = new GoogleGenerativeAI("YOUR_FREE_API_KEY");

// Define what our data looks like
interface GeminiPayload {
  current_goal: string;
  context: {
    recent_performance: any[];
    active_bottlenecks: any[];
  };
}

// 2. Define the "System Instruction"
// This tells the AI how to behave before the user even speaks.
const SYSTEM_INSTRUCTION = `
  You are a Productivity Architect & Behavioral Coach. Your goal is to transform vague intentions into a high-probability execution plan.

  1. GOAL BREAKDOWN RULES:
     - Deconstruct goals into a logical sequence (e.g., you cannot "Bake" before "Buy Ingredients").
     - Identify Dependencies: If Task B requires Task A, mark Task B as 'dependent' and include Task A's temporary ID in the dependencies array.
     - Sizing: Ensure no 'independent' task exceeds 2 hours. If it does, split it.

  2. RESCHEDULING STRATEGY (Behavioral Coaching):
     - If a user provides a task with a high 'reschedule_count' or 'Late' remarks, DO NOT just move the date.
     - Analyze the friction: Suggest a smaller "Micro-Task" to build momentum, or change the 'task_type' if it should actually be 'recurring'.

  3. DATABASE MAPPING:
     - Return ONLY valid JSON matching this schema:
     {
       "tasks": [
         {
           "def": string,
           "task_type": "independent" | "dependent" | "recurring",
           "details": {
             "priority": 1-5,
             "time_alloted_in_hrs": number,
             "due_date": "YYYY-MM-DD",
             "dependencies": [index_references],
             "recur_rate": number_of_days (if recurring)
           },
           "coach_note": "Short explanation of why this is sequenced here"
         }
       ],
       "productivity_graph": [{ "day": string, "score": number, "insight": string }]
     }
`;
export const getGeminiResponse = async (
  userPrompt: string,
  payload: GeminiPayload
): Promise<any> => {
  try {
    // 1. Initialize the model (Flash is best for JSON speed)
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" },
    });

    // 2. Build the "Behavioral Context"
    // We feed the AI the user's history so it can see their "Remarks" and "Miss Rates"
    const userContextString = `
      [USER CONTEXT]
      Goal: ${payload.current_goal}
      History: ${JSON.stringify(payload.context.recent_performance)}
      Struggling with: ${JSON.stringify(payload.context.active_bottlenecks)}
    `;

    // 3. The Final Prompt
    // We combine the System Instruction (the rules), the Context (the data), and the User Request (the question)
    const result = await model.generateContent([
      SYSTEM_INSTRUCTION,
      userContextString,
      `Specific User Request: ${userPrompt}`,
    ]);

    const response = await result.response;
    const text = response.text();

    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini API Error:", error);
    return null;
  }
};
