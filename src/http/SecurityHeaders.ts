/**
 * 모든 동적 응답에 적용되는 보안 헤더.
 * - CSP는 인라인 스크립트/스타일을 전혀 허용하지 않고(스크립트는 /js/app.js 하나만),
 *   Trusted Types까지 요구해 DOM 기반 XSS의 실질적 피해 범위를 원천적으로 제한한다.
 * - HSTS, 클릭재킹/스니핑/크로스오리진 격리 헤더를 함께 적용한다.
 * - 동적 페이지는 CSRF 토큰·세션 상태를 담고 있으므로 어떤 캐시에도 저장되지 않도록 한다.
 */
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  'upgrade-insecure-requests',
  "require-trusted-types-for 'script'",
  "trusted-types 'none'",
].join('; ');

const PERMISSIONS_POLICY = [
  'geolocation=()',
  'camera=()',
  'microphone=()',
  'payment=()',
  'usb=()',
  'bluetooth=()',
  'magnetometer=()',
  'gyroscope=()',
  'accelerometer=()',
  'midi=()',
  'interest-cohort=()',
  'browsing-topics=()',
].join(', ');

function applyCommonHeaders(headers: Headers): void {
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  headers.set('Cross-Origin-Resource-Policy', 'same-origin');
}

export interface DynamicHeaderOptions {
  noIndex?: boolean;
}

/** App.handle()이 만든 동적 HTML/리다이렉트 응답에 적용한다. */
export function applySecurityHeaders(response: Response, options: DynamicHeaderOptions = {}): Response {
  const headers = new Headers(response.headers);
  applyCommonHeaders(headers);
  headers.set('Content-Security-Policy', CONTENT_SECURITY_POLICY);
  headers.set('X-Frame-Options', 'DENY');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', PERMISSIONS_POLICY);
  // CSRF 토큰/세션 상태가 담긴 페이지이므로 어떤 캐시에도 저장되지 않게 한다.
  headers.set('Cache-Control', 'private, no-store, max-age=0');
  if (options.noIndex) {
    headers.set('X-Robots-Tag', 'noindex, nofollow');
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/** 정적 자산(context.next() 결과) 응답에 적용한다. 캐시 동작은 건드리지 않는다. */
export function applyStaticAssetHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  applyCommonHeaders(headers);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
