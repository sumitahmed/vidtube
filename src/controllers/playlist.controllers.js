import mongoose, { isValidObjectId } from "mongoose"
import { Playlist } from "../models/playlist.models.js"
import { Video } from "../models/video.models.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    // Step 1: Get name and description from request body
    const { name, description } = req.body

    //TODO: create playlist
    //step 2: validate required fields
    if (!name?.trim()) {
        throw new ApiError(400, "Playlist name is required")
    }

    //step 3: create playlist in database
    const playlist = await Playlist.create({
        name: name.trim(),
        description: description?.trim() || "",
        owner: req.user._id,
        videos: [] //start with empty video array
    })

    //step 4: Verify playlist was created
    if (!playlist) {
        throw new ApiError(500, "Failed to create playlist")
    }

    //step 5: Fetch created playlist with owner details 
    const createdPlaylist = await Playlist.findById(playlist._id)
        .populate('owner', 'username fullname avatar')

    //step 6: send response
    return res.status(201).json(
        new ApiResponse(201, createdPlaylist, "Playlist created successfully")
    )
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    // Get userId from URL params OR from authenticated user
    let userId = req.params.userId;
    
    // If no userId in params, use authenticated user's ID
    if (!userId) {
        userId = req.user._id;
    }
    
    // Validate userId
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID");
    }
    
    // Get pagination parameters
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get total playlist count
    const totalPlaylists = await Playlist.countDocuments({ owner: userId });
    
    // Fetch playlists
    const playlists = await Playlist.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
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
            $addFields: {
                videoCount: { $size: "$videos" }
            }
        },
        {
            $sort: { createdAt: -1 }
        },
        {
            $skip: skip
        },
        {
            $limit: parseInt(limit)
        },
        {
            $project: {
                _id: 1,
                name: 1,
                description: 1,
                videoCount: 1,
                videos: 1,
                owner: 1,
                createdAt: 1,
                updatedAt: 1
            }
        }
    ]);
    
    const totalPages = Math.ceil(totalPlaylists / parseInt(limit));
    
    // Return playlists array directly in data field
    return res.status(200).json(
        new ApiResponse(200, playlists, "User playlists fetched successfully")
    );
});


const getPlaylistById = asyncHandler(async (req, res) => {
    // Step 1: Get playlistId from URL parameters
    const { playlistId } = req.params
        //TODO: get playlist by id
        // Step 2: Validate playlistId
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID")
    }

    // Step 3: Fetch playlist with populated videos and owner using aggregation
    const playlist = await Playlist.aggregate([
        {
            // Match the specific playlist
            $match: {
                _id: new mongoose.Types.ObjectId(playlistId)
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
            // Lookup video details for all videos in playlist
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos",
                pipeline: [
                    {
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
            // Add video count
            $addFields: {
                videoCount: { $size: "$videos" }
            }
        }
    ])

    // Step 4: Check if playlist exists
    if (!playlist || playlist.length === 0) {
        throw new ApiError(404, "Playlist not found")
    }

    // Step 5: Send response
    return res.status(200).json(
        new ApiResponse(200, playlist[0], "Playlist fetched successfully")
    )
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params
     // Step 2: Validate both IDs
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID")
    }
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    // Step 3: Check if playlist exists
    const playlist = await Playlist.findById(playlistId)
    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    // Step 4: Check if user is the owner of the playlist
    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to modify this playlist")
    }

    // Step 5: Check if video exists
    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    // Step 6: Check if video is already in the playlist
    if (playlist.videos.includes(videoId)) {
        throw new ApiError(400, "Video already exists in playlist")
    }

    // Step 7: Add video to playlist
    playlist.videos.push(videoId)
    await playlist.save()

    // Step 8: Fetch updated playlist with video details
    const updatedPlaylist = await Playlist.findById(playlistId)
        .populate('owner', 'username fullname avatar')
        .populate({
            path: 'videos',
            select: 'videoFile thumbnail title description duration views',
            populate: {
                path: 'owner',
                select: 'username fullname avatar'
            }
        })

    // Step 9: Send response
    return res.status(200).json(
        new ApiResponse(200, updatedPlaylist, "Video added to playlist successfully")
    )
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params
    // TODO: remove video from playlist
    // Step 2: Validate both IDs
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID")
    }
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    // Step 3: Check if playlist exists
    const playlist = await Playlist.findById(playlistId)
    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    // Step 4: Check if user is the owner of the playlist
    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to modify this playlist")
    }

    // Step 5: Check if video exists in playlist
    const videoIndex = playlist.videos.indexOf(videoId)
    if (videoIndex === -1) {
        throw new ApiError(404, "Video not found in playlist")
    }

    // Step 6: Remove video from playlist
    playlist.videos.splice(videoIndex, 1)
    await playlist.save()

    // Step 7: Fetch updated playlist
    const updatedPlaylist = await Playlist.findById(playlistId)
        .populate('owner', 'username fullname avatar')
        .populate({
            path: 'videos',
            select: 'videoFile thumbnail title description duration views',
            populate: {
                path: 'owner',
                select: 'username fullname avatar'
            }
        })

    // Step 8: Send response
    return res.status(200).json(
        new ApiResponse(200, updatedPlaylist, "Video removed from playlist successfully")
    )
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    // TODO: delete playlist
    // Step 2: Validate playlistId
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID")
    }

    // Step 3: Find the playlist
    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    // Step 4: Check if user is the owner
    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this playlist")
    }

    // Step 5: Delete the playlist
    await Playlist.findByIdAndDelete(playlistId)

    // Step 6: Send response
    return res.status(200).json(
        new ApiResponse(200, {}, "Playlist deleted successfully")
    )
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    //TODO: update playlist
    
    // Step 2: Validate playlistId
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID")
    }

    // Step 3: Get update data from request body
    const { name, description } = req.body

    // Step 4: Validate at least one field is provided
    if (!name && !description) {
        throw new ApiError(400, "At least one field (name or description) is required to update")
    }

    // Step 5: Find the playlist
    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    // Step 6: Check if user is the owner
    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this playlist")
    }

    // Step 7: Update fields if provided
    if (name?.trim()) playlist.name = name.trim()
    if (description !== undefined) playlist.description = description.trim()

    // Step 8: Save updated playlist
    await playlist.save()

    // Step 9: Fetch updated playlist with details
    const updatedPlaylist = await Playlist.findById(playlistId)
        .populate('owner', 'username fullname avatar')
        .populate({
            path: 'videos',
            select: 'videoFile thumbnail title description duration views',
            populate: {
                path: 'owner',
                select: 'username fullname avatar'
            }
        })

    // Step 10: Send response
    return res.status(200).json(
        new ApiResponse(200, updatedPlaylist, "Playlist updated successfully")
    )
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}
