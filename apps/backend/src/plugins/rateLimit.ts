import { FastifyInstance } from 'fastify';
import fastifyRateLimit from '@fastify/rate-limit';

export async function registerRateLimit(app: FastifyInstance) {
  await app.register(fastifyRateLimit, {
    max: 200,
    timeWindow: '1 minute',
    errorResponseBuilder: () => ({
      error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
      code: 'RATE_LIMIT_EXCEEDED',
    }),
  });
}
