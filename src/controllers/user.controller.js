import mongoose from "mongoose";

import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.models.js"
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import { upload } from "../middlewares/multer.middleware.js"


const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        console.log('User found for tokens:', user);
        if (!user) throw new ApiError(404, 'User not found');
        console.log('User methods:', user.generateAccessToken, user.generateRefreshToken);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });
        return { accessToken, refreshToken };
    } catch (error) {
        console.error('TOKEN ERROR:', error);
        throw new ApiError(500, 'Something went wrong while generating tokens');
    }

}

const registerUser = asyncHandler(async (req, res) => {
    const { fullname, email, username, password } = req.body;

    //validation
    // if(fullname?.trim()==="")
    // {
    //     throw new ApiError(400, "All fields are required" )
    // }
    if (
        [fullname, email, username, password].some((filed) => filed?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    //checking if existing user is already in database
    const existedUser = await User.findOne({
        //usinf mongoDB operator
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email/username already exists")
    }

    //handling the images (they come in files)
    console.warn(req.files);

    const avatarLocalPath = req.files?.avatar?.[0]?.path //as we used it in user.router.js
    const coverLocalPath = req.files?.coverImage?.[0]?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required")
    }
    //now gotta upload url on cloudnary

    //const avatar = await uploadOnCloudinary(avatarLocalPath)
    //const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    let avatar;
    try {
        avatar = await uploadOnCloudinary(avatarLocalPath)
        console.log("Uploaded avatar:", avatar);

    }
    catch (error) {
        console.log("Error uploading avatar", error);
        throw new ApiError(500, "failed to uplaod avatar")

    }

    let coverImage;
    try {
        coverImage = await uploadOnCloudinary(coverLocalPath)
        console.log("Uploaded coverImage:", coverImage);

    }
    catch (error) {
        console.log("Error uploading coverImage", error);
        throw new ApiError(500, "failed to uplaod coverImage")

    }
    console.log("Registration data:", {
    username,
    email,
    fullname,
    password: "***hidden***",
    avatar: avatar?.url,
    coverImage: coverImage?.url
});


    //construct the user
    try {
        const user = await User.create({
            fullname,
            email,
            username: username.toLowerCase(),
            password,
            avatar: avatar?.url,
            coverImage: coverImage?.url || ""
        })
        //to verify if user was created or not
        const createUser = await User.findById(user._id).select(
            "-password -refreshToken"
        )

        if (!createUser) {
            throw new ApiError(500, "Something went wrong while registering a user")
        }
        return res
            .status(201)
            .json(new ApiResponse(200, createUser, "User registed successfully"))
    } catch (error) {
        console.log("User Creation failed");

        if (avatar) {
            await deleteFromCloudinary(avatar.public_id)
        }
        if (coverImage) {
            await deleteFromCloudinary(coverImage.public_id)
        }

        throw new ApiError(500, "Something went wrong while registering a user and images were deleted")
    }
})

const loginUser = asyncHandler(async (req, res) => {
    //get data from body
    const { email, username, password } = req.body
    //validation
    if (!email) {
        throw new ApiError(400, "Email is required")
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!user) {
        throw new ApiError(404, "User not found")
    }
    //validate password
    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid credentials")
    }

    const { accessToken, refreshToken } = await
        generateAccessAndRefreshToken(user._id)

    //fire a database query 
    const loggedInUser = await User.findById(user._id)
        .select("-password -refreshToken")
    if (!loggedInUser) {
        throw new ApiError(404, "User not found")
    }

    //sending all login details to user, SECURELY
    const options = {
        httpOnly: true,  //this makes the cookie not modifiable by the user only i can modify it
        secure: process.env.NODE_ENV === "production",
    }

    //sending all data
    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(
            200,
            { user: loggedInUser, accessToken, refreshToken }, //**cause in mobile apps you cant set the cookies**!!
            "User logged in successfully"

            /**
             * This is the part where you ask your fronend team, this is how am crafting and will send the response, do you want to be manipulated, do ya want me to send the refresh token, keeping the security and everything in mind, if not fine as well
             */
        ))

})
//logout
const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        //TO DO: need to come back here after middleware, by middleware will be able to tell whos the user
        //easy way: we can look into users cookie, just decode it and extract the user id from it
        req.user._id,
        {
            $set: {
                refreshToken: undefined,
            }
        },
        //return fresh information
        { new: true }
    )

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",

    }
    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out successfully"))
})

//generating refresh token:
const refreshAccessToken = asyncHandler(async (req, res) => {
    //step1: collect incoming refresh token!, give me your refresh token ill go ahead and grab it
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken // for web: req.cookies.refreshToken
    //for mobile app: req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(400, "Refresh token is required")
    }

    //validation
    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
        const user = await User.findById(decodedToken?._id)
        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }
        //checking if the refresh token matches the database one
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Invalid refresh token")
        }

        //generate the new token and send to user
        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV == "production",
        }
        const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshToken(user._id)

        return res.status(200)
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    {
                        accessToken,
                        refreshToken: newRefreshToken
                    },
                    "Access token refreshed successfully"
                ));
    } catch (error) {
        throw new ApiError(401, "Something went wrong while refreshing the access token")
    }


})

/*
/**
 * CRUD OPERATION!!!!
 */
///////
//boiler plate route

