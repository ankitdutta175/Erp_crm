import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('🔥 Global Error Handler:', err);

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  if (err.status || err.statusCode) {
    res.status(err.status || err.statusCode).json({
      success: false,
      message: err.message || 'An error occurred',
    });
    return;
  }

  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
};
