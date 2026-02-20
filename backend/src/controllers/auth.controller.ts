import nacl from "tweetnacl";
import bs58 from "bs58";
import jwt from "jsonwebtoken";
import { randomUUIDv7 } from "bun";
import { config } from "../config";
import { ApiError, ApiSuccess } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { prisma } from "@itsu/shared/src/lib/prisma";
import { logger } from "../utils/logger";

const generateAccessAndRefreshToken = (id: string, name: string) => {
  const accessToken = jwt.sign({ id, name }, config.JWT_ACCESS_SECRET, {
    expiresIn: "1d",
  });
  const refreshToken = jwt.sign({ id }, config.JWT_REFRESH_SECRET, {
    expiresIn: "20d",
  });

  return { refreshToken, accessToken };
};

export const getUserNonce = asyncHandler(async (req, res) => {
  const { walletAddress } = req.params;
  if (!walletAddress) {
    throw new ApiError(400, "BAD_REQUEST");
  }

  const existingUser = await prisma.user.findUnique({
    where: { walletAddress: walletAddress.toString() },
    select: { nonce: true },
  });

  if (existingUser) {
    return res
      .status(200)
      .json(new ApiSuccess(existingUser, "Nonce fetched successfully"));
  }

  const newUser = await prisma.user.create({
    data: { walletAddress: walletAddress.toString() },
    select: { nonce: true },
  });

  return res
    .status(201)
    .json(new ApiSuccess(newUser, "Account created successfully"));
});

export const login = asyncHandler(async (req, res) => {
  const { walletAddress, signature, timezone } = req.body;

  if (!walletAddress || !signature) {
    throw new ApiError(400, "Wallet address and signature are required");
  }

  const user = await prisma.user.findUnique({
    where: { walletAddress },
    select: { id: true, name: true, nonce: true },
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  try {
    // 1. Reconstruct the exact message the app was supposed to sign
    const expectedMessage = `Sign in into ItsU. Nonce: ${user.nonce}`;
    const messageBytes = new TextEncoder().encode(expectedMessage);

    // 2. Decode the Base58 wallet address into a public key byte array
    const publicKeyBytes = bs58.decode(walletAddress);
    const signatureBytes = bs58.decode(signature);

    // 3. Decode the signature (assuming frontend sends it as a Base58 string)
    const isValid = nacl.sign.detached.verify(
      messageBytes,
      signatureBytes,
      publicKeyBytes,
    );

    if (!isValid) {
      logger.warn({ walletAddress }, "Invalid login signature attempt");
      throw new ApiError(401, "Invalid cryptographic signature");
    }
  } catch (error: any) {
    throw new ApiError(401, "Signature verification failed");
  }

  const { accessToken, refreshToken } = generateAccessAndRefreshToken(
    user.id,
    user.name || "",
  );

  await prisma.user.update({
    where: { id: user.id },
    data: {
      refreshToken,
      timezone,
      nonce: randomUUIDv7(), // Rotating the nonce to prevent replay attacks
    },
  });

  logger.info({ userId: user.id }, "User logged in");

  return res
    .status(201)
    .cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      maxAge: 20 * 24 * 60 * 60 * 1000,
    })
    .json(
      new ApiSuccess(
        { accessToken, refreshToken },
        "User logged in successfully",
      ),
    );
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new ApiError(400, "Refresh token is required");
  }

  let decodedRefreshToken: {
    id: string;
    iat: number;
    exp: number;
  };

  try {
    decodedRefreshToken = jwt.verify(
      refreshToken,
      config.JWT_REFRESH_SECRET,
    ) as {
      id: string;
      iat: number;
      exp: number;
    };
  } catch (error: any) {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  if (!decodedRefreshToken?.id) {
    throw new ApiError(400, "Invalid refresh token payload");
  }

  const user = await prisma.user.findUnique({
    where: { id: decodedRefreshToken.id },
    select: { id: true, name: true, refreshToken: true },
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  if (user.refreshToken !== refreshToken) {
    logger.warn({ userId: user.id }, "Refresh token reuse/mismatch detected");
    throw new ApiError(401, "Refresh token mismatch");
  }

  const { accessToken, refreshToken: newRefreshToken } =
    generateAccessAndRefreshToken(user.id, user.name || "");

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: newRefreshToken },
  });

  logger.info({ userId: user.id }, "Token refreshed successfully");

  return res
    .status(200)
    .json(
      new ApiSuccess(
        { accessToken, refreshToken: newRefreshToken },
        "Token refreshed successfully",
      ),
    );
});
