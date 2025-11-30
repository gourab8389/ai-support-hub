import { Context } from 'hono';
import { ApiError, errorResponse } from '@/utils/response';
import { logger } from '@/utils/logger';

export const errorHandler = (err: Error, c: Context) => {
  logger.error('Error:', err);

  if (err instanceof ApiError) {
    return errorResponse(c, err.message, err.statusCode, err.errors);
  }

  // Handle Prisma errors
  if (err.constructor.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as any;
    
    if (prismaError.code === 'P2002') {
      return errorResponse(c, 'A record with this data already exists', 409);
    }
    
    if (prismaError.code === 'P2025') {
      return errorResponse(c, 'Record not found', 404);
    }
  }

  // Default error
  return errorResponse(
    c,
    'Internal server error',
    500,
    process.env.NODE_ENV === 'development' ? [{ message: err.message }] : undefined
  );
};