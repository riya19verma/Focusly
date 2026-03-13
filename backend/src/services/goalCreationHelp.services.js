import { callAIforPlanning } from "./ai.services.js";

const shortTerm = async (goalDescription, deadline, hours_per_day, user_qualities, rem_capacity, available_days) => {
  const prompt = `
    You are a productivity planning assistant.

    Goal:
    ${goalDescription}

    Deadline:
    ${deadline}

    User daily work capacity:
    ${hours_per_day}

    User daily remaining capacity:
    ${rem_capacity}

    Days of the week available for work:
    ${available_days}

    User task behaviour statistics:
    ${user_qualities}
    
    Planning horizon: <= 4 weeks

    Instructions:

    Break the goal into daily workloads.

    When planning:
    - If procrastination is high → schedule work earlier in the week
    - If consistency is low → break work into smaller chunks
    - If avg_time_devoted is low → avoid long sessions
    - If meet_deadline is low → add buffer days

    Return JSON with hours allocated per day and planning horizon too.
    JSON format:
    {
      "term": "short term",
      "schedule":
       [
        {
          "day": "2024-01-01",
           "description": "Study Science",
           "time_allocated": 2,
           "time_unit" : "hours"
        },
        {
          "day": "2024-01-02",
           "description": "Study Mathematics",
           "time_allocated": 1,
           "time_unit": "hours",
        },
        ...
    ]}
  `;
  return prompt;
}

const mediumTerm = async (goalDescription, deadline, hours_per_day, user_qualities, available_days) => {
  const prompt = `
    You are a productivity planning assistant.

    Goal:
    ${goalDescription}

    Deadline:
    ${deadline}

    Days of the week available for work:
    ${available_days}

    User task behaviour statistics:
    ${user_qualities} 
    Planning horizon: 1-12 months

    Instructions:

    Break the goal into weekly objectives or 
    if required you can include some regularly recurring tasks.

    Consider:
    - user's consistency level
    - user's procrastination tendency
    - user's average task duration

    If procrastination is high:
    distribute work earlier in the schedule.

    Return JSON with weekly milestones and planning horizon too.
    JSON format:
    {
      "term": "medium term",

      "milestones": [
        {
          "week": 1,
          "description": "Complete writing first draft of report"
        },
        {
          "week": 2,
          "description": "Complete peer review of report"
        }
      ],
     
      "recurring_tasks": [
        {
          "description": "Team meeting",
          "time_allocated": 2,
          "time_unit": "hours",
          "start_date": "2024-01-01",
          "recur_rate": 2,
          "recur_unit": "days",
          "due_date": "2024-01-08"
        }
      ]
    }
  `;
  return prompt;
}

const longTerm = async (goalDescription, deadline, hours_per_day, user_qualities) => {
  const prompt = `
    You are a productivity planning assistant.

    Goal:
    ${goalDescription}

    Deadline:
    ${deadline}

    User task behaviour statistics:
    ${user_qualities}

    Planning horizon: 1-2 years

    Instructions:

    Break the goal into monthly milestones or 
    if required you can include some regularly recurring tasks.

    Use user behaviour statistics to determine pacing:
    - low consistency → smaller milestones
    - high procrastination → earlier milestones

    Return json with milestones month-wise and planning horizon too.
    JSON format:
    {
      "term": "long term",

      "milestones": [
        {
          "month": 1,
          "description": "JEE easy topics"
        },
        {
          "month": 2,
          "description": "JEE medium topics"
        }
      ],
     
      "recurring_tasks": [
        {
          "description": "Mock tests",
          "time_allocated": 1,
          "time_unit": "hours",
          "start_date": "2024-01-01",
          "recur_rate": 4,
          "recur_unit": "days",
          "due_date": "2024-01-31"
        }
      ]
    }
  `;
  return prompt;
}

const extraLongTerm = async (goalDescription, deadline, hours_per_day, user_qualities) => {
  const prompt = `
    You are a productivity planning assistant.

    Goal:
    ${goalDescription}

    Deadline:
    ${deadline}

    Planning horizon: > 2 years

    Instructions:

    Create a roadmap with stages.

    Each stage should represent a major milestone.

    Do not create schedules.
  `;
  return prompt;
}

