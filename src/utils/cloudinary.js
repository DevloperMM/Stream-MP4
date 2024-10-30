import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

const uploadOnCloudinary = async (
  localFilePath,
  cloudPublicId,
  mediaType,
  isVideo = false
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
      public_id: cloudPublicId,
      folder: publicName,
    });

    //file uploaded successfully, unlink it
    fs.unlinkSync(localFilePath);
    return response;
  } catch (err) {
    //removes locally saved temp files as the upload operation got failed
    fs.unlinkSync(localFilePath);
    return null;
  }
};

const destroyFromCloudinary = async (url, isVideo = false) => {
  const idx = url.indexOf(process.env.PROJECT);
  const public_id = url.slice(idx).split(".")[0];

  if (isVideo) {
    return cloudinary.uploader.destroy(public_id, { resource_type: "video" });
  } else {
    return cloudinary.uploader.destroy(public_id);
  }
};

export { uploadOnCloudinary, destroyFromCloudinary };
