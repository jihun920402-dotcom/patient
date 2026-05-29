import { FastifyInstance } from 'fastify';
import { authenticate } from '../../middleware/authenticate';
import { emrService } from './emr.service';
import { AppError } from '../../utils/errors';

export async function emrRoutes(app: FastifyInstance) {
  const secure = { preHandler: [authenticate], schema: { security: [{ bearerAuth: [] }] } };

  // ICD-10 검색
  app.get('/icd10/search', {
    ...secure,
    schema: {
      ...secure.schema,
      tags: ['emr'],
      summary: 'ICD-10 코드 검색',
      querystring: {
        type: 'object',
        required: ['q'],
        properties: { q: { type: 'string' } },
      },
    },
    handler: async (request, reply) => {
      const { q } = request.query as { q: string };
      return reply.send(emrService.searchICD10(q));
    },
  });

  // 환자별 진료 기록 목록
  app.get('/patient/:patientId', {
    ...secure,
    schema: { ...secure.schema, tags: ['emr'], summary: '환자 진료 기록 목록' },
    handler: async (request, reply) => {
      const { patientId } = request.params as { patientId: string };
      return reply.send(emrService.listByPatient(patientId));
    },
  });

  // 진료 기록 상세
  app.get('/:id', {
    ...secure,
    schema: { ...secure.schema, tags: ['emr'], summary: '진료 기록 상세' },
    handler: async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        return reply.send(emrService.findById(id));
      } catch (err) {
        if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message });
        return reply.status(500).send({ error: '서버 오류' });
      }
    },
  });

  // 진료 기록 생성
  app.post('/', {
    ...secure,
    schema: {
      ...secure.schema,
      tags: ['emr'],
      summary: '진료 기록 생성',
      body: {
        type: 'object',
        required: ['patientId', 'doctorId'],
        properties: {
          patientId: { type: 'string' },
          doctorId: { type: 'string' },
          appointmentId: { type: 'string' },
          subjective: { type: 'string' },
          objective: { type: 'string' },
          assessment: { type: 'string' },
          plan: { type: 'string' },
          vitalSigns: { type: 'object' },
          visitDate: { type: 'string' },
        },
      },
    },
    handler: async (request, reply) => {
      try {
        const record = emrService.create(request.body as Parameters<typeof emrService.create>[0]);
        return reply.status(201).send(record);
      } catch (err) {
        if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message });
        return reply.status(500).send({ error: '서버 오류' });
      }
    },
  });

  // 진료 기록 수정
  app.patch('/:id', {
    ...secure,
    schema: { ...secure.schema, tags: ['emr'], summary: '진료 기록 수정' },
    handler: async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        return reply.send(emrService.update(id, request.body as Parameters<typeof emrService.update>[1]));
      } catch (err) {
        if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message });
        return reply.status(500).send({ error: '서버 오류' });
      }
    },
  });

  // 진단 추가
  app.post('/:id/diagnoses', {
    ...secure,
    schema: {
      ...secure.schema,
      tags: ['emr'],
      summary: '진단 추가',
      body: {
        type: 'object',
        required: ['icd10CodeId'],
        properties: {
          icd10CodeId: { type: 'string' },
          isPrimary: { type: 'boolean' },
          notes: { type: 'string' },
        },
      },
    },
    handler: async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const body = request.body as { icd10CodeId: string; isPrimary?: boolean; notes?: string };
        return reply
          .status(201)
          .send(emrService.addDiagnosis(id, body.icd10CodeId, body.isPrimary ?? false, body.notes));
      } catch (err) {
        if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message });
        return reply.status(500).send({ error: '서버 오류' });
      }
    },
  });

  // 검사 결과 추가
  app.post('/:id/lab-results', {
    ...secure,
    schema: {
      ...secure.schema,
      tags: ['emr'],
      summary: '검사 결과 등록',
      body: {
        type: 'object',
        required: ['testName', 'result'],
        properties: {
          testName: { type: 'string' },
          testCode: { type: 'string' },
          result: { type: 'string' },
          unit: { type: 'string' },
          referenceRange: { type: 'string' },
          isAbnormal: { type: 'boolean' },
          severity: { type: 'string' },
          testedAt: { type: 'string' },
          notes: { type: 'string' },
        },
      },
    },
    handler: async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const body = request.body as Record<string, unknown>;
        return reply.status(201).send(
          emrService.addLabResult({ medicalRecordId: id, isAbnormal: false, testedAt: new Date().toISOString(), ...body } as Parameters<typeof emrService.addLabResult>[0])
        );
      } catch (err) {
        if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message });
        return reply.status(500).send({ error: '서버 오류' });
      }
    },
  });
}
