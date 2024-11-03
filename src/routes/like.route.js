import { Router } from "express";
import {
  getLikedVideos,
  toggleCommentLike,
  toggleVideoLike,
  togglePulseLike,
} from "../controllers/like.controller.js";
import { verifyJWT } from "../middlewares/auth.midware.js";

const router = Router();
router.use(verifyJWT);

router.route("/v/:videoId").post(toggleVideoLike);
router.route("/c/:commentId").post(toggleCommentLike);
router.route("/p/:pulseId").post(togglePulseLike);
router.route("/videos").get(getLikedVideos);

export default router;
