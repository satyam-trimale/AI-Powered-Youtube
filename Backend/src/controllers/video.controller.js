import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import { response } from "express";

const getAllVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    query,
    sortBy = "createdAt",
    sortType = "desc",
    userId,
  } = req.query;
  //TODO: get all videos based on query, sort, pagination
  const pageNumber = parseInt(page, 10);
  const pageLimit = parseInt(limit, 10);

  let searchConditions = {};

  if (query) {
    searchConditions.$or = [
      { title: { $regex: query, $options: "i" } },
      { description: { $regex: query, $options: "i" } },
    ];
  }
  if (userId && isValidObjectId(userId)) {
    searchConditions.owner = userId;
  }
  const sortOrder = {};
  sortOrder[sortBy] = sortType === "asc" ? 1 : -1; //In MongoDB, sorting is controlled using numeric values:

  // 1 → Ascending Order (Smallest to Largest)
  // -1 → Descending Order (Largest to Smallest)
  const videos = await Video.find(searchConditions)
    .sort(sortOrder)
    .skip((pageNumber - 1) * pageLimit)
    .limit(pageLimit);

  const totalVideos = await Video.countDocuments(searchConditions);
  const totalPages = Math.ceil(totalVideos / pageLimit);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        videos,
        pagination: {
          page: pageNumber,
          limit: pageLimit,
          totalPages,
          totalVideos,
        },
      },
      "Videos Retrieved Successfully"
    )
  );
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  // TODO: get video, upload to cloudinary, create video
  if ([title, description].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All Fields are required");
  }
  const videoLocalPath = req.files?.videoFile[0]?.path;
  const thumbnail = req.files?.thumbnail[0].path;
  if (!videoLocalPath) {
    throw new ApiError(400, "Video is required");
  }
  if (!thumbnail) {
    throw new ApiError(400, "Thumbnail is required");
  }
  const videoResponse = await uploadOnCloudinary(videoLocalPath);
  const thumbnailResponse = await uploadOnCloudinary(thumbnail);
  if (!videoResponse?.url) {
    throw new ApiError(400, "Error while uploading video");
  }
  if (!thumbnailResponse?.url) {
    throw new ApiError(400, "Error while uploading thumbnail");
  }
  const videoDuration = videoResponse?.duration;
  const video = await Video.create({
    title,
    description,
    videoFile: videoResponse.url,
    thumbnail: thumbnailResponse.url,
    duration: videoDuration,
    owner: req.user?._id,
  });
  return res.status(201).json(
    //201 is for resource creation (like a new video).
    new ApiResponse(201, video, "Video Uploaded Successfully")
  );
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id
  if (!videoId?.trim()) {
    throw new ApiError(400, "Video is missing");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }
  return res
    .status(200) //Since you're fetching data, use 200 instead.
    .json(new ApiResponse(200, video, "Video Fetched Successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail
  const oldVideo = await Video.findById(videoId);
  if (!oldVideo) {
    throw new ApiError(404, "Video not found");
  }

  const { title, description } = req.body;
  if (!title || !description) {
    throw new ApiError(400, "All fields are required");
  }

  let thumbnailUrl = oldVideo.thumbnail; // Default to old thumbnail

  // Check if a new thumbnail is uploaded

  const thumbnail = req.file?.path;
  if (thumbnail) {
    const thumbnailResponse = await uploadOnCloudinary(thumbnail);
    if (!thumbnailResponse?.url) {
      throw new ApiError(400, "Error while updating thumbnail");
    }
    // Only delete old thumbnail if new one is successfully uploaded

    if (oldVideo.thumbnail) {
      const oldPublicId = oldVideo.thumbnail.split("/").pop().split(".")[0];
      await deleteFromCloudinary(oldPublicId);
    }
    thumbnailUrl = thumbnailResponse.url;
  }
  const video = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        title,
        description,
        thumbnail: thumbnailUrl,
      },
    },
    {
      new: true,
    }
  );
  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video Updated Successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video
  if (!videoId) {
    throw new ApiError(400, "Video ID not Found");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(401, "Video not found");
  }
  // console.log("Video File URL:", video.videoFile);
  // console.log("thumbnail File URL:", video.thumbnail);

  // videoFile = video.videoFile
  // thumbnail = video.thumbnail
  if (video.videoFile) {
    const videoPublicId = video.videoFile.split("/").pop().split(".")[0];
    await deleteFromCloudinary(videoPublicId, "video");
  }
  if (video.thumbnail) {
    const thumbnailPublicId = video.thumbnail.split("/").pop().split(".")[0];
    await deleteFromCloudinary(thumbnailPublicId);
  }
  await Video.findByIdAndDelete(videoId);
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Video Deleted Successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  console.log("Received videoId:", videoId); // 🔍 Debugging

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid ID format");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (req.user.id !== video.owner.toString()) {
    throw new ApiError(403, "You are not allowed to access this video");
  }

  video.isPublished = !video.isPublished;
  await video.save(); // ✅ Corrected save()

  return res.status(200).json(
    new ApiResponse(200, video, `Video ${video.isPublished ? "published" : "unpublished"} successfully`)
  );
});


export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
