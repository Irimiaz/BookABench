import type { Db, Collection, Document } from "mongodb";
import { connectToDatabase } from "../services/mongodb.js";

export class BaseCollection {
  protected collectionName: string;
  protected db: Db | undefined;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  protected async getCollection(): Promise<Collection<Document>> {
    if (!this.db) {
      this.db = await connectToDatabase();
    }
    return this.db.collection(this.collectionName);
  }

  async find(query: any = {}) {
    try {
      const collection = await this.getCollection();
      return collection.find(query).toArray();
    } catch (error) {
      console.error(
        `Error in find operation for ${this.collectionName}:`,
        error
      );
      throw error;
    }
  }

  async findOne(query: any) {
    try {
      const collection = await this.getCollection();
      return collection.findOne(query);
    } catch (error) {
      console.error(
        `Error in findOne operation for ${this.collectionName}:`,
        error
      );
      throw error;
    }
  }

  async insertOne(document: any) {
    try {
      const collection = await this.getCollection();
      return collection.insertOne(document);
    } catch (error) {
      console.error(
        `Error in insertOne operation for ${this.collectionName}:`,
        error
      );
      throw error;
    }
  }

  async updateOne(query: any, update: any) {
    try {
      const collection = await this.getCollection();
      return collection.updateOne(query, { $set: update });
    } catch (error) {
      console.error(
        `Error in updateOne operation for ${this.collectionName}:`,
        error
      );
      throw error;
    }
  }

  async deleteOne(query: any) {
    try {
      const collection = await this.getCollection();
      return collection.deleteOne(query);
    } catch (error) {
      console.error(
        `Error in deleteOne operation for ${this.collectionName}:`,
        error
      );
      throw error;
    }
  }

  async count(query: any = {}) {
    try {
      const collection = await this.getCollection();
      return collection.countDocuments(query);
    } catch (error) {
      console.error(
        `Error in count operation for ${this.collectionName}:`,
        error
      );
      throw error;
    }
  }
}
