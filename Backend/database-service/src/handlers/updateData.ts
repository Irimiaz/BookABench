import type {
  CustomRequestData,
  HandlerFunction,
  HandlerFunctionResult,
} from "../types/request.d.js";
import { BaseCollection } from "../types/BaseCollection.js";
import { ValidationError, NotFoundError } from "../utils/errors.js";

export const updateData: HandlerFunction<CustomRequestData> = async (
  data
): Promise<HandlerFunctionResult> => {
  const { collection, params } = data;

  if (!collection || typeof collection !== "string") {
    throw new ValidationError("Collection name is required");
  }

  if (!params?.query || typeof params.query !== "object") {
    throw new ValidationError("Query is required and must be an object");
  }

  if (!params?.update || typeof params.update !== "object") {
    throw new ValidationError("Update is required and must be an object");
  }

  try {
    const collectionInstance = new BaseCollection(collection);
    const existing = await collectionInstance.findOne(params.query);

    if (!existing) {
      throw new NotFoundError("No matching record found to update");
    }

    const result = await collectionInstance.updateOne(
      params.query,
      params.update
    );

    // Fetch the updated document
    const updatedDocument = await collectionInstance.findOne(params.query);

    return {
      success: true,
      data: {
        document: updatedDocument,
        documentId: existing._id?.toString() || existing._id,
      },
      message: "Document updated successfully",
    };
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ValidationError) {
      throw error;
    }
    if (error instanceof Error) {
      throw new ValidationError(`Failed to update data: ${error.message}`);
    }
    throw new ValidationError("Failed to update data");
  }
};
