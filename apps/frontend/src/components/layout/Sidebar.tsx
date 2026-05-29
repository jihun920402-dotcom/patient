import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  FileText,
  Pill,
  CreditCard,
  Menu,
  Hospital,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/uiStore';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: '대시보드' },
  { to: '/patients', icon: Users, label: '환자 관리' },
  { to: '/appointments', icon: CalendarDays, label: '예약 관리' },
  { to: '/emr', icon: FileText, label: '진료 기록' },
  { to: '/prescriptions', icon: Pill, label: '처방전' },
  { to: '/billing', icon: CreditCard, label: '수납/청구' },
];

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  return (
    <aside
      className={cn(
        'flex flex-col border-r bg-card transition-all duration-300',
        sidebarCollapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* 로고 */}
      <div className="flex h-16 items-center border-b px-4">
        <Hospital className="h-7 w-7 text-primary flex-shrink-0" />
        {!sidebarCollapsed && (
          <span className="ml-2 font-bold text-lg tracking-tight">Hospital MS</span>
        )}
        <button
          onClick={toggleSidebar}
          className="ml-auto p-1 rounded hover:bg-accent transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* 네비게이션 */}
      <nav className="flex-1 overflow-y-auto py-4">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 mx-2 mb-1 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )
            }
          >
            <Icon className="h-5 w-5 flex-shrink-0" />
            {!sidebarCollapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
