import { FastifyInstance } from 'fastify';
import { authenticate } from '../../middleware/authenticate';
import { appointmentService } from './appointment.service';
import { AppError } from '../../utils/errors';

export async function appointmentRoutes(app: FastifyInstance) {
  const secure = { preHandler: [authenticate], schema: { security: [{ bearerAuth: [] }] } };

  app.get('/departments', {
    ...secure,
    schema: { ...secure.schema, tags: ['appointments'], summary: '진료과 목록' },
    handler: async (_req, reply) => reply.send(appointmentService.getDepartments()),
  });

  app.get('/doctors', {
    ...secure,
    schema: {
      ...secure.schema,
      tags: ['appointments'],
      summary: '의사 목록',
      querystring: {
        type: 'object',
        properties: { departmentId: { type: 'string' } },
      },
    },
    handler: async (request, reply) => {
      const { departmentId } = request.query as { departmentId?: string };
      return reply.send(appointmentService.getDoctors(departmentId));
    },
  });

  app.get('/', {
    ...secure,
    schema: {
      ...secure.schema,
      tags: ['appointments'],
      summary: '예약 목록 조회',
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', default: 1 },
          limit: { type: 'integer', default: 50 },
          date: { type: 'string' },
          doctorId: { type: 'string' },
          status: { type: 'string' },
        },
      },
    },
    handler: async (request, reply) => {
      const q = request.query as { page?: number; limit?: number; date?: string; doctorId?: string; status?: string };
      return reply.send(
        appointmentService.list({
          page: Number(q.page) || 1,
          limit: Number(q.limit) || 50,
          date: q.date,
          doctorId: q.doctorId,
          status: q.status,
        })
      );
    },
  });

  app.get('/:id', {
    ...secure,
    schema: { ...secure.schema, tags: ['appointments'], summary: '예약 상세' },
    handler: async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        return reply.send(appointmentService.findById(id));
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
      tags: ['appointments'],
      summary: '예약 생성',
      body: {
        type: 'object',
        required: ['patientId', 'doctorId', 'departmentId', 'scheduledAt'],
        properties: {
          patientId: { type: 'string' },
          doctorId: { type: 'string' },
          departmentId: { type: 'string' },
          scheduledAt: { type: 'string' },
          duration: { type: 'integer' },
          visitType: { type: 'string' },
          chiefComplaint: { type: 'string' },
          notes: { type: 'string' },
        },
      },
    },
    handler: async (request, reply) => {
      try {
        const appt = appointmentService.create(request.body as Parameters<typeof appointmentService.create>[0]);
        return reply.status(201).send(appt);
      } catch (err) {
        if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message });
        return reply.status(500).send({ error: '서버 오류' });
      }
    },
  });

  app.patch('/:id', {
    ...secure,
    schema: { ...secure.schema, tags: ['appointments'], summary: '예약 수정' },
    handler: async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        return reply.send(appointmentService.update(id, request.body as Parameters<typeof appointmentService.update>[1]));
      } catch (err) {
        if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message });
        return reply.status(500).send({ error: '서버 오류' });
      }
    },
  });

  app.patch('/:id/cancel', {
    ...secure,
    schema: {
      ...secure.schema,
      tags: ['appointments'],
      summary: '예약 취소',
      body: {
        type: 'object',
        properties: { reason: { type: 'string' } },
      },
    },
    handler: async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const { reason } = (request.body || {}) as { reason?: string };
        return reply.send(appointmentService.cancel(id, reason));
      } catch (err) {
        if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message });
        return reply.status(500).send({ error: '서버 오류' });
      }
    },
  });
}
