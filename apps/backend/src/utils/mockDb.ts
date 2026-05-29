// In-memory database for development without PostgreSQL
// Each array acts as a table. Replace service layer with Prisma when DB is ready.

import bcrypt from 'bcryptjs';
import type {
  User,
  Patient,
  Department,
  Appointment,
  MedicalRecord,
  ICD10Code,
  RecordDiagnosis,
  LabResult,
  Medication,
  Prescription,
  PrescriptionItem,
  Invoice,
  InvoiceItem,
  Payment,
} from '@hospital-ms/shared';

const now = () => new Date().toISOString();
export const uid = () => crypto.randomUUID();

// ── Counters ──────────────────────────────────────────────────────
let _patientCnt = 5;
let _appointmentCnt = 3;
let _recordCnt = 2;
let _prescriptionCnt = 2;
let _invoiceCnt = 2;

export const nextPatientNo = () =>
  `P-${new Date().getFullYear()}${String(++_patientCnt).padStart(5, '0')}`;
export const nextAppointmentNo = () =>
  `A-${new Date().getFullYear()}${String(++_appointmentCnt).padStart(5, '0')}`;
export const nextRecordNo = () =>
  `R-${new Date().getFullYear()}${String(++_recordCnt).padStart(5, '0')}`;
export const nextPrescriptionNo = () =>
  `RX-${new Date().getFullYear()}${String(++_prescriptionCnt).padStart(5, '0')}`;
export const nextInvoiceNo = () =>
  `INV-${new Date().getFullYear()}${String(++_invoiceCnt).padStart(5, '0')}`;

// ── Departments ───────────────────────────────────────────────────
export const departments: Department[] = [
  { id: 'dept-1', name: '내과', code: 'IM', isActive: true, createdAt: now() },
  { id: 'dept-2', name: '외과', code: 'GS', isActive: true, createdAt: now() },
  { id: 'dept-3', name: '소아과', code: 'PD', isActive: true, createdAt: now() },
  { id: 'dept-4', name: '정형외과', code: 'OS', isActive: true, createdAt: now() },
  { id: 'dept-5', name: '신경과', code: 'NR', isActive: true, createdAt: now() },
  { id: 'dept-6', name: '피부과', code: 'DM', isActive: true, createdAt: now() },
];

// ── Users ─────────────────────────────────────────────────────────
// 기본 계정: admin@hospital.com / admin1234!  |  kim@hospital.com / doctor1234!
export const users: (User & { password: string })[] = [
  {
    id: 'user-admin-1',
    email: 'admin@hospital.com',
    password: bcrypt.hashSync('admin1234!', 10),
    name: '관리자',
    role: 'ADMIN',
    isActive: true,
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: 'user-doctor-1',
    email: 'kim@hospital.com',
    password: bcrypt.hashSync('doctor1234!', 10),
    name: '김민준',
    role: 'DOCTOR',
    licenseNo: 'MD-12345',
    departmentId: 'dept-1',
    phone: '010-1234-5678',
    isActive: true,
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: 'user-doctor-2',
    email: 'lee@hospital.com',
    password: bcrypt.hashSync('doctor1234!', 10),
    name: '이서연',
    role: 'DOCTOR',
    licenseNo: 'MD-23456',
    departmentId: 'dept-2',
    phone: '010-2345-6789',
    isActive: true,
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: 'user-nurse-1',
    email: 'nurse@hospital.com',
    password: bcrypt.hashSync('nurse1234!', 10),
    name: '박지현',
    role: 'NURSE',
    departmentId: 'dept-1',
    isActive: true,
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: 'user-recep-1',
    email: 'reception@hospital.com',
    password: bcrypt.hashSync('recep1234!', 10),
    name: '정수아',
    role: 'RECEPTIONIST',
    isActive: true,
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: 'user-pharm-1',
    email: 'pharm@hospital.com',
    password: bcrypt.hashSync('pharm1234!', 10),
    name: '최약사',
    role: 'PHARMACIST',
    isActive: true,
    createdAt: now(),
    updatedAt: now(),
  },
];

