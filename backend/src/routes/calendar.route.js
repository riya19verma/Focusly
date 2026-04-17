import express from "express";
import { 
    authGoogleCalendar, 
    Callback, 
    createEvent,
    getEvents, 
    sync_events 
} from "../controllers/calendar.controllers.js";
import { verifyToken } from "../middlewares/auth.middlewares.js";

const router = express.Router();
router.route("/authGoogle").get(
    verifyToken, 
    authGoogleCalendar
);
router.route("/oauth2callback").get(
    verifyToken,
    Callback
);
router.route("/createEvent").post(
    verifyToken,
    createEvent
);
router.route("/getEvents").get(
    verifyToken,
    getEvents   
);
router.route("/syncEvents").post(
    verifyToken,
    sync_events
);

export default router;