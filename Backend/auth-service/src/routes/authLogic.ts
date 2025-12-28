import type { Request, Response } from "express";
import { sendSuccess, sendError } from "../utils/response.js";
import type {
  CustomRequest,
  HandlerFunctionResult,
} from "../types/request.d.js";
import { AppError } from "../utils/errors.js";
import { register } from "../handlers/register.js";
import { login } from "../handlers/login.js";

export async function handleAuthRequest(req: Request, res: Response) {
  const body = req.body as CustomRequest<any>;

  if (!body.api) {
    return sendError(res, "Missing 'api' field in request", 400);
  }

  if (!body.data) {
    return sendError(res, "Missing 'data' field in request", 400);
  }

  try {
    let result: HandlerFunctionResult<any>;

    switch (body.api) {
      case "LOGIN":
        result = await login(body.data);
        break;
      case "REGISTER":
        result = await register(body.data);
        break;
      default:
        return sendError(res, `Unknown auth request api: "${body.api}"`, 400);
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
