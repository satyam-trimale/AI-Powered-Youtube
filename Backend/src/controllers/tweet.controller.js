import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  //TODO: create tweet
  const { content } = req.body;
  const userId = req.user?._id;
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  if (!content || content.trim().length === 0) {
    throw new ApiError(400, "Tweet content is required");
  }

  const tweet = await Tweet.create({
    content,
    owner: userId,
  });
  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet created successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  // TODO: get user tweets
  const { userId } = req.params;
  if (!userId) {
    throw new ApiError(401, "User not authenticated");
  }
  const tweets = await Tweet.find({
    owner: userId,
  });
  return res
    .status(200)
    .json(new ApiResponse(200, tweets, "Tweets fetched Successfully"));
});

const updateTweet = asyncHandler(async (req, res) => {
  //TODO: update tweet
  const { tweetId } = req.params;

  if (!tweetId) {
    throw new ApiError(400, "Tweet ID is required");
  }
  const { content } = req.body;
  if (!content || content.trim().length === 0) {
    throw new ApiError(400, "All fields are required");
  }
  const tweet = await Tweet.findById(tweetId)
  if(!tweet){
    throw new ApiError(404,"Tweet not found")
  }
  if(tweet.owner.toString() !== req.user._id.toString()){
    throw new ApiError(403,"You are not allowed to update this tweet")
  }
  tweet.content = content
  await tweet.save()
  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet Updated successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  //TODO: delete tweet
  const { tweetId } = req.params
  if(!tweetId){
    throw new ApiError(400,"Tweet id required")
  }
  const tweet = await Tweet.findById(tweetId)
  if(!tweet){
    throw new ApiError(404,"Tweet not found")
  }
  if(!tweet.owner || tweet.owner.toString() !== req.user._id.toString()){
    throw new ApiError(403,"You are not allowed to delete this tweet")
  }
  await tweet.deleteOne(); // More efficient than findByIdAndDelete
  return res
  .status(200)
  .json(new ApiResponse(200,{},"Tweet deleted successfully"))
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