// ── Patients ──────────────────────────────────────────────────────
export const patients: Patient[] = [
  {
    id: 'patient-1',
    patientNo: 'P-202400001',
    name: '홍길동',
    birthDate: '1980-05-15',
    gender: 'MALE',
    phone: '010-1111-2222',
    email: 'hong@example.com',
    address: '서울시 강남구 테헤란로 123',
    insuranceType: 'HEALTH_INSURANCE',
    insuranceNo: 'HI-123456',
    bloodType: 'A+',
    allergies: '페니실린',
    isActive: true,
    firstVisitDate: '2024-01-10',
    lastVisitDate: '2024-11-20',
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: 'patient-2',
    patientNo: 'P-202400002',
    name: '김영희',
    birthDate: '1995-08-22',
    gender: 'FEMALE',
    phone: '010-3333-4444',
    email: 'kim@example.com',
    address: '서울시 서초구 반포대로 56',
    insuranceType: 'HEALTH_INSURANCE',
    bloodType: 'O+',
    isActive: true,
    firstVisitDate: '2024-03-05',
    lastVisitDate: '2024-12-01',
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: 'patient-3',
    patientNo: 'P-202400003',
    name: '박철수',
    birthDate: '1965-12-01',
    gender: 'MALE',
    phone: '010-5555-6666',
    address: '경기도 수원시 팔달구 효원로 100',
    insuranceType: 'MEDICAL_AID_1',
    bloodType: 'B+',
    specialNotes: '고혈압, 당뇨 병력',
    isActive: true,
    firstVisitDate: '2023-06-15',
    lastVisitDate: '2024-12-03',
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: 'patient-4',
    patientNo: 'P-202400004',
    name: '이미래',
    birthDate: '2010-03-14',
    gender: 'FEMALE',
    phone: '010-7777-8888',
    email: 'lee@example.com',
    guardianName: '이진우',
    guardianPhone: '010-9999-0000',
    guardianRelation: '부',
    insuranceType: 'HEALTH_INSURANCE',
    bloodType: 'AB-',
    isActive: true,
    firstVisitDate: '2024-09-10',
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: 'patient-5',
    patientNo: 'P-202400005',
    name: '정도현',
    birthDate: '1975-07-30',
    gender: 'MALE',
    phone: '010-2222-3333',
    address: '서울시 마포구 홍익로 23',
    insuranceType: 'HEALTH_INSURANCE',
    bloodType: 'A-',
    allergies: '아스피린, 설파제',
    isActive: true,
    firstVisitDate: '2024-02-28',
    lastVisitDate: '2024-11-15',
    createdAt: now(),
    updatedAt: now(),
  },
];

// ── Appointments ──────────────────────────────────────────────────
const today = new Date().toISOString().split('T')[0];
export const appointments: Appointment[] = [
  {
    id: 'appt-1',
    appointmentNo: 'A-202400001',
    patientId: 'patient-1',
    patientName: '홍길동',
    patientNo: 'P-202400001',
    doctorId: 'user-doctor-1',
    doctorName: '김민준',
    departmentId: 'dept-1',
    departmentName: '내과',
    scheduledAt: `${today}T09:00:00.000Z`,
    duration: 20,
    status: 'SCHEDULED',
    queueNo: 1,
    visitType: 'OUTPATIENT',
    chiefComplaint: '두통, 어지러움',
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: 'appt-2',
    appointmentNo: 'A-202400002',
    patientId: 'patient-2',
    patientName: '김영희',
    patientNo: 'P-202400002',
    doctorId: 'user-doctor-1',
    doctorName: '김민준',
    departmentId: 'dept-1',
    departmentName: '내과',
    scheduledAt: `${today}T10:00:00.000Z`,
    duration: 20,
    status: 'WAITING',
    queueNo: 2,
    visitType: 'REVISIT',
    chiefComplaint: '복통',
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: 'appt-3',
    appointmentNo: 'A-202400003',
    patientId: 'patient-3',
    patientName: '박철수',
    patientNo: 'P-202400003',
    doctorId: 'user-doctor-2',
    doctorName: '이서연',
    departmentId: 'dept-2',
    departmentName: '외과',
    scheduledAt: `${today}T14:00:00.000Z`,
    duration: 30,
    status: 'SCHEDULED',
    queueNo: 1,
    visitType: 'OUTPATIENT',
    chiefComplaint: '무릎 통증',
    createdAt: now(),
    updatedAt: now(),
  },
];

