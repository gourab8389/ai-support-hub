import { prisma } from '@/config/database';
import { hashPassword, comparePassword } from '@/utils/hash';
import { generateTokens } from '@/utils/jwt';
import { emailService } from './email.service';
import { nanoid } from 'nanoid';
import { addDays, addHours } from 'date-fns';
import { ApiError } from '@/utils/response';

export class AuthService {
  async register(email: string, password: string, name: string) {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    
    if (existingUser) {
      throw new ApiError('User already exists', 409);
    }

    const hashedPassword = await hashPassword(password);
    const verificationToken = nanoid(32);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        verificationToken,
      },
    });

    await emailService.sendVerificationEmail(email, verificationToken, name);

    return {
      message: 'Registration successful. Please check your email to verify your account.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.password) {
      throw new ApiError('Invalid credentials', 401);
    }

    const isValidPassword = await comparePassword(password, user.password);

    if (!isValidPassword) {
      throw new ApiError('Invalid password', 401);
    }

    if (!user.emailVerified) {
      throw new ApiError('Please verify your email before logging in', 403);
    }

    const tokens = generateTokens({
      userId: user.id,
      email: user.email,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
      ...tokens,
    };
  }

  async verifyEmail(token: string) {
    const user = await prisma.user.findFirst({
      where: { verificationToken: token },
    });

    if (!user) {
      throw new ApiError('Invalid or expired verification token', 400);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationToken: null,
      },
    });

    return { message: 'Email verified successfully' };
  }

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Don't reveal if user exists
      return { message: 'If an account exists, a password reset email has been sent.' };
    }

    const resetToken = nanoid(32);
    const resetTokenExpiry = addHours(new Date(), 1);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    await emailService.sendPasswordResetEmail(email, resetToken, user.name || 'User');

    return { message: 'If an account exists, a password reset email has been sent.' };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gte: new Date() },
      },
    });

    if (!user) {
      throw new ApiError('Invalid or expired reset token', 400);
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return { message: 'Password reset successfully' };
  }

  async googleAuth(googleId: string, email: string, name: string, avatar: string) {
    let user = await prisma.user.findUnique({ where: { googleId } });

    if (!user) {
      user = await prisma.user.findUnique({ where: { email } });

      if (user) {
        // Link Google account to existing user
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId, emailVerified: true },
        });
      } else {
        // Create new user
        user = await prisma.user.create({
          data: {
            googleId,
            email,
            name,
            avatar,
            emailVerified: true,
          },
        });
      }
    }

    const tokens = generateTokens({
      userId: user.id,
      email: user.email,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
      ...tokens,
    };
  }
}

export const authService = new AuthService();