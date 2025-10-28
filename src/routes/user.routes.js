import { Router } from "express";

import { 
    registerUser, 
    logoutUser, 
    loginUser, 
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getwatchHistory,
    addToWatchHistory
} from "../controllers/user.controller.js";
//similar to creating app from express

//we will need user upload, for post fn 
import { upload } from "../middlewares/multer.middleware.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";


const router = Router()

//unsecured routes
router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]), // with this we can get multiple i/p from the user
    registerUser)

//login route
router.route("/login").post(loginUser)

//refresh toke route
router.route("/refresh-token").post(refreshAccessToken)

//**secured routes**//

//req-->verifyJWT --> controller
//using verifyJWT middleware to protect the route
router.route("/logout").post(verifyJWT, logoutUser)

//change password
router.route("/change-password").post(verifyJWT, changeCurrentPassword)
//get current user
router.route("/current-user").get(verifyJWT, getCurrentUser)
//get channel details
router.route("/channel/:username").get(verifyJWT, getUserChannelProfile)
//update account details
router.route("/update-account").patch(
    verifyJWT, 
    upload.single("coverImage"),
    updateAccountDetails
)
//update avatar&cover image
router.route("/avatar").patch(verifyJWT,upload.single("avatar"), updateUserAvatar)

router.route("/cover-image").patch(verifyJWT,upload.single("coverImage"), updateUserCoverImage)

//get watch history
router.route("/history").get(verifyJWT, getwatchHistory)
router.route("/history/:videoId").post(verifyJWT, addToWatchHistory)  // ← ADD THIS


export default router;