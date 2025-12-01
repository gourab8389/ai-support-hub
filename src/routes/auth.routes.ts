import { Hono } from 'hono';
import { authController } from '@/controllers/auth.controller';
import { validate } from '@/middlewares/validator';
import { authMiddleware } from '@/middlewares/auth';
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '@/schemas/auth.schema';

export const authRoutes = new Hono();

authRoutes.post('/register', validate(registerSchema), (c) => authController.register(c));
authRoutes.post('/login', validate(loginSchema), (c) => authController.login(c));
authRoutes.post('/verify-email', validate(verifyEmailSchema), (c) => authController.verifyEmail(c));
authRoutes.post('/forgot-password', validate(forgotPasswordSchema), (c) => authController.forgotPassword(c));
authRoutes.post('/reset-password', validate(resetPasswordSchema), (c) => authController.resetPassword(c));
authRoutes.get('/me', authMiddleware, (c) => authController.me(c));