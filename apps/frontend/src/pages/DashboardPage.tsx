import { useQuery } from '@tanstack/react-query';
import { Users, CalendarDays, Pill, CreditCard, TrendingUp, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { patientService } from '@/services/patientService';
import { appointmentService } from '@/services/appointmentService';
import { billingService } from '@/services/billingService';
import { formatCurrency, formatDateTime, statusLabel, statusColor, cn } from '@/lib/utils';

function StatCard({
  title, value, icon: Icon, description, color,
}: { title: string; value: string | number; icon: React.ElementType; description?: string; color: string }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
          </div>
          <div className={cn('flex h-12 w-12 items-center justify-center rounded-full', color)}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const today = new Date().toISOString().split('T')[0];

  const { data: patientsData } = useQuery({
    queryKey: ['patients', { page: 1, limit: 1 }],
    queryFn: () => patientService.list({ page: 1, limit: 1 }),
  });

  const { data: todayAppts } = useQuery({
    queryKey: ['appointments', { date: today, limit: 10 }],
    queryFn: () => appointmentService.list({ date: today, limit: 10, page: 1 }),
  });

  const { data: billingStats } = useQuery({
    queryKey: ['billing', 'stats'],
    queryFn: () => billingService.getStats(),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">대시보드</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
        </p>
      </div>

      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="전체 환자"
          value={patientsData?.total ?? '-'}
          icon={Users}
          description="등록된 환자 수"
          color="bg-blue-500"
        />
        <StatCard
          title="오늘 예약"
          value={todayAppts?.total ?? '-'}
          icon={CalendarDays}
          description={`대기 ${todayAppts?.appointments.filter((a) => a.status === 'WAITING').length ?? 0}명`}
          color="bg-purple-500"
        />
        <StatCard
          title="미납 청구서"
          value={billingStats?.pending ?? '-'}
          icon={CreditCard}
          description={billingStats ? `미수금 ${formatCurrency(billingStats.unpaidAmount)}` : ''}
          color="bg-orange-500"
        />
        <StatCard
          title="총 수납액"
          value={billingStats ? formatCurrency(billingStats.totalRevenue) : '-'}
          icon={TrendingUp}
          description="누적 수납"
          color="bg-green-500"
        />
      </div>

      {/* 오늘의 예약 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-5 w-5" />
            오늘의 예약
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!todayAppts?.appointments.length ? (
            <p className="text-sm text-muted-foreground py-8 text-center">오늘 예약이 없습니다</p>
          ) : (
            <div className="space-y-3">
              {todayAppts.appointments.map((appt) => (
                <div
                  key={appt.id}
                  className="flex items-center justify-between rounded-md border p-3 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-muted-foreground w-12">
                      {new Date(appt.scheduledAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <div>
                      <span className="font-medium">{appt.patientName}</span>
                      <span className="text-muted-foreground ml-2">({appt.patientNo})</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-xs">{appt.doctorName} · {appt.departmentName}</span>
                    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', statusColor(appt.status))}>
                      {statusLabel(appt.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
