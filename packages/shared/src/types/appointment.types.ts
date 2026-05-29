export type AppointmentStatus =
  | 'SCHEDULED'
  | 'WAITING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export type VisitType = 'OUTPATIENT' | 'EMERGENCY' | 'REVISIT';

export interface Appointment {
  id: string;
  appointmentNo: string;
  patientId: string;
  patientName?: string;
  patientNo?: string;
  doctorId: string;
  doctorName?: string;
  departmentId: string;
  departmentName?: string;
  scheduledAt: string;
  duration: number;
  status: AppointmentStatus;
  queueNo?: number;
  visitType: VisitType;
  chiefComplaint?: string;
  notes?: string;
  cancelReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAppointmentDto {
  patientId: string;
  doctorId: string;
  departmentId: string;
  scheduledAt: string;
  duration?: number;
  visitType?: VisitType;
  chiefComplaint?: string;
  notes?: string;
}

export type UpdateAppointmentDto = Partial<CreateAppointmentDto> & {
  status?: AppointmentStatus;
  cancelReason?: string;
};

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
}
