import { invoices, patients, nextInvoiceNo, uid, saveSnapshot } from '../../utils/mockDb';
import { Errors } from '../../utils/errors';
import type { Invoice, CreateInvoiceDto, CreatePaymentDto, Payment } from '@hospital-ms/shared';

const now = () => new Date().toISOString();

export const billingService = {
  list(params: { page: number; limit: number; patientId?: string; status?: string }) {
    let filtered = [...invoices];
    if (params.patientId) filtered = filtered.filter((i) => i.patientId === params.patientId);
    if (params.status) filtered = filtered.filter((i) => i.status === params.status);
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = filtered.length;
    const start = (params.page - 1) * params.limit;
    return { invoices: filtered.slice(start, start + params.limit), total, page: params.page, limit: params.limit };
  },

  findById(id: string): Invoice {
    const inv = invoices.find((i) => i.id === id);
    if (!inv) throw Errors.NotFound('청구서');
    return inv;
  },

  create(data: CreateInvoiceDto): Invoice {
    const patient = patients.find((p) => p.id === data.patientId && p.isActive);
    if (!patient) throw Errors.NotFound('환자');

    const items = data.items.map((item) => ({
      id: uid(),
      invoiceId: '',
      description: item.description,
      category: item.category,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.quantity * item.unitPrice,
    }));

    const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const insuranceAmt = data.insuranceAmt || Math.round(totalAmount * 0.7);
    const discountAmt = data.discountAmt || 0;
    const patientAmt = totalAmount - insuranceAmt - discountAmt;

    const newInvoice: Invoice = {
      id: uid(),
      invoiceNo: nextInvoiceNo(),
      patientId: data.patientId,
      patientName: patient.name,
      totalAmount,
      insuranceAmt,
      patientAmt,
      discountAmt,
      status: 'PENDING',
      dueDate: data.dueDate,
      notes: data.notes,
      items: [],
      payments: [],
      createdAt: now(),
      updatedAt: now(),
    };

    newInvoice.items = items.map((item) => ({ ...item, invoiceId: newInvoice.id }));
    invoices.push(newInvoice as typeof invoices[0]);
    saveSnapshot();
    return newInvoice;
  },

  addPayment(data: CreatePaymentDto): { invoice: Invoice; payment: Payment } {
    const idx = invoices.findIndex((i) => i.id === data.invoiceId);
    if (idx === -1) throw Errors.NotFound('청구서');

    const invoice = invoices[idx];
    if (invoice.status === 'PAID') throw Errors.Conflict('이미 완납된 청구서입니다');

    const payment: Payment = {
      id: uid(),
      invoiceId: data.invoiceId,
      amount: data.amount,
      method: data.method,
      transactionId: data.transactionId,
      paidAt: now(),
      receivedBy: data.receivedBy,
      notes: data.notes,
    };

    const allPayments = [...invoice.payments, payment];
    const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);

    let status: Invoice['status'] = 'PARTIAL';
    if (totalPaid >= invoice.patientAmt) status = 'PAID';

    invoices[idx] = {
      ...invoice,
      payments: allPayments,
      status,
      updatedAt: now(),
    };

    saveSnapshot();
    return { invoice: invoices[idx], payment };
  },

  getStats() {
    const total = invoices.length;
    const paid = invoices.filter((i) => i.status === 'PAID').length;
    const pending = invoices.filter((i) => i.status === 'PENDING').length;
    const totalRevenue = invoices
      .flatMap((i) => i.payments)
      .reduce((sum, p) => sum + p.amount, 0);
    const unpaidAmount = invoices
      .filter((i) => i.status !== 'PAID')
      .reduce((sum, i) => sum + i.patientAmt - i.payments.reduce((s, p) => s + p.amount, 0), 0);

    return { total, paid, pending, totalRevenue, unpaidAmount };
  },
};
