import { api } from './api';
import type { Invoice, CreateInvoiceDto, CreatePaymentDto } from '@hospital-ms/shared';

export const billingService = {
  async list(params: { page?: number; limit?: number; patientId?: string; status?: string }) {
    const { data } = await api.get('/billing', { params });
    return data as { invoices: Invoice[]; total: number };
  },

  async findById(id: string): Promise<Invoice> {
    const { data } = await api.get(`/billing/${id}`);
    return data;
  },

  async create(dto: CreateInvoiceDto): Promise<Invoice> {
    const { data } = await api.post('/billing', dto);
    return data;
  },

  async addPayment(id: string, dto: Omit<CreatePaymentDto, 'invoiceId'>) {
    const { data } = await api.post(`/billing/${id}/payments`, dto);
    return data;
  },

  async getStats() {
    const { data } = await api.get('/billing/stats');
    return data as { total: number; paid: number; pending: number; totalRevenue: number; unpaidAmount: number };
  },
};
