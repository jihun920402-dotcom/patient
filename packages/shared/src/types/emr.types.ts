export type RecordStatus = 'DRAFT' | 'COMPLETED' | 'AMENDED';

export interface VitalSigns {
  bp?: string;
  pulse?: number;
  temperature?: number;
  spo2?: number;
  respiratoryRate?: number;
  height?: number;
  weight?: number;
}

export interface MedicalRecord {
  id: string;
  recordNo: string;
  patientId: string;
  patientName?: string;
  doctorId: string;
  doctorName?: string;
  appointmentId?: string;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  vitalSigns?: VitalSigns;
  status: RecordStatus;
  visitDate: string;
  diagnoses?: RecordDiagnosis[];
  labResults?: LabResult[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateMedicalRecordDto {
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  vitalSigns?: VitalSigns;
  visitDate?: string;
}

export type UpdateMedicalRecordDto = Partial<CreateMedicalRecordDto> & {
  status?: RecordStatus;
};

export interface ICD10Code {
  id: string;
  code: string;
  descriptionEn: string;
  descriptionKo?: string;
  category: string;
}

export interface RecordDiagnosis {
  id: string;
  medicalRecordId: string;
  icd10CodeId: string;
  icd10Code?: ICD10Code;
  isPrimary: boolean;
  notes?: string;
  createdAt: string;
}

export interface LabResult {
  id: string;
  medicalRecordId: string;
  testName: string;
  testCode?: string;
  result: string;
  unit?: string;
  referenceRange?: string;
  isAbnormal: boolean;
  severity?: 'NORMAL' | 'MILD' | 'MODERATE' | 'CRITICAL';
  testedAt: string;
  notes?: string;
  createdAt: string;
}
