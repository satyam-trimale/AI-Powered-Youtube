import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  // TODO: toggle subscription
  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "invalid channel ID");
  }
  const userId = req.user?._id;

  const existingSubscription = await Subscription.findOne({
    subscriber: userId,
    channel: channelId,
  });
  if (existingSubscription) {
    await Subscription.deleteOne({ _id: existingSubscription._id });
    return res.status(200).json(new ApiResponse("Unsubscribed Successfully"));
  }
  const newSubscriber = new Subscription({
    subscriber: userId,
    channel: channelId,
  });
  await newSubscriber.save();

  return res
    .status(200)
    .json(new ApiResponse(200, newSubscriber, "Subscribed Successfully"));
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  // Add detailed logging
  // console.log("Received channelId:", channelId);
  // console.log("ObjectId validation:", {
  //     channelId,
  //     isValid: isValidObjectId(channelId),
  //     type: typeof channelId
  // });

  if (!channelId) {
    throw new ApiError(400, "Channel ID is required");
  }

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, `Invalid channel ID format: ${channelId}`);
  }

  // Check if channel exists in User collection first
  const channelExists = await User.findById(channelId);
  if (!channelExists) {
    throw new ApiError(404, "Channel not found");
  }

  const subscribers = await Subscription.aggregate([
    {
      $match: {
        channel: mongoose.Types.ObjectId.createFromHexString(channelId), // Updated constructor
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscriberDetails",
      },
    },
    {
      $unwind: "$subscriberDetails",
    },
    {
      $project: {
        _id: "$subscriberDetails._id",
        username: "$subscriberDetails.username",
        email: "$subscriberDetails.email",
        subscribedAt: "$createdAt",
      },
    },
  ]);

  if (!subscribers?.length) {
    return res
      .status(200)
      .json(new ApiResponse(200, [], "No subscribers found for this channel"));
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, subscribers, "Subscribers fetched successfully")
    );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;
  
  if (!subscriberId) {
    throw new ApiError(400, "subscriber ID is required");
  }

  if (!isValidObjectId(subscriberId)) {
    throw new ApiError(400, `Invalid subscriber ID format: ${subscriberId}`);
  }

  // Check if channel exists in User collection first
  const subscriberExists = await User.findById(subscriberId);
  if (!subscriberExists) {
    throw new ApiError(404, "subscriber not found");
  }
  const channels = await Subscription.aggregate([
    {
      $match: {
        subscriber: mongoose.Types.ObjectId.createFromHexString(subscriberId),
      },
    },
    {
        $lookup:{
            from: "users",
            localField: "channel",
            foreignField:"_id",
            as:"SubscribedTo"
        },
    },
    {
        $unwind: "$SubscribedTo"
    },
    {
        $project:{
        _id: "$SubscribedTo._id",
        username: "$SubscribedTo.username",
        email: "$SubscribedTo.email",
        subscribedAt: "$createdAt",
        }
    }
  ]);
  if (!channels?.length) {
    return res
      .status(200)
      .json(new ApiResponse(200, [], "No Channels found for this channel"));
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, channels, "Channels fetched successfully")
    );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
