import nacl from "tweetnacl";
import bs58 from "bs58"; // Crucial for decoding Solana Base58 strings
import jwt from "jsonwebtoken";
import { randomUUIDv7 } from "bun";
import { config } from "../config";
import { ApiError, ApiSuccess } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { prisma } from "@itsu/shared/src/lib/prisma";

const generateAccessAndRefreshToken = (id: string, name: string) => {
  const accessToken = jwt.sign({ id, name }, config.JWT_SECRET, {
    expiresIn: "15m",
  });
  const refreshToken = jwt.sign({ id }, config.JWT_SECRET, {
    expiresIn: "20d",
  });

  return { refreshToken, accessToken };
};

export const getUserNonce = asyncHandler(async (req, res, next) => {
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

  console.log(walletAddress);
  const newUser = await prisma.user.create({
    data: { walletAddress: walletAddress.toString() },
    select: { nonce: true },
  });

  return res
    .status(201)
    .json(new ApiSuccess(newUser, "Account created successfully"));
});

export const login = asyncHandler(async (req, res, next) => {
  const { walletAddress, signature } = req.body;

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

    // 3. Decode the signature (assuming frontend sends it as a Base58 string)
    const signatureBytes = bs58.decode(signature);

    // 4. Run the math
    const isValid = nacl.sign.detached.verify(
      messageBytes,
      signatureBytes,
      publicKeyBytes,
    );

    if (!isValid) {
      throw new ApiError(401, "Invalid cryptographic signature");
    }
  } catch (error) {
    console.log("Error while verifying the signature", error);
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
      nonce: randomUUIDv7(), // Rotating the nonce to prevent replay attacks
    },
  });

  return res
    .status(201)
    .json(new ApiSuccess({accessToken}, "User logged in successfully"));
});
