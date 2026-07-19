import { prisma } from '../../config/prismaClient';
import { comparePassword, hashPassword } from '../../utils/password';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt';
import {
  AppError, UnauthorizedError, NotFoundError, ConflictError,
} from '../../utils/apiResponse';
import { logger } from '../../config/logger';
import type { LoginInput } from './auth.schema';
import type { User } from '@prisma/client';

export class AuthService {
  async login(
    dto: LoginInput,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ accessToken: string; refreshToken: string; user: Omit<User, 'password' | 'refreshToken'> }> {
    const user = await prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });

    if (!user) {
      await this.logAudit(null, 'LOGIN_FAILED', 'User', undefined, { email: dto.email, reason: 'user_not_found' }, ipAddress, userAgent);
      throw new UnauthorizedError('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account deactivated. Contact your administrator.');
    }

    // Role must match the selected role at login
    if (user.role !== dto.role) {
      await this.logAudit(user.id, 'LOGIN_FAILED', 'User', user.id, { reason: 'role_mismatch' }, ipAddress, userAgent);
      throw new UnauthorizedError('Invalid credentials');
    }

    const passwordMatch = await comparePassword(dto.password, user.password);
    if (!passwordMatch) {
      await this.logAudit(user.id, 'LOGIN_FAILED', 'User', user.id, { reason: 'wrong_password' }, ipAddress, userAgent);
      logger.warn({ userId: user.id, ip: ipAddress }, 'Failed login attempt');
      throw new UnauthorizedError('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email, role: user.role, name: user.name };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    // Store hashed refresh token in DB
    const hashedRefresh = await hashPassword(refreshToken);
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: hashedRefresh },
    });

    await this.logAudit(user.id, 'LOGIN_SUCCESS', 'User', user.id, { role: user.role }, ipAddress, userAgent);
    logger.info({ userId: user.id, role: user.role }, 'User logged in');

    const { password: _, refreshToken: __, ...safeUser } = user;
    return { accessToken, refreshToken, user: safeUser };
  }

  async refresh(incomingToken: string): Promise<{ accessToken: string }> {
    let payload: ReturnType<typeof verifyRefreshToken>;
    try {
      payload = verifyRefreshToken(incomingToken);
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.refreshToken) {
      throw new UnauthorizedError('Refresh token revoked');
    }

    const tokenMatch = await comparePassword(incomingToken, user.refreshToken);
    if (!tokenMatch) {
      // Possible token reuse attack — revoke all tokens
      await prisma.user.update({ where: { id: user.id }, data: { refreshToken: null } });
      throw new UnauthorizedError('Refresh token compromised — please login again');
    }

    const newPayload = { sub: user.id, email: user.email, role: user.role, name: user.name };
    const accessToken = signAccessToken(newPayload);
    return { accessToken };
  }

  async logout(userId: string): Promise<void> {
    await prisma.user.update({ where: { id: userId }, data: { refreshToken: null } });
    await this.logAudit(userId, 'LOGOUT', 'User', userId, {});
    logger.info({ userId }, 'User logged out');
  }

  async getMe(userId: string): Promise<Omit<User, 'password' | 'refreshToken'>> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, name: true, role: true,
        department: true, isActive: true, createdAt: true, updatedAt: true,
      },
    });
    if (!user) throw new NotFoundError('User');
    return user as Omit<User, 'password' | 'refreshToken'>;
  }

  private async logAudit(
    userId: string | null,
    action: string,
    entity: string,
    entityId?: string,
    metadata?: object,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await prisma.auditLog.create({
      data: { userId, action, entity, entityId, metadata, ipAddress, userAgent },
    });
  }
}

export const authService = new AuthService();
