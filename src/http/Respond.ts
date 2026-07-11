import { SafeHtml } from './Html';

/** 보안 헤더가 기본 적용된 표준 응답 빌더. */
export class Respond {
  static html(content: SafeHtml, init: ResponseInit = {}): Response {
    const headers = new Headers(init.headers);
    headers.set('Content-Type', 'text/html; charset=utf-8');
    return new Response(content.value, { ...init, headers });
  }

  static redirect(location: string, extraHeaders: string[][] = []): Response {
    const headers = new Headers(extraHeaders);
    headers.set('Location', location);
    return new Response(null, { status: 303, headers });
  }

  static notFound(content: SafeHtml): Response {
    return Respond.html(content, { status: 404 });
  }

  static forbidden(content: SafeHtml): Response {
    return Respond.html(content, { status: 403 });
  }

  static badRequest(content: SafeHtml): Response {
    return Respond.html(content, { status: 400 });
  }

  static serverError(content: SafeHtml): Response {
    return Respond.html(content, { status: 500 });
  }
}
