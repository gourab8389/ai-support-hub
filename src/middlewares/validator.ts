import { Context, Next } from 'hono';
import { ZodSchema, ZodError } from 'zod';
import { ApiError } from '@/utils/response';

export const validate = (schema: ZodSchema, source: 'body' | 'query' | 'param' = 'body') => {
  return async (c: Context, next: Next) => {
    try {
      let data;
      
      switch (source) {
        case 'body':
          data = await c.req.json();
          break;
        case 'query':
          data = c.req.query();
          break;
        case 'param':
          data = c.req.param();
          break;
      }

      const validated = schema.parse(data);
      c.set('validated', validated);
      
      await next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        
        throw new ApiError('Validation failed', 400, messages);
      }
      throw error;
    }
  };
};