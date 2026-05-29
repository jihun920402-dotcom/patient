import { patients, nextPatientNo, uid } from '../../utils/mockDb';
import { encrypt } from '../../utils/crypto';
import { Errors } from '../../utils/errors';
import type { Patient, CreatePatientDto, UpdatePatientDto, PatientListResponse } from '@hospital-ms/shared';

const now = () => new Date().toISOString();

export const patientService = {
  list(params: { page: number; limit: number; search?: string; gender?: string }): PatientListResponse {
    let filtered = patients.filter((p) => p.isActive);

    if (params.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.patientNo.toLowerCase().includes(q) ||
          p.phone.includes(q)
      );
    }

    if (params.gender) {
      filtered = filtered.filter((p) => p.gender === params.gender);
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / params.limit);
    const start = (params.page - 1) * params.limit;
    const paged = filtered.slice(start, start + params.limit);

    return { patients: paged, total, page: params.page, limit: params.limit, totalPages };
  },

  findById(id: string): Patient {
    const patient = patients.find((p) => p.id === id && p.isActive);
    if (!patient) throw Errors.NotFound('환자');
    return patient;
  },

  create(data: CreatePatientDto): Patient {
    // 중복 체크 (전화번호)
    const dup = patients.find((p) => p.phone === data.phone && p.isActive);
    if (dup) throw Errors.Conflict('동일 전화번호로 등록된 환자가 존재합니다');

    const { ssn, ...rest } = data;
    const newPatient: Patient = {
      id: uid(),
      patientNo: nextPatientNo(),
      ...rest,
      isActive: true,
      firstVisitDate: now().split('T')[0],
      createdAt: now(),
      updatedAt: now(),
    };

    // SSN 암호화
    if (ssn) {
      const { encrypted, iv } = encrypt(ssn);
      (newPatient as Patient & { ssnEncrypted: string; ssnIv: string }).ssnEncrypted = encrypted;
      (newPatient as Patient & { ssnEncrypted: string; ssnIv: string }).ssnIv = iv;
    }

    patients.push(newPatient);
    return newPatient;
  },

  update(id: string, data: UpdatePatientDto): Patient {
    const idx = patients.findIndex((p) => p.id === id && p.isActive);
    if (idx === -1) throw Errors.NotFound('환자');

    const { ssn, ...rest } = data as CreatePatientDto;
    const updated = {
      ...patients[idx],
      ...rest,
      updatedAt: now(),
    };

    if (ssn) {
      const { encrypted, iv } = encrypt(ssn);
      (updated as Patient & { ssnEncrypted: string; ssnIv: string }).ssnEncrypted = encrypted;
      (updated as Patient & { ssnEncrypted: string; ssnIv: string }).ssnIv = iv;
    }

    patients[idx] = updated;
    return updated;
  },

  delete(id: string): void {
    const idx = patients.findIndex((p) => p.id === id);
    if (idx === -1) throw Errors.NotFound('환자');
    patients[idx] = { ...patients[idx], isActive: false, updatedAt: now() };
  },
};
