import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { loginSchema, refreshSchema } from './auth.schema';
import rateLimit from 'express-rate-limit';
import { env } from '../../config/env';

export const authRouter = Router();

const authRateLimit = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.AUTH_RATE_LIMIT_MAX,
  message: { success: false, error: { message: 'Too many login attempts', code: 'RATE_LIMITED' } },
  skip: () => env.NODE_ENV === 'test',
});

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, role]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *               role: { type: string, enum: [fleet_manager, dispatcher, safety_officer, financial_analyst] }
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
authRouter.post('/login', authRateLimit, validate(loginSchema), (req, res, next) => authController.login(req, res, next));
authRouter.post('/refresh', validate(refreshSchema), (req, res, next) => authController.refresh(req, res, next));
authRouter.post('/logout', authenticate, (req, res, next) => authController.logout(req, res, next));
authRouter.get('/me', authenticate, (req, res, next) => authController.getMe(req, res, next));
