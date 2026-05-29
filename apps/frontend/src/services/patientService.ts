import { api } from './api';
import type { Patient, CreatePatientDto, UpdatePatientDto, PatientListResponse } from '@hospital-ms/shared';

export const patientService = {
  async list(params: { page?: number; limit?: number; search?: string; gender?: string }): Promise<PatientListResponse> {
    const { data } = await api.get('/patients', { params });
    return data;
  },

  async findById(id: string): Promise<Patient> {
    const { data } = await api.get(`/patients/${id}`);
    return data;
  },

  async create(dto: CreatePatientDto): Promise<Patient> {
    const { data } = await api.post('/patients', dto);
    return data;
  },

  async update(id: string, dto: UpdatePatientDto): Promise<Patient> {
    const { data } = await api.patch(`/patients/${id}`, dto);
    return data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/patients/${id}`);
  },
};
