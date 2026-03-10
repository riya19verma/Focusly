import { callAI } from "./ai.services.js";

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

    Return JSON with hours allocated per day.
  `;
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

    Break the goal into weekly objectives.

    Consider:
    - user's consistency level
    - user's procrastination tendency
    - user's average task duration

    If procrastination is high:
    distribute work earlier in the schedule.

    Return JSON with weekly milestones.
  `;
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

    Break the goal into monthly milestones.

    Use user behaviour statistics to determine pacing:
    - low consistency → smaller milestones
    - high procrastination → earlier milestones

    Return json with milestones month-wise.
  `;
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
}

const createGoal = async (description,work_capacity_in_hrs ,deadline, qualities, rem_capacity, available_days) => {

  // Call appropriate planning function based on deadline proximity (shortTerm, mediumTerm, longTerm, extraLongTerm)
  const today = new Date();
  const durationDays = (new Date(deadline) - today) / (1000*60*60*24);

  if(durationDays <= 30) prompt = shortTerm(description, deadline, work_capacity_in_hrs, qualities, rem_capacity, available_days);
  else if(durationDays <= 365) prompt = mediumTerm(description, deadline, work_capacity_in_hrs, qualities, available_days);
  else if(durationDays <= 730) prompt = longTerm(description, deadline, work_capacity_in_hrs, qualities);
  else prompt = extraLongTerm(description, deadline, work_capacity_in_hrs, qualities);
}

export { createGoal };
