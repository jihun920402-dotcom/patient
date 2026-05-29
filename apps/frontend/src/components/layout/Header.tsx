import { LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { api } from '@/services/api';

const roleLabels: Record<string, string> = {
  ADMIN: '관리자',
  DOCTOR: '의사',
  NURSE: '간호사',
  RECEPTIONIST: '원무',
  PHARMACIST: '약사',
};

export function Header() {
  const { user, refreshToken, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout', { refreshToken });
    } catch {
      // silent
    } finally {
      logout();
      navigate('/login');
    }
  };

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-6">
      <div />
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{user?.name}</span>
          <span className="text-muted-foreground">({roleLabels[user?.role || ''] || user?.role})</span>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-1" />
          로그아웃
        </Button>
      </div>
    </header>
  );
}
