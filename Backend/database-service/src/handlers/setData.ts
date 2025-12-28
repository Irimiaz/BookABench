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
    const update = params?.update || {};

    // If update exists, update existing document
    if (Object.keys(update).length > 0) {
      const existing = await collectionInstance.findOne(query);
      if (!existing) {
        throw new ValidationError("No matching record found to update");
      }
      const result = await collectionInstance.updateOne(query, update);
      return {
        success: true,
        data: result,
        message: "Document updated successfully",
      };
    } else {
      // Insert new document
      // Generate string _id if not provided
      const documentToInsert = { ...query };
      if (!documentToInsert._id) {
        documentToInsert._id = randomUUID();
      }

      const result = await collectionInstance.insertOne(documentToInsert);

      return {
        success: true,
        data: {
          insertedId:
            typeof documentToInsert._id === "string"
              ? documentToInsert._id
              : documentToInsert._id.toString(),
          document: documentToInsert,
        },
        message: "Document inserted successfully",
      };
    }
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
