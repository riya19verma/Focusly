import {asyncHandler} from '../utils/asyncHandler.js';
import pool from '../db/db.js';
import {ApiError} from '../utils/ApiError.js';
import {ApiResponse} from '../utils/ApiResponse.js';

const getDiaryEntry = asyncHandler(async (req, res) => {
    const userID = req.user.uid;
    console.log('Retrieving diary entry for user:', userID, 'on date:', req.query.date);
    let client;
    try {
        client = await pool.connect();
        const result = await client.query(`
            SELECT * 
            FROM diaryEntry
            WHERE uid = $1
            AND created_on = $2`, 
        [userID, req.query.date]);
        const diaryEntries = result.rows[0];
        if(!diaryEntries){
            return res.status(200)
            .json(new ApiResponse(
                true, 
                null,
                'No diary entry found for the specified date'
            ));
        }
        console.log('Diary entries retrieved successfully:',
             diaryEntries.entry);
        res.status(200)
        .json(new ApiResponse(
            true, 
            diaryEntries,
            'Diary entries retrieved successfully'
        ));
    }
    catch (error) {
        console.error('Error retrieving diary entries:', error);
        throw new ApiError(
            500, 
            'An error occurred while retrieving diary entries'
        );
    }
    finally {
        if (client) {
            client.release();
        }
    }
});

const createDiaryEntry = asyncHandler(async (req, res) => {
    const userID = req.user.uid;
    console.log('Creating diary entry for user:', userID);
    const content = req.body.content;
    console.log('Diary entry content:', content);
    let client;
    const today = new Date();
    try {
        client = await pool.connect();
        const search = await client.query(`
            SELECT * 
            FROM diaryEntry
            WHERE uid = $1 AND created_on::date = $2::date`,
        [userID, today]);
        if(search.rows.length > 0 && 
            search.rows[0].created_on.toDateString() === today.toDateString()){
            const updateResult = await client.query(`
                UPDATE diaryEntry
                SET entry = $1
                WHERE eid = $2
                RETURNING *`,
            [content, search.rows[0].eid]);
            const updatedEntry = updateResult.rows[0];
            await client.query(`
                INSERT INTO sync_changes
                (uid, obj_type, obj_id, act, created_at)
                VALUES ($1, $2, $3, $4, $5)
            `, [userID, 'EID', updatedEntry.id, 'update', today]);
            return res.status(200)
            .json(new ApiResponse(
                true, 
                updatedEntry,
                'Diary entry updated successfully'
            ));
        }
        const result = await client.query(`
            INSERT INTO diaryEntry (uid, entry, created_on)
            VALUES ($1, $2, $3)
            RETURNING *`,
        [userID, content, today]);
        const newEntry = result.rows[0];
        await client.query(`
            INSERT INTO sync_changes
            (uid, obj_type, obj_id, act, created_at)
            VALUES ($1, $2, $3, $4, $5)
        `, [userID, 'EID', newEntry.id, 'create', today]);
        res.status(201)
        .json(new ApiResponse(
            true, 
            newEntry,
            'Diary entry created successfully'
        ));
    }
    catch (error) {
        console.error('Error creating diary entry:', error);
        throw new ApiError(
            500, 
            'An error occurred while creating the diary entry'
        );
    }
    finally {
        if (client) {
            client.release();
        }
    }
});

export {
    getDiaryEntry,
    createDiaryEntry
}