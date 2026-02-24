import dotenv from 'dotenv';
dotenv.config();
import jwt from 'jsonwebtoken';

const GenerateAccessToken = (userID) =>{
    const token = jwt.sign(
        {id : userID},
        process.env.ACCESS_TOKEN_SECRET,
        {expiresIn: process.env.ACCESS_TOKEN_EXPIRY}
    )
    return token;
}

const GenerateRefreshToken = (userID) =>{
    const token = jwt.sign(
        {id : userID},
        process.env.REFRESH_TOKEN_SECRET,
        {expiresIn: process.env.REFRESH_TOKEN_EXPIRY}
    )
    return token;
}

export {
    GenerateAccessToken, 
    GenerateRefreshToken
};