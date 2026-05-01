import {asyncHandler} from '../utils/asyncHandler.js';
import pool from '../db/db.js';
import {ApiError} from '../utils/ApiError.js';
import {ApiResponse} from '../utils/ApiResponse.js';
import { classifyTask } from '../services/taskClassify.services.js';
import { parse } from 'dotenv';

async function getNextRecurDate(startDate, recur_rate, recur_unit) {
  const date = new Date(startDate);
  console.log("Start Date:", date);
  switch (recur_unit) {
    case "day":
      date.setDate(date.getDate() + recur_rate);
      console.log("Next Recur Date (Day):", date);
      break;

    case "week":
      date.setDate(date.getDate() + (7 * recur_rate));
      break;

    case "month":
      date.setMonth(date.getMonth() + recur_rate);
      break;

    case "year":
      date.setFullYear(date.getFullYear() + recur_rate);
      break;

    default:
      throw new Error("Invalid recurrence unit");
  }

  return date;
}

async function createNewGoalsFunc(client, PID, tasks, UID) {
    // Collect data from user
    // Check if user has entered all required fields
    // Check whether the set due date >= current date
    // check if user has set recur == true then has the user
    //     entered start date and recurr rate
    // then set parentID and reschedule NULL for independent goal
    // If user clicks to add then first save the entered task and 
    //     then got to a sub-goal:
        // then treat every task and sub goal independently and set
        // parentID as the goalID and reschedule = 0
    // generate task type for every task/goal
    // Enter the task in task table and return TID
    // if task is recurring then generate the next occurrence of the task
    // then find the correct table for category of task and enter the data
    // fill the dependency table if there are any dependencies
    // update sync changes table
    // return success response

    const currentDate = new Date().toISOString().split('T')[0];
    console.log("1")
    console.log("Current User ID:", UID);
    let {
        description = null, 
        due_date = currentDate, 
        is_recurring = false, 
        time_alloted = null, 
        time_unit = null, 
        start_date = currentDate, 
        r_rate=null,
        recur_unit=null,
        sub_goals=null
    } = tasks;
    if(!description || !due_date || !time_alloted || !time_unit) {
        console.log("Missing required fields:", {description, due_date, time_alloted, time_unit});
        throw new ApiError(400, "Description, due date, time alloted and time unit are required fields");
    }
    if(!start_date) start_date = currentDate;
    if(!due_date) due_date = currentDate;
    console.log("Received task data:", tasks);
    const recurring = is_recurring === true? true : false;
    const recur_rate = recurring ? parseInt(r_rate) : null;
    
    const dueDate = new Date(due_date);
    if(dueDate < currentDate) {
        console.log("Due date is in the past:", dueDate);
        throw new ApiError(400, "Due date must be greater than or equal to current date");
    }

    const taskType = await classifyTask(description);
    console.log(taskType);
    const {category, effort_level, energy_type} = taskType;

    let tid;
    const insertQuery = "INSERT INTO tasks (def, cat_type,effort_level, energy_type , UID) VALUES ($1, $2, $3, $4, $5) returning TID";
    const task = await client.query(insertQuery, [description, category, effort_level, energy_type, UID]);
    if(task.rows.length === 0) {
        throw new ApiError(500, "task could not be created");
    }
    tid = task.rows[0].tid;
    if(recurring){
        const startDateObj = new Date(start_date);
        const next_recur_date = startDateObj == currentDate ? startDateObj : getNextRecurDate(start_date, recur_rate, recur_unit);
        // //recurring task table entry
        const insertQuery = 
        `INSERT INTO recurring 
        (tid, pid, start_date, next_recur_date, recur_unit, recur_rate, end_date, completion_rate, miss_rate,time_alloted, time_unit) 
        VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
        returning TID`;
        const response = await client.query(
            insertQuery, 
            [tid, PID, startDateObj, next_recur_date,recur_unit, recur_rate, due_date, 0, 0, time_alloted, time_unit]
        );
        if(response.rows.length === 0) {
            throw new ApiError(500, "task could not be created");
        }
        console.log("Recurring task created with TID:", response.rows[0].tid);
    }
    else {
        const insertQuery =` 
            INSERT INTO dependent (tid, pid, reschedule_count, due_date, completion_rate, time_allotted, time_unit)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING tid`;
        const response = await client.query(
            insertQuery, 
            [tid, PID, 0, due_date, 0, time_alloted, time_unit]
        );
        if(response.rows.length === 0) {
            throw new ApiError(500, "task could not be created");
        }
        if(sub_goals && sub_goals.length > 0) {
            PID = tid;
            for (let i=0; i<sub_goals.length; i++) {
                await createNewGoalsFunc(
                    client, 
                    PID, 
                    sub_goals[i], 
                    UID
                );
            }
        }   
        console.log("Independent task created with TID:", response.rows[0].tid);    
    }
    const {prerequisites} = tasks;
    if(prerequisites && prerequisites.length > 0) {
        for(let i=0; i<prerequisites.length; i++) {
            const insertQuery = "INSERT INTO dependency (tid, prerequisite_tid) VALUES ($1, $2)";
            await client.query(insertQuery, [tid, prerequisites[i]]);
        }
    }
    // -------- SYNC TABLE UPDATE --------
    const verResult = await client.query(
        `SELECT COALESCE(MAX(ver), 0) + 1 AS ver
            FROM sync_changes WHERE uid = $1`,
        [UID]
    );

    const newVer = verResult.rows[0].ver;

    await client.query(
        `
        INSERT INTO sync_changes (uid, obj_type, obj_id, act, ver)
        VALUES ($1, $2, $3, $4, $5)
        `,
        [UID, "TID", tid, "create", newVer]
    );
       
    return tid;
}

