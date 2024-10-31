import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Playlist } from "../models/playlist.models.js";
import { User } from "../models/user.models.js";
import { Video } from "../models/video.models.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description = "" } = req.body;

  if (!name) {
    throw new ApiError(401, "Playlist name is required");
  }

  try {
    const playList = await Playlist.create({
      name,
      description,
      owner: req.user._id,
    });
  } catch (err) {
    throw new ApiError(500, err?.message || "Error while processing playlist");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playList, "Playlist created successfully"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "No such user exist");
  }

  try {
    const result = await Playlist.aggregate([
      {
        $match: { owner: new mongoose.Types.ObjectId(userId) },
      },
    ]);

    return res
      .status(200)
      .json(new ApiResponse(200, result, "Playlists fetched successfully"));
  } catch (err) {
    throw new ApiError(400, err?.message || "Error while fetching playlists");
  }
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const playList = await Playlist.findById(playlistId);
  if (!playList) {
    throw new ApiError(404, "No such playlist exists");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playList, "Playlist fetched successfully"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  const isVideo = await Video.exists({ _id: videoId });
  if (!isVideo) {
    throw new ApiError(404, "No such video found");
  }

  try {
    const playList = await Playlist.findByIdAndUpdate(
      playlistId,
      {
        $push: { videos: videoId },
      },
      { new: true }
    );

    return res
      .status(200)
      .json(
        new ApiResponse(200, playList, "Video added to playlist successfully")
      );
  } catch (err) {
    throw new ApiError(500, err?.message || "Error occured while adding video");
  }
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  const isVideo = await Video.exists({ _id: videoId });
  if (!isVideo) {
    throw new ApiError(404, "No such video found");
  }

  try {
    const playList = await Playlist.findByIdAndUpdate(
      playlistId,
      { $pull: { videos: videoId } },
      { new: true }
    );

    if (!playList) {
      throw new ApiError(404, "Playlist not found");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          playList,
          "Video removed from playlist successfully"
        )
      );
  } catch (err) {
    throw new ApiError(
      500,
      err?.message || "Error occurred while removing video"
    );
  }
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  const playList = await Playlist.findByIdAndDelete(playlistId);
  if (!playList) {
    throw new ApiError(400, "No such playlist exist");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playList, "Playlist deleted successfully"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description = "" } = req.body;

  if (!name) {
    throw new ApiError(401, "Name can't be empty");
  }

  try {
    const playList = await Playlist.findByIdAndUpdate(
      playlistId,
      {
        $set: { name, description },
      },
      { new: true }
    );

    return res
      .status(200)
      .json(new ApiResponse(200, playList, "Playlist updated successfully"));
  } catch (err) {
    throw new ApiError(400, err?.message || "Error occured while updation");
  }
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
