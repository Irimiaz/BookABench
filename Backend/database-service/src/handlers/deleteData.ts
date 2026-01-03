import type {
  CustomRequestData,
  HandlerFunction,
  HandlerFunctionResult,
} from "../types/request.d.js";
import { BaseCollection } from "../types/BaseCollection.js";
import { ValidationError, NotFoundError } from "../utils/errors.js";

export const deleteData: HandlerFunction<CustomRequestData> = async (
  data
): Promise<HandlerFunctionResult> => {
  const { collection, params } = data;

  if (!collection || typeof collection !== "string") {
    throw new ValidationError("Collection name is required");
  }

  if (!params?.query || typeof params.query !== "object") {
    throw new ValidationError("Query is required and must be an object");
  }

  try {
    const collectionInstance = new BaseCollection(collection);

    // Fetch the document before deleting it
    const documentToDelete = await collectionInstance.findOne(params.query);

    if (!documentToDelete) {
      throw new NotFoundError("No matching record found to delete");
    }

    const result = await collectionInstance.deleteOne(params.query);

    if (result.deletedCount === 0) {
      throw new NotFoundError("No matching record found to delete");
    }

    return {
      success: true,
      data: {
        document: documentToDelete,
        documentId: documentToDelete._id?.toString() || documentToDelete._id,
      },
      message: `Deleted ${result.deletedCount} document(s) successfully`,
    };
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ValidationError) {
      throw error;
    }
    if (error instanceof Error) {
      throw new ValidationError(`Failed to delete data: ${error.message}`);
    }
    throw new ValidationError("Failed to delete data");
  }
};
