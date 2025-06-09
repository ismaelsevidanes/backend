import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Pitch Dreamers',
      version: '1.0.0',
      description: 'Documentación API REST generada por Swagger',
    },
    tags: [
      { name: 'Auth', description: 'Endpoints relacionados con la autenticación de usuarios' },
      { name: 'Users', description: 'Endpoints relacionados con la gestión de usuarios' },
      { name: 'Fields', description: 'Endpoints relacionados con la gestión de campos' },
      { name: 'Reservations', description: 'Endpoints relacionados con la gestión de reservas' },
      { name: 'Payments', description: 'Endpoints relacionados con la gestión de pagos' },
    ],
    servers: [
      {
        url: 'http://localhost:3000', // Cambiar esto si se usa otro puerto
        //url: 'https://pitchdreamers.duckdns.org', // URL de producción
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
  apis: ['./modules/**/*.ts', './src/**/*.ts'], // Ruta a los archivos donde están las rutas
};

const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app: Express): void => {
  app.use('/v3/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log('Swagger disponible en http://localhost:3000/v3/api-docs');
  //console.log('Swagger disponible en https://pitchdreamers.duckdns.org/v3/api-docs');
};
