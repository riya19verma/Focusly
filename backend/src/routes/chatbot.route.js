import express from "express";
import {chatbotController} from "../controllers/chatbot.controllers.js";
import {verifyToken} from "../middlewares/auth.middlewares.js";

const router = express.Router();

router.route("/chat").post(
    verifyToken,
    chatbotController()
); 
export default router;

