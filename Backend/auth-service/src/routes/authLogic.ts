import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";

const router = Router();

// Example 1: Simple POST route with typed body
router.post(
  "/login",
  asyncHandler(async (req, res) => {
    // Type the body inline - simple!
    const { email, password: _password } = req.body as {
      email: string;
      password: string;
    };

    // Your logic here
    const token = "abc123";

    sendSuccess(res, { token, email }, "Login successful");
  })
);

// Example 2: GET route with params
router.get(
  "/users/:id",
  asyncHandler(async (req, res) => {
    // Type the params inline
    const { id } = req.params as { id: string };

    // Your logic here
    const user = { id, name: "John", email: "john@example.com" };

    sendSuccess(res, user, "User found");
  })
);

// Example 3: POST with body and params
router.post(
  "/users/:id/update",
  asyncHandler(async (req, res) => {
    const { id } = req.params as { id: string };
    const { name, email } = req.body as { name: string; email: string };

    // Your logic here
    sendSuccess(res, { id, name, email }, "User updated");
  })
);

export default router;
