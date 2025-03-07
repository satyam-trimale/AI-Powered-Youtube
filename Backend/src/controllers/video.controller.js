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
import axios from "axios";
import { v2 as cloudinary } from 'cloudinary';


/**
 * Function to generate Cloudinary frame URLs
 * @param {string} videoUrl - Cloudinary video URL
 * @returns {array} - Array of frame URLs
 */
const generateFrameUrls = (videoUrl) => {
  const baseUrl = videoUrl.split("/upload/")[0]; // Extract base Cloudinary URL
  const publicId = videoUrl.split("/upload/")[1].split(".mp4")[0]; // Extract video ID (remove .mp4)

  return [
    `${baseUrl}/upload/so_10/${publicId}.jpg`, // Frame at 10s
    `${baseUrl}/upload/so_30/${publicId}.jpg`, // Frame at 30s
    `${baseUrl}/upload/so_60/${publicId}.jpg`, // Frame at 60s
  ];
};
// const generateThumbnailFrameUrl = (videoUrl) => {
//   const baseUrl = videoUrl.split("/upload/")[0]; // Extract base Cloudinary URL
//   const publicId = videoUrl.split("/upload/")[1].split(".mp4")[0]; // Extract video ID (remove .mp4)

//   return `${baseUrl}/image/upload/so_10/${publicId}.jpg`; // ✅ Return a single string
// };

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

  if ([title, description].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All Fields are required");
  }

  const videoLocalPath = req.files?.videoFile[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

  if (!videoLocalPath) {
    throw new ApiError(400, "Video is required");
  }

  // ✅ Upload Video
  const videoResponse = await uploadOnCloudinary(videoLocalPath);
  if (!videoResponse?.url) {
    throw new ApiError(400, "Error while uploading video");
  }

  // ✅ Generate Key Frames
  const frameUrls = generateFrameUrls(videoResponse.url);
  if (!frameUrls.length) console.error("❌ No frame URLs found!");

  // ✅ Generate AI Metadata
  let aiGeneratedTitle = title;
  let aiGeneratedDescription = description;

    try {
      const aiResponse = await axios.post(
        "http://localhost:8000/api/v1/videos/generate-metadata",
        { frameUrls },
        {
          params: { key: process.env.GEMINI_API_KEY },
          headers: { "Content-Type": "application/json" },
        }
      );

      aiGeneratedTitle = aiResponse.data.title || title;
      aiGeneratedDescription = aiResponse.data.description || description;
    } catch (error) {
      console.error("❌ AI Metadata Error:", error.response?.data || error.message);
    }

  // ✅ Handle Thumbnail
  let thumbnailUrl;

  if (!thumbnailLocalPath) {
    const ThumbnailFrameUrl = generateFrameUrls(videoResponse.url);
    if (!ThumbnailFrameUrl || ThumbnailFrameUrl.length === 0) {
      console.error("❌ No frame URL for thumbnail!");
    } else {
      console.log("✅ Using Thumbnail Source:", ThumbnailFrameUrl[0]);
    }
    
    try {
      let sourceImageUrl = ThumbnailFrameUrl[0]; // ✅ First frame as thumbnail
    
      // ✅ Upload frame to Cloudinary
      const thumbnailId = `video_thumbnail_${Date.now()}`;
      const uploadResult = await cloudinary.uploader.upload(sourceImageUrl, {
        public_id: thumbnailId,
      });
    
      console.log("✅ Uploaded Image:", uploadResult.secure_url);
    
      
      // ✅ Generate transformed URL
      thumbnailUrl = cloudinary.url(thumbnailId, {
        transformation: [
          { gravity: "auto", height: 720, width: 1280, crop: "fill" },
          { overlay: { font_family: "Arial", font_size: 70, text: aiGeneratedTitle.split(" ").slice(0, 3).join(" ") }, color: "white" }, // Get first three words of title
          { flags: "layer_apply", gravity: "center" }
        ],
      });
    
      console.log("✅ Transformed Thumbnail URL:", thumbnailUrl);
    } catch (error) {
      console.error("❌ Error generating thumbnail:", error.message);
    }
  } else {
    // ✅ Upload provided thumbnail
    const thumbnailResponse = await uploadOnCloudinary(thumbnailLocalPath);
    if (!thumbnailResponse?.url) {
      throw new ApiError(400, "Error while uploading thumbnail");
    }
    thumbnailUrl = thumbnailResponse.url;
  }

  // ✅ Save in DB
  const video = await Video.create({
    title: aiGeneratedTitle,
    description: aiGeneratedDescription,
    videoFile: videoResponse.url,
    thumbnail: thumbnailUrl,
    duration: videoResponse?.duration || 0,
    owner: req.user?._id,
  });

  return res.status(201).json(new ApiResponse(201, video, "Video Uploaded Successfully with AI Metadata"));
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

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        video,
        `Video ${video.isPublished ? "published" : "unpublished"} successfully`
      )
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
