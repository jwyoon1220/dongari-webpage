import { Cookies } from './Cookies';
import { Encoding } from './Encoding';

export const CSRF_COOKIE_NAME = 'csrf';
export const CSRF_FIELD_NAME = 'csrf_token';
const CSRF_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 4; // 4시간

/**
 * CSRF 방어: (1) SameSite=Strict 쿠키로 크로스사이트 전송 자체를 차단하고,
 * (2) 이중 제출 토큰(double-submit cookie)으로 한 번 더 검증하며,
 * (3) state-changing 요청에서는 Origin 헤더까지 검사한다.
 */
export class CsrfProtection {
  static ensureToken(cookies: Map<string, string>): { token: string; setCookieHeader: string | null } {
    const existing = cookies.get(CSRF_COOKIE_NAME);
    if (existing && /^[a-f0-9]{64}$/.test(existing)) {
      return { token: existing, setCookieHeader: null };
    }
    const token = Encoding.randomToken(32);
    const setCookieHeader = Cookies.serialize(CSRF_COOKIE_NAME, token, {
      httpOnly: false, // 서버가 자체 렌더링한 폼에 값을 심어야 하므로 JS 접근은 불필요하지만 httpOnly는 강제하지 않는다.
      maxAgeSeconds: CSRF_COOKIE_MAX_AGE_SECONDS,
    });
    return { token, setCookieHeader };
  }

  static verify(request: Request, cookies: Map<string, string>, submittedToken: string | null): boolean {
    const cookieToken = cookies.get(CSRF_COOKIE_NAME);
    if (!cookieToken || !submittedToken) return false;
    if (cookieToken !== submittedToken) return false;
    return CsrfProtection.isTrustedOrigin(request);
  }

  private static isTrustedOrigin(request: Request): boolean {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin');
    if (origin) {
      try {
        return new URL(origin).host === url.host;
      } catch {
        return false;
      }
    }
    // 일부 브라우저/구성에서는 동일 출처 POST에도 Origin이 생략될 수 있으므로 Referer로 폴백한다.
    const referer = request.headers.get('Referer');
    if (referer) {
      try {
        return new URL(referer).host === url.host;
      } catch {
        return false;
      }
    }
    // Origin, Referer 둘 다 없는 요청은 신뢰하지 않는다.
    return false;
  }
}
