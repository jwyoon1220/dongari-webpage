const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '/': '&#x2F;',
};

// 개행(\n, 10)과 탭(\t, 9)을 제외한 C0 제어 문자 + DEL(127) 코드 포인트.
const DISALLOWED_CONTROL_CODES = (() => {
  const codes: number[] = [];
  for (let i = 0; i <= 31; i++) {
    if (i !== 9 && i !== 10) codes.push(i);
  }
  codes.push(127);
  return new Set(codes);
})();

/**
 * 출력 인코딩(XSS 방지) 및 입력 검증을 전담하는 클래스.
 * 서버 렌더링 템플릿에 사용자 입력을 삽입할 때는 반드시
 * Sanitize.escapeHtml 을 거치도록 강제한다 (src/http/Html.ts 참고).
 */
export class Sanitize {
  static escapeHtml(input: unknown): string {
    const str = String(input ?? '');
    return str.replace(/[&<>"'/]/g, (ch) => HTML_ESCAPE_MAP[ch]);
  }

  /** 제어 문자(NUL 등) 제거 및 앞뒤 공백 정리. 개행과 탭은 유지한다. */
  static cleanText(input: unknown): string {
    const str = String(input ?? '');
    let out = '';
    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i);
      if (!DISALLOWED_CONTROL_CODES.has(code)) out += str[i];
    }
    return out.trim();
  }

  static isNonEmptyWithin(value: string, min: number, max: number): boolean {
    const len = value.length;
    return len >= min && len <= max;
  }

  /** 게시판 slug: 소문자 영문/숫자/하이픈만 허용 */
  static isValidSlug(slug: string): boolean {
    return /^[a-z0-9-]{2,30}$/.test(slug);
  }

  static isValidUsername(username: string): boolean {
    return /^[a-zA-Z0-9_]{3,20}$/.test(username);
  }

  /** 양의 정수 페이지 번호로 정규화 (범위를 벗어나면 안전한 기본값) */
  static parsePositiveInt(value: string | null, fallback: number, max = 1_000_000): number {
    if (!value) return fallback;
    const n = Number.parseInt(value, 10);
    if (!Number.isInteger(n) || n < 1 || n > max) return fallback;
    return n;
  }
}
