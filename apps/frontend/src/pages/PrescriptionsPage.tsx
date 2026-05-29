import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Loader2 } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { prescriptionService } from '@/services/prescriptionService';
import { patientService } from '@/services/patientService';
import { useAuthStore } from '@/stores/authStore';
import { formatDateTime, cn } from '@/lib/utils';
import type { CreatePrescriptionDto, Medication } from '@hospital-ms/shared';

interface PrescFormData {
  patientId: string;
  items: { medicationId: string; medicationName: string; dosage: string; frequency: string; duration: number; quantity: number; instructions: string; }[];
  notes: string;
}

export function PrescriptionsPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [openCreate, setOpenCreate] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');
  const [medSearch, setMedSearch] = useState('');
  const [addingItemIdx, setAddingItemIdx] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['prescriptions', { page }],
    queryFn: () => prescriptionService.list({ page, limit: 20 }),
  });

  const { data: patients } = useQuery({
    queryKey: ['patients-presc', patientSearch],
    queryFn: () => patientService.list({ page: 1, limit: 10, search: patientSearch }),
    enabled: openCreate && patientSearch.length >= 1,
  });

  const { data: medications } = useQuery({
    queryKey: ['medications', medSearch],
    queryFn: () => prescriptionService.searchMedications({ search: medSearch }),
    enabled: medSearch.length >= 1,
  });

  const { register, handleSubmit, control, setValue, watch, reset } = useForm<PrescFormData>({
    defaultValues: { items: [{ medicationId: '', medicationName: '', dosage: '1정', frequency: '1일 3회 식후', duration: 7, quantity: 21, instructions: '' }], notes: '' },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const createMutation = useMutation({
    mutationFn: (dto: CreatePrescriptionDto) => prescriptionService.create(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['prescriptions'] });
      setOpenCreate(false);
      reset();
      setPatientSearch('');
    },
  });

  const dispenseMutation = useMutation({
    mutationFn: (id: string) => prescriptionService.dispense(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['prescriptions'] }),
  });

  const patientId = watch('patientId');

  const onSubmit = (data: PrescFormData) => {
    if (!user) return;
    createMutation.mutate({
      patientId: data.patientId,
      doctorId: user.id,
      notes: data.notes || undefined,
      items: data.items.map(({ medicationId, dosage, frequency, duration, quantity, instructions }) => ({
        medicationId, dosage, frequency, duration, quantity, instructions: instructions || undefined,
      })),
    });
  };

  const selectMedication = (idx: number, med: Medication) => {
    setValue(`items.${idx}.medicationId`, med.id);
    setValue(`items.${idx}.medicationName`, med.name);
    setValue(`items.${idx}.dosage`, '1정');
    setMedSearch('');
    setAddingItemIdx(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">처방전 관리</h1>
        <Button onClick={() => setOpenCreate(true)}>
          <Plus className="h-4 w-4 mr-1" /> 처방전 발행
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">처방번호</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">환자</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">처방 의사</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">발행일시</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">약품 수</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">조제 상태</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">불러오는 중...</td></tr>
                ) : !data?.prescriptions.length ? (
                  <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">처방전이 없습니다</td></tr>
                ) : data.prescriptions.map((p) => (
                  <tr key={p.id} className="border-b">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.prescriptionNo}</td>
                    <td className="px-4 py-3 font-medium">{p.patientName}</td>
                    <td className="px-4 py-3">{p.doctorName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDateTime(p.issuedAt)}</td>
                    <td className="px-4 py-3">{p.items.length}종</td>
                    <td className="px-4 py-3">
                      <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', p.dispensedAt ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700')}>
                        {p.dispensedAt ? `조제 완료 (${formatDateTime(p.dispensedAt)})` : '미조제'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {!p.dispensedAt && user?.role === 'PHARMACIST' && (
                        <Button size="sm" variant="outline" onClick={() => dispenseMutation.mutate(p.id)} disabled={dispenseMutation.isPending}>
                          조제 처리
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 처방전 발행 다이얼로그 */}
      <Dialog open={openCreate} onOpenChange={(o) => { setOpenCreate(o); if (!o) { reset(); setPatientSearch(''); } }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>처방전 발행</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <Label>환자 선택 *</Label>
              <Input placeholder="이름 또는 전화번호 검색" value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)} />
              {patients?.patients.length ? (
                <div className="border rounded-md max-h-32 overflow-y-auto">
                  {patients.patients.map((p) => (
                    <button key={p.id} type="button" className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                      onClick={() => { setValue('patientId', p.id); setPatientSearch(`${p.name} (${p.patientNo})`); }}>
                      {p.name} ({p.patientNo}) — {p.phone}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            {/* 약품 목록 */}
            <div className="space-y-3">
              <Label>처방 약품</Label>
              {fields.map((field, idx) => (
                <div key={field.id} className="border rounded-md p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">약품 {idx + 1}</p>
                    {fields.length > 1 && <Button type="button" variant="ghost" size="sm" className="h-6 text-xs" onClick={() => remove(idx)}>삭제</Button>}
                  </div>
                  <div className="space-y-1">
                    <div className="relative">
                      <Input placeholder="약품명 검색" value={addingItemIdx === idx ? medSearch : watch(`items.${idx}.medicationName`) || ''}
                        onChange={(e) => { setMedSearch(e.target.value); setAddingItemIdx(idx); }}
                        onFocus={() => setAddingItemIdx(idx)} />
                      {addingItemIdx === idx && medications?.length ? (
                        <div className="absolute z-10 w-full border rounded-md bg-background shadow-lg mt-1 max-h-32 overflow-y-auto">
                          {medications.map((med) => (
                            <button key={med.id} type="button" className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                              onClick={() => selectMedication(idx, med)}>
                              {med.name} <span className="text-muted-foreground text-xs">({med.genericName})</span>
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-sm">
                    <div className="space-y-1">
                      <Label className="text-xs">용량</Label>
                      <Input className="h-8" {...register(`items.${idx}.dosage`)} placeholder="1정" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">용법</Label>
                      <Input className="h-8" {...register(`items.${idx}.frequency`)} placeholder="1일 3회 식후" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">일수</Label>
                      <Input className="h-8" type="number" {...register(`items.${idx}.duration`, { valueAsNumber: true })} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">수량</Label>
                      <Input className="h-8" type="number" {...register(`items.${idx}.quantity`, { valueAsNumber: true })} />
                    </div>
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" className="w-full"
                onClick={() => append({ medicationId: '', medicationName: '', dosage: '1정', frequency: '1일 3회 식후', duration: 7, quantity: 21, instructions: '' })}>
                <Plus className="h-4 w-4 mr-1" /> 약품 추가
              </Button>
            </div>

            <div className="space-y-1">
              <Label>메모</Label>
              <Input {...register('notes')} placeholder="복약 지도, 주의사항" />
            </div>

            {createMutation.error && (
              <p className="text-sm text-destructive">
                {(createMutation.error as {response?: {data?: {error?: string}}})?.response?.data?.error || '발행 실패'}
              </p>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpenCreate(false)}>취소</Button>
              <Button type="submit" disabled={createMutation.isPending || !patientId}>
                {createMutation.isPending ? '발행 중...' : '처방전 발행'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
