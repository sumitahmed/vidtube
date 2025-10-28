import { Router } from 'express';
import {
  deleteVideo,
  getAllVideos,
  getVideoById,
  publishAVideo,
  togglePublishStatus,
  updateVideo,
} from "../controllers/video.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"
import {upload} from "../middlewares/multer.middleware.js"

const router = Router();

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================

// Get all videos (for home page)
router.route("/").get(getAllVideos);

// Get single video (for video player)
router.route("/:videoId").get(getVideoById);

// ============================================
// PROTECTED ROUTES (Authentication required)
// ============================================

// Upload video (only logged in users)
router.route("/").post(
  verifyJWT,
  upload.fields([
    {
      name: "videoFile",
      maxCount: 1
    },
    {
      name: "thumbnail",
      maxCount: 1
    }
  ]),
  publishAVideo
);

// Update video (only owner)
router.route("/:videoId").patch(
  verifyJWT,
  upload.single("thumbnail"),
  updateVideo
);

// Delete video (only owner)
router.route("/:videoId").delete(verifyJWT, deleteVideo);

// Toggle publish status (only owner)
router.route("/toggle/publish/:videoId").patch(verifyJWT, togglePublishStatus);

export default router
