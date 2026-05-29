export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type InsuranceType = 'HEALTH_INSURANCE' | 'MEDICAL_AID_1' | 'MEDICAL_AID_2' | 'UNINSURED';

export interface Patient {
  id: string;
  patientNo: string;
  name: string;
  birthDate: string;
  gender: Gender;
  phone: string;
  email?: string;
  address?: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianRelation?: string;
  insuranceType: InsuranceType;
  insuranceNo?: string;
  bloodType?: string;
  allergies?: string;
  specialNotes?: string;
  isActive: boolean;
  firstVisitDate: string;
  lastVisitDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePatientDto {
  name: string;
  birthDate: string;
  gender: Gender;
  phone: string;
  email?: string;
  address?: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianRelation?: string;
  insuranceType: InsuranceType;
  insuranceNo?: string;
  bloodType?: string;
  allergies?: string;
  specialNotes?: string;
  ssn?: string;
}

export type UpdatePatientDto = Partial<CreatePatientDto>;

export interface PatientListResponse {
  patients: Patient[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
