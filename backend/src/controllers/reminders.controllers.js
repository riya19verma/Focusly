import {asyncHandler} from '../utils/asyncHandler.js';
import pool from '../db/db.js';
import {ApiError} from '../utils/ApiError.js';
import {ApiResponse} from '../utils/ApiResponse.js';

const createReminder = asyncHandler(async (req, res) => {
    console.log("recieved request");
    const uid = req.user.uid;
    console.log("User UID:", uid);
    const {description, remindAt, ring_date} = req.body;
    if (!description || !remindAt || !ring_date) {
        throw new ApiError(400, 'Missing required fields');
    }
    const fullDateTime = new Date(`${ring_date}T${remindAt}`);

    if (fullDateTime < new Date()) {
        throw new ApiError(400, 'remindAt must be a future date');
    }
    console.log("Data recieved for creating reminder:", {uid, description, remindAt, ring_date});
    let client;
    client = await pool.connect();
    try {
        const insertQuery = `
            INSERT INTO reminders (
                uid, 
                def, 
                ring_at,
                ring_date,
                created_at
            )
            VALUES ($1, $2, $3, $4, $5) RETURNING* `;
        const values = [uid, description, remindAt, ring_date, new Date()];
        const result = await client.query(insertQuery, values);
        const newReminder = result.rows[0];
        console.log('New reminder created:', newReminder);
        res.status(201).json(new ApiResponse(201, 'Reminder created successfully', newReminder));
    }
    catch (error) {
        console.error('Error creating reminder:', error);
        throw new ApiError(500, 'Internal Server Error');
    }
    finally {
        if (client) client.release();
    }
});

const updateReminders = asyncHandler(async (req, res) => {
    console.log("Received request to update reminders for user:", req.user.uid);
    const uid = req.user.uid;
    if (!uid) {
        throw new ApiError(400, 'Missing userID');
    }
    const rid = parseInt(req.body.id);
    if (!rid) {
        throw new ApiError(400, 'id not provided');
    }
    let client;
    client = await pool.connect();
    try {
        const updateQuery = `
            UPDATE reminders 
            SET completed = true
            WHERE
                uid = $1 AND
                rid = $2
            RETURNING *`;
        const result = await client.query(updateQuery, [uid, rid]);
        if (result.rowCount === 0) {
            throw new ApiError(404, 'Reminder not found or does not belong to the user');
        }
        res.status(200).json(new ApiResponse(200, 'Reminder updated successfully', result.rows[0]));
    }
    catch (error) {
        console.error('Error updating reminder:', error);
        throw new ApiError(500, 'Internal Server Error');
    }
    finally {
        if (client) client.release();
    }
});

const viewReminders = asyncHandler(async (req, res) => {
    console.log("Received request to view reminders for user:", req.user.uid);
    const uid = req.user.uid;
    if (!uid) {
        throw new ApiError(400, 'Missing userID');
    }
    let client;
    client = await pool.connect();
    try {
        const selectQuery = `
            SELECT * FROM reminders 
            WHERE 
                uid = $1 AND 
                ring_date = CURRENT_DATE AND
                completed != true
            ORDER BY ring_at`;
        const result = await client.query(selectQuery, [uid]);
        const reminders = result.rows.map(reminder => ({
            id: reminder.rid,
            description: reminder.def,
            remindAt: reminder.ring_at,
        }));
        console.log(`Reminders retrieved for user ${uid}:`, reminders);
        res.status(200).json({reminders: reminders});
    }
    catch (error) {
        console.error('Error viewing reminders:', error);
        throw new ApiError(500, 'Internal Server Error');
    }
    finally {
        if (client) client.release();
    }
});

export {
    createReminder,
    viewReminders,
    updateReminders
};