import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.models.js";
import { User } from "../models/user.models.js";

const getChannelStats = asyncHandler(async (req, res) => {
  let userId = req.user._id;
  let user = await User.exists({ _id: userId });
  if (!user) {
    throw new ApiError(404, "Login is needed to view dashboard");
  }

  try {
    const channelStats = await Video.aggregate([
      {
        $match: { owner: new mongoose.Types.ObjectId(userId) },
      },
      {
        $lookup: {
          from: "subscriptions",
          localField: "owner",
          foreignField: "channel",
          as: "subscribers",
        },
      },
      {
        $lookup: {
          from: "subscriptions",
          localField: "owner",
          foreignField: "subscriber",
          as: "subscribedTo",
        },
      },
      {
        $lookup: {
          from: "likes",
          localField: "_id",
          foreignField: "video",
          as: "likedVideos",
        },
      },
      {
        $group: {
          _id: null,
          totalVideos: { $sum: 1 },
          totalViews: { $sum: "$views" },
          totalLikes: { $sum: { $size: "$likedVideos" } },
          subscribers: { $first: "$subscribers" },
          subscribedTo: { $first: "$subscribedTo" },
          // All videos are having same subscribers and subscriptions list
        },
      },
      {
        $project: {
          _id: 0,
          totalVideos: 1,
          totalViews: 1,
          subscribers: { $size: "$subscribers" },
          subscribedTo: { $size: "$subscribedTo" },
          totalLikes: 1,
        },
      },
    ]);

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          channelStats,
          "User's dashboard statistics fetched successfully"
        )
      );
  } catch (err) {
    throw new ApiError(
      500,
      err?.message || "Error occured while fetching the dashboard"
    );
  }
});

const getChannelVideos = asyncHandler(async (req, res) => {
  let userId = req.user._id;
  let user = await User.exists({ _id: userId });
  if (!user) {
    throw new ApiError(404, "No such user found");
  }

  const videos = await Video.find({ owner: userId });

  return res
    .status(200)
    .json(
      new ApiResponse(200, videos, "All uploaded videos fetched successfully")
    );
});

export { getChannelStats, getChannelVideos };
