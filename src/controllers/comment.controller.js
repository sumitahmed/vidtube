import mongoose from "mongoose"
import { Video } from "../models/video.models.js"
import { Comment } from "../models/comment.models.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const { videoId } = req.params
    // Step 2: Get pagination parameters from query
    const { page = 1, limit = 10 } = req.query
    // Step 3: Validate videoId
    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    // Step 4: Check if video exists
    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    // Step 5: Calculate skip value for pagination
    const skip = (parseInt(page) - 1) * parseInt(limit)

    // Step 6: Get total comment count for this video
    const totalComments = await Comment.countDocuments({ video: videoId })

    // Step 7: Fetch comments with aggregation
    const comments = await Comment.aggregate([
        {
            // Match comments for this video
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            // Sort by newest first
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
            // Lookup owner (commenter) details
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
            // Lookup likes for each comment
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "comment",
                as: "likes"
            }
        },
        {
            // Add likes count
            $addFields: {
                likesCount: { $size: "$likes" }
            }
        },
        {
            // Project final output
            $project: {
                content: 1,
                owner: 1,
                createdAt: 1,
                updatedAt: 1,
                likesCount: 1
            }
        }
    ])

    // Step 8: Calculate pagination metadata
    const totalPages = Math.ceil(totalComments / parseInt(limit))

    // Step 9: Send response
    return res.status(200).json(
        new ApiResponse(200, {
            comments,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalComments,
                limit: parseInt(limit),
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        }, "Comments fetched successfully")
    )

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    // Step 1: Get videoId from URL parameters
    const { videoId } = req.params

    // Step 2: Get content from request body
    const { content } = req.body

    // Step 3: Validate videoId
    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    // Step 4: Validate content
    if (!content?.trim()) {
        throw new ApiError(400, "Comment content is required")
    }

    // Step 5: Check if video exists
    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    // Step 6: Create comment
    const comment = await Comment.create({
        content: content.trim(),
        video: videoId,
        owner: req.user._id
    })

    // Step 7: Verify comment was created
    if (!comment) {
        throw new ApiError(500, "Failed to add comment")
    }

    // Step 8: Fetch created comment with owner details
    const createdComment = await Comment.findById(comment._id)
        .populate('owner', 'username fullname avatar')

    // Step 9: Send response
    return res.status(201).json(
        new ApiResponse(201, createdComment, "Comment added successfully")
    )
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    // Step 1: Get commentId from URL parameters
    const { commentId } = req.params

    // Step 2: Get new content from request body
    const { content } = req.body

    // Step 3: Validate commentId
    if (!mongoose.isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID")
    }

    // Step 4: Validate content
    if (!content?.trim()) {
        throw new ApiError(400, "Comment content is required")
    }

    // Step 5: Find the comment
    const comment = await Comment.findById(commentId)

    if (!comment) {
        throw new ApiError(404, "Comment not found")
    }

    // Step 6: Check if user is the owner of the comment
    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this comment")
    }

    // Step 7: Update comment content
    comment.content = content.trim()
    await comment.save()

    // Step 8: Fetch updated comment with owner details
    const updatedComment = await Comment.findById(commentId)
        .populate('owner', 'username fullname avatar')

    // Step 9: Send response
    return res.status(200).json(
        new ApiResponse(200, updatedComment, "Comment updated successfully")
    )
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    // Step 1: Get commentId from URL parameters
    const { commentId } = req.params

    // Step 2: Validate commentId
    if (!mongoose.isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID")
    }

    // Step 3: Find the comment
    const comment = await Comment.findById(commentId)

    if (!comment) {
        throw new ApiError(404, "Comment not found")
    }

    // Step 4: Check if user is the owner of the comment
    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this comment")
    }

    // Step 5: Delete the comment
    await Comment.findByIdAndDelete(commentId)

    // Step 6: Send response
    return res.status(200).json(
        new ApiResponse(200, {}, "Comment deleted successfully")
    )
})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}
