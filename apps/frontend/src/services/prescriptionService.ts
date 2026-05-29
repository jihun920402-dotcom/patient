import { api } from './api';
import type { Prescription, CreatePrescriptionDto, Medication } from '@hospital-ms/shared';

export const prescriptionService = {
  async list(params: { page?: number; limit?: number; patientId?: string }) {
    const { data } = await api.get('/prescriptions', { params });
    return data as { prescriptions: Prescription[]; total: number };
  },

  async findById(id: string): Promise<Prescription> {
    const { data } = await api.get(`/prescriptions/${id}`);
    return data;
  },

  async create(dto: CreatePrescriptionDto): Promise<Prescription> {
    const { data } = await api.post('/prescriptions', dto);
    return data;
  },

  async dispense(id: string): Promise<Prescription> {
    const { data } = await api.patch(`/prescriptions/${id}/dispense`);
    return data;
  },

  async searchMedications(params: { search?: string; category?: string }): Promise<Medication[]> {
    const { data } = await api.get('/prescriptions/medications', { params });
    return data;
  },
};
