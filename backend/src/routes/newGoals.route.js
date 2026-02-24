import express from "express";
import {createNew} from "../controllers/newGoal.controllers.js";

const router = express.Router();

router.route("/newGoals").post(createNew); 
export default router;