const createGoal = async (description,work_capacity_in_hrs ,deadline, qualities, rem_capacity, available_days) => {

  // Call appropriate planning function based on deadline proximity (shortTerm, mediumTerm, longTerm, extraLongTerm)
  const today = new Date();
  const durationDays = (new Date(deadline) - today) / (1000*60*60*24);
  let prompt;
  if(durationDays <= 30) prompt = shortTerm(description, deadline, work_capacity_in_hrs, qualities, rem_capacity, available_days);
  else if(durationDays <= 365) prompt = mediumTerm(description, deadline, work_capacity_in_hrs, qualities, available_days);
  else if(durationDays <= 730) prompt = longTerm(description, deadline, work_capacity_in_hrs, qualities);
  else prompt = extraLongTerm(description, deadline, work_capacity_in_hrs, qualities);
  try{
      const raw = await callAIforPlanning(prompt);

      // Clean possible markdown formatting
      const cleaned = raw.replace(/```json|```/g, "").trim();

      const parsed = JSON.parse(cleaned);
      return {parsed, res : "Schedule created"};   // return full object
  }catch(error) {
      console.error("AI quota exceeded. Using fallback planning.");
      const parsed = {};

    return {parsed, res : "Message limit reached"};   // return full object
  }
};

const updatePlan = async (UID, user_req, createdGoal, context) => {
  const prompt = `
    User request: ${user_req}
    current plan : ${createdGoal}
    context : ${context}
    Instructions:
    Update the plan based on user request. 
    If user is asking for a change in schedule, update the schedule accordingly. 
    If user is asking for a change in goal, update the goal and the schedule accordingly. 
    If user is asking for a change in both, update both accordingly. 
    If user is asking for a change in neither, provide a conversational response.
    Return the updated plan.
    Keep Return formar same as original prompt return format.
    Original prompt for reference:
  `;
  if(context.term.toLowerCase() == "short term") prompt += shortTerm(description, deadline, work_capacity_in_hrs, qualities, rem_capacity, available_days);
  else if(context.term.toLowerCase() == "medium term") prompt += mediumTerm(description, deadline, work_capacity_in_hrs, qualities, available_days);
  else if(context.term.toLowerCase() == "long term") prompt += longTerm(description, deadline, work_capacity_in_hrs, qualities);
  else prompt += extraLongTerm(description, deadline, work_capacity_in_hrs, qualities);
  try{
      const raw = await callAIforPlanning(prompt);

      // Clean possible markdown formatting
      const cleaned = raw.replace(/```json|```/g, "").trim();

      const parsed = JSON.parse(cleaned);
      return {parsed, res : "Schedule updated"};   // return full object
  }catch(error) {
      console.error("AI quota exceeded. Using fallback planning.");
      const parsed = {};

    return {parsed, res : "Message limit reached"};   // return full object
  }
};


const rescheduleHelp = async (UID, createdGoal, context) => {
  const prompt = `
    User request: Kindly help me perform this task in a better way 
    current plan : ${createdGoal}
    Instructions:
    Analyze the goal description and provide suggestions to complete it in a better way.
    If you think that the task should be broken down into smaller sub-tasks, break it down and provide a schedule for the same.
    If you think that the task is already being performed in the best way, provide a conversational response appreciating the user's efforts and suggesting minor improvements if any.
    User task behaviour statistics:
    ${context.context}

    Instructions:

    Break the goal into daily workloads.

    When planning:
    - If procrastination is high → schedule work earlier in the week
    - If consistency is low → break work into smaller chunks
    - If avg_time_devoted is low → avoid long sessions
    - If meet_deadline is low → add buffer days

    Return JSON with hours allocated per day.
    JSON format:
    {
      "term": "short term",
      "schedule":
       [
        {
          "day": "2024-01-01",
           "description": "Study Science",
           "time_allocated": 2,
           "time_unit" : "hours"
        },
        {
          "day": "2024-01-02",
           "description": "Study Mathematics",
           "time_allocated": 1,
           "time_unit": "hours",
        },
        ...
    ]}
  `;
  try{
      const raw = await callAIforPlanning(prompt);

      // Clean possible markdown formatting
      const cleaned = raw.replace(/```json|```/g, "").trim();

      const parsed = JSON.parse(cleaned);
      return {parsed, res : "Schedule updated"};   // return full object
  }catch(error) {
      console.error("AI quota exceeded. Using fallback planning.");
      const parsed = {};

    return {parsed, res : "Message limit reached"};   // return full object
  }
};



export { 
  createGoal,
  updatePlan,
  rescheduleHelp
};