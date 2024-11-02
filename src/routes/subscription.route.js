import { Router } from "express";
import {
  getUserSubscribers,
  getSubscribedChannels,
  toggleSubscription,
} from "../controllers/subscription.controller.js";
import { verifyJWT } from "../middlewares/auth.midware.js";

const router = Router();
router.use(verifyJWT);

router.route("/c/:channelId").get(getUserSubscribers).post(toggleSubscription);

router.route("/u/:subscriberId").get(getSubscribedChannels);

export default router;
