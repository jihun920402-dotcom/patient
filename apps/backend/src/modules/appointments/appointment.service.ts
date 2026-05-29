import {
  appointments,
  patients,
  users,
  departments,
  nextAppointmentNo,
  uid,
} from '../../utils/mockDb';
import { Errors } from '../../utils/errors';
import type { Appointment, CreateAppointmentDto, UpdateAppointmentDto } from '@hospital-ms/shared';

const now = () => new Date().toISOString();

function enrich(appt: Appointment): Appointment {
  const patient = patients.find((p) => p.id === appt.patientId);
  const doctor = users.find((u) => u.id === appt.doctorId);
  const dept = departments.find((d) => d.id === appt.departmentId);
  return {
    ...appt,
    patientName: patient?.name,
    patientNo: patient?.patientNo,
    doctorName: doctor?.name,
    departmentName: dept?.name,
  };
}

export const appointmentService = {
  list(params: { page: number; limit: number; date?: string; doctorId?: string; status?: string }) {
    let filtered = [...appointments];

    if (params.date) {
      filtered = filtered.filter((a) => a.scheduledAt.startsWith(params.date!));
    }
    if (params.doctorId) {
      filtered = filtered.filter((a) => a.doctorId === params.doctorId);
    }
    if (params.status) {
      filtered = filtered.filter((a) => a.status === params.status);
    }

    filtered.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

    const total = filtered.length;
    const start = (params.page - 1) * params.limit;
    const paged = filtered.slice(start, start + params.limit).map(enrich);

    return { appointments: paged, total, page: params.page, limit: params.limit };
  },

  findById(id: string): Appointment {
    const appt = appointments.find((a) => a.id === id);
    if (!appt) throw Errors.NotFound('예약');
    return enrich(appt);
  },

  create(data: CreateAppointmentDto): Appointment {
    const patient = patients.find((p) => p.id === data.patientId && p.isActive);
    if (!patient) throw Errors.NotFound('환자');

    const doctor = users.find((u) => u.id === data.doctorId && u.isActive);
    if (!doctor) throw Errors.NotFound('의사');

    // 같은 시간대 중복 예약 체크
    const conflict = appointments.find(
      (a) =>
        a.doctorId === data.doctorId &&
        a.scheduledAt === data.scheduledAt &&
        !['CANCELLED', 'NO_SHOW', 'COMPLETED'].includes(a.status)
    );
    if (conflict) throw Errors.Conflict('해당 시간에 이미 예약이 있습니다');

    // 당일 대기 순번 계산
    const date = data.scheduledAt.split('T')[0];
    const dayAppts = appointments.filter(
      (a) => a.doctorId === data.doctorId && a.scheduledAt.startsWith(date)
    );
    const queueNo = dayAppts.length + 1;

    const newAppt: Appointment = {
      id: uid(),
      appointmentNo: nextAppointmentNo(),
      patientId: data.patientId,
      doctorId: data.doctorId,
      departmentId: data.departmentId,
      scheduledAt: data.scheduledAt,
      duration: data.duration || 20,
      status: 'SCHEDULED',
      queueNo,
      visitType: data.visitType || 'OUTPATIENT',
      chiefComplaint: data.chiefComplaint,
      notes: data.notes,
      createdAt: now(),
      updatedAt: now(),
    };

    appointments.push(newAppt);
    return enrich(newAppt);
  },

  update(id: string, data: UpdateAppointmentDto): Appointment {
    const idx = appointments.findIndex((a) => a.id === id);
    if (idx === -1) throw Errors.NotFound('예약');

    appointments[idx] = { ...appointments[idx], ...data, updatedAt: now() };
    return enrich(appointments[idx]);
  },

  cancel(id: string, reason?: string): Appointment {
    const idx = appointments.findIndex((a) => a.id === id);
    if (idx === -1) throw Errors.NotFound('예약');
    if (appointments[idx].status === 'COMPLETED')
      throw Errors.BadRequest('완료된 예약은 취소할 수 없습니다');

    appointments[idx] = {
      ...appointments[idx],
      status: 'CANCELLED',
      cancelReason: reason,
      updatedAt: now(),
    };
    return enrich(appointments[idx]);
  },

  getDepartments() {
    return departments.filter((d) => d.isActive);
  },

  getDoctors(departmentId?: string) {
    let docs = users.filter((u) => u.role === 'DOCTOR' && u.isActive);
    if (departmentId) docs = docs.filter((u) => u.departmentId === departmentId);
    return docs.map(({ password: _pw, ...u }) => u);
  },
};
