import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Subscription } from "../models/subscription.models.js";
import { User } from "../models/user.models.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const user = await User.findById(channelId);
  if (!user) {
    throw new ApiError(404, "No such channel found");
  }

  // const result = await Subscription.aggregate([
  //   {
  //     $match: {
  //       channel: new mongoose.Types.ObjectId(channelId),
  //       subscriber: new mongoose.Types.ObjectId(req.user._id),
  //     },
  //   },
  // ]);

  const channelSubscriber = await Subscription.findOne({
    subscriber: req.user._id,
    channel: channelId,
  });

  try {
    if (channelSubscriber) {
      const response = await Subscription.findByIdAndDelete(
        channelSubscriber._id
      );
      return res
        .status(200)
        .json(new ApiResponse(200, response, "Unsubscribed successfully"));
    } else {
      const response = await Subscription.create({
        subscriber: req.user._id,
        channel: channelId,
      });
      return res
        .status(200)
        .json(new ApiResponse(200, response, "Subscribed successfully"));
    }
  } catch (err) {
    throw new ApiError(
      500,
      err?.message || "Error occured to subscribe/unsubscribe"
    );
  }
});

const getUserSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  const isChannel = await User.exists({ _id: channelId });
  if (!isChannel) {
    throw new ApiError(404, "No such channel found");
  }

  try {
    const subscribers = await Subscription.aggregate([
      {
        $match: { channel: new mongoose.Types.ObjectId(channelId) },
      },
      {
        $lookup: {
          from: "users",
          localField: "subscriber",
          foreignField: "_id",
          as: "subscribers",
        },
      },
      {
        $unwind: "$subscribers",
      },
      {
        $project: {
          subscribers: {
            _id: 1,
            username: 1,
            fullName: 1,
            email: 1,
          },
        },
      },
    ]);

    return res
      .status(200)
      .json(
        new ApiResponse(200, subscribers, "Subscribers fetched successfully")
      );
  } catch (err) {
    throw new ApiError(
      500,
      err?.message || "Error while retrieving subscribers"
    );
  }
});

const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  const isExist = await User.findById({ _id: subscriberId });
  if (!isExist) {
    throw new ApiError(404, "No such User found");
  }

  try {
    const subscribedChannels = await Subscription.aggregate([
      {
        $match: { subscriber: new mongoose.Types.ObjectId(subscriberId) },
      },
      {
        $lookup: {
          from: "users",
          localField: "channel",
          foreignField: "_id",
          as: "channels",
        },
      },
      {
        $unwind: "$channels",
      },
      {
        $project: {
          channels: {
            _id: 1,
            username: 1,
            fullName: 1,
            avatar: 1,
          },
        },
      },
    ]);

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          subscribedChannels,
          "Subscriptions fetched successfully"
        )
      );
  } catch (err) {
    throw new ApiError(
      500,
      err?.message || "Error while retrieving subscriptions"
    );
  }
});

export { toggleSubscription, getSubscribedChannels, getUserSubscribers };
