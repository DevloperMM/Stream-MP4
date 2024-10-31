import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Pulse } from "../models/pulse.models.js";
import { User } from "../models/user.models.js";

const createPulse = asyncHandler(async (req, res) => {
  const { content } = req.body;
  if (!content) {
    throw new ApiError(400, "Pulse can't be empty");
  }

  const pulse = await Pulse.create({
    content,
    owner: req.user?._id,
  });
  if (!pulse) {
    throw new ApiError(500, "Error occured while processing");
  }

  res
    .status(200)
    .json(new ApiResponse(200, pulse, "Pulse posted successfully"));
});

const getUserPulses = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "No such user found");
  }

  const result = await User.aggregate([
    {
      $match: { _id: new mongoose.Types.ObjectId(userId) },
    },
    {
      $lookup: {
        from: "pulses",
        localField: "_id",
        foreignField: "owner",
        as: "fetchPulses",
      },
    },
    { $unwind: "$fetchPulses" },
    {
      $project: {
        "fetchPulses.content": 1,
        "fetchPulses.owner": 1,
      },
    },
  ]);

  if (!result) {
    throw new ApiError(501, "Failed to fetch comments");
  }

  res
    .status(200)
    .json(new ApiResponse(200, result, "Pulses fetched successfully"));
});

const updatePulse = asyncHandler(async (req, res) => {
  const { pulseId } = req.params;
  const pulse = await Pulse.findById(pulseId);
  if (!pulse) {
    throw new ApiError(404, "No such pulse exist");
  }

  const { content } = req.body;
  if (!content) {
    throw new ApiError(401, "Pulse can't be empty");
  }

  if (pulse.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(400, "Unauthorized request");
  }

  pulse.content = content;
  const result = await pulse.save();

  res
    .status(200)
    .json(new ApiResponse(200, result, "Pulse updated successfully"));
});

const deletePulse = asyncHandler(async (req, res) => {
  const { pulseId } = req.params;

  const pulse = await Pulse.findById(pulseId);
  if (!pulse) {
    throw new ApiError(400, "No such pulse found");
  }

  if (pulse.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(400, "Unauthorised request");
  }

  const result = await Pulse.findByIdAndDelete(pulseId);

  if (!result) {
    throw new ApiError(500, "Error occured while deletion");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Comment deleted successfully"));
});

export { createPulse, getUserPulses, updatePulse, deletePulse };
