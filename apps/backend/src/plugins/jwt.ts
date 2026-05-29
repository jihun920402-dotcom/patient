import { FastifyInstance } from 'fastify';
import fastifyJwt from '@fastify/jwt';

export async function registerJwt(app: FastifyInstance) {
  await app.register(fastifyJwt, {
    secret: process.env.JWT_SECRET || 'hms-dev-secret-change-in-prod',
    sign: {
      expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    },
  });
}
