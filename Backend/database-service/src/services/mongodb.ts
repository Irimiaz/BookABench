import { MongoClient, ServerApiVersion, Db } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error("MONGODB_URI is not defined in environment variables");
}

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  connectTimeoutMS: 30000,
  socketTimeoutMS: 45000,
});

let dbConnection: Db | null = null;
let collectionsCache: string[] | null = null;

/**
 * Connects the MongoClient and returns the Db instance.
 * Caches the Db in `dbConnection` so subsequent calls are fast.
 */
export async function connectToDatabase(): Promise<Db> {
  if (dbConnection) return dbConnection;
  await client.connect();
  dbConnection = client.db(process.env.DB_NAME); // or use process.env.DB_NAME
  console.log("✅  Successfully connected to MongoDB");
  return dbConnection;
}

/**
 * Returns the already‐connected Db instance.
 * Throws if called before `connectToDatabase()`.
 */
export function getDb(): Db {
  if (!dbConnection) {
    throw new Error("Database not connected yet");
  }
  return dbConnection;
}

/**
 * Returns a list of collection names in the database.
 * Caches results so subsequent calls don't re‐list.
 */
export async function getAvailableCollections(): Promise<string[]> {
  if (collectionsCache) return collectionsCache;
  const db = await connectToDatabase();
  const cols = await db.listCollections().toArray();
  collectionsCache = cols.map((c) => c.name);
  console.log("Collections:", collectionsCache);
  return collectionsCache;
}

/**
 * Clears the cached collection list so the next
 * `getAvailableCollections()` will re‐query Mongo.
 */
export function clearCollectionsCache(): void {
  collectionsCache = null;
}
