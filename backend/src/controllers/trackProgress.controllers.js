import {asyncHandler} from '../utils/asyncHandler.js';
import pool from '../db/db.js';
import {ApiError} from '../utils/ApiError.js';
import {ApiResponse} from '../utils/ApiResponse.js';

const getGoals = asyncHandler(async (req, res) => {
    const userId = req.user.uid;
    let client;
    try {
        client = await pool.connect();
        const query = `
            SELECT tasks.TID, tasks.UID, tasks.def, 
                dependent.PID, dependent.Real_end_date, 
                dependent.due_date, dependent.completion_rate,
                dependent.time_unit
            FROM dependent JOIN tasks ON dependent.TID = tasks.TID
            WHERE 
                tasks.UID = $1
                AND dependent.PID IS NULL
                AND dependent.Real_end_date IS NULL
                AND time_unit != 'day'
            ORDER BY due_date ASC;
            ;
        `;
        const result = await client.query(query, [userId]);
        console.log("Goals retrieved:", result.rows);
        if (result.rows.length === 0) {
            return res.json(
                new ApiResponse(
                    200,
                    [],
                    "No active goals found"
                )
            );
        }
        return res.json(
            new ApiResponse(
                200,
                result.rows,
                "Goals retrieved successfully"
            )
        );
    } catch (error) {
        throw new ApiError(500, error.message || "Failed to retrieve goals");
    }finally {
        if (client) {
            client.release();
        }
    }
});

export {
    getGoals
}