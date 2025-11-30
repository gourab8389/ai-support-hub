import { Context, Next } from 'hono';
import { verify } from 'jsonwebtoken';
import { config } from '@/config/env';
import { prisma } from '@/config/database';
import { ApiError } from '@/utils/response';

export interface AuthContext {
  user: {
    id: string;
    email: string;
    role?: string;
  };
}

export const authMiddleware = async (c: Context, next: Next) => {
  try {
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError('No token provided', 401);
    }

    const token = authHeader.substring(7);
    const decoded = verify(token, config.jwt.secret) as {
      userId: string;
      email: string;
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, emailVerified: true },
    });

    if (!user) {
      throw new ApiError('User not found', 404);
    }

    if (!user.emailVerified) {
      throw new ApiError('Email not verified', 403);
    }

    c.set('user', user);
    await next();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Invalid or expired token', 401);
  }
};

export const optionalAuth = async (c: Context, next: Next) => {
  try {
    const authHeader = c.req.header('Authorization');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verify(token, config.jwt.secret) as {
        userId: string;
        email: string;
      };

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true },
      });

      if (user) {
        c.set('user', user);
      }
    }
  } catch (error) {
    // Continue without auth
  }
  
  await next();
};

export const apiKeyAuth = async (c: Context, next: Next) => {
  try {
    const apiKey = c.req.header('X-API-Key');
    
    if (!apiKey) {
      throw new ApiError('API key required', 401);
    }

    const key = await prisma.apiKey.findUnique({
      where: { key: apiKey },
      include: {
        workspace: true,
        user: true,
      },
    });

    if (!key) {
      throw new ApiError('Invalid API key', 401);
    }

    // Update last used
    await prisma.apiKey.update({
      where: { id: key.id },
      data: { lastUsedAt: new Date() },
    });

    c.set('workspace', key.workspace);
    c.set('user', key.user);
    
    await next();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Invalid API key', 401);
  }
};