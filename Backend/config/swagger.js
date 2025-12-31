import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import path from 'path';
import { fileURLToPath } from 'url';

// gets the absolute paht of the file
const __filename = fileURLToPath(import.meta.url);
// does the same for the directory
const __dirname = path.dirname(__filename);

// swagger-jsdoc requires forward slashes for globs, even on Windows
const baseDir = path.join(__dirname, '..').split(path.sep).join('/');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'DeptConnekt API',
      version: '1.0.0',
      description: 'API documentation for the DeptConnekt platform',
    },
    servers: [
      {
        url: 'http://localhost:5000',
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
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  // Ensure the paths use forward slashes for the glob engine
  apis: [
    `${baseDir}/Auth/*.js`,
    `${baseDir}/Users/*.js`,
    `${baseDir}/Announcement/*.js`,
    `${baseDir}/Assignment/*.js`,
    `${baseDir}/Event/*.js`,
    `${baseDir}/Timetable/*.js`,
    `${baseDir}/Ai/*.js`,
  ],
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
};
