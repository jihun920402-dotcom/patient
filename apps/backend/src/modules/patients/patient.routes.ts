import { FastifyInstance } from 'fastify';
import { authenticate } from '../../middleware/authenticate';
import { patientService } from './patient.service';
import { AppError } from '../../utils/errors';

export async function patientRoutes(app: FastifyInstance) {
  const secureOpts = { preHandler: [authenticate], schema: { security: [{ bearerAuth: [] }] } };

  // GET /api/patients
  app.get('/', {
    ...secureOpts,
    schema: {
      ...secureOpts.schema,
      tags: ['patients'],
      summary: '환자 목록 조회',
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', default: 1 },
          limit: { type: 'integer', default: 20 },
          search: { type: 'string' },
          gender: { type: 'string', enum: ['MALE', 'FEMALE', 'OTHER'] },
        },
      },
    },
    handler: async (request, reply) => {
      const q = request.query as { page?: number; limit?: number; search?: string; gender?: string };
      const result = patientService.list({
        page: Number(q.page) || 1,
        limit: Number(q.limit) || 20,
        search: q.search,
        gender: q.gender,
      });
      return reply.send(result);
    },
  });

  // GET /api/patients/:id
  app.get('/:id', {
    ...secureOpts,
    schema: {
      ...secureOpts.schema,
      tags: ['patients'],
      summary: '환자 상세 조회',
    },
    handler: async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        return reply.send(patientService.findById(id));
      } catch (err) {
        if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message });
        return reply.status(500).send({ error: '서버 오류' });
      }
    },
  });

  // POST /api/patients
  app.post('/', {
    ...secureOpts,
    schema: {
      ...secureOpts.schema,
      tags: ['patients'],
      summary: '환자 등록',
      body: {
        type: 'object',
        required: ['name', 'birthDate', 'gender', 'phone', 'insuranceType'],
        properties: {
          name: { type: 'string' },
          birthDate: { type: 'string' },
          gender: { type: 'string', enum: ['MALE', 'FEMALE', 'OTHER'] },
          phone: { type: 'string' },
          email: { type: 'string' },
          address: { type: 'string' },
          guardianName: { type: 'string' },
          guardianPhone: { type: 'string' },
          guardianRelation: { type: 'string' },
          insuranceType: { type: 'string' },
          insuranceNo: { type: 'string' },
          bloodType: { type: 'string' },
          allergies: { type: 'string' },
          specialNotes: { type: 'string' },
          ssn: { type: 'string' },
        },
      },
    },
    handler: async (request, reply) => {
      try {
        const patient = patientService.create(request.body as Parameters<typeof patientService.create>[0]);
        return reply.status(201).send(patient);
      } catch (err) {
        if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message });
        return reply.status(500).send({ error: '서버 오류' });
      }
    },
  });

  // PATCH /api/patients/:id
  app.patch('/:id', {
    ...secureOpts,
    schema: {
      ...secureOpts.schema,
      tags: ['patients'],
      summary: '환자 정보 수정',
    },
    handler: async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const updated = patientService.update(id, request.body as Parameters<typeof patientService.update>[1]);
        return reply.send(updated);
      } catch (err) {
        if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message });
        return reply.status(500).send({ error: '서버 오류' });
      }
    },
  });

  // DELETE /api/patients/:id
  app.delete('/:id', {
    ...secureOpts,
    schema: { ...secureOpts.schema, tags: ['patients'], summary: '환자 비활성화' },
    handler: async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        patientService.delete(id);
        return reply.status(204).send();
      } catch (err) {
        if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message });
        return reply.status(500).send({ error: '서버 오류' });
      }
    },
  });
}
