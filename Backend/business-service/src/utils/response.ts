import type { Response } from "express";
import type { SuccessResponse, ErrorResponse } from "../types/request.d.js";

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message: string = "Success",
  statusCode: number = 200
) => {
  const response: SuccessResponse<T> = {
    success: true,
    message,
    data,
  };
  res.status(statusCode).json(response);
};

export const sendError = (
  res: Response,
  message: string = "Error",
  statusCode: number = 500
) => {
  const response: ErrorResponse = {
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && {
      stack: new Error(message).stack,
    }),
  };
  res.status(statusCode).json(response);
};
