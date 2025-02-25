import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  if (!videoId) {
    throw new ApiError(400, "Video ID is required");
  }
  const { page = 1, limit = 10 } = req.query;

  const pageNumber = parseInt(page, 10);
  const pageLimit = parseInt(limit, 10);

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  const comments = await Comment.find({ video: videoId })
    .sort({ createdAt: -1 })
    .skip((pageNumber - 1) * pageLimit)
    .limit(pageLimit);

  const totalComments = await Comment.countDocuments({ video: videoId });
  const totalPages = Math.ceil(totalComments / pageLimit);

  return res.status(200).json(
    new ApiResponse(200, {
      comments,
      pagination: {
        page: pageNumber,
        limit: pageLimit,
        totalPages,
        totalComments,
      },
    },
    "Comments Retrieved Successful"
  )
  );
});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  const { content } = req.body;
  const { videoId } = req.params;
  const userId = req.user?._id;
  if (!content || content.trim().length === 0) {
    throw new ApiError(400, "Comment is required");
  }
  if (!videoId || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video ID");
  }
  const video = await Video.findById(videoId);
  if (!videoId) {
    throw new ApiError(404, "Video Not Found");
  }
  if (!userId) {
    throw new ApiError(401, "User not authenticated");
  }
  const comment = await Comment.create({
    content,
    video: videoId,
    owner: userId,
  });
  await comment.save();
  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment added successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  const { commentId } = req.params;
  const { content } = req.body;
  const userId = req.user?._id;

  if (!content || content.trim().length === 0) {
    throw new ApiError(400, "Comment is required");
  }
  if (!commentId || !isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid Comment Id");
  }
  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }
  if (
    !userId ||
    !comment.owner ||
    comment.owner.toString() !== userId.toString()
  ) {
    throw new ApiError(403, "You are not allowed to update this comment");
  }
  comment.content = content;

  await comment.save();

  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment Updated Successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment
  const { commentId } = req.params;
  const userId = req.user?._id;
  if (!commentId) {
    throw new ApiError(400, "Comment Id is required");
  }
  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }
  if (
    !userId ||
    !comment.owner ||
    comment.owner.toString() !== userId.toString()
  ) {
    throw new ApiError(403, "You are not allowed to delete this comment");
  }
  await comment.deleteOne();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Comment deleted successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
