import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.models.js"
import {User} from "../models/user.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary, deleteFromCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    //extract query params
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
    //1. build filter object
    const filter = { isPublished: true } // only published videos

    //add search functionality if query exists
    if(query){
        FileSystemEntry.$or =[
            {
                title: {$regex: query,
                    $options: "i" // case insensitive
                }
            },
            {
                description: {$regex: query,
                    $options: "i" // case insensitive
                }
            }
        ]
    }
    //2. add user filter if userId is provided
    if(userId){
        if(!isValidObjectId(userId)){
            throw new ApiError(400, "Invalid userId")
        }
        filter.owner = new mongoose.Types.ObjectId(userId)
    }
    //3. add user filere if userid is there
    if(userId)
    {
        if(!isValidObjectId(userId)){
            throw new ApiError(400, "Invalid userId")
        }
        filter.owner = new mongoose.Types.ObjectId(userId)
    }
    //4. build sort object
    const sort = {}
    if(sortBy && sortType){
        sort[sortBy] = sortType === "asc" ? 1 : -1
    }else{
        //default newsest first
        sort.createdAt = -1
    }
    //5. calculaet pagination values
    const skip = (parseInt(page) - 1) * parseInt(limit)

    //6. get total count for pagination metadata
    const totalVideos = await Video.countDocuments(filter)
    
    //7. fetch videos will all filters, sort and pagination
    const videos = await Video.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .populate("owner", "username fullname avatar")

    //8. calculate total pages
    const totalPages = Math.ceil(totalVideos / parseInt(limit))

    //9. send response
    return res.status(200).json(
        new ApiResponse(200, {
            videos,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalVideos,
                limit: parseInt(limit),
                hasNextPage: parseInt(page) < totalPages,
                hasPrevPage: parseInt(page) > 1
            }

        }, "Videos fetched successfully"
        )
    )
})

/**
 * PUBLISH A VIDEO
 */
const publishAVideo = asyncHandler(async (req, res) => {
    // 1. Get title and description from req.body
    const { title, description } = req.body

    // 2. Validate required fields
    if (!title?.trim()) {
        throw new ApiError(400, "Title is required")
    }

    if (!description?.trim()) {
        throw new ApiError(400, "Description is required")
    }

    // 3. Get video and thumbnail from multer - FIX HERE!
    const videoLocalPath = req.files?.videoFile?.[0]?.path  // ✅ Changed from videoLocalPath to path
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path  // ✅ Changed from videoLocalPath to path

    if (!videoLocalPath) {
        throw new ApiError(400, "Video file is required")
    }

    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail file is required")
    }

    // 4. Upload video to Cloudinary
    let videoFile
    try {
        videoFile = await uploadOnCloudinary(videoLocalPath)
        if (!videoFile) {
            throw new ApiError(500, "Failed to upload video to cloudinary")
        }
    } catch (error) {
        console.log(error)
        throw new ApiError(500, "Failed to upload video to cloudinary")
    }

    // 5. Upload thumbnail to Cloudinary
    let thumbnailFile
    try {
        thumbnailFile = await uploadOnCloudinary(thumbnailLocalPath)
        if (!thumbnailFile) {
            // Delete uploaded video from cloudinary
            await deleteFromCloudinary(videoFile.public_id)
            throw new ApiError(500, "Failed to upload thumbnail to cloudinary")
        }
    } catch (error) {
        await deleteFromCloudinary(videoFile.public_id)
        console.log(error)
        throw new ApiError(500, "Failed to upload thumbnail to cloudinary")
    }

    // 6. Create video document in db - FIX HERE!
    const newVideo = await Video.create({
        title: title.trim(),
        description: description.trim(),
        videoFile: videoFile.url,
        thumbnail: thumbnailFile.url,  // ✅ Changed from thumbnail.url to thumbnailFile.url
        duration: videoFile.duration,
        owner: req.user._id,
        isPublished: true,
        publishedAt: new Date()
    })

    // 7. Verify video was created
    const createdVideo = await Video.findById(newVideo._id).populate('owner', 'username fullname avatar')

    if (!createdVideo) {
        // Cleanup uploaded files from cloudinary
        await deleteFromCloudinary(videoFile.public_id)
        await deleteFromCloudinary(thumbnailFile.public_id)
        throw new ApiError(500, "Something went wrong while uploading video")
    }

    // 8. Send response
    return res.status(201).json(
        new ApiResponse(201, createdVideo, "Video uploaded successfully")
    )
})

