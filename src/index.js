
import express from 'express';
import morgan from 'morgan';
import logger from './logger.js'; // Import your custom logger

import dotenv from 'dotenv';
import {app} from './app.js';
import connectDB from './db/index.js';

//cofiguring the env
dotenv.config({
    path: "./.env"
})
const PORT = process.env.PORT || 8001;

//i want to connect the app only after the databse connection is done, 
connectDB()
.then(()=>{ //success
    app.listen(PORT, () =>
    {
        console.log(`Server is running on port ${PORT}`);
        
    })
})
.catch((err)=>//errors
{
    console.log("MongoDB connection error:", err);
    
}) 
//server has its own ports, so it should be coming from the server itself, so use .env