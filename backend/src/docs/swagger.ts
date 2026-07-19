import type { Application } from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { env } from '../config/env';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.1.0',
    info: {
      title: 'TransitOps API',
      version: '1.0.0',
      description:
        'Enterprise Transport Operations Platform — production-grade REST API built with Node.js, Express, Prisma, and PostgreSQL.',
      contact: { name: 'TransitOps Engineering', email: 'api@transitops.com' },
      license: { name: 'MIT' },
    },
    servers: [
      { url: `http://localhost:${env.PORT}${env.API_PREFIX}`, description: 'Local Development' },
      { url: `https://api.transitops.com${env.API_PREFIX}`, description: 'Production' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
      responses: {
        UnauthorizedError: {
          description: 'Access token missing or invalid',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
          },
        },
        ForbiddenError: {
          description: 'Insufficient permissions for this action',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
          },
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
          },
        },
        ValidationError: {
          description: 'Request validation failed',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
          },
        },
      },
      schemas: {
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                message: { type: 'string', example: 'Resource not found' },
                code: { type: 'string', example: 'NOT_FOUND' },
              },
            },
          },
        },
        PaginationMeta: {
          type: 'object',
          properties: {
            page: { type: 'integer', example: 1 },
            pageSize: { type: 'integer', example: 10 },
            total: { type: 'integer', example: 100 },
            totalPages: { type: 'integer', example: 10 },
          },
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'object' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Auth', description: 'Authentication & session management' },
      { name: 'Vehicles', description: 'Fleet vehicle registry & management' },
      { name: 'Drivers', description: 'Driver management & license tracking' },
      { name: 'Trips', description: 'Trip lifecycle — draft → dispatch → complete/cancel' },
      { name: 'Maintenance', description: 'Vehicle service scheduling & completion' },
      { name: 'Fuel Logs', description: 'Fuel consumption tracking' },
      { name: 'Expenses', description: 'Trip expense management' },
      { name: 'Notifications', description: 'In-app notification management' },
      { name: 'Dashboard', description: 'Fleet KPIs, stats, and health metrics' },
      { name: 'Analytics', description: 'Fleet analytics, performance & reporting' },
      { name: 'Settings', description: 'User preference management' },
    ],
  },
  apis: ['./src/modules/**/*.routes.ts'],
};

export function setupSwagger(app: Application): void {
  const spec = swaggerJsdoc(options);

  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(spec, {
      customSiteTitle: 'TransitOps API Docs',
      customCss: '.swagger-ui .topbar { background-color: #1e40af; }',
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
      },
    }),
  );

  // Raw OpenAPI spec endpoint
  app.get('/api/docs.json', (_req, res) => res.json(spec));
}
