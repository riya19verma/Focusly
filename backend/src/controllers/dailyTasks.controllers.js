import {asyncHandler} from '../utils/asyncHandler.js';
import pool from '../db/db.js';
import {ApiError} from '../utils/ApiError.js';
import {ApiResponse} from '../utils/ApiResponse.js';

const getRecurringTasks = asyncHandler(async (req, res) => {
    const userId = req.user.uid;
    let client;
    try {
        client = await pool.connect();
        const d = new Date();
        const date =
        d.getFullYear() + '-' +
        String(d.getMonth() + 1).padStart(2, '0') + '-' +
        String(d.getDate()).padStart(2, '0');
        console.log('Fetching recurring tasks for user:', userId, 'on date:', date);
        const { rows: tasks } = await pool.query(
            `SELECT recurring.TID, next_recur_date,recur_rate,recur_unit,end_date,completion_rate,time_allotted,
                        tasks.TID, def, UID
                FROM recurring JOIN tasks ON recurring.TID = tasks.TID 
                WHERE tasks.UID = $1 AND next_recur_date = $2`,
            [userId, date]
        );
        if (tasks.length === 0) {
            console.log('No recurring tasks due today for user:', userId);
            return res.json(new ApiResponse('No recurring tasks due today', []));
        }
        const formattedTasks = tasks.map(task => ({
            tid: task.tid,
            description: task.def,
            nextRecurDate: task.next_recur_date,
            recurRate: task.recur_rate,
            recurUnit: task.recur_unit,
            endDate: task.end_date,
            completionRate: task.completion_rate,
            timeAllotted: task.time_allotted
        }));
        //calculate total occurences of the task using recur_rate, recur_unit, completion_rate(No. of times task has been completed) and end_date
        for (let task of formattedTasks) {
            const totalOccurences = task.completionRate + Math.floor(
                (new Date(task.endDate) - new Date(task.nextRecurDate)) / 
                (   
                    task.recurUnit === 'daily' ? 24 * 60 * 60 * 1000 : 
                    task.recurUnit === 'weekly' ? 7 * 24 * 60 * 60 * 1000 : 
                    task.recurUnit === 'monthly' ? 30 * 24 * 60 * 60 * 1000 : 
                    task.recurUnit === 'yearly' ? 365 * 24 * 60 * 60 * 1000 : 0
                ) / task.recurRate
            );
            task.totalOccurences = totalOccurences;
            //update the next_recur_date of the task in the database
            const nextRecurDate = new Date(task.nextRecurDate);
            nextRecurDate.setTime(nextRecurDate.getTime() + (totalOccurences * task.recurRate *
                (   
                    task.recurUnit === 'daily' ? 24 * 60 * 60 * 1000 : 
                    task.recurUnit === 'weekly' ? 7 * 24 * 60 * 60 * 1000 : 
                    task.recurUnit === 'monthly' ? 30 * 24 * 60 * 60 * 1000 : 
                    task.recurUnit === 'yearly' ? 365 * 24 * 60 * 60 * 1000 : 0
                )
            ));
            task.nextRecurDate = nextRecurDate;
            await pool.query(
                `
                    UPDATE tasks 
                    SET next_recur_date = $1 
                    WHERE TID = $2
                `,
                [nextRecurDate, task.tid]
            );
        }
        console.log('Daily tasks retrieved:', formattedTasks);
        res.json(new ApiResponse('Daily tasks retrieved successfully', formattedTasks));
    } catch (error) {
        console.error('Error fetching daily tasks:', error);
        throw new ApiError('Failed to retrieve daily tasks', 500);
    } finally {
        if (client) client.release();
    }
});

const todayTasksController = asyncHandler(async (req, res) => {
    const userId = req.user.uid;
    let client;
    try {
        client = await pool.connect();
        const d = new Date();
        const date =
        d.getFullYear() + '-' +
        String(d.getMonth() + 1).padStart(2, '0') + '-' +
        String(d.getDate()).padStart(2, '0');
        const { rows: tasks } = await pool.query(
            `
                SELECT dependent.TID, due_date, pid,priority, time_allotted, time_unit, tasks.TID, def, UID, completed_dropped
                FROM tasks JOIN dependent ON tasks.TID = dependent.TID
                WHERE tasks.UID = $1 AND dependent.due_date = $2 AND tasks.completed_dropped IS NULL
                    AND NOT EXISTS (
                        SELECT 1 
                        FROM dependent d2 
                        WHERE d2.PID = dependent.TID
                    );
            `,
            [userId, date]
        );
        if (tasks.length === 0) {
            console.log('No tasks due today for user:', userId);
            return res.json(new ApiResponse('No tasks due today', []));
        }
        const formattedTasks = tasks.map(task => ({
            tid: task.tid,
            description: task.def,
            dueDate: task.due_date,
            priority: task.priority,
            timeAllotted: task.time_allotted,
            timeUnit: task.time_unit
        }));
        console.log('Today\'s tasks retrieved:', formattedTasks);
        res.json(new ApiResponse('Today\'s tasks retrieved successfully', formattedTasks));
    } catch (error) {
        console.error('Error fetching today\'s tasks:', error);
        throw new ApiError('Failed to retrieve today\'s tasks', 500);
    } finally {
        if (client) client.release();
    }
});

