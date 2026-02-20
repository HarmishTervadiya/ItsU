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
    throw new ApiError(500, "Internal Server Error");
  }

  logger.debug({ path: req.originalUrl }, "[Update User] Completed");
  return res
    .status(200)
    .json(new ApiSuccess(updatedUser, "User data updated successfully"));
});
