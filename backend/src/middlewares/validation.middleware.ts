import * as z from "zod";
import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/apiResponse";
import { logger } from "../utils/logger";

export const validateReqBody = (schema: z.ZodType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      logger.debug({ path: req.originalUrl, body: req.body }, `[Body Validation] Initiated`);

      const result = schema.safeParse(req.body);
      if (!result.success) {
        //Todo: remove the stringfy error from the interpolation
        return next(new ApiError(400,  `Invalid request body ${JSON.stringify(result.error.flatten())}`));
      }

      req.body = result.data;

      logger.debug(`[Body Validation] Completed`);
      next();
    } catch (error: any) {
      logger.debug("[Body Validation]")
      next(new ApiError(400, error.message));
    }
  };
};
