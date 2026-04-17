import { google } from "googleapis";
import dotenv from "dotenv";
dotenv.config();
import pool from "../db/db.js";

const oauth2Client = new google.auth.OAuth2(
    process.env.G_CALENDAR_CLIENT_ID,
    process.env.G_CALENDAR_CLIENT_SECRET,
    "http://localhost:3000/api/calendar/oauth2callback"
);

const getAuthClient = async (userId) => {
    console.log("in getAuthClient")
    // Fetch tokens from the database
    let c;
    let client;
    try{
        c = await pool.connect();
        const result = await pool.query(`
            SELECT google_refresh_token 
            FROM users 
            WHERE uid = $1
        `, [userId]);
        console.log("Database query result for refresh token:", result.rows[0]);
        client = new google.auth.OAuth2(
            process.env.G_CALENDAR_CLIENT_ID,
            process.env.G_CALENDAR_CLIENT_SECRET,
            "http://localhost:3000/api/calendar/oauth2callback"
        );
        client.setCredentials({
            refresh_token: result.rows[0].google_refresh_token
        });
    } catch (err) {
        console.error("Database error:", err);
        throw new Error("Failed to retrieve refresh token");
    } finally {
        if (c) c.release();
    }
    return client;
};


export { 
  oauth2Client as oauth2,
  getAuthClient
};