import { Context } from 'hono';

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public errors?: any[]
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const successResponse = (
  c: Context,
  data: any,
  message = 'Success',
  statusCode = 200
) => {
  return c.json(
    {
      success: true,
      message,
      data,
    },
    statusCode as any
  );
};

export const errorResponse = (
  c: Context,
  message: string,
  statusCode = 500,
  errors?: any[]
) => {
  return c.json(
    {
      success: false,
      message,
      errors,
    },
    statusCode as any
  );
};