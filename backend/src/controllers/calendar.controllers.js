import {asyncHandler} from '../utils/asyncHandler.js';
import pool from '../db/db.js';
import {ApiError} from '../utils/ApiError.js';
import {ApiResponse} from '../utils/ApiResponse.js';
import { oauth2, getAuthClient } from '../services/googleCalendar.services.js';
import { google } from "googleapis";

const authGoogleCalendar = asyncHandler(async (req, res) => {
    const userId = req.user.uid;
    console.log("User ID for Google Calendar auth:", userId);
    const url = oauth2.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/calendar'],
        prompt: 'consent', // ensures refresh token is always returned
        state: userId // pass user ID in state parameter
    });
    res.redirect(url);
});

const Callback = asyncHandler(async (req, res) => {
    const code = req.query.code;
    const {tokens} = await oauth2.getToken(code);
    oauth2.setCredentials(tokens);

    if (!tokens.refresh_token) {
        throw new ApiError(400, "No refresh token received");
    }
    // Store tokens in the database
    const userId = req.user.uid;
    console.log("userId from state:", userId);
    let c;
    try{
        c = await pool.connect();
        console.log("Received tokens:", tokens);
        await c.query(`
            UPDATE users 
            SET google_access_token = $1,
                google_refresh_token = $2
            WHERE uid = $3
        `, [
            tokens.access_token, 
            tokens.refresh_token, 
            userId
        ]);
    } catch (err) {
        console.error("Database error:", err);
        throw new ApiError(500, "Failed to store tokens");
    } finally {
        if (c) c.release();
    }

    res.redirect("http://localhost:5173/Calendar?google=success");
});

const createEvent = asyncHandler(async (req, res) => {
    const { summary, description, startTime, endTime } = req.body;
    const userId = req.user.id; 
    const event = {
        summary,
        description,
        start: {
            dateTime: startTime,
            timeZone: 'Asia/Kolkata',
        },
        end: {
            dateTime: endTime,
            timeZone: 'Asia/Kolkata',
        }
    };
    const authClient = await getAuthClient(userId);

    const calendar = google.calendar({ 
        version: 'v3', 
        auth: authClient }
    );

    const response = await calendar.events.insert({
        calendarId: 'primary',
        resource: event,
    });
    res.status(201)
    .json(new ApiResponse(
        true, 
        "Event created successfully",
        response.data
    ));
});

const getEvents = asyncHandler(async (req, res) => {
    const userId = req.user.uid; 
    const month = req.query.month;
    const year = req.query.year;
    console.log(`Fetching events for user ${userId} for month ${month} and year ${year}`);
    // fetch from database
    let c,events;
    try{
        c = await pool.connect();
        events = await c.query(`
            SELECT * 
            FROM google_events 
            WHERE 
                user_id = $1 AND 
                EXTRACT(MONTH FROM start_time) = $2 AND 
                EXTRACT(YEAR FROM start_time) = $3`, 
        [userId, month, year]);
    } catch (err) {
        console.error("Database error:", err);
        throw new ApiError(500, "Failed to fetch events");
    } finally {
        if (c) c.release();
    }
    res.status(200)
    .json(new ApiResponse(
        true, 
        "Events retrieved successfully",
        events.rows
    ));
});

const sync_events = asyncHandler(async (req, res) => {
    console.log("Starting event sync process...");
    const userId = req.user.uid;
    console.log("User ID for syncing events:", userId);
    const authClient = await getAuthClient(userId);
    console.log("Syncing events for user:", userId);

    const calendar = google.calendar({
        version: 'v3',
        auth: authClient
    });

    let events = [];
    let pageToken = null;
    console.log("Fetching events from Google Calendar...");
    do {
        const response = await calendar.events.list({
            calendarId: 'primary',
            maxResults: 2500,
            // Fetch all events for last 1 year
            timeMin: new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString(), 
            timeMax: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
            singleEvents: true,
            orderBy: 'startTime',
            pageToken
        });

        events = events.concat(response.data.items);
        pageToken = response.data.nextPageToken;

    } while (pageToken);
    console.log(`Fetched ${events.length} events from Google Calendar`);
    let c;
    try{
        c = await pool.connect();
        for (const event of events) {

            // Handle deleted events
            if (event.status === "cancelled") {
                await c.query(
                    `DELETE FROM google_events WHERE google_event_id=$1`,
                    [event.id]
                );
                continue;
            }
            console.log(`Syncing event: ${event.summary} (ID: ${event.id})`);

            // Handle all-day vs timed events
            const start = event.start.dateTime || event.start.date;
            const end = event.end.dateTime || event.end.date;

            await c.query(`
                INSERT INTO google_events 
                (user_id, google_event_id, title, description, start_time, end_time, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (google_event_id) DO UPDATE SET
                    title = EXCLUDED.title,
                    description = EXCLUDED.description,
                    start_time = EXCLUDED.start_time,
                    end_time = EXCLUDED.end_time,
                    updated_at = EXCLUDED.updated_at
            `, [
                userId,
                event.id,
                event.summary || "No Title",
                event.description || "",
                start,
                end,
                event.updated || new Date()
            ]);
        }
        console.log("All events synced to database successfully");
    } catch (err) {
        console.error("Database error:", err);
        throw new ApiError(500, "Failed to sync events");
    } finally {
        if (c) c.release();
    }
    res.status(200).json(
        new ApiResponse(true, "Events synced successfully")
    );
});

export { 
    authGoogleCalendar, 
    Callback,
    createEvent,
    getEvents,
    sync_events 
};