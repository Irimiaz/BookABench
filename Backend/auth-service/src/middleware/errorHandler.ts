import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/errors.js";

export function notFound(req: Request, res: Response, next: NextFunction) {
  const error = new AppError(
    `Not Found - ${req.method} ${req.originalUrl}`,
    404
  );
  next(error);
}

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  let statusCode = 500;
  let message = "Internal Server Error";

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err instanceof Error) {
    message = err.message;
  }

  const isDevelopment = process.env.NODE_ENV === "development";

  const errorResponse: {
    success: boolean;
    message: string;
    stack?: string;
  } = {
    success: false,
    message,
    ...(isDevelopment && { stack: err.stack }),
  };

  if (isDevelopment) {
    console.error("Error:", {
      message: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
    });
  }

  res.status(statusCode).json(errorResponse);
}
