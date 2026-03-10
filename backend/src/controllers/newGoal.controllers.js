import {asyncHandler} from '../utils/asyncHandler.js';
import pool from '../db/db.js';
import {ApiError} from '../utils/ApiError.js';
import {ApiResponse} from '../utils/ApiResponse.js';
import { classifyTask } from '../services/taskClassify.services.js';
import { createGoal } from '../services/goalCreationHelp.services.js';

async function helpAI(UID, taskDescription, taskType, deadline) {
    //retrive from db
    let client;
    client = await pool.connect();
    const available_hours = {};
    try {
        await client.query("BEGIN");
        const query = `
            SELECT * 
            FROM user_qualities 
            WHERE 
                uid = $1 and 
                category = $2 and 
            effort_level = $3 and 
            energy_type = $4`;
        const result = await client.query(
            query, 
            [
                UID, 
                taskType.category, 
                taskType.effort_level, 
                taskType.energy_type
            ]
        );
        const query2 = `
            SELECT work_capacity_in_hrs, days_available_per_week
            FROM users
            WHERE uid = $1
        `;
        
        const result2 = await client.query(query2, [UID]);

        // fetching schedule in case of short term goal 
        if(dueDate - new Date() <= 30*24*60*60*1000) {
            const curr = new Date(dueDate);
            while(curr <= deadline){
                const dateStr = curr.toISOString().split('T')[0];
                const scheduleQuery1 = `
                    SELECT TID, due_date, time_allotted, time_unit
                    FROM dependent
                    WHERE pid IN ( 
                        SELECT tid 
                        FROM tasks 
                        WHERE uid = $1
                    ) 
                    AND due_date = $2
                    AND time_unit = 'hour'
                `;
                const scheduleResult1 = await client.query(
                    scheduleQuery1, 
                    [UID, curr]
                );
                let total = 0;
                for(let i=0; i<scheduleResult1.rows.length; i++) {
                    total += scheduleResult1.rows[i].time_allotted;
                }                   
                available_hours[dateStr] = total;
                curr.setDate(curr.getDate() + 1);
            } 
            
            const scheduleQuery2 = `
                SELECT TID, next_recur_date, time_alloted, time_unit, recur_unit, recur_rate, end_date
                FROM recurring
                WHERE pid IN (
                    SELECT tid 
                    FROM tasks
                    WHERE uid = $1
                )
                AND end_date >= $2
                AND recur_unit = 'day'
            `;
            const scheduleResult2 = await client.query(
                scheduleQuery2, 
                [UID, curr]
            );
            
            for(let i=0; i<scheduleResult2.rows.length; i++) {
                const row = scheduleResult2.rows[i];
                let time_alloted = row.time_alloted;
                let next_recur_date = new Date(row.next_recur_date);
                const end_date = new Date(row.end_date);
                while(next_recur_date <= end_date && next_recur_date <= deadline) {
                    const dateStr = next_recur_date.toISOString().split('T')[0];
                    if(available_hours[dateStr]) {
                        available_hours[dateStr] += time_alloted;
                    }
                    next_recur_date.setDate(next_recur_date.getDate() + row.recur_rate);
                }
            } 
            for(let date in available_hours) {
                available_hours[date] = result2.rows[0].work_capacity_in_hrs - available_hours[date];
            }
        }
        await client.query("COMMIT");
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
    
    const AIresponse = await createGoal(
        taskDescription, 
        result2.rows[0].work_capacity_in_hrs, 
        deadline,
        result.rows[0],
        available_hours,
        result2.rows[0].days_available_per_week
    );

    return AIresponse;
}


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

    const currentDate = new Date();
    console.log("1")
    console.log("Current User ID:", UID);
    const {
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
        throw new ApiError(400, "Description, due date, time alloted and time unit are required fields");
    }
    if(!start_date) start_date = currentDate;
    if(!due_date) due_date = currentDate;
    console.log("Received task data:", tasks);
    const recurring = is_recurring ==="true"? true : false;
    const recur_rate = recurring ? parseInt(r_rate) : null;
    const dueDate = new Date(due_date);
    if(dueDate < currentDate) {
        throw new ApiError(400, "Due date must be greater than or equal to current date");
    }

    const {category, effort_level, energy_type} = await classifyTask(description);
    console.log(category, effort_level, energy_type);

    let tid;
    const insertQuery = "INSERT INTO tasks (def, cat_type,effort_level, energy_type , UID) VALUES ($1, $2, $3, $4, $5) returning TID";
    const task = await client.query(insertQuery, [description, category, effort_level, energy_type, UID]);
    if(task.rows.length === 0) {
        throw new ApiError(500, "task could not be created");
    }
    tid = task.rows[0].tid;
    if(recurring){
        const startDateObj = new Date(start_date);
        const next_recur_date = getNextRecurDate(start_date, recur_rate, recur_unit)
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

const createNew = asyncHandler(async (req, res) => {
    const UID = req.user.uid;
    console.log("User UID:", UID);
    const help = req.query.help === "true" ? true : false;
    if(help) {
        const taskType = await classifyTask(req.body.description);
        await helpAI(UID, req.body.description, taskType, req.body.due_date);
    }

    const client = await pool.connect();
    try{
        await client.query("BEGIN");
        const tid = await createNewGoalsFunc(
            client,
            null, 
            req.body, 
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