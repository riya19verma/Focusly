import {asyncHandler} from '../utils/asyncHandler.js';
import pool from '../db/db.js';
import {ApiError} from '../utils/ApiError.js';
import {ApiResponse} from '../utils/ApiResponse.js';
import { classifyTask } from '../services/taskClassify.services.js';

//TO BE USED AT THE END OF EACH MONTH TO UPDATE THE USER QUALITIES IN THE DATABASE
async function CalculateUserQualities(UID){
    // helper function to create new goals and subgoals using AI
    let client;
    client = await pool.connect();

    //1. Retrieve data:
    const ret_query = `SELECT TID, cat_type, effort_level, energy_type FROM tasks WHERE uid = $1`;
    const TIDs = await client.query(ret_query, [UID]);
    if(TIDs.rows.length < 10) {
        // Not enough data to train AI model, return default values
        const values = {};
        //COMMENT : edit values after making the questionnaire
        client.release();
        return values;
    }
    const types = {}; 
    TIDs.rows.forEach(row => {
        const value = `${row.cat_type}-${row.effort_level}-${row.energy_type}`;
        types[row.tid] = value;
    });

    //2. Consistency
    const consistency_query = `
        SELECT TID,miss_rate 
        FROM recurring
        WHERE TID = ANY($1) and miss_rate != 0`;
    const consistency = await client.query(consistency_query, [TIDs.rows.map(row => row.tid)]);
    const consistencyMap = {};
    consistency.rows.forEach(row => {
        const key = types[row.tid];
        if (!consistencyMap[key]) {
            consistencyMap[key] = {count: 0, total: 0};
        }
        consistencyMap[key] = {
            count: (consistencyMap[key].count + row.miss_rate),
            total: consistencyMap[key].total + 1
        };
    });
    const quality_consistency = {};
    for (const key in consistencyMap) {
        quality_consistency[key] = 1 - (consistencyMap[key].count / consistencyMap[key].total);
    }


    //3. Hours devoted on a task type
    const time_query = `
        SELECT TID, time_alloted, time_unit 
        FROM dependent
        WHERE TID not in(
            SELECT PID from dependent where PID is not null
        ) and TID = ANY($1) and time_unit = 'hour'`;

    const timeDevoted = await client.query(time_query, [TIDs.rows.map(row => row.tid)]);
    const timeMap = {};
    timeDevoted.rows.forEach(row => {
        const key = types[row.tid];
        let hours = row.time_alloted;
        let value = 0;
        if (!timeMap[key]) {
            timeMap[key] = {hours : hours, count : 1};
        }
        else{
            timeMap[key] = {
                hours: (hours + timeMap[key].hours), 
                count: timeMap[key].count + 1
            };
        }
    });
    quality_timeDevoted = {};
    for (const key in timeMap) {
        quality_timeDevoted[key] = timeMap[key].hours / timeMap[key].count;
    }

    //4. type of task they procrastinate most on
    const procrastinate_query = `
        SELECT TID, reschedule_count 
        FROM dependent
        WHERE TID not in(
            SELECT PID from dependent where PID is not null
        ) and TID = ANY($1)`;
    const procrastinate = await client.query(procrastinate_query, [TIDs.rows.map(row => row.tid)]);
    const procrastinateMap = {};
    procrastinate.rows.forEach(row => {
        const key = types[row.tid];
        if (!procrastinateMap[key]) {
            procrastinateMap[key] = {count: 0, total: 0};
        }
        procrastinateMap[key] = {
            count: (procrastinateMap[key].count + row.reschedule_count),
            total: procrastinateMap[key].total + 1
        };
    });
    const quality_procrastinate = {};
    for (const key in procrastinateMap) {
        quality_procrastinate[key] = procrastinateMap[key].count / procrastinateMap[key].total;
    }

    //5. type of task they complete on time
    const complete_query = `
        SELECT TID, reschedule_count 
        FROM dependent
        WHERE reschedule_count = 0 and TID = ANY($1)`;
    const complete = await client.query(complete_query, [TIDs.rows.map(row => row.tid)]);
    const completeMap = {};
    complete.rows.forEach(row => {
        const key = types[row.tid];
        if (!completeMap[key]) {
            completeMap[key] = {count: 0, total: 0};
        }
        completeMap[key] = {
            count: completeMap[key].count + 1,
            total: completeMap[key].total + 1
        };
    });
    const quality_completeOnTime = {};
    for (const key in completeMap) {
        quality_completeOnTime[key] = completeMap[key].count / completeMap[key].total;
    }

    // 6. can person meet the deadline for a task type
    const deadline_query = `
        SELECT TID, due_date, Real_end_date 
        FROM dependent
        WHERE TID = ANY($1) and Real_end_date is not null;
    `
    const deadline = await client.query(deadline_query, [TIDs.rows.map(row => row.tid)]);
    const deadlineMap = {};
    deadline.rows.forEach(row => {
        const key = types[row.tid];
        if (!deadlineMap[key]) {
            deadlineMap[key] = {count: 0, total: 0};
        }
        deadlineMap[key].total++;
        if(new Date(row.Real_end_date) <= new Date(row.due_date)) {
            deadlineMap[key].count++;
        }
    });
    const quality_meetDeadline = {};
    for (const key in deadlineMap) {
        quality_meetDeadline[key] = deadlineMap[key].count / deadlineMap[key].total;
    }

    //7. tasks completed earlier than deadline
    const early_query = `
        SELECT TID, due_date, Real_end_date 
        FROM dependent
        WHERE TID = ANY($1) and Real_end_date is not null
        and Real_end_date < due_date;
    `
    const early = await client.query(early_query, [TIDs.rows.map(row => row.tid)]);
    const earlyMap = {};
    early.rows.forEach(row => {
        const key = types[row.tid];
        if (!earlyMap[key]) {
            earlyMap[key] = {count: 0, total: 0};
        }
        earlyMap[key] = {
            count: (earlyMap[key].count + 1),
            total: earlyMap[key].total + 1
        };
    });
    const quality_early = {};
    for (const key in earlyMap) {
        quality_early[key] = earlyMap[key].count / earlyMap[key].total;
    }

    const values = {}
    values.quality_consistency = quality_consistency;
    values.quality_timeDevoted = quality_timeDevoted;
    values.quality_procrastinate = quality_procrastinate;
    values.quality_completeOnTime = quality_completeOnTime;
    values.quality_meetDeadline = quality_meetDeadline;
    values.quality_early = quality_early;
    client.release();
    return values;
}

//COLD START : USER QUALITIES BASED ON A QUESTIONNAIRE FILLED BY THE USER
