import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const userId = req.user?._id;
  //TODO: create playlist
  if (!name) {
    throw new ApiError(400, "Playlist name is required");
  }
  const playlist = await Playlist.create({
    name,
    description,
    owner:userId,
  });
  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist created succeessfully"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  //TODO: get user playlists
  if (!userId) {
    throw new ApiError(400, "User Id is required");
  }
  const playlists = await Playlist.find({ owner: userId });
  if (playlists.length === 0) {
    throw new ApiError(404, "No playlist found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, playlists, "Playlists fetched successfully"));
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  //TODO: get playlist by id
  if (!playlistId) {
    throw new ApiError(400, "Playlist Id is required");
  }
  if (!mongoose.isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid Playlist ID format");
  }
  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist fetched successfully"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid playlist or video IDs");
  }
  const userId = req.user?._id;

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(404, "playlist not found");
  }
  if (playlist.owner.toString() !== userId.toString()) {
    throw new ApiError(
      403,
      "You are not allowed to add video in this playlist"
    );
  }
  if (playlist.videos.includes(videoId)) {
    throw new ApiError(400, "Video is already in the playlist");
  }
  playlist.videos.push(videoId);
  await playlist.save();

  return res
    .status(200)
    .json(
      new ApiResponse(200, playlist, "Video Added to playlist successfully")
    );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  // TODO: remove video from playlist
  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid playlist or video IDs");
  }
  const userId = req.user?._id;

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(404, "playlist not found");
  }
  if (playlist.owner.toString() !== userId.toString()) {
    throw new ApiError(
      403,
      "You are not allowed to delete video in this playlist"
    );
  }
  const videoIndex = playlist.videos.indexOf(videoId);

  if (videoIndex === -1) {
    throw new ApiError(404, "Video not found in playlist");
  }

  playlist.videos.splice(videoIndex, 1);
  await playlist.save();

  return res
    .status(200)
    .json(
      new ApiResponse(200, playlist, "Video Removed from playlist successfully")
    );
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  // TODO: delete playlist
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist ID");
  }
  const userId = req.user?._id;

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(404, "playlist not found");
  }
  if (playlist.owner.toString() !== userId.toString()) {
    throw new ApiError(403, "You are not allowed to delete this playlist");
  }
  await playlist.deleteOne();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Playlist deleted successfully"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  if (!name && !description) {
    throw new ApiError(400, "Playlist name or description is required");
  }
  const userId = req.user?._id;
  //TODO: update playlist
  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }
  if (!playlist.owner) {
    throw new ApiError(500, "Playlist owner is missing. Database issue detected.");
  }
  if (playlist.owner.toString() !== userId.toString()) {
    throw new ApiError(403, "You are not allowed to update playlist");
  }
  playlist.name = name;
  if (description) {
    playlist.description = description;
  }
  await playlist.save();

  return res
    .status(200)
    .json(
      new ApiResponse(200, playlist, "Playlist details updated successfully")
    );
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
