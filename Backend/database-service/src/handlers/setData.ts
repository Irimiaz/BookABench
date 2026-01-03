import type {
  CustomRequestData,
  HandlerFunction,
  HandlerFunctionResult,
} from "../types/request.d.js";
import { BaseCollection } from "../types/BaseCollection.js";
import { ValidationError } from "../utils/errors.js";
import { randomUUID } from "crypto";

export const setData: HandlerFunction<CustomRequestData> = async (
  data
): Promise<HandlerFunctionResult> => {
  const { collection, params } = data;

  if (!collection || typeof collection !== "string") {
    throw new ValidationError("Collection name is required");
  }

  try {
    const collectionInstance = new BaseCollection(collection);
    const query = params?.query || {};

    // Insert new document
    // Generate string _id if not provided
    const documentToInsert = { ...query };
    if (!documentToInsert._id) {
      documentToInsert._id = randomUUID();
    }
    const existing = await collectionInstance.findOne({
      _id: documentToInsert._id,
    });
    if (existing) {
      throw new ValidationError(
        `Document with _id "${documentToInsert._id}" already exists`
      );
    }
    const result = await collectionInstance.insertOne(documentToInsert);

    return {
      success: true,
      data: {
        document: documentToInsert,
        documentId:
          typeof documentToInsert._id === "string"
            ? documentToInsert._id
            : documentToInsert._id.toString(),
      },
      message: "Document inserted successfully",
    };
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    if (error instanceof Error) {
      throw new ValidationError(`Failed to set data: ${error.message}`);
    }
    throw new ValidationError("Failed to set data");
  }
};
