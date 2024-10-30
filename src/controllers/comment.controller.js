import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.models.js";
import { Comment } from "../models/comment.models.js";

const addComment = asyncHandler(async (req, res) => {
  //get comment content from the user
  //get the user from the request
  //find the video in which the comment to be added
  const { content } = req.body;
  if (!content) {
    throw new ApiError(401, "Content is missing in the comment");
  }

  const { videoId } = req.params;
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Not found! Invalid video request");
  }

  const comment = await Comment.create({
    content,
    video: videoId,
    owner: req.user._id,
  });

  const isComment = await Comment.findById(comment._id).populate(
    "owner",
    "username"
  );

  if (!isComment) {
    throw new ApiError(500, "Error occured while adding your comment");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, isComment, "Comment added successfully"));
});

const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "No such video found");
  }

  const skip = (page - 1) * limit;

  const result = await Video.aggregate([
    {
      $match: { _id: new mongoose.Types.ObjectId(videoId) },
    },
    {
      $lookup: {
        from: "comments",
        localField: "_id",
        foreignField: "video",
        as: "page_comments",
      },
    },
    { $unwind: "$page_comments" },
    { $skip: skip },
    { $limit: limit },
    {
      $project: {
        "page_comments.content": 1,
        "page_comments.owner": 1,
      },
    },
  ]);

  if (!result) {
    throw new ApiError(501, "Failed to fetch comments");
  }

  res
    .status(200)
    .json(new ApiResponse(200, result, "Comments fetched Successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(404, "No such comment found");
  }

  const { content } = req.body;

  if (!content) {
    throw new ApiError(401, "Content is missing in the comment");
  }

  if (comment.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(400, "Unauthorized user to edit comment");
  }

  comment.content = content;

  const result = await comment.save();

  if (!result) {
    throw new ApiError(500, "Error while updating the comment");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Comment Updated Successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(400, "No such comment found");
  }

  if (comment.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(400, "Unauthorised request to delete comment");
  }

  const result = await Comment.findByIdAndDelete(commentId);

  if (!result) {
    throw new ApiError(500, "Error occured while deletion");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment deleted successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
