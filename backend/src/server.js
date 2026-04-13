import express from 'express';
import newGoalsRoute from "./routes/newGoals.route.js";
import {router} from "./routes/user.route.js"; 
import chatbotRoute from "./routes/chatbot.route.js";
import diaryRoute from "./routes/diary.route.js";
import cors from 'cors';
import cookieParser from 'cookie-parser';
import reminderRoute from './routes/reminders.route.js';

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));

app.use(express.json({ limit: '16kb'}));
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use(cookieParser());


app.use("/api/CreateNew", newGoalsRoute);
//https://localhost:3000/api/CreateNew/newGoals


app.use("/api/User", router);
//https://localhost:3000/api/User/login

app.use("/api/chatbot", chatbotRoute);
//https://localhost:3000/api/chatbot/chat

app.use("/api/Reminders", reminderRoute);
//https://localhost:3000/api/Reminders

app.use("/api/Diary", diaryRoute);
//https://localhost:3000/api/Diary
console.log("Server is starting...");

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT} at http://localhost:${PORT}`);
});