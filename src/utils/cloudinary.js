import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

const uploadOnCloudinary = async (
  localFilePath,
  cloudName,
  mediaType,
  isVideo
) => {
  try {
    if (!localFilePath) return null;

    let publicName;

    if (mediaType === "a") {
      publicName = `${process.env.PROJECT}/avatar`;
    } else if (mediaType === "c") {
      publicName = `${process.env.PROJECT}/coverImg`;
    } else if (mediaType === "t") {
      publicName = `${process.env.PROJECT}/thumbnail`;
    } else {
      publicName = `${process.env.PROJECT}/video`;
    }

    const resourceType = isVideo ? "video" : "auto";

    //upload file on cloud
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: resourceType,
      public_id: cloudName,
      folder: publicName,
    });

    //file uploaded successfully, unlink it
    fs.unlinkSync(localFilePath);
    return response;
  } catch (err) {
    fs.unlinkSync(localFilePath);
    //removes locally saved temp files as the upload operation got failed
    return null;
  }
};

const destroyFromCloudinary = async (url) => {
  const arr = url.split("/");
  const public_id = arr[arr.length - 1].split(".")[0];
  return cloudinary.uploader.destroy(public_id);
};

export { uploadOnCloudinary };
