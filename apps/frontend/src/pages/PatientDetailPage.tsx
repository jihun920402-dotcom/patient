import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, User, Phone, MapPin, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { patientService } from '@/services/patientService';
import { emrService } from '@/services/emrService';
import { prescriptionService } from '@/services/prescriptionService';
import { billingService } from '@/services/billingService';
import { calcAge, formatDate, formatDateTime, formatCurrency, genderLabel, insuranceLabel, statusLabel, statusColor, cn } from '@/lib/utils';
import { useState } from 'react';

type Tab = 'info' | 'emr' | 'prescriptions' | 'billing';

export function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('info');

  const { data: patient, isLoading } = useQuery({
    queryKey: ['patient', id],
    queryFn: () => patientService.findById(id!),
    enabled: !!id,
  });

  const { data: records } = useQuery({
    queryKey: ['emr', 'patient', id],
    queryFn: () => emrService.listByPatient(id!),
    enabled: !!id && tab === 'emr',
  });

  const { data: prescriptions } = useQuery({
    queryKey: ['prescriptions', { patientId: id }],
    queryFn: () => prescriptionService.list({ patientId: id }),
    enabled: !!id && tab === 'prescriptions',
  });

  const { data: invoices } = useQuery({
    queryKey: ['billing', { patientId: id }],
    queryFn: () => billingService.list({ patientId: id }),
    enabled: !!id && tab === 'billing',
  });

  if (isLoading) return <div className="flex items-center justify-center h-64 text-muted-foreground">불러오는 중...</div>;
  if (!patient) return <div className="flex items-center justify-center h-64 text-muted-foreground">환자를 찾을 수 없습니다</div>;

  const tabs: { key: Tab; label: string }[] = [
    { key: 'info', label: '기본 정보' },
    { key: 'emr', label: '진료 이력' },
    { key: 'prescriptions', label: '처방전' },
    { key: 'billing', label: '수납 내역' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{patient.name}</h1>
          <p className="text-sm text-muted-foreground">{patient.patientNo}</p>
        </div>
      </div>

      {/* 환자 요약 카드 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-6 text-sm">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>{genderLabel(patient.gender)} · {calcAge(patient.birthDate)}세 ({formatDate(patient.birthDate)})</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{patient.phone}</span>
            </div>
            {patient.address && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{patient.address}</span>
              </div>
            )}
            {patient.bloodType && (
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-muted-foreground" />
                <span>{patient.bloodType}</span>
              </div>
            )}
            <div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                {insuranceLabel(patient.insuranceType)}
              </span>
            </div>
            {patient.allergies && (
              <div className="text-orange-600 text-xs font-medium">⚠ 알레르기: {patient.allergies}</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 탭 */}
      <div className="flex border-b gap-1">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
              tab === key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 탭 콘텐츠 */}
      {tab === 'info' && (
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-base">기본 정보</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              {[
                ['이름', patient.name],
                ['환자번호', patient.patientNo],
                ['생년월일', formatDate(patient.birthDate)],
                ['성별', genderLabel(patient.gender)],
                ['연락처', patient.phone],
                ['이메일', patient.email || '-'],
                ['주소', patient.address || '-'],
                ['혈액형', patient.bloodType || '-'],
                ['알레르기', patient.allergies || '-'],
                ['특이사항', patient.specialNotes || '-'],
              ].map(([label, value]) => (
                <div key={label} className="flex">
                  <span className="w-24 text-muted-foreground">{label}</span>
                  <span>{value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">보험 / 보호자</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              {[
                ['보험 종류', insuranceLabel(patient.insuranceType)],
                ['보험증번호', patient.insuranceNo || '-'],
                ['초진일', formatDate(patient.firstVisitDate)],
                ['최근 방문', patient.lastVisitDate ? formatDate(patient.lastVisitDate) : '-'],
                ['보호자 이름', patient.guardianName || '-'],
                ['보호자 연락처', patient.guardianPhone || '-'],
                ['관계', patient.guardianRelation || '-'],
              ].map(([label, value]) => (
                <div key={label} className="flex">
                  <span className="w-28 text-muted-foreground">{label}</span>
                  <span>{value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {tab === 'emr' && (
        <div className="space-y-3">
          {!records?.length ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">진료 기록이 없습니다</CardContent></Card>
          ) : records.map((record) => (
            <Card key={record.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium text-sm">{formatDateTime(record.visitDate)}</p>
                    <p className="text-xs text-muted-foreground">{record.recordNo} · {record.doctorName}</p>
                  </div>
                  <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', statusColor(record.status))}>
                    {statusLabel(record.status)}
                  </span>
                </div>
                {record.subjective && <p className="text-sm"><span className="font-medium">S:</span> {record.subjective}</p>}
                {record.assessment && <p className="text-sm mt-1"><span className="font-medium">A:</span> {record.assessment}</p>}
                {record.plan && <p className="text-sm mt-1"><span className="font-medium">P:</span> {record.plan}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {tab === 'prescriptions' && (
        <div className="space-y-3">
          {!prescriptions?.prescriptions.length ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">처방전이 없습니다</CardContent></Card>
          ) : prescriptions.prescriptions.map((presc) => (
            <Card key={presc.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-sm">{formatDateTime(presc.issuedAt)}</p>
                  <span className={cn('text-xs px-2 py-0.5 rounded-full', presc.dispensedAt ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700')}>
                    {presc.dispensedAt ? '조제 완료' : '미조제'}
                  </span>
                </div>
                <div className="space-y-1">
                  {presc.items.map((item) => (
                    <div key={item.id} className="text-sm flex gap-2">
                      <span className="font-medium">{item.medication?.name}</span>
                      <span className="text-muted-foreground">{item.dosage} / {item.frequency} / {item.duration}일</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {tab === 'billing' && (
        <div className="space-y-3">
          {!invoices?.invoices.length ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">수납 내역이 없습니다</CardContent></Card>
          ) : invoices.invoices.map((inv) => (
            <Card key={inv.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{inv.invoiceNo}</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(inv.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(inv.patientAmt)}</p>
                    <span className={cn('text-xs px-2 py-0.5 rounded-full', statusColor(inv.status))}>
                      {statusLabel(inv.status)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
