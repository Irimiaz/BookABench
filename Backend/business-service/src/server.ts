import express from "express";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { requestLogger } from "./middleware/logger.js";
import { asyncHandler } from "./middleware/asyncHandler.js";
import healthRouter from "./routes/health.js";
import { handleBusinessRequest } from "./routes/businessRequest.js";
import { createServer } from "http";
import { initializeSocketService } from "./services/socketService.js";

const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO
initializeSocketService(httpServer);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Routes
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Server is running",
    version: "1.0.0",
  });
});

app.use("/health", healthRouter);
app.post("/business", asyncHandler(handleBusinessRequest));
// Error handling
app.use(notFound);
app.use(errorHandler);

export default httpServer;
