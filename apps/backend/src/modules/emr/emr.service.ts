import {
  medicalRecords,
  recordDiagnoses,
  labResults,
  icd10Codes,
  nextRecordNo,
  uid,
} from '../../utils/mockDb';
import { Errors } from '../../utils/errors';
import type {
  MedicalRecord,
  CreateMedicalRecordDto,
  UpdateMedicalRecordDto,
  ICD10Code,
  LabResult,
} from '@hospital-ms/shared';

const now = () => new Date().toISOString();

export const emrService = {
  listByPatient(patientId: string): MedicalRecord[] {
    return medicalRecords
      .filter((r) => r.patientId === patientId)
      .sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime())
      .map((r) => ({
        ...r,
        diagnoses: recordDiagnoses
          .filter((d) => d.medicalRecordId === r.id)
          .map((d) => ({ ...d, icd10Code: icd10Codes.find((c) => c.id === d.icd10CodeId) })),
        labResults: labResults.filter((l) => l.medicalRecordId === r.id),
      }));
  },

  findById(id: string): MedicalRecord {
    const record = medicalRecords.find((r) => r.id === id);
    if (!record) throw Errors.NotFound('진료 기록');
    return {
      ...record,
      diagnoses: recordDiagnoses
        .filter((d) => d.medicalRecordId === id)
        .map((d) => ({ ...d, icd10Code: icd10Codes.find((c) => c.id === d.icd10CodeId) })),
      labResults: labResults.filter((l) => l.medicalRecordId === id),
    };
  },

  create(data: CreateMedicalRecordDto): MedicalRecord {
    const newRecord: MedicalRecord = {
      id: uid(),
      recordNo: nextRecordNo(),
      patientId: data.patientId,
      doctorId: data.doctorId,
      appointmentId: data.appointmentId,
      subjective: data.subjective,
      objective: data.objective,
      assessment: data.assessment,
      plan: data.plan,
      vitalSigns: data.vitalSigns,
      status: 'DRAFT',
      visitDate: data.visitDate || now(),
      diagnoses: [],
      labResults: [],
      createdAt: now(),
      updatedAt: now(),
    };
    medicalRecords.push(newRecord);
    return newRecord;
  },

  update(id: string, data: UpdateMedicalRecordDto): MedicalRecord {
    const idx = medicalRecords.findIndex((r) => r.id === id);
    if (idx === -1) throw Errors.NotFound('진료 기록');
    medicalRecords[idx] = { ...medicalRecords[idx], ...data, updatedAt: now() };
    return this.findById(id);
  },

  addDiagnosis(recordId: string, icd10CodeId: string, isPrimary: boolean, notes?: string) {
    const record = medicalRecords.find((r) => r.id === recordId);
    if (!record) throw Errors.NotFound('진료 기록');
    const code = icd10Codes.find((c) => c.id === icd10CodeId);
    if (!code) throw Errors.NotFound('ICD-10 코드');

    const diagnosis = {
      id: uid(),
      medicalRecordId: recordId,
      icd10CodeId,
      icd10Code: code,
      isPrimary,
      notes,
      createdAt: now(),
    };
    recordDiagnoses.push(diagnosis);
    return diagnosis;
  },

  removeDiagnosis(diagnosisId: string) {
    const idx = recordDiagnoses.findIndex((d) => d.id === diagnosisId);
    if (idx === -1) throw Errors.NotFound('진단');
    recordDiagnoses.splice(idx, 1);
  },

  addLabResult(data: Omit<LabResult, 'id' | 'createdAt'>): LabResult {
    const record = medicalRecords.find((r) => r.id === data.medicalRecordId);
    if (!record) throw Errors.NotFound('진료 기록');

    const result: LabResult = {
      id: uid(),
      ...data,
      createdAt: now(),
    };
    labResults.push(result);
    return result;
  },

  searchICD10(query: string): ICD10Code[] {
    const q = query.toLowerCase();
    return icd10Codes
      .filter(
        (c) =>
          c.code.toLowerCase().includes(q) ||
          c.descriptionKo?.toLowerCase().includes(q) ||
          c.descriptionEn.toLowerCase().includes(q)
      )
      .slice(0, 20);
  },
};
