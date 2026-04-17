import express from "express";
import {getGoals} from "../controllers/trackProgress.controllers.js";
import {verifyToken} from "../middlewares/auth.middlewares.js";
const router = express.Router();

router.route("/progress").get(
    verifyToken,
    getGoals
)
export default router;