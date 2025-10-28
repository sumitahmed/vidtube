import { Router } from 'express';
import {
    getSubscribedChannels,
    getUserChannelSubscribers,
    toggleSubscription,
} from "../controllers/subscription.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router
  .route("/c/:channelId")
  .get(getUserChannelSubscribers)  // ✅ Get subscribers of a channel
  .post(toggleSubscription);        // ✅ Subscribe to a channel

router.route("/u/:subscriberId").get(getSubscribedChannels); // ✅ Get channels a user subscribed to


export default router