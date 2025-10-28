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
    const { userId } = req.params;
    
    // Use authenticated user's ID if userId not provided
    const targetUserId = userId || req.user._id;
    
    if (!isValidObjectId(targetUserId)) {
        throw new ApiError(400, "Invalid user ID");
    }
    
    // Find all playlists for the user and populate videos with full details
    const playlists = await Playlist.find({ owner: targetUserId })
        .populate({
            path: 'videos',
            select: 'title thumbnail duration views createdAt owner',
            populate: {
                path: 'owner',
                select: 'username avatar'
            }
        })
        .populate('owner', 'username avatar')
        .sort({ createdAt: -1 });
    
    return res.status(200).json(
        new ApiResponse(200, playlists, "Playlists fetched successfully")
    );
});



const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID");
    }
    
    const playlist = await Playlist.findById(playlistId)
        .populate({
            path: 'videos',
            select: 'title thumbnail duration views createdAt owner videoFile',
            populate: {
                path: 'owner',
                select: 'username avatar'
            }
        })
        .populate('owner', 'username avatar');
    
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }
    
    return res.status(200).json(
        new ApiResponse(200, playlist, "Playlist fetched successfully")
    );
});


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
