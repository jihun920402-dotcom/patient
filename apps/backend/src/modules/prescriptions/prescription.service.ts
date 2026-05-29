import { prescriptions, medications, patients, users, nextPrescriptionNo, uid } from '../../utils/mockDb';
import { Errors } from '../../utils/errors';
import type { Prescription, CreatePrescriptionDto } from '@hospital-ms/shared';

const now = () => new Date().toISOString();

export const prescriptionService = {
  listByPatient(patientId: string): Prescription[] {
    return prescriptions
      .filter((p) => p.patientId === patientId)
      .sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime());
  },

  list(params: { page: number; limit: number; patientId?: string; dispensed?: boolean }) {
    let filtered = [...prescriptions];
    if (params.patientId) filtered = filtered.filter((p) => p.patientId === params.patientId);
    if (params.dispensed !== undefined) {
      filtered = params.dispensed
        ? filtered.filter((p) => !!p.dispensedAt)
        : filtered.filter((p) => !p.dispensedAt);
    }
    filtered.sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime());
    const total = filtered.length;
    const start = (params.page - 1) * params.limit;
    return { prescriptions: filtered.slice(start, start + params.limit), total, page: params.page, limit: params.limit };
  },

  findById(id: string): Prescription {
    const p = prescriptions.find((p) => p.id === id);
    if (!p) throw Errors.NotFound('처방전');
    return p;
  },

  create(data: CreatePrescriptionDto): Prescription {
    const patient = patients.find((p) => p.id === data.patientId && p.isActive);
    if (!patient) throw Errors.NotFound('환자');

    const items = data.items.map((item) => {
      const med = medications.find((m) => m.id === item.medicationId && m.isActive);
      if (!med) throw Errors.NotFound(`약품 (${item.medicationId})`);
      return { id: uid(), prescriptionId: '', medication: med, ...item };
    });

    const doctor = users.find((u) => u.id === data.doctorId);
    const newPresc: Prescription = {
      id: uid(),
      prescriptionNo: nextPrescriptionNo(),
      patientId: data.patientId,
      patientName: patient.name,
      doctorId: data.doctorId,
      doctorName: doctor?.name,
      medicalRecordId: data.medicalRecordId,
      issuedAt: now(),
      notes: data.notes,
      items: items.map((item) => ({ ...item, prescriptionId: '' })),
      createdAt: now(),
      updatedAt: now(),
    };

    newPresc.items = items.map((item) => ({ ...item, prescriptionId: newPresc.id }));
    prescriptions.push(newPresc as typeof prescriptions[0]);
    return newPresc;
  },

  dispense(id: string, pharmacistId: string): Prescription {
    const idx = prescriptions.findIndex((p) => p.id === id);
    if (idx === -1) throw Errors.NotFound('처방전');
    if (prescriptions[idx].dispensedAt) throw Errors.Conflict('이미 조제된 처방전입니다');

    prescriptions[idx] = {
      ...prescriptions[idx],
      dispensedAt: now(),
      dispensedBy: pharmacistId,
      updatedAt: now(),
    };
    return prescriptions[idx];
  },

  getMedications(params: { search?: string; category?: string }) {
    let filtered = medications.filter((m) => m.isActive);
    if (params.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(
        (m) => m.name.toLowerCase().includes(q) || m.genericName?.toLowerCase().includes(q)
      );
    }
    if (params.category) filtered = filtered.filter((m) => m.category === params.category);
    return filtered;
  },
};