// ── Medical Records ───────────────────────────────────────────────
export const medicalRecords: MedicalRecord[] = [
  {
    id: 'record-1',
    recordNo: 'R-202400001',
    patientId: 'patient-1',
    patientName: '홍길동',
    doctorId: 'user-doctor-1',
    doctorName: '김민준',
    appointmentId: 'appt-1',
    subjective: '2주 전부터 두통과 어지러움 호소. 혈압이 높다고 느낌.',
    objective: '혈압 145/92, 맥박 78, 체온 36.5°C',
    assessment: '본태성 고혈압 의심',
    plan: '항고혈압제 처방, 1주 후 재진',
    vitalSigns: { bp: '145/92', pulse: 78, temperature: 36.5, spo2: 98 },
    status: 'COMPLETED',
    visitDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    diagnoses: [],
    labResults: [],
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: 'record-2',
    recordNo: 'R-202400002',
    patientId: 'patient-3',
    patientName: '박철수',
    doctorId: 'user-doctor-1',
    doctorName: '김민준',
    subjective: '공복 혈당 수치 높음. 다뇨, 다음, 피로감.',
    objective: '공복혈당 185mg/dL, HbA1c 8.2%',
    assessment: '제2형 당뇨병',
    plan: '메트포르민 처방, 식이조절 교육, 4주 후 재진',
    vitalSigns: { bp: '130/85', pulse: 82, temperature: 36.7, spo2: 97 },
    status: 'COMPLETED',
    visitDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    diagnoses: [],
    labResults: [],
    createdAt: now(),
    updatedAt: now(),
  },
];

// ── ICD-10 Codes ──────────────────────────────────────────────────
export const icd10Codes: ICD10Code[] = [
  { id: 'icd-1', code: 'I10', descriptionEn: 'Essential hypertension', descriptionKo: '본태성 고혈압', category: 'I00-I99' },
  { id: 'icd-2', code: 'E11', descriptionEn: 'Type 2 diabetes mellitus', descriptionKo: '제2형 당뇨병', category: 'E00-E89' },
  { id: 'icd-3', code: 'J06.9', descriptionEn: 'Acute upper respiratory infection', descriptionKo: '급성 상기도 감염', category: 'J00-J99' },
  { id: 'icd-4', code: 'K29.7', descriptionEn: 'Gastritis, unspecified', descriptionKo: '상세불명의 위염', category: 'K00-K93' },
  { id: 'icd-5', code: 'M54.5', descriptionEn: 'Low back pain', descriptionKo: '요통', category: 'M00-M99' },
  { id: 'icd-6', code: 'J18.9', descriptionEn: 'Pneumonia, unspecified', descriptionKo: '상세불명의 폐렴', category: 'J00-J99' },
  { id: 'icd-7', code: 'R51', descriptionEn: 'Headache', descriptionKo: '두통', category: 'R00-R99' },
  { id: 'icd-8', code: 'A09', descriptionEn: 'Gastroenteritis', descriptionKo: '위장염', category: 'A00-B99' },
  { id: 'icd-9', code: 'F32.9', descriptionEn: 'Major depressive disorder', descriptionKo: '주요우울장애', category: 'F00-F99' },
  { id: 'icd-10', code: 'N39.0', descriptionEn: 'Urinary tract infection', descriptionKo: '요로감염', category: 'N00-N99' },
];

export const recordDiagnoses: RecordDiagnosis[] = [];
export const labResults: LabResult[] = [];

