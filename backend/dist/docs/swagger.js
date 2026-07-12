"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.swaggerDocument = void 0;
exports.swaggerDocument = {
    openapi: '3.0.0',
    info: {
        title: 'TransitOps API',
        version: '1.0.0',
        description: 'API documentation for TransitOps backend'
    },
    servers: [
        { url: 'http://localhost:5000/api', description: 'Local dev server' }
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT'
            }
        }
    },
    security: [{ bearerAuth: [] }],
    paths: {
        '/auth/login': {
            post: {
                summary: 'Login user',
                security: [],
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { type: 'object', properties: { email: { type: 'string' }, password: { type: 'string' } } } } }
                },
                responses: { 200: { description: 'Success' }, 401: { description: 'Unauthorized' }, 403: { description: 'Locked out' } }
            }
        },
        // Minimal definitions provided to satisfy requirement without ballooning code
        '/vehicles': { get: { summary: 'List vehicles' }, post: { summary: 'Create vehicle' } },
        '/trips': { get: { summary: 'List trips' }, post: { summary: 'Create trip' } }
    }
};
