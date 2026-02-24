import {asyncHandler} from '../utils/asyncHandler.js';
import pool from '../db/db.js';
import {ApiError} from '../utils/ApiError.js';
import {ApiResponse} from '../utils/ApiResponse.js';
import { classifyTask } from '../services/taskClassify.services.js';

async function insertTaskHierarchy(tid, pid = null, due_date, time_allotted_in_hrs) {
    const result = await client.query(
        `INSERT INTO dependent (tid, pid, reschedule_count, due_date, completion_rate, time_allotted_in_hrs)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING tid`,
        [tid, pid, 0, due_date, 0, time_allotted_in_hrs]
    );

    const newTid = result.rows[0].tid;

    if (task.sub_goals && task.sub_goals.length > 0) {
        for (const sub of task.sub_goals) {
            await createNew(PID, UID);
        }
    }
}

const createNew = asyncHandler(async (req, res) => {
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

    const UID = 1; //get this from the auth middleware after implementing authentication
    const {description, due_date, recurring, time_alloted} = req.body;
    if(!description || !due_date || !time_alloted) {
        throw new ApiError(400, "Description, due date and time alloted are required fields");
    }
    if(recurring){
        //recur rate in days
        const {start_date, recur_rate} = req.body;
        if(!start_date || !recur_rate) {
            throw new ApiError(400, "Start date and recur rate are required for recurring tasks");
        }
    }

    const currentDate = new Date();
    const dueDate = new Date(due_date);
    if(dueDate < currentDate) {
        throw new ApiError(400, "Due date must be greater than or equal to current date");
    }

    const taskClassification = await classifyTask(description);

    const {sub_goals} = req.body;

    let client;

    try{
        client = await pool.connect();
        await client.query("BEGIN");
        const insertQuery = "INSERT INTO tasks (def, cat_type,effort_level, energy_type , UID) VALUES ($1, $2, $3, $4, $5) returning TID";
        const newUser = await client.query(insertQuery, [description, taskClassification.category, taskClassification.effort_level, taskClassification.energy_type, UID]);
        if(newUser.rows.length === 0) {
            throw new ApiError(500, "task could not be created");
        }

        const tid = newUser.rows[0].tid;

        if(recurring){
            const startDateObj = new Date(start_date);
            const next_recur_date = new Date(startDateObj);
            next_recur_date.setDate(startDateObj.getDate() + recur_rate);
            //recurring task table entry
            const insertQuery = 
            `INSERT INTO dependent 
            (tid, pid, start_date, next_recur_date, recur_rate, end_date, completion_rate, miss_rate,time_alloted_in_hrs) 
            VALUES 
            ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
            returning TID`;
            const newUser = await client.query(
                insertQuery, 
                [tid, PID, start_date, next_recur_date, recur_rate, due_date, 0, 0, time_alloted]
            );
            if(newUser.rows.length === 0) {
                throw new ApiError(500, "task could not be created");
            }
            res.status(201).json(
                new ApiResponse(201, newUser.rows[0], "Task created successfully")
            );
        }
        else{
            await insertTaskHierarchy(tid, client, req.body, UID);
        }
        const {prerequisites} = req.body;
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

        await client.query("COMMIT");

        // -------- FINAL RESPONSE --------
        res.status(201).json(
            new ApiResponse(201, { tid }, "Task created successfully")
        );

    } catch (error) {
        if (client) await client.query("ROLLBACK");
        throw error;
    } finally {
        if (client) client.release();
    }
});

export {createNew};