import { AdminSessionRepository } from '../repositories/AdminSessionRepository';
import { Cookies } from './Cookies';
import { Encoding } from './Encoding';

export const ADMIN_SESSION_COOKIE = 'admin_session';
const SESSION_DURATION_SECONDS = 12 * 60 * 60; // 12시간

/**
 * 관리자 세션 관리. 쿠키에는 무작위 토큰만 저장하고, DB에는 그 토큰의
 * SHA-256 해시만 저장한다(DB 유출 시에도 세션 탈취가 불가능하도록).
 */
export class SessionService {
  constructor(private readonly sessions: AdminSessionRepository) {}

  private static async hashToken(token: string): Promise<string> {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
    return Encoding.toHex(new Uint8Array(digest));
  }

  async createSession(adminId: number): Promise<{ token: string; setCookieHeader: string }> {
    const token = Encoding.randomToken(32);
    const tokenHash = await SessionService.hashToken(token);
    const expiresAt = new Date(Date.now() + SESSION_DURATION_SECONDS * 1000).toISOString();
    await this.sessions.create(tokenHash, adminId, expiresAt);

    const setCookieHeader = Cookies.serialize(ADMIN_SESSION_COOKIE, token, {
      httpOnly: true,
      maxAgeSeconds: SESSION_DURATION_SECONDS,
    });
    return { token, setCookieHeader };
  }

  async resolveAdminId(cookies: Map<string, string>): Promise<number | null> {
    const token = cookies.get(ADMIN_SESSION_COOKIE);
    if (!token) return null;
    const tokenHash = await SessionService.hashToken(token);
    return this.sessions.findValidAdminId(tokenHash, new Date().toISOString());
  }

  async destroySession(cookies: Map<string, string>): Promise<string> {
    const token = cookies.get(ADMIN_SESSION_COOKIE);
    if (token) {
      const tokenHash = await SessionService.hashToken(token);
      await this.sessions.deleteByTokenHash(tokenHash);
    }
    return Cookies.clear(ADMIN_SESSION_COOKIE, { httpOnly: true });
  }
}
