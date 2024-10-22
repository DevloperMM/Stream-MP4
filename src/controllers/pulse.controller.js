import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPulse = asyncHandler(async (req, res) => {
  // TODO: create pulse
});

const getUserPulses = asyncHandler(async (req, res) => {
  // TODO: get user pulses
});

const updatePulse = asyncHandler(async (req, res) => {
  // TODO: update pulse
});

const deletePulse = asyncHandler(async (req, res) => {
  // TODO: delete pulse
});

export { createPulse, getUserPulses, updatePulse, deletePulse };
