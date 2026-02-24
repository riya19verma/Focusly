import express from "express";
import {registerUser, loginUser, logoutUser} from "../controllers/login.controllers.js";
import {verifyToken} from "../middlewares/auth.middleware.js";
const router = express.Router();

const srouter = router.route("/signup").post(registerUser); 
const lrouter = router.route("/login").post(loginUser);
const logoutRouter = router.route("/logout").post(
    verifyToken,
    logoutUser
);
export default {
    lrouter,
    srouter,
    logoutRouter
}
