import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { billingService } from '@/services/billingService';
import { patientService } from '@/services/patientService';
import { formatDateTime, formatCurrency, statusLabel, statusColor, cn } from '@/lib/utils';
import type { CreateInvoiceDto, CreatePaymentDto } from '@hospital-ms/shared';

interface InvoiceFormData {
  patientId: string;
  items: { description: string; category: string; quantity: number; unitPrice: number }[];
  insuranceAmt: number;
  discountAmt: number;
  notes: string;
}

export function BillingPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [openCreate, setOpenCreate] = useState(false);
  const [openPayment, setOpenPayment] = useState<string | null>(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<'CASH' | 'CARD' | 'INSURANCE' | 'MIXED'>('CARD');

  const { data, isLoading } = useQuery({
    queryKey: ['billing', { page, statusFilter }],
    queryFn: () => billingService.list({ page, limit: 20, status: statusFilter || undefined }),
  });

  const { data: stats } = useQuery({
    queryKey: ['billing', 'stats'],
    queryFn: () => billingService.getStats(),
  });

  const { data: patients } = useQuery({
    queryKey: ['patients-billing', patientSearch],
    queryFn: () => patientService.list({ page: 1, limit: 10, search: patientSearch }),
    enabled: openCreate && patientSearch.length >= 1,
  });

  const { register, handleSubmit, control, setValue, watch, reset } = useForm<InvoiceFormData>({
    defaultValues: {
      items: [{ description: '초진진찰료', category: '진찰료', quantity: 1, unitPrice: 15000 }],
      insuranceAmt: 0, discountAmt: 0, notes: '',
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const items = watch('items');
  const totalAmount = items.reduce((sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0), 0);
  const insuranceAmt = Number(watch('insuranceAmt') || 0);
  const discountAmt = Number(watch('discountAmt') || 0);
  const patientAmt = totalAmount - insuranceAmt - discountAmt;

  const createMutation = useMutation({
    mutationFn: (dto: CreateInvoiceDto) => billingService.create(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['billing'] });
      setOpenCreate(false);
      reset();
      setPatientSearch('');
    },
  });

  const paymentMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Omit<CreatePaymentDto, 'invoiceId'> }) =>
      billingService.addPayment(id, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['billing'] });
      setOpenPayment(null);
      setPayAmount('');
    },
  });

  const onSubmit = (data: InvoiceFormData) => {
    createMutation.mutate({
      patientId: data.patientId,
      notes: data.notes || undefined,
      insuranceAmt: Number(data.insuranceAmt),
      discountAmt: Number(data.discountAmt),
      items: data.items.map((item) => ({
        description: item.description,
        category: item.category as CreateInvoiceDto['items'][0]['category'],
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
      })),
    });
  };

  const selectedInvoice = data?.invoices.find((i) => i.id === openPayment);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">수납 / 청구 관리</h1>
        <Button onClick={() => setOpenCreate(true)}>
          <Plus className="h-4 w-4 mr-1" /> 청구서 생성
        </Button>
      </div>

      {/* 통계 */}
      {stats && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: '전체', value: stats.total + '건' },
            { label: '미납', value: stats.pending + '건', className: 'text-orange-600' },
            { label: '완납', value: stats.paid + '건', className: 'text-green-600' },
            { label: '총 수납액', value: formatCurrency(stats.totalRevenue), className: 'text-primary' },
          ].map(({ label, value, className }) => (
            <Card key={label}>
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className={cn('text-xl font-bold mt-1', className)}>{value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 필터 */}
      <div className="flex gap-2">
        {[['', '전체'], ['PENDING', '미납'], ['PARTIAL', '부분납'], ['PAID', '완납']].map(([v, l]) => (
          <Button key={v} size="sm" variant={statusFilter === v ? 'default' : 'outline'} onClick={() => setStatusFilter(v)}>
            {l}
          </Button>
        ))}
      </div>

      {/* 청구서 테이블 */}
      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">청구번호</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">환자</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">청구 총액</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">보험 부담</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">환자 부담</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">상태</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">날짜</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={8} className="py-8 text-center text-muted-foreground">불러오는 중...</td></tr>
              ) : !data?.invoices.length ? (
                <tr><td colSpan={8} className="py-8 text-center text-muted-foreground">청구서가 없습니다</td></tr>
              ) : data.invoices.map((inv) => (
                <tr key={inv.id} className="border-b hover:bg-muted/20">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{inv.invoiceNo}</td>
                  <td className="px-4 py-3 font-medium">{inv.patientName}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(inv.totalAmount)}</td>
                  <td className="px-4 py-3 text-right text-blue-600">{formatCurrency(inv.insuranceAmt)}</td>
                  <td className="px-4 py-3 text-right font-bold">{formatCurrency(inv.patientAmt)}</td>
                  <td className="px-4 py-3">
                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', statusColor(inv.status))}>
                      {statusLabel(inv.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{formatDateTime(inv.createdAt)}</td>
                  <td className="px-4 py-3">
                    {inv.status !== 'PAID' && (
                      <Button size="sm" variant="outline" onClick={() => { setOpenPayment(inv.id); setPayAmount(String(inv.patientAmt - inv.payments.reduce((s, p) => s + p.amount, 0))); }}>
                        수납
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* 청구서 생성 다이얼로그 */}
      <Dialog open={openCreate} onOpenChange={(o) => { setOpenCreate(o); if (!o) { reset(); setPatientSearch(''); } }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>청구서 생성</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <Label>환자 *</Label>
              <Input placeholder="이름 또는 번호 검색" value={patientSearch} onChange={(e) => setPatientSearch(e.target.value)} />
              {patients?.patients.length ? (
                <div className="border rounded-md max-h-32 overflow-y-auto">
                  {patients.patients.map((p) => (
                    <button key={p.id} type="button" className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                      onClick={() => { setValue('patientId', p.id); setPatientSearch(`${p.name} (${p.patientNo})`); }}>
                      {p.name} ({p.patientNo})
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            {/* 청구 항목 */}
            <div className="space-y-2">
              <Label>청구 항목</Label>
              {fields.map((field, idx) => (
                <div key={field.id} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-4 space-y-1">
                    <Label className="text-xs">항목명</Label>
                    <Input className="h-8 text-sm" {...register(`items.${idx}.description`)} />
                  </div>
                  <div className="col-span-3 space-y-1">
                    <Label className="text-xs">분류</Label>
                    <Select onValueChange={(v) => setValue(`items.${idx}.category`, v)} defaultValue="진찰료">
                      <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['진찰료', '검사료', '처치료', '약제비', '입원료', '기타'].map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-1 space-y-1">
                    <Label className="text-xs">수량</Label>
                    <Input className="h-8 text-sm" type="number" {...register(`items.${idx}.quantity`, { valueAsNumber: true })} />
                  </div>
                  <div className="col-span-3 space-y-1">
                    <Label className="text-xs">단가(원)</Label>
                    <Input className="h-8 text-sm" type="number" {...register(`items.${idx}.unitPrice`, { valueAsNumber: true })} />
                  </div>
                  <div className="col-span-1">
                    {fields.length > 1 && <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => remove(idx)}>×</Button>}
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm"
                onClick={() => append({ description: '', category: '기타', quantity: 1, unitPrice: 0 })}>
                <Plus className="h-4 w-4 mr-1" />항목 추가
              </Button>
            </div>

            {/* 합계 */}
            <div className="border rounded-md p-3 space-y-2 bg-muted/30">
              <div className="flex justify-between text-sm">
                <span>소계</span><span>{formatCurrency(totalAmount)}</span>
              </div>
              <div className="flex items-center gap-3">
                <Label className="text-sm w-24">보험 부담금</Label>
                <Input className="h-8 w-36" type="number" {...register('insuranceAmt', { valueAsNumber: true })}
                  defaultValue={Math.round(totalAmount * 0.7)} />
              </div>
              <div className="flex items-center gap-3">
                <Label className="text-sm w-24">할인금액</Label>
                <Input className="h-8 w-36" type="number" {...register('discountAmt', { valueAsNumber: true })} />
              </div>
              <div className="flex justify-between font-bold text-sm border-t pt-2">
                <span>환자 부담금</span><span>{formatCurrency(Math.max(0, patientAmt))}</span>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpenCreate(false)}>취소</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? '생성 중...' : '청구서 생성'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 수납 다이얼로그 */}
      <Dialog open={!!openPayment} onOpenChange={(o) => !o && setOpenPayment(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>수납 처리</DialogTitle></DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="text-sm space-y-1">
                <div className="flex justify-between"><span>환자</span><span className="font-medium">{selectedInvoice.patientName}</span></div>
                <div className="flex justify-between"><span>환자 부담금</span><span className="font-bold">{formatCurrency(selectedInvoice.patientAmt)}</span></div>
                <div className="flex justify-between"><span>기납부</span><span>{formatCurrency(selectedInvoice.payments.reduce((s, p) => s + p.amount, 0))}</span></div>
                <div className="flex justify-between border-t pt-1 font-bold"><span>미납금</span>
                  <span className="text-orange-600">{formatCurrency(selectedInvoice.patientAmt - selectedInvoice.payments.reduce((s, p) => s + p.amount, 0))}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>수납 금액</Label>
                  <Input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>결제 방법</Label>
                  <Select onValueChange={(v) => setPayMethod(v as typeof payMethod)} defaultValue="CARD">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CARD">카드</SelectItem>
                      <SelectItem value="CASH">현금</SelectItem>
                      <SelectItem value="INSURANCE">보험 청구</SelectItem>
                      <SelectItem value="MIXED">혼합</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenPayment(null)}>취소</Button>
            <Button
              disabled={!payAmount || paymentMutation.isPending}
              onClick={() => {
                if (!openPayment || !payAmount) return;
                paymentMutation.mutate({ id: openPayment, dto: { amount: Number(payAmount), method: payMethod } });
              }}>
              {paymentMutation.isPending ? '처리 중...' : '수납 완료'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
