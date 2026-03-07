import { prisma } from "@itsu/shared/src/lib/prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError, ApiSuccess } from "../utils/apiResponse";
import { logger } from "../utils/logger";

export const updateUserData = asyncHandler(async (req, res) => {
  const userData = req.body;

  logger.debug({ path: req.originalUrl }, "[Update User] Started");
  const updatedUser = await prisma.user.update({
    where: { id: req.user?.id.toString() },
    data: userData,
    select: {
      id: true,
      name: true,
      email: true,
      timezone: true,
    },
  });

  if (!updatedUser) {
    throw new ApiError(500, "INTERNAL_SERVER_ERROR", "Internal Server Error");
  }

  logger.debug({ path: req.originalUrl }, "[Update User] Completed");
  return res
    .status(200)
    .json(new ApiSuccess(updatedUser, "User data updated successfully"));
});

export const getUserStats = asyncHandler(async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    throw new ApiError(401, "UNAUTHORIZED", "User not found");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      totalSolWon: true,
    },
  });

  if (!user) {
    throw new ApiError(404, "USER_NOT_FOUND", "User not found");
  }

  const totalWins = await prisma.gamePlayer.count({
    where: {
      userId,
      winnings: { gt: 0 },
    },
  });

  return res
    .status(200)
    .json(
      new ApiSuccess(
        { totalWins, totalSolWon: user.totalSolWon.toString() },
        "User stats fetched successfully",
      ),
    );
});

export const reportIssue = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  const { description } = req.body;

  if (!userId) {
    throw new ApiError(401, "UNAUTHORIZED", "User not found");
  }

  if (!description || description.trim() === "") {
    throw new ApiError(400, "BAD_REQUEST", "Description is required");
  }

  const report = await prisma.report.create({
    data: {
      userId,
      description,
    },
  });

  return res
    .status(201)
    .json(new ApiSuccess(report, "Issue reported successfully"));
});
