export type Role = 'ADMIN' | 'DOCTOR' | 'NURSE' | 'RECEPTIONIST' | 'PHARMACIST';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  licenseNo?: string;
  departmentId?: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface TokenPayload {
  sub: string;
  email: string;
  role: Role;
  name: string;
}
