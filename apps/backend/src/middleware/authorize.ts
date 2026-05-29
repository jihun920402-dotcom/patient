import { FastifyRequest, FastifyReply } from 'fastify';
import type { Role, TokenPayload } from '@hospital-ms/shared';

export function authorize(roles: Role[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as TokenPayload;
    if (!user || !roles.includes(user.role)) {
      reply.status(403).send({ error: '권한이 없습니다', code: 'FORBIDDEN' });
    }
  };
}
