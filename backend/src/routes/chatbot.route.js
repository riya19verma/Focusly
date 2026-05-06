import express from "express";
import {chatbotController,diaryNameRetrieve} from "../controllers/chatbot.controllers.js";
import {verifyToken} from "../middlewares/auth.middlewares.js";

const router = express.Router();

router.route("/chat").post(
    verifyToken,
    chatbotController()
);

router.route("/diaryName").get(
    verifyToken,
    diaryNameRetrieve
);

export default router;

