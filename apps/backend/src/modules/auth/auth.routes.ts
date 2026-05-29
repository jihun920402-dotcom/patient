import { FastifyInstance } from 'fastify';
import { authenticate } from '../../middleware/authenticate';
import { authService } from './auth.service';
import { AppError } from '../../utils/errors';
import type { TokenPayload } from '@hospital-ms/shared';

export async function authRoutes(app: FastifyInstance) {
  // POST /api/auth/login
  app.post('/login', {
    schema: {
      tags: ['auth'],
      summary: '로그인',
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 },
        },
      },
    },
    handler: async (request, reply) => {
      try {
        const body = request.body as { email: string; password: string };
        const result = await authService.login(app, body);
        return reply.send(result);
      } catch (err) {
        if (err instanceof AppError) {
          return reply.status(err.statusCode).send({ error: err.message });
        }
        return reply.status(500).send({ error: '서버 오류' });
      }
    },
  });

  // POST /api/auth/refresh
  app.post('/refresh', {
    schema: {
      tags: ['auth'],
      summary: 'Access Token 재발급',
      body: {
        type: 'object',
        required: ['refreshToken'],
        properties: { refreshToken: { type: 'string' } },
      },
    },
    handler: async (request, reply) => {
      try {
        const { refreshToken } = request.body as { refreshToken: string };
        const result = await authService.refresh(app, refreshToken);
        return reply.send(result);
      } catch (err) {
        if (err instanceof AppError) {
          return reply.status(err.statusCode).send({ error: err.message });
        }
        return reply.status(500).send({ error: '서버 오류' });
      }
    },
  });

  // POST /api/auth/logout
  app.post('/logout', {
    preHandler: [authenticate],
    schema: {
      tags: ['auth'],
      summary: '로그아웃',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        properties: { refreshToken: { type: 'string' } },
      },
    },
    handler: async (request, reply) => {
      const { refreshToken } = request.body as { refreshToken?: string };
      if (refreshToken) authService.logout(refreshToken);
      return reply.send({ message: '로그아웃 되었습니다' });
    },
  });

  // GET /api/auth/me
  app.get('/me', {
    preHandler: [authenticate],
    schema: {
      tags: ['auth'],
      summary: '내 정보 조회',
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      try {
        const payload = request.user as TokenPayload;
        const user = authService.getProfile(payload.sub);
        return reply.send(user);
      } catch (err) {
        if (err instanceof AppError) {
          return reply.status(err.statusCode).send({ error: err.message });
        }
        return reply.status(500).send({ error: '서버 오류' });
      }
    },
  });
}
