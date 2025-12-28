import dotenv from "dotenv";
import server from "./server.js";

dotenv.config();

const port = Number(process.env.PORT) || 3000;

async function startServer() {
  try {
    server.listen(port, () => {
      console.log(`🚀 Server running on http://localhost:${port}`);
      console.log(`📊 Health check: http://localhost:${port}/health`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`🔌 Database service: ${process.env.DATABASE_SERVICE_URL}`);
      console.log(`🔌 Auth service: ${process.env.AUTH_SERVICE_URL}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
