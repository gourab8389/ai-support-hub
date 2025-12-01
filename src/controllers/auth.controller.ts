import { Context } from 'hono';
import { authService } from '@/services/auth.service';
import { successResponse } from '@/utils/response';

export class AuthController {
  async register(c: Context) {
    const { email, password, name } = c.get('validated');
    const result = await authService.register(email, password, name);
    return successResponse(c, result, 'Registration successful', 201);
  }

  async login(c: Context) {
    const { email, password } = c.get('validated');
    const result = await authService.login(email, password);
    return successResponse(c, result, 'Login successful');
  }

  async verifyEmail(c: Context) {
    const { token } = c.get('validated');
    const result = await authService.verifyEmail(token);
    return successResponse(c, result, 'Email verified successfully');
  }

  async forgotPassword(c: Context) {
    const { email } = c.get('validated');
    const result = await authService.forgotPassword(email);
    return successResponse(c, result);
  }

  async resetPassword(c: Context) {
    const { token, password } = c.get('validated');
    const result = await authService.resetPassword(token, password);
    return successResponse(c, result, 'Password reset successfully');
  }

  async me(c: Context) {
    const user = c.get('user');
    return successResponse(c, { user }, 'User retrieved successfully');
  }

  async refreshToken(c: Context) {
    const { refreshToken } = c.get('validated');
    // Implement refresh token logic
    return successResponse(c, {}, 'Token refreshed');
  }
}

export const authController = new AuthController();