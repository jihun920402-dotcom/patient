import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { appointmentService } from '@/services/appointmentService';
import { patientService } from '@/services/patientService';
import { formatDate, statusLabel, statusColor, cn } from '@/lib/utils';
import type { CreateAppointmentDto } from '@hospital-ms/shared';

const schema = z.object({
  patientId: z.string().min(1, '환자를 선택하세요'),
  doctorId: z.string().min(1, '의사를 선택하세요'),
  departmentId: z.string().min(1, '진료과를 선택하세요'),
  scheduledAt: z.string().min(1, '예약 일시를 입력하세요'),
  visitType: z.enum(['OUTPATIENT', 'EMERGENCY', 'REVISIT']),
  chiefComplaint: z.string().optional(),
  duration: z.number().optional(),
});

type FormData = z.infer<typeof schema>;

export function AppointmentsPage() {
  const qc = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [openCreate, setOpenCreate] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['appointments', { date: selectedDate }],
    queryFn: () => appointmentService.list({ date: selectedDate, limit: 100, page: 1 }),
  });

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: () => appointmentService.getDepartments(),
  });

  const { data: patients } = useQuery({
    queryKey: ['patients-search', patientSearch],
    queryFn: () => patientService.list({ page: 1, limit: 20, search: patientSearch || undefined }),
    enabled: openCreate,
  });

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { visitType: 'OUTPATIENT', duration: 20 },
  });

  const deptId = watch('departmentId');
  const { data: doctors } = useQuery({
    queryKey: ['doctors', deptId],
    queryFn: () => appointmentService.getDoctors(deptId),
    enabled: !!deptId && openCreate,
  });

  const createMutation = useMutation({
    mutationFn: (dto: CreateAppointmentDto) => appointmentService.create(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
      setOpenCreate(false);
      reset();
    },
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => appointmentService.cancel(id, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  });

  const prevDay = () => setSelectedDate(d => { const dt = new Date(d); dt.setDate(dt.getDate() - 1); return dt.toISOString().split('T')[0]; });
  const nextDay = () => setSelectedDate(d => { const dt = new Date(d); dt.setDate(dt.getDate() + 1); return dt.toISOString().split('T')[0]; });

  const statusGroups = [
    { status: 'WAITING', label: '대기중', color: 'border-l-yellow-400' },
    { status: 'IN_PROGRESS', label: '진료중', color: 'border-l-purple-400' },
    { status: 'SCHEDULED', label: '예약', color: 'border-l-blue-400' },
    { status: 'COMPLETED', label: '완료', color: 'border-l-green-400' },
    { status: 'CANCELLED', label: '취소', color: 'border-l-gray-300' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">예약 관리</h1>
        <Button onClick={() => setOpenCreate(true)}>
          <Plus className="h-4 w-4 mr-1" /> 예약 생성
        </Button>
      </div>

      {/* 날짜 선택 */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={prevDay}><ChevronLeft className="h-4 w-4" /></Button>
        <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-44" />
        <Button variant="outline" size="icon" onClick={nextDay}><ChevronRight className="h-4 w-4" /></Button>
        <Button variant="outline" size="sm" onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}>오늘</Button>
        <span className="text-sm text-muted-foreground ml-2">총 {data?.total ?? 0}건</span>
      </div>

      {/* 예약 리스트 */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : !data?.appointments.length ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">해당 날짜에 예약이 없습니다</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {data.appointments.map((appt) => {
            const group = statusGroups.find((g) => g.status === appt.status);
            return (
              <Card key={appt.id} className={cn('border-l-4', group?.color || 'border-l-gray-200')}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4 items-start">
                      <div className="text-center min-w-[50px]">
                        <p className="text-lg font-bold font-mono">
                          {new Date(appt.scheduledAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        {appt.queueNo && <p className="text-xs text-muted-foreground">#{appt.queueNo}</p>}
                      </div>
                      <div>
                        <p className="font-medium">{appt.patientName} <span className="text-xs text-muted-foreground">({appt.patientNo})</span></p>
                        <p className="text-sm text-muted-foreground">{appt.departmentName} · {appt.doctorName}</p>
                        {appt.chiefComplaint && <p className="text-sm mt-1 text-foreground/70">주소: {appt.chiefComplaint}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', statusColor(appt.status))}>
                        {statusLabel(appt.status)}
                      </span>
                      {!['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(appt.status) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive h-7"
                          onClick={() => { if (confirm('예약을 취소하시겠습니까?')) cancelMutation.mutate({ id: appt.id }); }}
                        >
                          취소
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* 예약 생성 다이얼로그 */}
      <Dialog open={openCreate} onOpenChange={(o) => { setOpenCreate(o); if (!o) reset(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>예약 생성</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit((d) => createMutation.mutate(d as CreateAppointmentDto))} className="space-y-4">
            <div className="space-y-1">
              <Label>환자 검색 *</Label>
              <Input placeholder="이름 또는 전화번호로 검색" value={patientSearch} onChange={(e) => setPatientSearch(e.target.value)} />
              {patients?.patients.length ? (
                <div className="border rounded-md max-h-32 overflow-y-auto mt-1">
                  {patients.patients.map((p) => (
                    <button key={p.id} type="button" className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                      onClick={() => { setValue('patientId', p.id); setPatientSearch(`${p.name} (${p.patientNo})`); }}>
                      {p.name} ({p.patientNo}) — {p.phone}
                    </button>
                  ))}
                </div>
              ) : null}
              {errors.patientId && <p className="text-xs text-destructive">{errors.patientId.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>진료과 *</Label>
              <Select onValueChange={(v) => { setValue('departmentId', v); setValue('doctorId', ''); }}>
                <SelectTrigger><SelectValue placeholder="진료과 선택" /></SelectTrigger>
                <SelectContent>{departments?.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
              </Select>
              {errors.departmentId && <p className="text-xs text-destructive">{errors.departmentId.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>담당 의사 *</Label>
              <Select onValueChange={(v) => setValue('doctorId', v)} disabled={!deptId}>
                <SelectTrigger><SelectValue placeholder="의사 선택" /></SelectTrigger>
                <SelectContent>{doctors?.map((d: {id: string; name: string}) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
              </Select>
              {errors.doctorId && <p className="text-xs text-destructive">{errors.doctorId.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>예약 일시 *</Label>
                <Input type="datetime-local" {...register('scheduledAt')} />
                {errors.scheduledAt && <p className="text-xs text-destructive">{errors.scheduledAt.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>방문 유형</Label>
                <Select onValueChange={(v) => setValue('visitType', v as 'OUTPATIENT' | 'EMERGENCY' | 'REVISIT')} defaultValue="OUTPATIENT">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OUTPATIENT">외래</SelectItem>
                    <SelectItem value="REVISIT">재진</SelectItem>
                    <SelectItem value="EMERGENCY">응급</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>주소증</Label>
              <Input {...register('chiefComplaint')} placeholder="두통, 복통 등" />
            </div>
            {createMutation.error && (
              <p className="text-sm text-destructive">
                {(createMutation.error as {response?: {data?: {error?: string}}})?.response?.data?.error || '생성 실패'}
              </p>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpenCreate(false)}>취소</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? '생성 중...' : '예약 생성'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