//changeCurrentPassword
const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body

    const user = await User.findById(req.user?._id)

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(401, "Old password is incorrect")
    }
    user.password = newPassword;

    await user.save({
        validateBeforeSave: false
    })

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password changed successfully"))

})

//getCurrentUser
const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(200, req.user, "Current user details"))
})

//updateAccountDetails
const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullname, email } = req.body

    //validate
    if (!fullname) {
        throw new ApiError(400, "Fullname is required")
    }
    if (!email) {
        throw new ApiError(400, "Email is required")
    }


    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullname,
                email: email
            }
        },
        //updated info to come
        {
            new: true
        }
    ).select("-password -refreshToken")

    return res
        .status(200)
        .json(new ApiResponse(200, user, "User details updated successfully"))
})

//update AvatarImage
const updateUserAvatar = asyncHandler(async (req, res) => {
    //step 1: access local file path
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar File is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(500, "Failed to upload avatar")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {
            new: true
        }
    ).select("-password -refreshToken")

    res
        .status(200)
        .json(new ApiResponse(200, user, "User avatar updated successfully"))

})

//update coverImage
const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path;
    console.log('req.file:', req.file); // should be a file object

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover Image File is required");
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!coverImage.url) {
        throw new ApiError(500, "Failed to upload cover image");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        { $set: { coverImage: coverImage.url } },
        { new: true }
    ).select("-password -refreshToken");

    return res
        .status(200)
        .json(new ApiResponse(200, user, "User cover image updated successfully"));
});

//**aggregation pipelines**/

//getUserChannelProfile
const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params;
    
    if (!username?.trim()) {
        throw new ApiError(400, "Username is required");
    }

    // First, get the user to see their ID
    const user = await User.findOne({ username: username.toLowerCase() });
    console.log('Found user:', user._id);
    
    // Check if any subscriptions exist for this user
    const Subscription = mongoose.model('Subscription');
    const subs = await Subscription.find({ channel: user._id });
    console.log('Direct subscription query found:', subs.length, 'subscribers');
    
    // Check if any videos exist for this user
    const Video = mongoose.model('Video');
    const vids = await Video.find({ owner: user._id });
    console.log('Direct video query found:', vids.length, 'videos');

    // Now run the aggregation
    const channel = await User.aggregate([
        {
            $match: {
                username: username.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "_id",
                foreignField: "owner",
                as: "videos"
            }
        },
        {
            $addFields: {
                subscribersCount: { $size: "$subscribers" },
                channelsSubscribedToCount: { $size: "$subscribedTo" },
                videosCount: { $size: "$videos" },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullname: 1,
                username: 1,
                avatar: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                videosCount: 1,
                isSubscribed: 1,
                coverImage: 1,
                email: 1
            }
        }
    ]);

    console.log('Aggregation result:', JSON.stringify(channel[0], null, 2));

    if (!channel?.length) {
        throw new ApiError(404, "Channel not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, channel[0], "User channel profile fetched successfully"));
});




//getwatchHistory
// const getwatchHistory = asyncHandler(async (req, res) => {
//     const user = await User.aggregate([
//         {
//             $match: {
//                 //note: in aggregation pipeline you cant just give like this: req.user?._id, 
//                 //instead use mongoose desgined id:
//                 _id: new mongoose.Types.ObjectId(req.user?._id)
//             }
//         },
//         {
//             $lookup: {
//                 from: "videos",
//                 localField : "watchHistory",
//                 foreignField: "_id",
//                 as: "watchHistory",
//                 pipeline: [{
//                     $lookup: {
//                         //owner/creator of the video
//                         from: "users",
//                         localField: "owner",
//                         foreignField: "_id",
//                         as: "owner",
//                         pipeline: [{
//                             $project: {
//                                 fullname: 1,
//                                 username: 1,
//                                 avatar: 1
//                             }
//                         }]
//                     }
//                 },
//                 {
//                     $addFields: {
//                         owner: {
//                             $first: "$owner"
//                         }
//                     }
//                 }
//                 ]
//             }
//         }

//     ])

//     return res.status(200)
//         .json(new ApiResponse(
//             200,
//             user?.[0]?.watchHistory || [],
//             "User watch history fetched successfully"
//         ))
// })

// Add video to watch history
//getwatchHistory - SIMPLER AND FASTER VERSION
const getwatchHistory = asyncHandler(async (req, res) => {
  console.log('🔍 Fetching watch history for user:', req.user?._id);
  
  const user = await User.findById(req.user?._id)
    .populate({
      path: 'watchHistory',
      populate: {
        path: 'owner',
        select: 'fullname username avatar'
      }
    })
    .select('watchHistory');
  
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  
  console.log('✅ Watch history found:', user.watchHistory?.length || 0, 'videos');
  
  return res.status(200)
    .json(new ApiResponse(
      200,
      user.watchHistory || [],
      "User watch history fetched successfully"
    ));
});


const addToWatchHistory = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  
  // Update user's watch history
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $addToSet: { // $addToSet prevents duplicates
        watchHistory: videoId
      }
    },
    { new: true }
  );
  
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  
  return res.status(200).json(
    new ApiResponse(200, {}, "Added to watch history")
  );
});



//export 
export {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getwatchHistory,  // ← FIXED (capital W)
  addToWatchHistory  // ← NEW
}
