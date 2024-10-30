import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  destroyFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import { Video } from "../models/video.models.js";
import mongoose from "mongoose";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  // query can be in title or description
  // sortBy can be through views/duration/createdAt
  // sortType can be ascending(1)/descending(-1)

  const skip = (page - 1) * limit;

  const result = await Video.aggregate([
    {
      $match: {
        $or: [
          { title: { $regex: query, options: "i" } },
          { description: { $regex: query, options: "i" } },
        ],
        ...{ owner: new mongoose.Types.ObjectId(req.user._id) },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              username: 1,
              fullName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        owner: {
          $first: "$owner",
        },
      },
    },
    {
      $sort: {
        [sortBy || "createdAt"]: sortType || 1,
      },
    },
    { $skip: skip },
    { $limit: limit },
  ]);

  if (!result) {
    throw new ApiError(500, "Failed to fetch all videos");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Videos fetched successfully"));
});

const publishVideo = asyncHandler(async (req, res) => {
  // get video details from frontend
  // validation like empty, etc.
  // check for video and thumbnail
  // upload them on cloudinary
  // create video object; create entry in DB
  // return object as response data

  const { title, description } = req.body;
  if (!(title && description)) {
    throw new ApiError(400, "Title and description are required to upload");
  }

  let videoLocalPath;
  let thumbnailLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.videoFile) &&
    req.files.videoFile.length > 0 &&
    Array.isArray(req.files.thumbnail) &&
    req.files.thumbnail.length > 0
  ) {
    videoLocalPath = req.files.videoFile[0].path;
    thumbnailLocalPath = req.files.thumbnail[0].path;
  } else {
    throw new ApiError(401, "Thumbnail and Video are required to upload");
  }

  const fileName = `${req.user.username}_${Date.now()}`;

  const videoFile = await uploadOnCloudinary(
    videoLocalPath,
    fileName,
    "v",
    true
  );

  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath, fileName, "t");

  if (!(videoFile && thumbnail)) {
    throw new ApiError(500, "Error occured while processing the video");
  }

  const video = await Video.create({
    videoFile: videoFile.url,
    thumbnail: thumbnail.url,
    title,
    description,
    duration: videoFile.duration,
    owner: req.user._id,
  });

  if (!video) {
    throw new ApiError(500, "Error occured while uploading the video");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, video, "Video processed and uploaded successfully")
    );
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Not Found! Video doesn't exist");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { videoFile: video.videoFile, thumbnail: video.thumbnail },
        "Video fetched succesfully"
      )
    );
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body;

  const thumbnailLocalPath = req.file?.path;
  if (!(thumbnailLocalPath && title && description)) {
    throw new ApiError(400, "Fields can't be empty while updation");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Not Found! Video doesn't exist");
  }

  const thumbnail = await uploadOnCloudinary(
    thumbnailLocalPath,
    `${req.user.username}_${Date.now()}`,
    "t"
  );

  if (!thumbnail.url) {
    throw new ApiError(400, "Error while processing thumbnail");
  }

  await destroyFromCloudinary(video.thumbnail);

  video.title = title;
  video.description = description;
  video.thumbnail = thumbnail.url;

  const updatedVideo = await video.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedVideo, "Video details updated successfully")
    );
});

const deleteVideo = asyncHandler(async (req, res) => {
  try {
    const { videoId } = req.params;
    const video = await Video.findByIdAndDelete(videoId);
    if (!video) {
      throw new ApiError(404, "Not Found! Video doesn't exist");
    }

    await destroyFromCloudinary(video.videoFile, true);
    await destroyFromCloudinary(video.thumbnail);

    console.log(res1);
    console.log(res2);

    return res
      .status(200)
      .json(new ApiResponse(200, video, "Video deleted successfully"));
  } catch (err) {
    throw new ApiError(500, err?.message || "Some error occured");
  }
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Not Found! Video doesn't exist");
  }

  video.isPublished = !video.isPublished;
  await video.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        video.isPublished,
        "Video publish toggled successfully"
      )
    );
});

export {
  getAllVideos,
  publishVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
