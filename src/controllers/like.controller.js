import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.models.js"
import {Video} from "../models/video.models.js"
import {Comment} from "../models/comment.models.js"
import {Tweet} from "../models/tweet.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
    // Step 2: Validate videoId
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    // Step 3: Check if video exists
    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    // Step 4: Check if user already liked this video
    const existingLike = await Like.findOne({
        video: videoId,
        likedBy: req.user._id
    })

    // Step 5: Toggle like (like or unlike)
    if (existingLike) {
        // Unlike: Delete the like
        await Like.findByIdAndDelete(existingLike._id)
        
        return res.status(200).json(
            new ApiResponse(200, { isLiked: false }, "Video unliked successfully")
        )
    } else {
        // Like: Create new like
        const newLike = await Like.create({
            video: videoId,
            likedBy: req.user._id
        })

        return res.status(200).json(
            new ApiResponse(200, { isLiked: true }, "Video liked successfully")
        )
    }
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment
// Step 2: Validate commentId
    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID")
    }

    // Step 3: Check if comment exists
    const comment = await Comment.findById(commentId)
    if (!comment) {
        throw new ApiError(404, "Comment not found")
    }

    // Step 4: Check if user already liked this comment
    const existingLike = await Like.findOne({
        comment: commentId,
        likedBy: req.user._id
    })

    // Step 5: Toggle like (like or unlike)
    if (existingLike) {
        // Unlike: Delete the like
        await Like.findByIdAndDelete(existingLike._id)
        
        return res.status(200).json(
            new ApiResponse(200, { isLiked: false }, "Comment unliked successfully")
        )
    } else {
        // Like: Create new like
        const newLike = await Like.create({
            comment: commentId,
            likedBy: req.user._id
        })

        return res.status(200).json(
            new ApiResponse(200, { isLiked: true }, "Comment liked successfully")
        )
    }
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    // Step 2: Validate tweetId
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID")
    }

    // Step 3: Check if tweet exists
    const tweet = await Tweet.findById(tweetId)
    if (!tweet) {
        throw new ApiError(404, "Tweet not found")
    }

    // Step 4: Check if user already liked this tweet
    const existingLike = await Like.findOne({
        tweet: tweetId,
        likedBy: req.user._id
    })

    // Step 5: Toggle like (like or unlike)
    if (existingLike) {
        // Unlike: Delete the like
        await Like.findByIdAndDelete(existingLike._id)
        
        return res.status(200).json(
            new ApiResponse(200, { isLiked: false }, "Tweet unliked successfully")
        )
    } else {
        // Like: Create new like
        const newLike = await Like.create({
            tweet: tweetId,
            likedBy: req.user._id
        })

        return res.status(200).json(
            new ApiResponse(200, { isLiked: true }, "Tweet liked successfully")
        )
    }
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    // Step 1: Get pagination parameters
    const { page = 1, limit = 10 } = req.query

    // Step 2: Calculate skip value
    const skip = (parseInt(page) - 1) * parseInt(limit)

    // Step 3: Get total count of liked videos by this user
    const totalLikedVideos = await Like.countDocuments({
        likedBy: req.user._id,
        video: { $exists: true, $ne: null }
    })

    // Step 4: Fetch liked videos using aggregation
    const likedVideos = await Like.aggregate([
        {
            // Match likes by this user that have a video (not comment or tweet)
            $match: {
                likedBy: new mongoose.Types.ObjectId(req.user._id),
                video: { $exists: true, $ne: null }
            }
        },
        {
            // Sort by most recently liked
            $sort: { createdAt: -1 }
        },
        {
            // Skip for pagination
            $skip: skip
        },
        {
            // Limit results
            $limit: parseInt(limit)
        },
        {
            // Lookup video details
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "videoDetails",
                pipeline: [
                    {
                        // Lookup video owner details
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        username: 1,
                                        fullname: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $unwind: "$owner"
                    },
                    {
                        $project: {
                            videoFile: 1,
                            thumbnail: 1,
                            title: 1,
                            description: 1,
                            duration: 1,
                            views: 1,
                            owner: 1,
                            createdAt: 1
                        }
                    }
                ]
            }
        },
        {
            // Unwind video details
            $unwind: "$videoDetails"
        },
        {
            // Project final output
            $project: {
                _id: 1,
                video: "$videoDetails",
                likedAt: "$createdAt"
            }
        }
    ])

    // Step 5: Calculate pagination metadata
    const totalPages = Math.ceil(totalLikedVideos / parseInt(limit))

    // Step 6: Send response
    return res.status(200).json(
        new ApiResponse(200, {
            likedVideos,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalLikedVideos,
                limit: parseInt(limit),
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        }, "Liked videos fetched successfully")
    )
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}