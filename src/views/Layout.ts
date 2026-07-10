import { html, safe, SafeHtml } from '../http/Html';
import { SITE_NAME } from '../config/constants';
import { FlashType } from './FlashMessages';
import { CSRF_FIELD_NAME } from '../security/CsrfProtection';

export interface LayoutOptions {
  title: string;
  flash?: { type: FlashType; message: string } | null;
  isAdmin?: boolean;
  csrfToken: string;
}

export class Layout {
  static render(options: LayoutOptions, body: SafeHtml): SafeHtml {
    const flashBlock = options.flash ? Layout.renderFlash(options.flash) : safe('');
    const adminNav = options.isAdmin
      ? html`<a href="/admin/dashboard" class="hover:text-slate-900">관리자 홈</a>
          <form method="POST" action="/admin/logout" class="inline">
            <input type="hidden" name="${CSRF_FIELD_NAME}" value="${options.csrfToken}" />
            <button type="submit" class="hover:text-slate-900 underline underline-offset-2">로그아웃</button>
          </form>`
      : html`<a href="/admin" class="hover:text-slate-900">관리자</a>`;

    return html`<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${options.title} · ${SITE_NAME}</title>
<link rel="stylesheet" href="/css/tailwind.css">
</head>
<body class="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased">
  <header class="border-b border-slate-200 bg-white">
    <div class="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
      <a href="/" class="text-xl font-bold tracking-tight">${SITE_NAME}</a>
      <nav class="flex items-center gap-4 text-sm text-slate-500">${adminNav}</nav>
    </div>
  </header>
  <main class="flex-1 w-full max-w-4xl mx-auto px-4 py-8">
    ${flashBlock}
    ${body}
  </main>
  <footer class="border-t border-slate-200 py-6 text-center text-xs text-slate-400">
    ${SITE_NAME} — 텍스트 기반 커뮤니티
  </footer>
  <script src="/js/app.js" defer></script>
</body>
</html>`;
  }

  private static renderFlash(flash: { type: FlashType; message: string }): SafeHtml {
    const styles =
      flash.type === 'success'
        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
        : 'bg-rose-50 text-rose-800 border-rose-200';
    return html`<div class="mb-6 rounded-lg border px-4 py-3 text-sm ${styles}">${flash.message}</div>`;
  }
}