const updatePriority = asyncHandler(async (req, res) => {
    const userId = req.user.uid;
    const priorityUpdates = req.body; // Array of { tid, newPriority }
    let client;
    try {
        client = await pool.connect();
        for (let update of priorityUpdates) {
            await pool.query(
                `
                    UPDATE dependent
                    SET priority = $1
                    WHERE TID = $2
                `,
                [update.newPriority, update.tid]
            );
        }
        console.log('Task priorities updated:', priorityUpdates);
        res.json(new ApiResponse('Task priorities updated successfully'));
    } catch (error) {
        console.error('Error updating task priorities:', error);
        throw new ApiError('Failed to update task priorities', 500);
    } finally {
        if (client) client.release();
    }
});

const updateDependentTasks = asyncHandler(async (req, res) => {
    const userId = req.user.uid;
    const { tid, c_or_d } = req.body;
    let client;
    try {
        client = await pool.connect();
        await pool.query(
            `
                UPDATE tasks
                SET completed_dropped = $1
                WHERE TID = $2
            `,
            [c_or_d, tid]
        );
        const pid = (await pool.query(
            `
                SELECT PID FROM dependent WHERE TID = $1
            `,
            [tid]
        )).rows[0].pid;
        const dependentTasks = (await pool.query(
            `
                SELECT tasks.TID, completed_dropped, dependent.TID AS dependentTID
                FROM dependent JOIN tasks ON dependent.TID = tasks.TID 
                WHERE PID = $1
            `,
            [pid]
        )).rows;
        const completed = true;
        for (let task of dependentTasks) {
            if(task.completed_dropped != 'completed' && task.completed_dropped != 'dropped') {
                completed = false;
                break;
            }
        }
        if (completed) {
            await pool.query(
                `
                    UPDATE tasks
                    SET completed_dropped = 'completed'
                    WHERE TID = $1
                `,
                [pid]
            );
        }
        console.log('Dependent tasks updated:', { tid, completed });
        res.json(new ApiResponse('Dependent tasks updated successfully'));
    } catch (error) {
        console.error('Error updating dependent tasks:', error);
        throw new ApiError('Failed to update dependent tasks', 500);
    } finally {
        if (client) client.release();
    }
});

const updateNextRecurDate = asyncHandler(async (req, res) => {
    const userId = req.user.uid;
    const tid = req.body.tid;
    const c_or_m = req.body.c_or_m; // 'completed' or 'missed'
    let client;
    try {
        client = await pool.connect();
        const result = await pool.query(
            `
                SELECT next_recur_date, recur_rate, recur_unit, end_date
                FROM tasks 
                WHERE TID = $1
            `,
            [tid]
        );
        const task = result.rows[0];
        if (!task) {
            throw new ApiError('Task not found', 404);
        }
        const nextRecurDate = new Date(task.next_recur_date);
        nextRecurDate.setTime(nextRecurDate.getTime() + (task.recur_rate *
            (
                task.recur_unit === 'daily' ? 24 * 60 * 60 * 1000 :
                task.recur_unit === 'weekly' ? 7 * 24 * 60 * 60 * 1000 :
                task.recur_unit === 'monthly' ? 30 * 24 * 60 * 60 * 1000 :
                task.recur_unit === 'yearly' ? 365 * 24 * 60 * 60 * 1000 :
                0
            )
        ));
        if(nextRecurDate < task.end_date) {
            await pool.query(
                `
                    UPDATE tasks
                    SET next_recur_date = $1
                    WHERE TID = $2
                `,
                [nextRecurDate, tid]
            );
        }
        else {
            await pool.query(
                `
                    UPDATE tasks
                    SET completed_dropped = 'completed'
                    WHERE TID = $1
                `,
                [tid]
            );
        }
        if(c_or_m == 'missed'){
            await pool.query(
                `
                UPDATE recurring
                SET miss_rate = old.miss_rate+1
                FROM (SELECT miss_rate FROM recurring WHERE TID = $1) AS old
                WHERE recurring.TID = $1
                `,
                [tid]
            ); 
        }
        else if(c_or_m == 'completed') {
            await pool.query(
                `
                UPDATE recurring
                SET completion_rate = old.completion_rate+1
                FROM (SELECT completion_rate FROM recurring WHERE TID = $1) AS old
                WHERE recurring.TID = $1
                `,
                [tid]
            ); 
        }
        console.log('Next recurrence date updated:', { tid, nextRecurDate });
        res.json(new ApiResponse('Next recurrence date updated successfully'));
    } catch (error) {
        console.error('Error updating next recurrence date:', error);
        throw new ApiError('Failed to update next recurrence date', 500);
    } finally {
        if (client) client.release();
    }
});

export {
    getRecurringTasks, 
    todayTasksController,
    updatePriority,
    updateDependentTasks,
    updateNextRecurDate
};
