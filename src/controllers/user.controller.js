import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const options = {
  httpOnly: true,
  cookies: true,
};

const generateTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (err) {
    throw new ApiError(500, "Error occured in generating tokens");
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  // validation (e.g. Fields should not be empty, etc.)
  // check if user not exist: username || email
  // else restrict from registration
  // check for images where avatar is mandatory
  // upload them on cloudinary, uploading avatar is necessary
  // create user object: create entry in DB
  // remove password and refresh_token field from response
  // check for user creation
  // return response or error if occured

  const { fullName, email, username, password } = req.body;

  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "Marked fields required to register");
  }

  const isExist = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (isExist)
    throw new ApiError(409, "User with this email or username already exist");

  // const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImgLocalPath = req.files?.coverImg[0]?.path;

  let avatarLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.avatar) &&
    req.files.avatar.length > 0
  ) {
    avatarLocalPath = req.files.avatar[0].path;
  } else {
    throw new ApiError(400, "Upload Avatar is necessary");
  }

  let coverImgLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImg) &&
    req.files.coverImg.length > 0
  ) {
    coverImgLocalPath = req.files.coverImg[0].path;
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath, `${username}`, "a");

  if (!avatar) {
    throw new ApiError(500, "Error while uploading avatar");
  }

  const coverImg = await uploadOnCloudinary(
    coverImgLocalPath,
    `${username}`,
    "c"
  );

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImg: coverImg?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const isUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!isUser) {
    throw new ApiError(500, "Error occured while registering the user");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, isUser, "User Registered Successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // get user detatils from frontend
  // check user exist
  // check the password check
  // generate access and refresh token
  // send secure cookies
  // respond successful login

  const { email, username, password } = req.body;

  if (!username && !email) {
    throw new ApiError(400, "Username/Email is required field");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User does not exit");
  }

  const isPassValid = await user.isPasswordCorrect(password);

  if (!isPassValid) {
    throw new ApiError(404, "Invalid user credentials");
  }

  const { accessToken, refreshToken } = await generateTokens(user._id);

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser },
        "User logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refresh_token: 1,
      },
    },
    {
      new: true,
    }
  );

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, { user }, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid Refresh Token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired");
    }

    const { accessToken, refreshToken } = await generateTokens(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken },
          "Access Token Refreshed"
        )
      );
  } catch (err) {
    throw new ApiError(401, err?.message || "Invalid Refresh Token");
  }
});

const changeCurrPassword = asyncHandler(async (req, res) => {
  const { oldPass, newPass } = req.body;

  // const {confirmPass} = req.body;
  // if (newPass !== confirmPass) {
  //   throw new ApiError(400, "New and Confirm Password must be same");
  // }

  const user = await User.findById(req.user?._id);
  const isPassValid = await user.isPasswordCorrect(oldPass);

  if (!isPassValid) {
    throw new ApiError(400, "Invalid current password");
  }

  user.password = newPass;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password Changed Successfully"));
});

const getCurrentUser = asyncHandler((req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "User Fetched Successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { newFullName, newEmail } = req.body;

  if (!newFullName || !newEmail) {
    throw new ApiError(400, "All fields are required");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName: newFullName,
        email: newEmail,
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));
});

const updateAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing");
  }

  try {
    const avatar = await uploadOnCloudinary(
      avatarLocalPath,
      `${req.user.username}`,
      "a"
    );

    if (!avatar.url) {
      throw new ApiError(400, "Error while uploading avatar");
    }

    let user = await User.findById(req.user._id).select(
      "-password -refreshToken"
    );

    // No need to destroy, uploading done with same name replacing it

    user.avatar = avatar.url;
    user = await user.save({ validateBeforeSave: false });

    return res
      .status(200)
      .json(new ApiResponse(200, user, "Avatar Updated Successfully"));
  } catch (err) {
    throw new ApiError(
      400,
      err?.message || "Some error occured while changing avatar"
    );
  }
});

const updateCoverImg = asyncHandler(async (req, res) => {
  const coverImgLocalPath = req.file?.path;

  if (!coverImgLocalPath) {
    throw new ApiError(
      400,
      "Uploading cover Image is mandatory while updating"
    );
  }

  try {
    const coverImg = await uploadOnCloudinary(
      coverImgLocalPath,
      `${req.user.username}`,
      "c"
    );

    if (!coverImg.url) {
      throw new ApiError(400, "Error while uploading cover image");
    }

    let user = await User.findById(req.user._id).select(
      "-password -refreshToken"
    );

    // No need to destroy, uploading done with same name replacing it

    user.coverImg = coverImg.url;
    user = await user.save({ validateBeforeSave: false });

    return res
      .status(200)
      .json(new ApiResponse(200, user, "Cover Image Updated Successfully"));
  } catch (err) {
    throw new ApiError(
      "400",
      err?.message || "Some error occured while changing cover photo"
    );
  }
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username?.trim()) {
    throw new ApiError(400, "Username is missing");
  }

  const channel = await User.aggregate([
    {
      $match: { username: username?.toLowerCase() },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
        // It contains documents of subscription model
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribed",
      },
    },
    {
      $addFields: {
        subscriberCount: {
          $size: "$subscribers",
        },
        subscriptionCount: {
          $size: "$subscribed",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        subscriberCount: 1,
        subscriptionCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImg: 1,
      },
    },
  ]);
  // console.log(channel);

  if (!channel?.length) {
    throw new ApiError(404, "Channel does not exist");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, channel[0], "User Channel fetched successfully")
    );
});

const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: { _id: new mongoose.Types.ObjectId(req.user._id) },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
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
        ],
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0].watchHistory,
        "Watch History fetched Successfully"
      )
    );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrPassword,
  getCurrentUser,
  updateAccountDetails,
  updateAvatar,
  updateCoverImg,
  getUserChannelProfile,
  getWatchHistory,
};
