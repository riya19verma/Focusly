import express from "express";
import {getDiaryEntry, createDiaryEntry} from "../controllers/diary.controllers.js";
import {verifyToken} from "../middlewares/auth.middlewares.js";
const router = express.Router();

router.route("/view").get(
    verifyToken,
    getDiaryEntry
)

router.route("/save").post(
    verifyToken,
    createDiaryEntry
)
export default router;