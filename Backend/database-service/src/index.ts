import dotenv from "dotenv";
import server from "./server.js";
import { connectToDatabase } from "./services/mongodb.js";

dotenv.config();

const port = Number(process.env.PORT) || 3000;

async function startServer() {
  try {
    await connectToDatabase();

    server.listen(port, () => {
      console.log(`🚀 Server running on http://localhost:${port}`);
      console.log(`📊 Health check: http://localhost:${port}/health`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`🔌 MongoDB connection: ${process.env.MONGODB_URI}`);
      console.log(`🔌 Database name: ${process.env.DB_NAME}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
