import { FastifyInstance } from 'fastify';
import { authenticate } from '../../middleware/authenticate';
import { billingService } from './billing.service';
import { AppError } from '../../utils/errors';

export async function billingRoutes(app: FastifyInstance) {
  const secure = { preHandler: [authenticate], schema: { security: [{ bearerAuth: [] }] } };

  app.get('/stats', {
    ...secure,
    schema: { ...secure.schema, tags: ['billing'], summary: '수납 통계' },
    handler: async (_req, reply) => reply.send(billingService.getStats()),
  });

  app.get('/', {
    ...secure,
    schema: {
      ...secure.schema,
      tags: ['billing'],
      summary: '청구서 목록',
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', default: 1 },
          limit: { type: 'integer', default: 20 },
          patientId: { type: 'string' },
          status: { type: 'string' },
        },
      },
    },
    handler: async (request, reply) => {
      const q = request.query as { page?: number; limit?: number; patientId?: string; status?: string };
      return reply.send(billingService.list({ page: Number(q.page) || 1, limit: Number(q.limit) || 20, patientId: q.patientId, status: q.status }));
    },
  });

  app.get('/:id', {
    ...secure,
    schema: { ...secure.schema, tags: ['billing'], summary: '청구서 상세' },
    handler: async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        return reply.send(billingService.findById(id));
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
      tags: ['billing'],
      summary: '청구서 생성',
      body: {
        type: 'object',
        required: ['patientId', 'items'],
        properties: {
          patientId: { type: 'string' },
          dueDate: { type: 'string' },
          notes: { type: 'string' },
          items: { type: 'array' },
          insuranceAmt: { type: 'number' },
          discountAmt: { type: 'number' },
        },
      },
    },
    handler: async (request, reply) => {
      try {
        const inv = billingService.create(request.body as Parameters<typeof billingService.create>[0]);
        return reply.status(201).send(inv);
      } catch (err) {
        if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message });
        return reply.status(500).send({ error: '서버 오류' });
      }
    },
  });

  app.post('/:id/payments', {
    ...secure,
    schema: {
      ...secure.schema,
      tags: ['billing'],
      summary: '수납 처리',
      body: {
        type: 'object',
        required: ['amount', 'method'],
        properties: {
          amount: { type: 'number' },
          method: { type: 'string', enum: ['CASH', 'CARD', 'INSURANCE', 'MIXED'] },
          transactionId: { type: 'string' },
          notes: { type: 'string' },
        },
      },
    },
    handler: async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const body = request.body as Parameters<typeof billingService.addPayment>[0];
        return reply.status(201).send(billingService.addPayment({ ...body, invoiceId: id }));
      } catch (err) {
        if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message });
        return reply.status(500).send({ error: '서버 오류' });
      }
    },
  });
}
