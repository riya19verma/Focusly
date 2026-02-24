import { callAI } from "../utils/aiService.js";

const classifyTask = async (description) => {

  const prompt = `
You are a task classification engine.

Classify the following task into following (Choose exactly ONE value from each group below.): 

1. category based on the nature of the task:
Deep Work, Study, Admin, Shallow, Creative, Physical, Personal.

2. category based on the effort level required:
Low, Medium, High.

3. category based on the energy type required:
Cognitive, Mechanical, Social.

Return ONLY valid JSON.
No explanation.
No markdown.
No extra text.

Format:
{
  "category": "...",
  "effort_level": "...",
  "energy_type": "...",
}

Task:
"${description}"
`;

  const raw = await callAI(prompt);

  // Clean possible markdown formatting
  const cleaned = raw.replace(/```json|```/g, "").trim();

  const parsed = JSON.parse(cleaned);

  return parsed;   // return full object
};

export { classifyTask };




//Categories:
// 1. Deep Work
// 2. Shallow Task
// 3. Admin
// 4. Study
// 5. Creative
// 6. Personal
// 7. Physical

//Effort Level:
// - Low
// - Medium
// - High

// Energy Type:
// - Cognitive
// - Mechanical
// - Social

// Term length:
// - Short Term (weekly or less than a month) -> break it day-wise + routines
// - Medium Term (monthly or more than a month but less than an year) -> break it week-wise + routines
// - Long Term (1-2 years) -> break it month-wise + routines
// - Extra long term(>2 years) -> suggest patha and ask at which stage user is and motivate user to first 
//   focus on one stage(1 yr) and make a long term goal out of it
// At begining of every week and month, give an option to break down big sub goals into smaller ones and make 
// day-wise schedule + set routines for them. Also, give an option to review the goals and routines and make
// changes if needed.