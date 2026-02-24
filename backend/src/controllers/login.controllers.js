import {asyncHandler} from '../utils/asyncHandler.js';
import pool from '../db/db.js';
import {ApiError} from '../utils/ApiError.js';
import bcrypt from 'bcrypt';
import {ApiResponse} from '../utils/ApiResponse.js';
import jwt from 'jsonwebtoken';
import {GenerateAccessToken, GenerateRefreshToken} from '../db/tokenGeneration.db.js';

const GenerateAccessAndRefreshToken = async(username) => {
    let client;
    try{
        client = await pool.connect();
        await client.query("BEGIN");
        const result = await client.query(
            "SELECT UID FROM users WHERE username = $1",
            [username]
        );
        const userID = result.rows[0].uid;
        const accessToken = GenerateAccessToken(userID);
        const refreshToken = GenerateRefreshToken(userID);
        
        const query = `
            UPDATE Users
            SET refreshToken = $1
            WHERE UID = $2;
        `
        await client.query(query, [refreshToken, userID]);
        await client.query("COMMIT");
        return {accessToken, refreshToken};
    }
    catch(err){
        if (client) await client.query("ROLLBACK");
        throw new ApiError(500, "Error generating and saving tokens");
    }
    finally {
        if(client) {
            client.release();
        }
    }
}

const registerUser = asyncHandler(async (req, res) => {
    //All fields are required for registration
    // Username and email must be unique
    // Password must be 8 letter long and must contain at least one uppercase letter, one lowercase letter, one number and one special character
    // validate email format
    // hash the password using bcrypt and store the hash in the database
    // generate timestamp and store it in the table sync changes
    // Store the user in the users table
    // return success response

    const {name, username, email, password} = req.body;

    if (!name || !username || !email || !password) {
        throw new ApiError(400, "All fields are required");
    }

    if(password.length < 8) {
        throw new ApiError(400, "Password must be at least 8 characters long");
    }
    if(
        password.search(/[A-Z]/) < 0 || 
        password.search(/[a-z]/) < 0 ||
        password.search(/[0-9]/) < 0 ||
        password.search(/[@$!%*?&]/) < 0
    ) {
        throw new ApiError(400, "Password must contain at least one uppercase letter, one lowercase letter, one number and one special character");
    }

    if(!email.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)) {
        throw new ApiError(400, "Invalid email format");
    }
    
    let client;

    try{
        const client = await pool.connect();

        const result = await client.query(
            "SELECT * FROM users WHERE username = $1 OR email = $2",
            [username, email]
        );
        if (result.rows.length > 0) {
        throw new ApiError(400, "Username or email already exists");
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const insertQuery = "INSERT INTO users (Uname, username, email, pass) VALUES ($1, $2, $3, $4) returning UID";
        const newUser = await client.query(insertQuery, [name, username, email, hashedPassword]);
        if(newUser.rows.length === 0) {
            throw new ApiError(500, "Error registering user");
        }
        res.status(201).json(
            new ApiResponse(201, newUser.rows[0], "User registered successfully")
        );
    } 
    finally { if(client)
        client.release();
    }
});

const loginUser = asyncHandler(async (req, res) => {
    //req body-> data
    // username -> find the user in db
    // password check
    //access and refresh token generation
    // send cookies

    const {username, password} = req.body;
    if (!username || !password) {
        throw new ApiError(400, "Username and password are required");
    }
    let client;
    try{
        client = await pool.connect();
        const result = await client.query(
            "SELECT * FROM users WHERE username = $1",
            [username]
        );
        if (result.rows.length === 0) {
            throw new ApiError(400, "Username does not exist");
        }
        if (!(await bcrypt.compare(password, result.rows[0].pass))) {
            throw new ApiError(400, "Invalid password");
        }

        //using JWT as a proof of identity
        const {accessToken, refreshToken} = await GenerateAccessAndRefreshToken(username);

        //making cookies server modifiable only and secure
        const cookieOptions = {
            httpOnly: true,
            secure : true
        }
        return res
        .status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(new ApiResponse(200, null, "Login successful"));

} finally {
    if(client) {
        client.release();
    }
}});

const logoutUser = asyncHandler(async (req, res) => {
    //clear the cookies
    // invalidate the refresh token in the database
    let client;
    try {
        client = await pool.connect();
        const query = `
            UPDATE Users
            SET refreshToken = NULL
            WHERE UID = $1;
        `
        await client.query(query, [req.user.id]);
        const options = {
            httpOnly: true,
            secure: true
        }
        return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, null, "Logout successful"));
    } finally {
        if(client) {
            client.release();
        }
    }
});

export {
    registerUser,
    loginUser,
    logoutUser
};


