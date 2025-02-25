import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
  const channelId = req.user?.channelId || req.user?._id; // Use `channelId` if available, fallback to `_id`

  if (!channelId || !mongoose.Types.ObjectId.isValid(channelId)) {
    throw new ApiError(400, "Invalid or missing channel ID");
  }

  // Fetch total videos uploaded by this channel
  const totalVideos = await Video.countDocuments({ owner: channelId });

  // Fetch total video views using aggregation
  const totalViewsAgg = await Video.aggregate([
    { $match: { owner: channelId } },
    { $group: { _id: null, totalViews: { $sum: "$views" } } },
  ]);
  const totalViews = totalViewsAgg.length > 0 ? totalViewsAgg[0].totalViews : 0;

  // Fetch total subscribers
  const totalSubscribers = await Subscription.countDocuments({
    channel: channelId,
  });

  // Fetch total likes (Optimized using `distinct("_id")`)
  const videoIds = await Video.find({ owner: channelId }).distinct("_id");
  const totalLikes = await Like.countDocuments({ video: { $in: videoIds } });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { totalSubscribers, totalLikes, totalVideos, totalViews },
        "Channel stats retrieved successfully!"
      )
    );
});

const getChannelVideos = asyncHandler(async (req, res) => {
        // TODO: Get all the videos uploaded by the channel

    // Extract the channel ID from the authenticated user
    const channelId = req.user?.channelId || req.user?._id; 
  
    if (!channelId) {
      throw new ApiError(400, "User does not have a channel ID");
    }
  
    // Pagination parameters
    const page = parseInt(req.query.page) || 1;  // Default to page 1
    const limit = parseInt(req.query.limit) || 10; // Default to 10 videos per page
    const skip = (page - 1) * limit;
  
    // Fetch videos with selected fields and pagination
    const videos = await Video.find({ owner: channelId })
      .select("videoFile title views thumbnail createdAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
  
    if (videos.length === 0) {
      return res.status(200).json(new ApiResponse(200, [], "No videos found for this channel"));
    }
  
    return res
      .status(200)
      .json(new ApiResponse(200, videos, "Videos fetched successfully"));
  });
  

export { getChannelStats, getChannelVideos };
