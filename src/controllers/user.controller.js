import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { apiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";

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
    throw new apiError(500, "Error occured in generating tokens");
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  // validation (e.g. Fields should not be empty, etc.)
  // check if user exist: username || email
  // proceed to create the user
  // check for images where avatar is mandatory
  // upload them on cloudinary, uploading avatar is necessary
  // create user object: create entry in DB
  // remove password and refresh_token field from response
  // check for user creation
  // return response or error if occured

  const { fullName, email, username, password } = req.body;

  // console.log(req.body);

  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new apiError(400, "All fields are required");
  }

  const isExist = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (isExist)
    throw new apiError(409, "User with this email or username already exist");

  // console.log(req.files)

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
    throw new apiError(400, "Upload Avatar is necessary");
  }

  let coverImgLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImg) &&
    req.files.coverImg.length > 0
  ) {
    coverImgLocalPath = req.files.coverImg[0].path;
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImg = await uploadOnCloudinary(coverImgLocalPath);

  // console.log(avatar);
  if (!avatar) {
    throw new apiError(400, "Upload Avatar is necessary");
  }

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
    throw new apiError(500, "Error occured while registering the user");
  }

  return res
    .status(201)
    .json(new apiResponse(200, isUser, "User Registered Successfully"));
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
    throw new apiError(400, "Username/Email is required field");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new apiError(404, "User does not exit");
  }

  const isPassValid = await user.isPasswordCorrect(password);

  if (!isPassValid) {
    throw new apiError(404, "Invalid user credentials");
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
      new apiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refresh_token: undefined,
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
    .json(new apiResponse(200, {}, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new apiError(401, "Unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new apiError(401, "Invalid Refresh Token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new apiError(401, "Refresh token is expired");
    }

    const { accessToken, newRefreshToken } = await generateTokens(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new apiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access Token Refreshed"
        )
      );
  } catch (err) {
    throw new apiError(401, err?.message || "Invalid Refresh Token");
  }
});

export { registerUser, loginUser, logoutUser, refreshAccessToken };
