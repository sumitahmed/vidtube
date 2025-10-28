import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.models.js"
import {User} from "../models/user.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    //step 1: Get tweet content from req.body
    const {content} = req.body
    //step 2: Validate content is provided and not empty
    if(!content?.trim())
    {
        throw new ApiError(400, "Tweet content is required")

    }

    //step 3: Validate content length 
    if(content.trim().length > 280){
        throw new ApiError(400, "Tweet content cannot exceed 280 characters")
    }

    //step 4: Create tweet in database
    const tweet = await Tweet.create({
        content: content.trim(),
        owner: req.user._id //from auth middleware
    })

    //step 5: Virify tweet is created
    if(!tweet){
        throw new ApiError(500, "Unable to create tweet. Please try again later.")
    }

    //step 6: Fetch Created tweet with owner details 
    const createdTweet = await Tweet.findById(tweet._id).populate('owner', 'username fullname avatar')

    //step 7: Send response
    res.status(201).json(
        new ApiResponse(201, tweet, "Tweet created successfully")
    )
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
