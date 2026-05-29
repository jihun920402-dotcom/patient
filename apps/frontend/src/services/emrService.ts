import { api } from './api';
import type { MedicalRecord, CreateMedicalRecordDto, UpdateMedicalRecordDto, ICD10Code } from '@hospital-ms/shared';

export const emrService = {
  async listByPatient(patientId: string): Promise<MedicalRecord[]> {
    const { data } = await api.get(`/emr/patient/${patientId}`);
    return data;
  },

  async findById(id: string): Promise<MedicalRecord> {
    const { data } = await api.get(`/emr/${id}`);
    return data;
  },

  async create(dto: CreateMedicalRecordDto): Promise<MedicalRecord> {
    const { data } = await api.post('/emr', dto);
    return data;
  },

  async update(id: string, dto: UpdateMedicalRecordDto): Promise<MedicalRecord> {
    const { data } = await api.patch(`/emr/${id}`, dto);
    return data;
  },

  async addDiagnosis(recordId: string, icd10CodeId: string, isPrimary: boolean, notes?: string) {
    const { data } = await api.post(`/emr/${recordId}/diagnoses`, { icd10CodeId, isPrimary, notes });
    return data;
  },

  async addLabResult(recordId: string, payload: Record<string, unknown>) {
    const { data } = await api.post(`/emr/${recordId}/lab-results`, payload);
    return data;
  },

  async searchICD10(q: string): Promise<ICD10Code[]> {
    const { data } = await api.get('/emr/icd10/search', { params: { q } });
    return data;
  },
};
