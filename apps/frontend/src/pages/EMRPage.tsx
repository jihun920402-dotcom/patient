import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Save, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { patientService } from '@/services/patientService';
import { emrService } from '@/services/emrService';
import { useAuthStore } from '@/stores/authStore';
import { formatDateTime, statusLabel, statusColor, cn } from '@/lib/utils';
import type { MedicalRecord, ICD10Code } from '@hospital-ms/shared';

export function EMRPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedPatientName, setSelectedPatientName] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [openNew, setOpenNew] = useState(false);
  const [icdSearch, setIcdSearch] = useState('');

  const { data: patients } = useQuery({
    queryKey: ['patients-emr', patientSearch],
    queryFn: () => patientService.list({ page: 1, limit: 20, search: patientSearch }),
    enabled: patientSearch.length >= 1,
  });

  const { data: records } = useQuery({
    queryKey: ['emr', 'patient', selectedPatientId],
    queryFn: () => emrService.listByPatient(selectedPatientId),
    enabled: !!selectedPatientId,
  });

  const { data: icdResults } = useQuery({
    queryKey: ['icd10', icdSearch],
    queryFn: () => emrService.searchICD10(icdSearch),
    enabled: icdSearch.length >= 2,
  });

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<{
    subjective: string; objective: string; assessment: string; plan: string;
    bp?: string; pulse?: string; temp?: string; spo2?: string;
  }>();

  const createMutation = useMutation({
    mutationFn: (data: Parameters<typeof emrService.create>[0]) => emrService.create(data),
    onSuccess: (record) => {
      qc.invalidateQueries({ queryKey: ['emr', 'patient', selectedPatientId] });
      setSelectedRecord(record);
      setOpenNew(false);
      reset();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof emrService.update>[1] }) =>
      emrService.update(id, data),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ['emr', 'patient', selectedPatientId] });
      setSelectedRecord(updated);
    },
  });

  const addDiagnosisMutation = useMutation({
    mutationFn: ({ recordId, code }: { recordId: string; code: ICD10Code }) =>
      emrService.addDiagnosis(recordId, code.id, !selectedRecord?.diagnoses?.length),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['emr', 'patient', selectedPatientId] });
      setIcdSearch('');
    },
  });

  const onSave = (data: { subjective: string; objective: string; assessment: string; plan: string; bp?: string; pulse?: string; temp?: string; spo2?: string }) => {
    if (!selectedRecord) return;
    const vitalSigns = { bp: data.bp, pulse: data.pulse ? Number(data.pulse) : undefined, temperature: data.temp ? Number(data.temp) : undefined, spo2: data.spo2 ? Number(data.spo2) : undefined };
    updateMutation.mutate({ id: selectedRecord.id, data: { subjective: data.subjective, objective: data.objective, assessment: data.assessment, plan: data.plan, vitalSigns } });
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">진료 기록 (EMR)</h1>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* 환자 검색 + 기록 목록 */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="환자 이름 검색" value={patientSearch} onChange={(e) => setPatientSearch(e.target.value)} />
          </div>
          {patients?.patients.length ? (
            <div className="border rounded-md divide-y">
              {patients.patients.map((p) => (
                <button key={p.id} type="button" className={cn('w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors', selectedPatientId === p.id && 'bg-muted')}
                  onClick={() => { setSelectedPatientId(p.id); setSelectedPatientName(p.name); setPatientSearch(''); setSelectedRecord(null); }}>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.patientNo} · {p.phone}</p>
                </button>
              ))}
            </div>
          ) : null}

          {selectedPatientId && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-sm">{selectedPatientName} 진료 이력</p>
                <Button size="sm" onClick={() => setOpenNew(true)}><Plus className="h-3 w-3 mr-1" />새 기록</Button>
              </div>
              <div className="space-y-2">
                {!records?.length ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">기록 없음</p>
                ) : records.map((r) => (
                  <button key={r.id} type="button"
                    className={cn('w-full text-left border rounded-md p-3 text-sm hover:bg-muted transition-colors', selectedRecord?.id === r.id && 'border-primary bg-primary/5')}
                    onClick={() => setSelectedRecord(r)}>
                    <div className="flex justify-between items-center">
                      <p className="font-medium">{formatDateTime(r.visitDate)}</p>
                      <span className={cn('text-xs px-1.5 py-0.5 rounded', statusColor(r.status))}>{statusLabel(r.status)}</span>
                    </div>
                    {r.assessment && <p className="text-muted-foreground text-xs mt-1 truncate">A: {r.assessment}</p>}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* SOAP 에디터 */}
        <div className="lg:col-span-2">
          {!selectedRecord ? (
            <Card>
              <CardContent className="py-16 text-center text-muted-foreground">
                환자를 선택하고 진료 기록을 선택하거나 새로 작성하세요
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>{selectedRecord.recordNo} — {formatDateTime(selectedRecord.visitDate)}</span>
                  <Button size="sm" onClick={handleSubmit(onSave)} disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                    저장
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 활력징후 */}
                <div>
                  <p className="text-sm font-semibold mb-2 text-muted-foreground">활력징후 (Vital Signs)</p>
                  <div className="grid grid-cols-4 gap-2">
                    {([
                      { label: '혈압', vKey: 'bp', placeholder: '120/80', field: register('bp') },
                      { label: '맥박', vKey: 'pulse', placeholder: '72', field: register('pulse') },
                      { label: '체온', vKey: 'temp', placeholder: '36.5', field: register('temp') },
                      { label: 'SpO2', vKey: 'spo2', placeholder: '98', field: register('spo2') },
                    ] as const).map(({ label, vKey, placeholder, field }) => (
                      <div key={label} className="space-y-1">
                        <Label className="text-xs">{label}</Label>
                        <Input className="h-8 text-sm" placeholder={placeholder} defaultValue={(selectedRecord.vitalSigns as Record<string, unknown>)?.[vKey] as string} {...field} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* SOAP */}
                {[
                  { key: 'subjective', label: 'S — Subjective (주호소)', placeholder: '환자가 호소하는 증상...', name: 'subjective' as const },
                  { key: 'objective', label: 'O — Objective (객관적 소견)', placeholder: '이학적 검사, 활력징후 소견...', name: 'objective' as const },
                  { key: 'assessment', label: 'A — Assessment (진단적 평가)', placeholder: '진단명, 감별진단...', name: 'assessment' as const },
                  { key: 'plan', label: 'P — Plan (치료 계획)', placeholder: '처방, 처치, 교육 내용...', name: 'plan' as const },
                ].map(({ key, label, placeholder, name }) => (
                  <div key={key} className="space-y-1">
                    <Label className="text-sm font-semibold">{label}</Label>
                    <Textarea className="min-h-[80px]" placeholder={placeholder} defaultValue={(selectedRecord[key as keyof typeof selectedRecord] ?? '') as string} {...register(name)} />
                  </div>
                ))}

                {/* 진단명 */}
                <div>
                  <p className="text-sm font-semibold mb-2">진단명 (ICD-10)</p>
                  <div className="relative">
                    <Input placeholder="진단명 또는 코드 검색 (예: J06, 감기)" value={icdSearch} onChange={(e) => setIcdSearch(e.target.value)} />
                    {icdResults?.length ? (
                      <div className="absolute z-10 w-full border rounded-md bg-background shadow-lg mt-1 max-h-40 overflow-y-auto">
                        {icdResults.map((code) => (
                          <button key={code.id} type="button" className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                            onClick={() => addDiagnosisMutation.mutate({ recordId: selectedRecord.id, code })}>
                            <span className="font-mono text-xs text-muted-foreground mr-2">{code.code}</span>
                            {code.descriptionKo || code.descriptionEn}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  {selectedRecord.diagnoses?.length ? (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedRecord.diagnoses.map((d) => (
                        <span key={d.id} className={cn('text-xs px-2 py-1 rounded-full border', d.isPrimary ? 'bg-primary/10 border-primary text-primary' : 'bg-muted')}>
                          {d.isPrimary && '주 '}
                          {d.icd10Code?.code} {d.icd10Code?.descriptionKo}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>

                {/* 완료 처리 */}
                {selectedRecord.status === 'DRAFT' && (
                  <Button variant="outline" className="w-full"
                    onClick={() => updateMutation.mutate({ id: selectedRecord.id, data: { status: 'COMPLETED' } })}>
                    진료 기록 완료 처리
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* 새 진료 기록 생성 */}
      <Dialog open={openNew} onOpenChange={setOpenNew}>
        <DialogContent>
          <DialogHeader><DialogTitle>새 진료 기록 생성</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">환자: <strong>{selectedPatientName}</strong></p>
          <p className="text-sm text-muted-foreground">담당의: <strong>{user?.name}</strong></p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenNew(false)}>취소</Button>
            <Button onClick={() => {
              if (!selectedPatientId || !user) return;
              createMutation.mutate({ patientId: selectedPatientId, doctorId: user.id });
            }} disabled={createMutation.isPending}>
              {createMutation.isPending ? '생성 중...' : '기록 생성'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
