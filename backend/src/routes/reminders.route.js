import express from "express";
import {createReminder,viewReminders, updateReminders} from "../controllers/reminders.controllers.js";
import {verifyToken} from "../middlewares/auth.middlewares.js";

const router = express.Router();


//understand authentication and how to get userID from frontend
router.route("/").post(
    verifyToken,
    createReminder
); 

router.route("/view").get(
    verifyToken,
    viewReminders
);

router.route("/update").post(
    verifyToken,
    updateReminders
);
export default router;