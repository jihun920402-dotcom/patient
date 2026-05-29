import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Hospital, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { api } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';
import type { LoginResponse } from '@hospital-ms/shared';

const schema = z.object({
  email: z.string().email('올바른 이메일을 입력하세요'),
  password: z.string().min(6, '비밀번호는 6자 이상이어야 합니다'),
});

type FormData = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: 'admin@hospital.com', password: 'admin1234!' },
  });

  const onSubmit = async (data: FormData) => {
    setError('');
    try {
      const res = await api.post<LoginResponse>('/auth/login', data);
      setAuth(res.data.user, res.data.accessToken, res.data.refreshToken);
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || '이메일 또는 비밀번호가 올바르지 않습니다');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40">
      <div className="w-full max-w-md px-4">
        {/* 로고 */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4">
            <Hospital className="h-9 w-9 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">Hospital MS</h1>
          <p className="text-muted-foreground text-sm mt-1">병원 환자관리 시스템</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>로그인</CardTitle>
            <CardDescription>계정 정보를 입력하세요</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">이메일</Label>
                <Input id="email" type="email" placeholder="이메일을 입력하세요" {...register('email')} />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">비밀번호</Label>
                <Input id="password" type="password" placeholder="비밀번호를 입력하세요" {...register('password')} />
                {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
              </div>
              {error && (
                <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                로그인
              </Button>
            </form>

            {/* 테스트 계정 안내 */}
            <div className="mt-6 rounded-md bg-muted/60 p-3 text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">테스트 계정</p>
              <p>관리자: admin@hospital.com / admin1234!</p>
              <p>의사: kim@hospital.com / doctor1234!</p>
              <p>원무: reception@hospital.com / recep1234!</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
