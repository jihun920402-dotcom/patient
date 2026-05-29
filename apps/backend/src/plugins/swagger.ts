import { FastifyInstance } from 'fastify';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';

export async function registerSwagger(app: FastifyInstance) {
  await app.register(fastifySwagger, {
    openapi: {
      openapi: '3.0.0',
      info: {
        title: 'Hospital Management System API',
        description: '병원 환자관리 시스템 API 문서',
        version: '1.0.0',
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      tags: [
        { name: 'auth', description: '인증' },
        { name: 'patients', description: '환자 관리' },
        { name: 'appointments', description: '예약 관리' },
        { name: 'emr', description: '진료 기록 (EMR)' },
        { name: 'prescriptions', description: '처방전 관리' },
        { name: 'billing', description: '수납/청구 관리' },
      ],
    },
  });

  await app.register(fastifySwaggerUi, {
    routePrefix: '/docs',
    uiConfig: { docExpansion: 'list', deepLinking: false },
  });
}
