import express from "express";
import * as errorHandler from "./error-handler.js";

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Server is running" });
});

app.use(errorHandler.notFound);
app.use(errorHandler.errorHandler);

export default app;
