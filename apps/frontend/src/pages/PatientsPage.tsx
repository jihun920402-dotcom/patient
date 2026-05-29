import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { patientService } from '@/services/patientService';
import { calcAge, genderLabel, insuranceLabel, formatDate, cn, statusColor } from '@/lib/utils';
import type { CreatePatientDto } from '@hospital-ms/shared';

const patientSchema = z.object({
  name: z.string().min(1, '이름을 입력하세요'),
  birthDate: z.string().min(1, '생년월일을 입력하세요'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  phone: z.string().min(1, '연락처를 입력하세요'),
  email: z.string().email('올바른 이메일').optional().or(z.literal('')),
  address: z.string().optional(),
  insuranceType: z.enum(['HEALTH_INSURANCE', 'MEDICAL_AID_1', 'MEDICAL_AID_2', 'UNINSURED']),
  insuranceNo: z.string().optional(),
  bloodType: z.string().optional(),
  allergies: z.string().optional(),
  specialNotes: z.string().optional(),
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional(),
  guardianRelation: z.string().optional(),
});

type FormData = z.infer<typeof patientSchema>;

export function PatientsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [openCreate, setOpenCreate] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['patients', { page, search }],
    queryFn: () => patientService.list({ page, limit: 15, search: search || undefined }),
    placeholderData: (prev) => prev,
  });

  const createMutation = useMutation({
    mutationFn: (dto: CreatePatientDto) => patientService.create(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['patients'] });
      setOpenCreate(false);
      reset();
    },
  });

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, setValue, watch } = useForm<FormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: { gender: 'MALE', insuranceType: 'HEALTH_INSURANCE' },
  });

  const onSubmit = (data: FormData) => {
    createMutation.mutate({
      ...data,
      email: data.email || undefined,
    } as CreatePatientDto);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">환자 관리</h1>
        <Button onClick={() => setOpenCreate(true)}>
          <Plus className="h-4 w-4 mr-1" /> 신규 환자 등록
        </Button>
      </div>

      {/* 검색 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="이름, 환자번호, 전화번호로 검색"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {/* 테이블 */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">환자번호</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">이름</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">생년월일(나이)</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">성별</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">연락처</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">보험</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">최근 방문</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">불러오는 중...</td></tr>
                ) : !data?.patients.length ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">검색 결과가 없습니다</td></tr>
                ) : (
                  data.patients.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b hover:bg-muted/30 cursor-pointer transition-colors"
                      onClick={() => navigate(`/patients/${p.id}`)}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.patientNo}</td>
                      <td className="px-4 py-3 font-medium">{p.name}</td>
                      <td className="px-4 py-3">{formatDate(p.birthDate)} <span className="text-muted-foreground">({calcAge(p.birthDate)}세)</span></td>
                      <td className="px-4 py-3">{genderLabel(p.gender)}</td>
                      <td className="px-4 py-3">{p.phone}</td>
                      <td className="px-4 py-3"><span className="text-xs">{insuranceLabel(p.insuranceType)}</span></td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{p.lastVisitDate ? formatDate(p.lastVisitDate) : '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 페이지네이션 */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <span className="text-sm text-muted-foreground">총 {data.total}명</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">{page} / {data.totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page === data.totalPages}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 환자 등록 다이얼로그 */}
      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>신규 환자 등록</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>이름 *</Label>
                <Input {...register('name')} placeholder="홍길동" />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>생년월일 *</Label>
                <Input type="date" {...register('birthDate')} />
                {errors.birthDate && <p className="text-xs text-destructive">{errors.birthDate.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>성별 *</Label>
                <Select onValueChange={(v) => setValue('gender', v as 'MALE' | 'FEMALE' | 'OTHER')} defaultValue="MALE">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">남성</SelectItem>
                    <SelectItem value="FEMALE">여성</SelectItem>
                    <SelectItem value="OTHER">기타</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>연락처 *</Label>
                <Input {...register('phone')} placeholder="010-0000-0000" />
                {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>이메일</Label>
                <Input type="email" {...register('email')} placeholder="example@email.com" />
              </div>
              <div className="space-y-1">
                <Label>혈액형</Label>
                <Select onValueChange={(v) => setValue('bloodType', v)}>
                  <SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger>
                  <SelectContent>
                    {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 col-span-2">
                <Label>주소</Label>
                <Input {...register('address')} placeholder="주소를 입력하세요" />
              </div>
              <div className="space-y-1">
                <Label>보험 종류 *</Label>
                <Select onValueChange={(v) => setValue('insuranceType', v as FormData['insuranceType'])} defaultValue="HEALTH_INSURANCE">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HEALTH_INSURANCE">건강보험</SelectItem>
                    <SelectItem value="MEDICAL_AID_1">의료급여 1종</SelectItem>
                    <SelectItem value="MEDICAL_AID_2">의료급여 2종</SelectItem>
                    <SelectItem value="UNINSURED">비급여</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>보험증번호</Label>
                <Input {...register('insuranceNo')} />
              </div>
              <div className="space-y-1 col-span-2">
                <Label>알레르기</Label>
                <Input {...register('allergies')} placeholder="페니실린, 아스피린 등" />
              </div>
              <div className="space-y-1 col-span-2">
                <Label>특이사항</Label>
                <Input {...register('specialNotes')} placeholder="병력, 주의사항 등" />
              </div>
              <div className="col-span-2 border-t pt-4">
                <p className="text-sm font-medium mb-3">보호자 정보</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label>보호자 이름</Label>
                    <Input {...register('guardianName')} />
                  </div>
                  <div className="space-y-1">
                    <Label>보호자 연락처</Label>
                    <Input {...register('guardianPhone')} />
                  </div>
                  <div className="space-y-1">
                    <Label>관계</Label>
                    <Input {...register('guardianRelation')} placeholder="부, 모, 배우자 등" />
                  </div>
                </div>
              </div>
            </div>

            {createMutation.error && (
              <p className="text-sm text-destructive">
                {(createMutation.error as { response?: { data?: { error?: string } } })?.response?.data?.error || '등록 실패'}
              </p>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setOpenCreate(false); reset(); }}>취소</Button>
              <Button type="submit" disabled={isSubmitting || createMutation.isPending}>
                {createMutation.isPending ? '등록 중...' : '등록'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
