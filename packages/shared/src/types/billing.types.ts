export type PaymentMethod = 'CASH' | 'CARD' | 'INSURANCE' | 'MIXED';
export type PaymentStatus = 'PENDING' | 'PARTIAL' | 'PAID' | 'REFUNDED';

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  description: string;
  category: '진찰료' | '검사료' | '처치료' | '약제비' | '입원료' | '기타';
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  transactionId?: string;
  paidAt: string;
  receivedBy?: string;
  notes?: string;
}

export interface Invoice {
  id: string;
  invoiceNo: string;
  patientId: string;
  patientName?: string;
  totalAmount: number;
  insuranceAmt: number;
  patientAmt: number;
  discountAmt: number;
  status: PaymentStatus;
  dueDate?: string;
  notes?: string;
  items: InvoiceItem[];
  payments: Payment[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvoiceDto {
  patientId: string;
  dueDate?: string;
  notes?: string;
  items: {
    description: string;
    category: InvoiceItem['category'];
    quantity: number;
    unitPrice: number;
  }[];
  insuranceAmt?: number;
  discountAmt?: number;
}

export interface CreatePaymentDto {
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  transactionId?: string;
  receivedBy?: string;
  notes?: string;
}
