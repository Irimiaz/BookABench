import type { HandlerFunction } from "../types/request.d.js";

type TestData = {
  message?: string;
};

export const test: HandlerFunction = async (data: TestData) => {
  const { message } = data;

  return {
    success: true,
    data: `Test successful ${message || ""}`,
  };
};
