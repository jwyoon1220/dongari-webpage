export interface CookieOptions {
  maxAgeSeconds?: number;
  httpOnly?: boolean;
  path?: string;
}

/**
 * 쿠키 파싱/직렬화를 전담한다. 모든 쿠키는 기본적으로
 * Secure; SameSite=Strict; Path=/ 로 발급되어 CSRF 및 전송 구간
 * 노출 위험을 최소화한다.
 */
export class Cookies {
  static parse(cookieHeader: string | null): Map<string, string> {
    const map = new Map<string, string>();
    if (!cookieHeader) return map;

    for (const pair of cookieHeader.split(';')) {
      const eq = pair.indexOf('=');
      if (eq === -1) continue;
      const name = pair.slice(0, eq).trim();
      const value = pair.slice(eq + 1).trim();
      if (!name) continue;
      try {
        map.set(name, decodeURIComponent(value));
      } catch {
        // 잘못 인코딩된 쿠키 값은 무시한다.
      }
    }
    return map;
  }

  static serialize(name: string, value: string, options: CookieOptions = {}): string {
    const segments = [`${name}=${encodeURIComponent(value)}`];
    segments.push(`Path=${options.path ?? '/'}`);
    segments.push('SameSite=Strict');
    segments.push('Secure');
    if (options.httpOnly !== false) {
      segments.push('HttpOnly');
    }
    if (typeof options.maxAgeSeconds === 'number') {
      segments.push(`Max-Age=${Math.max(0, Math.floor(options.maxAgeSeconds))}`);
    }
    return segments.join('; ');
  }

  static clear(name: string, options: Pick<CookieOptions, 'path' | 'httpOnly'> = {}): string {
    return Cookies.serialize(name, '', { ...options, maxAgeSeconds: 0 });
  }
}
