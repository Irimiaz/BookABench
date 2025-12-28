// Custom request structure: { api: "the handler", data: T }
export type CustomRequest<T = any> = {
  api: string; // The handler/endpoint name
  data: T; // The actual data
};

export type HandlerFunctionResult<T = any> = {
  success: boolean;
  data?: T;
  message?: string;
};

// Handler function type
export type HandlerFunction<T = any> = (
  data: T
) => Promise<HandlerFunctionResult<T>>;

// Success response structure
export type SuccessResponse<T = any> = {
  success: true;
  message?: string;
  data?: T;
};

// Error response structure
export type ErrorResponse = {
  success: false;
  message: string;
  stack?: string; // Only in development
};