//get video by id
const getVideoById = asyncHandler(async (req, res) => {
    //get videoId from URL parameters
    const { videoId } = req.params
    //TODO: get video by id

    //1. validate videoId
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid videoId")
    }

    //2. find video and populate owner details
    const video = await Video.findById(videoId)
        .populate("owner", "username fullname avatar")
    
    //3. check if video exists and is published
    if(!video || !video.isPublished){
        throw new ApiError(404, "Video not found")
    }

    //4. increment view count
    video.views +=1
    await video.save({
        validateBeforeSave: false
    })

    //5. send response
    return res.status(200).json(
        new ApiResponse(200, video, "Video fetched successfully")
    )
})
//UPDATE VIDEO

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    
 console.log("=== UPDATE VIDEO DEBUG ===");
    console.log("videoId:", videoId);
    console.log("req.body:", req.body);
    console.log("req.file:", req.file);
    console.log("========================");

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId");
    }
    
    const { title, description } = req.body;
    
    if (!title && !description && !req.file) {
        throw new ApiError(400, "At least one field (title, description, thumbnail) is required to update");
    }
    
    const video = await Video.findById(videoId);
    
    if (!video) {
        throw new ApiError(404, "Video not found");
    }
    
    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this video");
    }
    
    // Update title and description if provided
    if (title) video.title = title;
    if (description) video.description = description;
    
    // Update thumbnail if provided
    if (req.file) {
        const thumbnailLocalPath = req.file.path;  // ✅ FIXED
        const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);  // ✅ FIXED spelling
        
        if (!thumbnail) {
            throw new ApiError(500, "Failed to upload thumbnail to cloudinary");
        }
        
        // Delete old thumbnail from cloudinary
        const oldThumbnailPublicId = video.thumbnail.split("/").pop().split(".")[0];
        await deleteFromCloudinary(oldThumbnailPublicId);
        
        // Update video document with new thumbnail url
        video.thumbnail = thumbnail.url;  // ✅ FIXED variable name
    }
    
    await video.save();
    
    const updatedVideo = await Video.findById(videoId)
        .populate('owner', 'username fullname avatar');
    
    return res.status(200).json(
        new ApiResponse(200, updatedVideo, "Video updated successfully")
    );
});

//DELETE VIDEO
const deleteVideo = asyncHandler(async (req, res) => {
    //step 1: get videoId from params
    const { videoId } = req.params
    //TODO: delete video

    //step 2: validate videoId
    if(!isValidObjectId(videoId))
    {
        throw new ApiError(400, "Invalid videoId")
    }

    //step 3: find the video
    const video = await Video.findById(videoId)
    if(!video)
    {
        throw new ApiError(404, "Video not found")
    }

    //step 4: check if user is the owner
    if(video.owner.toString() !== req.user._id.toString())
    {
        throw new ApiError(403, "You are not authorized to delete this video")
    }

    //step 5: Extract public Ids from cloudinary URLs
    const videoPublicId = video.videoFile.split("/").pop().split(".")[0]
    const thumbnailPublicId = video.thumbnail.split("/").pop().split(".")[0]

    //step 6: delete video from cloudinary
    try{
        await deleteFromCloudinary(videoPublicId, 'video')
        await deleteFromCloudinary(thumbnailPublicId, 'image')
    }
    catch(error)
    {
        console.log("Error deleting from Cloudinary", error);
    }

    //step 7: delete video document from database
    await Video.findByIdAndDelete(videoId)

    //step 8: send response
    return res.status(200).json(
        new ApiResponse(200, {}, "Video deleted successfully")
    )

})

//Toggle Publish Status
const togglePublishStatus = asyncHandler(async (req, res) => {
    //get video if from params
    const { videoId } = req.params
    //step 2: validate videoId
    if(!isValidObjectId(videoId))
    {
        throw new ApiError(400, "Invalid video ID")
    }

    //step 3: find the video
    const video =  await videoId.findById(videoId)
    
    if(!video)
    {
        throw new ApiError(404,"Video not found")
    }

    //step 4: check is user is the owner
    if(video.owner.toString() !==req.user._id.toString())
    {
        throw new ApiError(403, "You are not authorized to update this video")
    }

    //step 5: Toggle the isPublished status
    video.isPublished = !video.isPublished
    await video.save({
        validateBeforeSave: false
    })

    //step 6: Send Response
    return res.status(200).json(
        new ApiResponse(200, video, `Video ${video.isPublisheed ? "published" : "unpublished"} successfully`)
    )

})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
