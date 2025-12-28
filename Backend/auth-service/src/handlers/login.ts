import type { HandlerFunctionResult } from "../types/request.d.js";
import { getUserByEmail } from "../services/databaseService.js";
import { comparePassword } from "../utils/password.js";
import { ValidationError, UnauthorizedError } from "../utils/errors.js";

type LoginData = {
  email: string;
  password: string;
};

type LoginResponse = {
  user: {
    _id: string;
    name: string;
    email: string;
    universityYear: number;
    phone: string;
    universityName: string;
    role: "admin" | "normal";
  };
};

export const login = async (
  data: LoginData
): Promise<HandlerFunctionResult<LoginResponse>> => {
  const { email, password } = data;

  // Validation
  if (!email || !password) {
    throw new ValidationError("Email and password are required");
  }

  if (typeof email !== "string" || typeof password !== "string") {
    throw new ValidationError("Email and password must be strings");
  }

  // Find user
  const user = await getUserByEmail(email);
  if (!user) {
    throw new UnauthorizedError("Invalid email or password");
  }

  // Verify password
  const isPasswordValid = await comparePassword(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new UnauthorizedError("Invalid email or password");
  }

  return {
    success: true,
    data: {
      user: {
        _id: user._id!,
        name: user.name,
        email: user.email,
        universityYear: user.universityYear,
        phone: user.phone,
        universityName: user.universityName,
        role: user.role,
      },
    },
    message: "Login successful",
  };
};
