import type { NextFunction, Request, Response } from "express";

// Wrapper for async route handlers - automatically catches errors
// Usage: router.get("/", asyncHandler(async (req, res) => { ... }))
export const asyncHandler = (
  fn: (req: Request, res: Response) => Promise<any> | any
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res)).catch(next);
  };
};
