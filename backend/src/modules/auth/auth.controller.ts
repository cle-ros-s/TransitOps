import type { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { sendSuccess, sendError } from '../../utils/apiResponse';
import { env } from '../../config/env';
import { REFRESH_TOKEN_COOKIE } from '../../config/constants';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export class AuthController {
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { accessToken, refreshToken, user } = await authService.login(
        req.body,
        req.ip,
        req.headers['user-agent'],
      );
      res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, COOKIE_OPTIONS);
      sendSuccess(res, { accessToken, user }, 200);
    } catch (err) {
      next(err);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.cookies[REFRESH_TOKEN_COOKIE] ?? req.body.refreshToken;
      if (!token) {
        sendError(res, 'Refresh token required', 401, 'UNAUTHORIZED');
        return;
      }
      const { accessToken } = await authService.refresh(token);
      sendSuccess(res, { accessToken });
    } catch (err) {
      next(err);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.user) await authService.logout(req.user.id);
      res.clearCookie(REFRESH_TOKEN_COOKIE);
      sendSuccess(res, { message: 'Logged out successfully' });
    } catch (err) {
      next(err);
    }
  }

  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await authService.getMe(req.user!.id);
      sendSuccess(res, user);
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();
