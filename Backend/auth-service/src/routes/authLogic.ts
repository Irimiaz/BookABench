import type { Request, Response } from "express";
import { sendSuccess, sendError } from "../utils/response.js";
import type {
  CustomRequest,
  HandlerFunctionResult,
} from "../types/request.d.js";
import { test } from "../handlers/test.js";

export async function handleAuthRequest(req: Request, res: Response) {
  const body = req.body as CustomRequest<any>;

  if (!body.api) {
    return sendError(res, "Missing 'api' field in request", 400);
  }

  if (!body.data) {
    return sendError(res, "Missing 'data' field in request", 400);
  }

  let result: HandlerFunctionResult<any>;

  switch (body.api) {
    case "TEST":
      result = await test(body.data);
      break;

    default:
      return sendError(res, `Unknown auth request api: "${body.api}"`, 400);
  }

  if (!result.success) {
    return sendError(res, result.message || "An error occurred", 500);
  }

  return sendSuccess(res, result.data, result.message || "Success");
}
