import express from "express";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { requestLogger } from "./middleware/logger.js";
import { asyncHandler } from "./middleware/asyncHandler.js";
import healthRouter from "./routes/health.js";
import { handleDatabaseRequest } from "./routes/databaseLogic.js";

const app = express();

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
app.post("/database", asyncHandler(handleDatabaseRequest));
// Error handling
app.use(notFound);
app.use(errorHandler);

export default app;
