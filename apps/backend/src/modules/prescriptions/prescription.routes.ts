import { FastifyInstance } from 'fastify';
import { authenticate } from '../../middleware/authenticate';
import { prescriptionService } from './prescription.service';
import { AppError } from '../../utils/errors';
import type { TokenPayload } from '@hospital-ms/shared';

export async function prescriptionRoutes(app: FastifyInstance) {
  const secure = { preHandler: [authenticate], schema: { security: [{ bearerAuth: [] }] } };

  app.get('/medications', {
    ...secure,
    schema: {
      ...secure.schema,
      tags: ['prescriptions'],
      summary: '약품 목록 검색',
      querystring: {
        type: 'object',
        properties: { search: { type: 'string' }, category: { type: 'string' } },
      },
    },
    handler: async (request, reply) => {
      const q = request.query as { search?: string; category?: string };
      return reply.send(prescriptionService.getMedications(q));
    },
  });

  app.get('/', {
    ...secure,
    schema: {
      ...secure.schema,
      tags: ['prescriptions'],
      summary: '처방전 목록',
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', default: 1 },
          limit: { type: 'integer', default: 20 },
          patientId: { type: 'string' },
          dispensed: { type: 'boolean' },
        },
      },
    },
    handler: async (request, reply) => {
      const q = request.query as { page?: number; limit?: number; patientId?: string; dispensed?: boolean };
      return reply.send(prescriptionService.list({ page: Number(q.page) || 1, limit: Number(q.limit) || 20, patientId: q.patientId }));
    },
  });

  app.get('/:id', {
    ...secure,
    schema: { ...secure.schema, tags: ['prescriptions'], summary: '처방전 상세' },
    handler: async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        return reply.send(prescriptionService.findById(id));
      } catch (err) {
        if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message });
        return reply.status(500).send({ error: '서버 오류' });
      }
    },
  });

  app.post('/', {
    ...secure,
    schema: {
      ...secure.schema,
      tags: ['prescriptions'],
      summary: '처방전 발행',
      body: {
        type: 'object',
        required: ['patientId', 'doctorId', 'items'],
        properties: {
          patientId: { type: 'string' },
          doctorId: { type: 'string' },
          medicalRecordId: { type: 'string' },
          notes: { type: 'string' },
          items: { type: 'array' },
        },
      },
    },
    handler: async (request, reply) => {
      try {
        const presc = prescriptionService.create(request.body as Parameters<typeof prescriptionService.create>[0]);
        return reply.status(201).send(presc);
      } catch (err) {
        if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message });
        return reply.status(500).send({ error: '서버 오류' });
      }
    },
  });

  app.patch('/:id/dispense', {
    ...secure,
    schema: { ...secure.schema, tags: ['prescriptions'], summary: '처방전 조제 처리' },
    handler: async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const user = request.user as TokenPayload;
        return reply.send(prescriptionService.dispense(id, user.sub));
      } catch (err) {
        if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message });
        return reply.status(500).send({ error: '서버 오류' });
      }
    },
  });
}
