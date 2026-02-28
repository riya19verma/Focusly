import express from "express";
import {createNew} from "../controllers/newGoal.controllers.js";
import {verifyToken} from "../middlewares/auth.middlewares.js";

const router = express.Router();

router.route("/newGoals").post(
    verifyToken, 
    createNew
); 
export default router;