const parseAIresponse = (client, PID, tasks, UID, AIres) => {
    const option = AIres.term.toLowerCase();
    const currentDate = new Date().toISOString().split('T')[0];
    if(option === "short term") {
        for(let i=0; i<AIres.schedule.length; i++) {
            const tasks = {
                description : AIres.schedule[i].description,
                due_date : currentDate,
                time_alloted : AIres.schedule[i].time_allocated,
                time_unit  : AIres.schedule[i].time_unit,
                start_date : currentDate,
                r_rate : null,
                recur_unit : null,
                sub_goals : null
            }
            createNewGoalsFunc(client, PID, tasks, UID);
        }
    }
    else if(option === "medium term") {
        for(let i=0; i<AIres.milestones.length; i++) {   
            const weekNo = parseInt(AIres.milestones[i].week);
            const start_date = getNextRecurDate(currentDate, weekNo-1, "week");
            const tasks = {
                description : AIres.milestones[i].description,
                start_date : start_date,
                due_date : getNextRecurDate(start_date, 1, "week"),
                time_alloted : 1,
                time_unit : "week",
                r_rate : null,
                recur_unit : null,
                sub_goals : null
            }
            createNewGoalsFunc(client, PID, tasks, UID);
        }
        for(let i=0; i<AIres.recurring_tasks.length; i++){  
            const tasks = {
                description : AIres.recurring_tasks[i].description,
                due_date : new Date(AIres.recurring_tasks[i].due_date),
                time_alloted : AIres.recurring_tasks[i].time_allocated,
                time_unit : AIres.recurring_tasks[i].time_unit,
                start_date : new Date(AIres.recurring_tasks[i].start_date),
                r_rate : AIres.recurring_tasks[i].recur_rate,
                recur_unit : AIres.recurring_tasks[i].recur_unit,
                sub_goals : null
            }
            createNewGoalsFunc(client, PID, tasks, UID);
        }
    }
    else if(option === "long term") {
        for(let i=0; i<AIres.milestones.length; i++) {   
            const monthNo = parseInt(AIres.milestones[i].month);
            const start_date = getNextRecurDate(currentDate, monthNo-1, "month");
            const tasks = {
                description : AIres.milestones[i].description,
                start_date : start_date,
                due_date : getNextRecurDate(start_date, 1, "month"),
                time_alloted : 1,
                time_unit : "month",
                r_rate : null,
                recur_unit : null,
                sub_goals : null
            }
            createNewGoalsFunc(client, PID, tasks, UID);
        }
        for(let i=0; i<AIres.recurring_tasks.length; i++){  
            const tasks = {
                description : AIres.recurring_tasks[i].description,
                due_date : new Date(AIres.recurring_tasks[i].due_date),
                time_alloted : AIres.recurring_tasks[i].time_allocated,
                time_unit : AIres.recurring_tasks[i].time_unit,
                start_date : new Date(AIres.recurring_tasks[i].start_date),
                r_rate : AIres.recurring_tasks[i].recur_rate,
                recur_unit : AIres.recurring_tasks[i].recur_unit,
                sub_goals : null
            }
            createNewGoalsFunc(client, PID, tasks, UID);
        }
    }
}

const createNew = (help = null, AIres = null) => asyncHandler(async (req, res) => {
    const UID = req.user.uid;
    console.log("User UID:", UID);
    const client = await pool.connect();
    if(help) {
        const tid = createNewGoalsFunc(client, null, tasks, UID)
        parseAIresponse(client, tid, tasks, UID, AIres);
        res.status(200).json(
            new ApiResponse(200, {message: "Goal created successfully with AI assistance"}, "Success")
        );
    }

    try{
        await client.query("BEGIN");
        const tid = await createNewGoalsFunc(
            client,
            null, 
            req.body.goal[0],
            UID
        );
        await client.query("COMMIT");
        res.status(201).json(
                new ApiResponse(201, {tid}, "Task created successfully")
            );
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
});

export {createNew};