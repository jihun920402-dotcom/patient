import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, differenceInYears } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calcAge(birthDate: string): number {
  return differenceInYears(new Date(), new Date(birthDate));
}

export function formatDate(date: string | Date, fmt = 'yyyy-MM-dd'): string {
  return format(new Date(date), fmt);
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), 'yyyy-MM-dd HH:mm');
}

export function formatCurrency(amount: number): string {
  return amount.toLocaleString('ko-KR') + '원';
}

export function genderLabel(gender: string): string {
  return gender === 'MALE' ? '남' : gender === 'FEMALE' ? '여' : '기타';
}

export function insuranceLabel(type: string): string {
  const map: Record<string, string> = {
    HEALTH_INSURANCE: '건강보험',
    MEDICAL_AID_1: '의료급여 1종',
    MEDICAL_AID_2: '의료급여 2종',
    UNINSURED: '비급여',
  };
  return map[type] || type;
}

export function statusLabel(status: string): string {
  const map: Record<string, string> = {
    SCHEDULED: '예약',
    WAITING: '대기',
    IN_PROGRESS: '진료중',
    COMPLETED: '완료',
    CANCELLED: '취소',
    NO_SHOW: '노쇼',
    DRAFT: '작성중',
    AMENDED: '수정됨',
    PENDING: '미납',
    PARTIAL: '부분납',
    PAID: '완납',
    REFUNDED: '환불',
  };
  return map[status] || status;
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    SCHEDULED: 'bg-blue-100 text-blue-800',
    WAITING: 'bg-yellow-100 text-yellow-800',
    IN_PROGRESS: 'bg-purple-100 text-purple-800',
    COMPLETED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
    NO_SHOW: 'bg-gray-100 text-gray-800',
    DRAFT: 'bg-gray-100 text-gray-700',
    PENDING: 'bg-orange-100 text-orange-800',
    PARTIAL: 'bg-yellow-100 text-yellow-800',
    PAID: 'bg-green-100 text-green-800',
    REFUNDED: 'bg-red-100 text-red-800',
  };
  return map[status] || 'bg-gray-100 text-gray-600';
}
