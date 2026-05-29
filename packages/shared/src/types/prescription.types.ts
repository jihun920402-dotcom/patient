export interface Medication {
  id: string;
  code: string;
  name: string;
  genericName?: string;
  manufacturer?: string;
  category: string;
  form: string;
  strength?: string;
  unit: string;
  stockCount: number;
  minStockAlert: number;
  unitPrice: number;
  requiresPrescription: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PrescriptionItem {
  id: string;
  prescriptionId: string;
  medicationId: string;
  medication?: Medication;
  dosage: string;
  frequency: string;
  duration: number;
  quantity: number;
  instructions?: string;
}

export interface Prescription {
  id: string;
  prescriptionNo: string;
  patientId: string;
  patientName?: string;
  doctorId: string;
  doctorName?: string;
  medicalRecordId?: string;
  issuedAt: string;
  dispensedAt?: string;
  dispensedBy?: string;
  notes?: string;
  items: PrescriptionItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePrescriptionDto {
  patientId: string;
  doctorId: string;
  medicalRecordId?: string;
  notes?: string;
  items: {
    medicationId: string;
    dosage: string;
    frequency: string;
    duration: number;
    quantity: number;
    instructions?: string;
  }[];
}
