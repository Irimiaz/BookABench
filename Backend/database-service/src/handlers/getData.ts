import type {
  CustomRequestData,
  HandlerFunction,
  HandlerFunctionResult,
} from "../types/request.d.js";
import { BaseCollection } from "../types/BaseCollection.js";
import { ValidationError } from "../utils/errors.js";

export const getData: HandlerFunction<CustomRequestData> = async (
  data
): Promise<HandlerFunctionResult> => {
  const { collection, params } = data;

  if (!collection || typeof collection !== "string") {
    throw new ValidationError("Collection name is required");
  }

  try {
    const collectionInstance = new BaseCollection(collection);
    const query = params?.query || {};
    const result = await collectionInstance.find(query);

    return {
      success: true,
      data: result,
      message: `Retrieved ${result.length} document(s) from ${collection}`,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new ValidationError(`Failed to get data: ${error.message}`);
    }
    throw new ValidationError("Failed to get data");
  }
};
