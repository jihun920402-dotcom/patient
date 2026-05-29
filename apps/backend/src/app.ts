import Fastify from 'fastify';
import { registerCors } from './plugins/cors';
import { registerJwt } from './plugins/jwt';
import { registerRateLimit } from './plugins/rateLimit';
import { registerSwagger } from './plugins/swagger';
import { authRoutes } from './modules/auth/auth.routes';
import { patientRoutes } from './modules/patients/patient.routes';
import { appointmentRoutes } from './modules/appointments/appointment.routes';
import { emrRoutes } from './modules/emr/emr.routes';
import { prescriptionRoutes } from './modules/prescriptions/prescription.routes';
import { billingRoutes } from './modules/billing/billing.routes';

const app = Fastify({
  logger: {
    transport: {
      target: 'pino-pretty',
      options: { colorize: true },
    },
  },
});

async function start() {
  await registerCors(app);
  await registerJwt(app);
  await registerRateLimit(app);
  await registerSwagger(app);

  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(patientRoutes, { prefix: '/api/patients' });
  await app.register(appointmentRoutes, { prefix: '/api/appointments' });
  await app.register(emrRoutes, { prefix: '/api/emr' });
  await app.register(prescriptionRoutes, { prefix: '/api/prescriptions' });
  await app.register(billingRoutes, { prefix: '/api/billing' });

  // 헬스 체크
  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  const port = Number(process.env.PORT) || 4000;
  await app.listen({ port, host: '0.0.0.0' });

  console.log('\n🏥  Hospital Management System — Backend');
  console.log(`✅  Server  : http://localhost:${port}`);
  console.log(`📚  Swagger : http://localhost:${port}/docs`);
  console.log('\n기본 계정:');
  console.log('  관리자    : admin@hospital.com      / admin1234!');
  console.log('  의사(내과): kim@hospital.com        / doctor1234!');
  console.log('  의사(외과): lee@hospital.com        / doctor1234!');
  console.log('  간호사    : nurse@hospital.com      / nurse1234!');
  console.log('  원무      : reception@hospital.com  / recep1234!');
  console.log('  약사      : pharm@hospital.com      / pharm1234!\n');
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
