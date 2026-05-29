import { FastifyInstance } from 'fastify';
import fastifyCors from '@fastify/cors';

export async function registerCors(app: FastifyInstance) {
  await app.register(fastifyCors, {
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:5173',
      'http://localhost:3000',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });
}
