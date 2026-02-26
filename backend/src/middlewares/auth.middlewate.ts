import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/apiResponse";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { config } from "../config";
import type { User } from "../@types/express";

interface JwtUserPayload extends JwtPayload {
  id: string;
  name: string;
}

export const verifyJwt = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer "))
    return next(new ApiError(401, "INVALID_ACCESS_TOKEN", "UNAUTHORIZED"));

  const token = authHeader.split(" ")[1];
  if (!token)
    return next(new ApiError(401, "INVALID_ACCESS_TOKEN", "UNAUTHORIZED"));

  try {
    const decoded = jwt.verify(
      token,
      config.JWT_ACCESS_SECRET,
    ) as JwtUserPayload;

    if (!decoded.id)
      return next(
        new ApiError(401, "INVALID_ACCESS_TOKEN", "Invalid Access Token"),
      );

    req.user = { id: decoded.id, name: decoded.name };

    next();
  } catch {
    return next(
      new ApiError(401, "INVALID_ACCESS_TOKEN", "Invalid or Expired Token"),
    );
  }
};
