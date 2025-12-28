import type { HandlerFunctionResult } from "../types/request.d.js";
import { createUser, getUserByEmail } from "../services/databaseService.js";
import { hashPassword } from "../utils/password.js";
import { ValidationError, ConflictError } from "../utils/errors.js";
import dotenv from "dotenv";

dotenv.config();

type RegisterData = {
  name: string;
  email: string;
  password: string;
  universityYear: number;
  phone: string;
  universityName: string;
  teacherID?: string;
};

type RegisterResponse = {
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

export const register = async (
  data: RegisterData
): Promise<HandlerFunctionResult<RegisterResponse>> => {
  const {
    name,
    email,
    password,
    universityYear,
    phone,
    universityName,
    teacherID,
  } = data;

  // Validation
  if (
    !name ||
    !email ||
    !password ||
    !universityYear ||
    !phone ||
    !universityName
  ) {
    throw new ValidationError("All fields are required");
  }

  if (typeof name !== "string" || name.trim().length === 0) {
    throw new ValidationError("Name must be a non-empty string");
  }

  if (typeof email !== "string") {
    throw new ValidationError("Email must be a string");
  }

  // Email format validation
  const emailRegex = /^[\w.%+-]+@[\w.-]+\.[a-z]{2,}$/i;
  if (!emailRegex.test(email)) {
    throw new ValidationError("Invalid email format");
  }

  // Password strength validation
  if (password.length < 6) {
    throw new ValidationError("Password must be at least 6 characters long");
  }

  // University year validation
  if (
    typeof universityYear !== "number" ||
    universityYear < 1 ||
    universityYear > 10
  ) {
    throw new ValidationError(
      "University year must be a number between 1 and 10"
    );
  }

  // Phone validation
  if (typeof phone !== "string" || phone.trim().length === 0) {
    throw new ValidationError("Phone must be a non-empty string");
  }

  // University name validation
  if (
    typeof universityName !== "string" ||
    universityName.trim().length === 0
  ) {
    throw new ValidationError("University name must be a non-empty string");
  }

  // Check if user already exists
  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    throw new ConflictError("User with this email already exists");
  }

  // Determine role based on teacherID
  let role: "admin" | "normal" = "normal";
  if (teacherID !== undefined && teacherID === process.env.ADMINID) {
    role = "admin";
  } else if (teacherID !== undefined && teacherID !== process.env.ADMINID) {
    throw new ValidationError("Teacher ID is wrong");
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user
  const user = await createUser({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    passwordHash,
    universityYear,
    phone: phone.trim(),
    universityName: universityName.trim(),
    role,
  });

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
    message: "User registered successfully",
  };
};
