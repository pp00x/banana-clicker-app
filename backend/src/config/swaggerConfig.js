const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Banana Clicker API',
      version: '1.0.0',
      description:
        'API documentation for the Banana Clicker backend application, managing users, authentication, and real-time game events.',
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}/api`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        UserResponse: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '60c72b2f9b1e8a5a4c8d9c0a' },
            username: { type: 'string', example: 'testuser' },
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com',
            },
            displayName: {
              type: 'string',
              example: 'Test User',
              nullable: true,
            },
            avatarUrl: {
              type: 'string',
              format: 'url',
              example: 'http://example.com/avatar.png',
              nullable: true,
            },
            role: {
              type: 'string',
              enum: ['player', 'admin'],
              example: 'player',
            },
            bananaCount: { type: 'integer', example: 100 },
            isBlocked: { type: 'boolean', example: false },
            isDeleted: { type: 'boolean', example: false },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
