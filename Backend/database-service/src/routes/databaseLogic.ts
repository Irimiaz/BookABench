import type { Request, Response } from "express";
import { sendSuccess, sendError } from "../utils/response.js";
import type {
  CustomRequest,
  HandlerFunctionResult,
} from "../types/request.d.js";
import { deleteData } from "../handlers/deleteData.js";
import { getData } from "../handlers/getData.js";
import { setData } from "../handlers/setData.js";
import { updateData } from "../handlers/updateData.js";
import { AppError } from "../utils/errors.js";

export async function handleDatabaseRequest(req: Request, res: Response) {
  const body = req.body as CustomRequest;

  if (!body.api) {
    return sendError(res, "Missing 'api' field in request", 400);
  }

  if (!body.data) {
    return sendError(res, "Missing 'data' field in request", 400);
  }
  if (!body.data.collection) {
    return sendError(res, "Missing 'collection' field in request", 400);
  }

  try {
    let result: HandlerFunctionResult<any>;

    switch (body.api) {
      case "GET_DATA":
        result = await getData(body.data);
        break;
      case "SET_DATA":
        result = await setData(body.data);
        break;
      case "UPDATE_DATA":
        result = await updateData(body.data);
        break;
      case "DELETE_DATA":
        result = await deleteData(body.data);
        break;

      default:
        return sendError(
          res,
          `Unknown database request api: "${body.api}"`,
          400
        );
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
