import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { apiResponse } from "../utils/apiResponse.js";

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

export { registerUser };
