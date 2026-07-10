import { Sanitize } from '../security/Sanitize';

export interface SafeHtml {
  readonly __safeHtml: true;
  readonly value: string;
}

/** 이미 이스케이프되었거나 신뢰할 수 있는 정적 마크업임을 명시적으로 표시한다. */
export function safe(value: string): SafeHtml {
  return { __safeHtml: true, value };
}

function stringify(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return value.map(stringify).join('');
  if (typeof value === 'object' && (value as SafeHtml).__safeHtml) return (value as SafeHtml).value;
  return Sanitize.escapeHtml(value);
}

/**
 * 태그드 템플릿 리터럴. 보간되는 모든 값은 기본적으로 HTML 이스케이프된다.
 * 이미 안전한 조각(다른 html`` 호출 결과 등)을 그대로 삽입하려면 safe()로 감싼다.
 * 이 규칙 덕분에 "이스케이프를 깜빡해서 생기는 XSS"를 구조적으로 방지한다.
 */
export function html(strings: TemplateStringsArray, ...values: unknown[]): SafeHtml {
  let out = strings[0];
  for (let i = 0; i < values.length; i++) {
    out += stringify(values[i]);
    out += strings[i + 1];
  }
  return safe(out);
}
