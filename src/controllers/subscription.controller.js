import mongoose, { isValidObjectId } from "mongoose"
import { User } from "../models/user.models.js"
import { Subscription } from "../models/subscription.models.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    //step 1: get channelId from params
    const { channelId } = req.params
    // TODO: toggle subscription

    //step 2: validate channelId
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channelId")
    }

    //step 3: check if user is tryna subscribe to self
    if (channelId === req.user._id.toString()) {
        throw new ApiError(400, "You cannot subscribe to your own channel")
    }

    //step 4: check if channel (user) exists
    const channel = await User.findById(channelId)
    if (!channel) {
        throw new ApiError(404, "Channel not found")
    }

    //step 5: check if subscription already exists
    const existingSubscription = await Subscription.findOne({
        subscriber: req.user._id,
        channel: channelId
    })

    //step 6: Toggle subscription (subscribe/unsubscribe)
    if (existingSubscription) {
        //unsubscribe
        await Subscription.findByIdAndDelete(existingSubscription._id)

        res.status(200).json(
            new ApiResponse(200, null, "Unsubscribed successfully")
        )
    } else {
        //subscribe
        const newSubscription = await Subscription.create({
            subscriber: req.user._id,
            channel: channelId
        })

        res.status(201).json(
            new ApiResponse(201, newSubscription, "Subscribed successfully")
        )
    }
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params

    //step 2: validate channelId
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channelId")
    }

    //step 3: check if channel (user) exists
    const channel = await User.findById(channelId)
    if (!channel) {
        throw new ApiError(404, "Channel not found")
    }

    //step 4:get pagination params
    const { page = 1, limit = 10 } = req.query

    //step 5: calc skip val
    const skip = (parseInt(page) - 1) * parseInt(limit)

    //step 6: get total subscribers count
    const totalSubscribers = await Subscription.countDocuments({ channel: channelId })

    //step 7: fetch subscribers with pagnation using aggregation 
    const subscribers = await Subscription.aggregate([
        {
            // Match all subscriptions for thi channel
            $match: {
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            // Lookup subscriber details from users collection
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriberDetails",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullname: 1,
                            avatar: 1,
                        }
                    }
                ]
            }
        },
        {
            // Unwind the subscriberDetails array
            $unwind: "$subscriberDetails"
        },
        {
            //sort by most recent subsriptions first
            $sort: {
                createdAt: -1
            }
        },
        {
            //skip for pagination
            $skip: skip
        },
        {
            //limnit results
            $limit: parseInt(limit)
        },
        {
            //project final o/p
            $project: {
                _id: 1,
                subscriber: "$subscriberDetails",
                subscribedAt: "$createdAt"
            }
        }
    ])

    //step 8: calculate pagination metadata
    const totalPages = Math.ceil(totalSubscribers / parseInt(limit))

    //step 9: send response
    return res.status(200).json(
        new ApiResponse(200, {
            subscribers,
            subscriberCount: totalSubscribers,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalSubscribers,
                limit: parseInt(limit),
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        }, "Channel subscribers fetched successfully")
    )

})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    // Step 1: Get subscriberId from URL parameters
    const { subscriberId } = req.params
    //step 2: Validate subscriberId
    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid subscriber Id")
    }

    //step 3: check if user exists
    const user = await User.findById(subscriberId)
    if(!user){
        throw new ApiError(404, "User not found")
    }

    //step 4: Get pagination params
    const {
        page = 1,
        limit = 10
    } = req.query

    //step 5: calc skip value
    const skip = (parseInt(page) -1) * parseInt(limit)

    //step 6: Get total subscribed channels count
    const totalSubscriptions = await Subscription.countDocuments({subscriber: subscriberId})

    //step 7: Fetch subscribed channels with pagination using aggregation

    const subscribedChannels =  await Subscription.aggregate([
        {
            // Match all subscriptions by this user
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            // Lookup channel details from users collection
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channelDetails",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullname: 1,
                            avatar: 1,
                            coverImage: 1
                        }
                    }
                ]
            }
        },
        {
            // Unwind the channel details array
            $unwind: "$channelDetails"
        },
        {
            // Lookup subscriber count for each channel
            $lookup: {
                from: "subscriptions",
                localField: "channel",
                foreignField: "channel",
                as: "subscriberCount"
            }
        },
        {
            // Add subscriber count field
            $addFields: {
                subscriberCount: { $size: "$subscriberCount" }
            }
        },
        {
            // Sort by most recent subscriptions first
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
            // Project final output
            $project: {
                _id: 1,
                channel: "$channelDetails",
                subscriberCount: 1,
                subscribedAt: "$createdAt"
            }
        }
    ])
    // Step 8: Calculate pagination metadata
    const totalPages = Math.ceil(totalSubscriptions / parseInt(limit))

    // Step 9: Send response
    return res.status(200).json(
        new ApiResponse(200, {
            subscribedChannels,
            totalSubscriptions,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalSubscriptions,
                limit: parseInt(limit),
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        }, "Subscribed channels fetched successfully")
    )
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}