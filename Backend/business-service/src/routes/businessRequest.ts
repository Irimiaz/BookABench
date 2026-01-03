import type { Request, Response } from "express";
import { sendSuccess, sendError } from "../utils/response.js";
import type { CustomRequest, HandlerFunctionResult } from "../types/request.js";
import { AppError } from "../utils/errors.js";
import { callAuthService } from "../services/authService.js";
import { callDatabaseService } from "../services/databaseService.js";

export async function handleBusinessRequest(req: Request, res: Response) {
  const body = req.body as CustomRequest;

  if (!body.api) {
    return sendError(res, "Missing 'api' field in request", 400);
  }

  if (!body.data) {
    return sendError(res, "Missing 'data' field in request", 400);
  }
  if (body.service !== "auth" && body.service !== "database") {
    return sendError(
      res,
      "Service field in request must be 'auth' or 'database'",
      400
    );
  }

  try {
    let result: HandlerFunctionResult<any>;

    switch (body.service) {
      case "auth":
        result = await callAuthService(body.api, body.data);
        break;
      case "database":
        result = await callDatabaseService(
          body.api as "SET_DATA" | "UPDATE_DATA" | "DELETE_DATA" | "GET_DATA",
          body.data.collection,
          body.data.params
        );
        break;
    }
    if (!result.success) {
      return sendError(res, result.message || "An error occurred", 500);
    }

    return sendSuccess(res, result.data, result.message || "Success");
  } catch (error) {
    if (error instanceof AppError) {
      return sendError(res, error.message, error.statusCode);
    }
    if (error instanceof Error) {
      return sendError(res, error.message, 500);
    }
    return sendError(res, "An unexpected error occurred", 500);
  }
}
