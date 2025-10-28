/*
_id string pk
 username string
 email string
 fullName string
 avatar string
 coverImage string
 watchHistory objectId[] videos
 passwordHash string
 refreshToken string
 createdAt Date
 updatedAt Date
 */

import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

//user schema
const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        fullname: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        avatar: {
            type: String, //cloudnary etc url
            required: true
        },
        coverImage: {
            type: String, //cloudnary etc url
        },
        watchHistory: [ //watchHistory objectId[] videos
            {
                type: Schema.Types.ObjectId,
                ref: "Video"
            }
        ],
        password: {
            type: String,
            required: [true, "password is required"] //sending message to frontend
        },
        refreshToken: {
            type: String,
        }
    },
    //createdAt Date
    //updatedAt Date
    {
        timestamps: true
    }
)
//just before saving the data we want to encrypt that so we use prehook
userSchema.pre("save", async function (next) //nver use => fn
{
    
    //if modified field is not password, just return it 

    //fixed it, it shoould ve been isModified
    if (!this.isModified("password")) return next()

    //the password should only updating at the time save or updating the password not anythign else
    this.password = await bcrypt.hash(this.password, 10) //10 is no. of rounds or salth which the algo goes through

    next() //will pass it to next middlewares/hooks
})

//decrypt password, it will take the password from database and user and try to check if the match
userSchema.methods.isPasswordCorrect = async function
    (password) {
    return await bcrypt.compare(password, this.password)
}

//islogged in? generate access and refresh token, jwe tokens
//Generate Access Tokens
userSchema.methods.generateAccessToken = function () {
    //short lived access token
    return jwt.sign({ //storing all data
        _id: this._id,
        email: this.email,
        username: this.username,
        fullname: this.fullname
    },
    process.env.ACCESS_TOKEN_SECRET,
    {expiresIn: process.env.ACCESS_TOKEN_EXPIRY}

);
}

//refresh token:
userSchema.methods.generateRefreshToken = function () {
    //short lived access token
    return jwt.sign({ //storing all data
        _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {expiresIn: process.env.REFRESH_TOKEN_EXPIRY}

);
}


//we are exporting this so that whenever i need i can import this model, and also feature of mongoDB, like querying the database, finding an elements, or saving any new data in the database
export const User = mongoose.model("User", userSchema)