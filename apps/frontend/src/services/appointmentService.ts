import { api } from './api';
import type { Appointment, CreateAppointmentDto, UpdateAppointmentDto, Department } from '@hospital-ms/shared';

export const appointmentService = {
  async list(params: { page?: number; limit?: number; date?: string; doctorId?: string; status?: string }) {
    const { data } = await api.get('/appointments', { params });
    return data as { appointments: Appointment[]; total: number; page: number };
  },

  async findById(id: string): Promise<Appointment> {
    const { data } = await api.get(`/appointments/${id}`);
    return data;
  },

  async create(dto: CreateAppointmentDto): Promise<Appointment> {
    const { data } = await api.post('/appointments', dto);
    return data;
  },

  async update(id: string, dto: UpdateAppointmentDto): Promise<Appointment> {
    const { data } = await api.patch(`/appointments/${id}`, dto);
    return data;
  },

  async cancel(id: string, reason?: string): Promise<Appointment> {
    const { data } = await api.patch(`/appointments/${id}/cancel`, { reason });
    return data;
  },

  async getDepartments(): Promise<Department[]> {
    const { data } = await api.get('/appointments/departments');
    return data;
  },

  async getDoctors(departmentId?: string) {
    const { data } = await api.get('/appointments/doctors', { params: { departmentId } });
    return data;
  },
};