// ── Medications ───────────────────────────────────────────────────
export const medications: Medication[] = [
  { id: 'med-1', code: 'MED001', name: '타이레놀 500mg', genericName: '아세트아미노펜', manufacturer: '한국얀센', category: '해열진통제', form: '정제', strength: '500mg', unit: '정', stockCount: 1000, minStockAlert: 100, unitPrice: 50, requiresPrescription: false, isActive: true, createdAt: now(), updatedAt: now() },
  { id: 'med-2', code: 'MED002', name: '아모잘탄정 5/100mg', genericName: '암로디핀/로살탄', manufacturer: '한미약품', category: '항고혈압제', form: '정제', strength: '5/100mg', unit: '정', stockCount: 500, minStockAlert: 50, unitPrice: 380, requiresPrescription: true, isActive: true, createdAt: now(), updatedAt: now() },
  { id: 'med-3', code: 'MED003', name: '메트포르민 500mg', genericName: '메트포르민', manufacturer: '대원제약', category: '당뇨약', form: '정제', strength: '500mg', unit: '정', stockCount: 800, minStockAlert: 80, unitPrice: 60, requiresPrescription: true, isActive: true, createdAt: now(), updatedAt: now() },
  { id: 'med-4', code: 'MED004', name: '아목시실린 250mg', genericName: '아목시실린', manufacturer: '유한양행', category: '항생제', form: '캡슐', strength: '250mg', unit: '캡슐', stockCount: 600, minStockAlert: 60, unitPrice: 120, requiresPrescription: true, isActive: true, createdAt: now(), updatedAt: now() },
  { id: 'med-5', code: 'MED005', name: '판토록정 40mg', genericName: '판토프라졸', manufacturer: '동아에스티', category: '위산억제제', form: '정제', strength: '40mg', unit: '정', stockCount: 400, minStockAlert: 40, unitPrice: 200, requiresPrescription: true, isActive: true, createdAt: now(), updatedAt: now() },
  { id: 'med-6', code: 'MED006', name: '이부프로펜 400mg', genericName: '이부프로펜', manufacturer: '종근당', category: '소염진통제', form: '정제', strength: '400mg', unit: '정', stockCount: 750, minStockAlert: 75, unitPrice: 80, requiresPrescription: false, isActive: true, createdAt: now(), updatedAt: now() },
  { id: 'med-7', code: 'MED007', name: '세티리진 10mg', genericName: '세티리진', manufacturer: '한독', category: '항히스타민제', form: '정제', strength: '10mg', unit: '정', stockCount: 350, minStockAlert: 35, unitPrice: 95, requiresPrescription: false, isActive: true, createdAt: now(), updatedAt: now() },
  { id: 'med-8', code: 'MED008', name: '아토르바스타틴 20mg', genericName: '아토르바스타틴', manufacturer: '화이자', category: '고지혈증약', form: '정제', strength: '20mg', unit: '정', stockCount: 300, minStockAlert: 30, unitPrice: 250, requiresPrescription: true, isActive: true, createdAt: now(), updatedAt: now() },
];

export const prescriptions: (Prescription & { items: (PrescriptionItem & { medication?: Medication })[] })[] = [
  {
    id: 'presc-1',
    prescriptionNo: 'RX-202400001',
    patientId: 'patient-1',
    patientName: '홍길동',
    doctorId: 'user-doctor-1',
    doctorName: '김민준',
    medicalRecordId: 'record-1',
    issuedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    notes: '혈압약은 매일 아침 식후 복용',
    items: [
      { id: 'pi-1', prescriptionId: 'presc-1', medicationId: 'med-2', dosage: '1정', frequency: '1일 1회 아침 식후', duration: 30, quantity: 30, medication: medications[1] },
    ],
    createdAt: now(),
    updatedAt: now(),
  },
];

// ── Invoices ──────────────────────────────────────────────────────
export const invoices: (Invoice & { items: InvoiceItem[]; payments: Payment[] })[] = [
  {
    id: 'inv-1',
    invoiceNo: 'INV-202400001',
    patientId: 'patient-1',
    patientName: '홍길동',
    totalAmount: 25000,
    insuranceAmt: 17500,
    patientAmt: 7500,
    discountAmt: 0,
    status: 'PAID',
    notes: '',
    items: [
      { id: 'ii-1', invoiceId: 'inv-1', description: '초진진찰료', category: '진찰료', quantity: 1, unitPrice: 15000, totalPrice: 15000 },
      { id: 'ii-2', invoiceId: 'inv-1', description: '혈압약 처방', category: '약제비', quantity: 1, unitPrice: 10000, totalPrice: 10000 },
    ],
    payments: [
      { id: 'pay-1', invoiceId: 'inv-1', amount: 7500, method: 'CARD', paidAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
    ],
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: 'inv-2',
    invoiceNo: 'INV-202400002',
    patientId: 'patient-3',
    patientName: '박철수',
    totalAmount: 45000,
    insuranceAmt: 31500,
    patientAmt: 13500,
    discountAmt: 0,
    status: 'PENDING',
    items: [
      { id: 'ii-3', invoiceId: 'inv-2', description: '재진진찰료', category: '진찰료', quantity: 1, unitPrice: 10000, totalPrice: 10000 },
      { id: 'ii-4', invoiceId: 'inv-2', description: '혈당검사', category: '검사료', quantity: 1, unitPrice: 20000, totalPrice: 20000 },
      { id: 'ii-5', invoiceId: 'inv-2', description: '당뇨약 처방', category: '약제비', quantity: 1, unitPrice: 15000, totalPrice: 15000 },
    ],
    payments: [],
    createdAt: now(),
    updatedAt: now(),
  },
];

// ── Refresh Tokens ────────────────────────────────────────────────
export const refreshTokens: { token: string; userId: string; expiresAt: Date }[] = [];
