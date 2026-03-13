// my chatbot controller
// tasks it has to do:
// 1. help in creating new goals
// 2. update planned goals by AI on user request
// 3. Help perform a goal properly that has been rescheduled many time by user
// 4. Generally chat with user

// fetch for required context for the message from DB
// Call AI's API for every single message
// Accept response from API
// Send response to frontend

import {asyncHandler} from '../utils/asyncHandler.js';
import pool from '../db/db.js';
import {ApiError} from '../utils/ApiError.js';
import {ApiResponse} from '../utils/ApiResponse.js';
import { createNew } from 'newGoal.controllers.js';
import { classifyTask } from '../services/taskClassify.services.js';
import { createGoal,updatePlan,rescheduleHelp } from '../services/goalCreationHelp.services.js';
import { callAIforChatting } from '../services/ai.services.js';

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
    const work_capacity_in_hrs = result2.rows[0].work_capacity_in_hrs;
    const qualities = result.rows[0];
    const days_available = result2.rows[0].days_available_per_week;
    const context = {
        def : taskDescription, 
        work_capacity_in_hrs : work_capacity_in_hrs, 
        deadline : deadline,
        qualities : qualities,
        available_hours : available_hours,
        days_available : days_available
    };

    return {context};
}

const options = req.query.options || "none";

const chatbotController = (context = null) => asyncHandler(async (req, res) => {
    const UID = req.user.uid;
    console.log("User UID:", UID);
    if(options === "createNew") {
        const taskType = await classifyTask(req.body.description);
        const context = await helpAI(UID, req.body.description, taskType, req.body.due_date);
        const Response = await createGoal(
            context.context.def, 
            context.context.work_capacity_in_hrs,
            context.context.deadline,
            context.context.qualities,
            context.context.available_hours,
            context.context.days_available
        );
        if(Response.res === "Message limit reached") {
            const message = "AI message limit reached. Goal created without AI assistance.";
        }
        else {
            message = `Do you approve the created schedule? ${Response.parsed}`;
            //if answer is yes then:
            // const dbResponse = await createNew(true, Response.parsed)(req, res);
            // const message = dbResponse.message;
        }
        context.term = Response.parsed.term;
        return {message, context};
    }
    else if(options === "updatePlan") {
        const user_req = req.body.message;
        const createdGoal = req.body.createdGoal;
        const context = req.body.context;
        const Response = await updatePlan(UID, user_req, createdGoal,context);
        if(Response.res === "Message limit reached") {
            const message = "AI message limit reached. Goal created without AI assistance.";
        }
        else {
            message = `Do you approve the created schedule? ${Response.parsed}`;
            //if answer is yes then:
            // const dbResponse = await createNew(true, Response.parsed)(req, res);
            // const message = dbResponse.message;
        }
        context.term = Response.parsed.term;
        return {message, context};
    }
    else if(options === "rescheduleHelp") {
        const user_req = req.body.message;
        const createdGoal = req.body.createdGoal;
        const context = await helpAI(UID, req.body.description, taskType, req.body.due_date);
        const Response = await rescheduleHelp(UID, user_req, createdGoal,context);
        if(Response.res === "Message limit reached") {
            const message = "AI message limit reached. Goal created without AI assistance.";
        }
        else {
            message = `Do you approve the created schedule? ${Response.parsed}`;
            //if answer is yes then:
            // const dbResponse = await createNew(true, Response.parsed)(req, res);
            // const message = dbResponse.message;
        }
        context[term] = Response.parsed.term;
        return {message, context};
    }
    else {
        //normal conversational message, call appropriate function in ai.services.js and return response
        const user_mssg = req.body.message;
        const conversation = req.body.context;
        conversation.push({role : "user", parts : [{text : user_mssg}]});
        const Response = await callAIforChatting(user_mssg, conversation);
        const message = Response;
        return {message, conversation};
    }
});