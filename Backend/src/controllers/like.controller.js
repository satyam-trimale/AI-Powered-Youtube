import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: toggle like on video
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "invalid video ID");
  }
  const userId = req.user?._id;

  // const liked = await Like.findOne({
  //     video : videoId,
  //     likedBy : userId,

  // })

  // if(liked){
  //     await Like.deleteOne({_id: liked._id})
  //     return res.status(200).json(new ApiResponse("Video Unliked Successfully"));

  // }
  //or
  // Check if the like already exists
  const existingLike = await Like.findOneAndDelete({
    video: videoId,
    likedBy: userId,
  });
  if (existingLike) {
    return res
      .status(200)
      .json(new ApiResponse(200, null, "Video Unliked Successfully"));
  }
  // const like = new Like({
  //     video : videoId,
  //     likedBy : userId,
  // })
  // await like.save()
  //or
  // If like doesn't exist, add a new one
  const newLike = await Like.create({ video: videoId, likedBy: userId });
  return res
    .status(200)
    .json(new ApiResponse(200, newLike, "Video Liked Successfully"));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid Comment ID");
  }
  const userId = req.user?._id;
  //TODO: toggle like on comment
  const existingLike = await Like.findOneAndDelete({
    comment: commentId,
    likedBy: userId,
  });
  if (existingLike) {
    return res
      .status(200)
      .json(new ApiResponse(200, null, "Comment Unliked Successfully"));
  }
  const newLike = await Like.create({ comment: commentId, likedBy: userId });
  return res
    .status(200)
    .json(new ApiResponse(200, newLike, "Comment liked Successfully"));
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid Tweet ID");
  }
  const userId = req.user?._id;

  //TODO: toggle like on tweet
  const existingLike = await Like.findOneAndDelete({
    tweet: tweetId,
    likedBy: userId,
  });
  if (existingLike) {
    return res
      .status(200)
      .json(new ApiResponse(200, null, "Tweet Unliked Successfully"));
  }
  const newLike = await Like.create({ tweet: tweetId, likedBy: userId });
  return res
    .status(200)
    .json(new ApiResponse(200, newLike, "Tweet liked Successfully"));
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos
  const userId = req.user?._id;
  const likedVideos = await Like.aggregate([
    {
        $match: { likedBy: userId }

    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "LikedVideosList",
      },
    },
    {
      $unwind: "$LikedVideosList",
    },
    {
      $project: {
        _id: "$LikedVideosList._id",
        videoFile: "$LikedVideosList.videoFile",
        thumbnail: "$LikedVideosList.thumbnail",
        title: "$LikedVideosList.title",
      },
    },
  ]);
  if (!likedVideos?.length) {
    return res
      .status(200)
      .json(new ApiResponse(200, [], "No liked videos found"));
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, likedVideos, "Liked Videos fetched successfully")
    );
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
