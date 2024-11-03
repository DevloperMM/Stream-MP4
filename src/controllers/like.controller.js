import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Like } from "../models/like.models.js";
import { User } from "../models/user.models.js";
import { Comment } from "../models/comment.models.js";
import { Pulse } from "../models/pulse.models.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const likedBy = req.user._id;
  const user = await User.exists({ _id: likedBy });
  if (!user) {
    throw new ApiError(402, "Login is required to like/unlike");
  }

  try {
    let isLiked = await Like.findOneAndDelete({ video: videoId, likedBy });
    if (!isLiked) {
      isLiked = await Like.create({ video: videoId, likedBy });
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, isLiked, "Video like status toggled successfully")
      );
  } catch (err) {
    throw new ApiError(
      500,
      err?.message || "Error occured while liking/unliking"
    );
  }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  const likedBy = req.user._id;
  const user = await User.exists({ _id: likedBy });
  if (!user) {
    throw new ApiError(402, "Login is required to like/unlike");
  }

  try {
    let isLiked = await Like.findOneAndDelete({
      comment: commentId,
      likedBy,
    });
    if (!isLiked) {
      isLiked = await Like.create({ comment: commentId, likedBy });
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          isLiked,
          "Comment like status toggled successfully"
        )
      );
  } catch (err) {
    throw new ApiError(
      500,
      err?.message || "Error occured while liking/unliking"
    );
  }
});

const togglePulseLike = asyncHandler(async (req, res) => {
  const { pulseId } = req.params;

  const likedBy = req.user._id;
  const user = await User.exists({ _id: likedBy });
  if (!user) {
    throw new ApiError(402, "Login is required to like/unlike");
  }

  try {
    let isLiked = await Like.findOneAndDelete({ pulse: pulseId, likedBy });
    if (!isLiked) {
      isLiked = await Like.create({ pulse: pulseId, likedBy });
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, isLiked, "Pulse like status toggled successfully")
      );
  } catch (err) {
    throw new ApiError(
      500,
      err?.message || "Error occured while liking/unliking"
    );
  }
});

const getLikedVideos = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  try {
    const videos = await Like.find({
      likedBy: userId,
      video: { $exists: true, $type: "objectId" },
    }).populate("video", ["videoFile", "thumbnail", "views", "createdAt"]);

    return res
      .status(200)
      .json(new ApiResponse(200, videos, "Liked videos fetched successfully"));
  } catch (err) {
    throw new ApiError(400, "Error occured while fetching videos");
  }
});

export { toggleCommentLike, togglePulseLike, toggleVideoLike, getLikedVideos };
