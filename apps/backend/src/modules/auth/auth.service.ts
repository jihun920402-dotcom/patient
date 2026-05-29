import bcrypt from 'bcryptjs';
import { users, refreshTokens } from '../../utils/mockDb';
import { Errors } from '../../utils/errors';
import type { LoginRequest, LoginResponse, User, TokenPayload } from '@hospital-ms/shared';

export const authService = {
  async login(app: { jwt: { sign: (payload: TokenPayload) => string } }, data: LoginRequest): Promise<LoginResponse> {
    const user = users.find((u) => u.email === data.email);
    if (!user || !user.isActive) throw Errors.Unauthorized();

    const valid = await bcrypt.compare(data.password, user.password);
    if (!valid) throw Errors.Unauthorized();

    const payload: TokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    const accessToken = app.jwt.sign(payload);

    // Refresh token: 7일 만료 (심플 구현)
    const refreshToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    refreshTokens.push({ token: refreshToken, userId: user.id, expiresAt });

    const { password: _pw, ...safeUser } = user;
    return { accessToken, refreshToken, user: safeUser as User };
  },

  async refresh(
    app: { jwt: { sign: (payload: TokenPayload) => string } },
    token: string
  ): Promise<{ accessToken: string }> {
    const record = refreshTokens.find((r) => r.token === token);
    if (!record || record.expiresAt < new Date()) {
      throw Errors.Unauthorized();
    }

    const user = users.find((u) => u.id === record.userId);
    if (!user || !user.isActive) throw Errors.Unauthorized();

    const payload: TokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    return { accessToken: app.jwt.sign(payload) };
  },

  logout(token: string) {
    const idx = refreshTokens.findIndex((r) => r.token === token);
    if (idx !== -1) refreshTokens.splice(idx, 1);
  },

  getProfile(userId: string): User {
    const user = users.find((u) => u.id === userId);
    if (!user) throw Errors.NotFound('사용자');
    const { password: _pw, ...safeUser } = user;
    return safeUser as User;
  },
};
