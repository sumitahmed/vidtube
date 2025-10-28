import mongoose from "mongoose"
import {Video} from "../models/video.models.js"
import {Subscription} from "../models/subscription.models.js"
import {Like} from "../models/like.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.

    // Get stats for the logged-in user's channel
    const userId = req.user._id

    // Use aggregation pipeline to calculate all stats in one query
    const stats = await Video.aggregate([
        {
            // Step 1: Match all videos owned by this user
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            // Step 2: Lookup likes for all videos
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            // Step 3: Group to calculate totals
            $group: {
                _id: null, // Group all documents together
                totalVideos: { $sum: 1 }, // Count number of videos
                totalViews: { $sum: "$views" }, // Sum all video views
                totalLikes: { $sum: { $size: "$likes" } } // Count total likes across all videos
            }
        }
    ])

    // Get total subscribers count separately
    const totalSubscribers = await Subscription.countDocuments({
        channel: userId
    })

    // Prepare response data
    const channelStats = {
        totalVideos: stats[0]?.totalVideos || 0,
        totalViews: stats[0]?.totalViews || 0,
        totalLikes: stats[0]?.totalLikes || 0,
        totalSubscribers: totalSubscribers
    }

    return res.status(200).json(
        new ApiResponse(200, channelStats, "Channel stats fetched successfully")
    )
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    // Get all videos uploaded by the logged-in user's channel
    const userId = req.user._id

    // Get pagination parameters
    const { page = 1, limit = 10, sortBy = "createdAt", sortType = "desc" } = req.query

    // Calculate skip value
    const skip = (parseInt(page) - 1) * parseInt(limit)

    // Build sort object
    const sort = {}
    sort[sortBy] = sortType === 'asc' ? 1 : -1

    // Get total video count
    const totalVideos = await Video.countDocuments({ owner: userId })

    // Fetch videos with aggregation to include likes and comments count
    const videos = await Video.aggregate([
        {
            // Match videos by this user
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            // Lookup likes for each video
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            // Lookup comments for each video
            $lookup: {
                from: "comments",
                localField: "_id",
                foreignField: "video",
                as: "comments"
            }
        },
        {
            // Lookup owner details
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
            // Add calculated fields
            $addFields: {
                likesCount: { $size: "$likes" },
                commentsCount: { $size: "$comments" }
            }
        },
        {
            // Sort videos
            $sort: sort
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
            // Project final output (remove likes and comments arrays, keep counts)
            $project: {
                videoFile: 1,
                thumbnail: 1,
                title: 1,
                description: 1,
                duration: 1,
                views: 1,
                isPublished: 1,
                owner: 1,
                createdAt: 1,
                updatedAt: 1,
                likesCount: 1,
                commentsCount: 1
            }
        }
    ])

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalVideos / parseInt(limit))

    return res.status(200).json(
        new ApiResponse(200, {
            videos,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalVideos,
                limit: parseInt(limit),
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        }, "Channel videos fetched successfully")
    )
})

export {
    getChannelStats, 
    getChannelVideos
    }