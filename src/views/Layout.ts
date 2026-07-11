import { html, safe, SafeHtml } from '../http/Html';
import { SITE_NAME } from '../config/constants';
import { FlashType } from './FlashMessages';
import { CSRF_FIELD_NAME } from '../security/CsrfProtection';

export interface LayoutOptions {
  title: string;
  flash?: { type: FlashType; message: string } | null;
  isAdmin?: boolean;
  csrfToken: string;
  /** 검색엔진에 노출하지 않을 페이지(관리자 화면 등)면 true */
  noIndex?: boolean;
}

export class Layout {
  static render(options: LayoutOptions, body: SafeHtml): SafeHtml {
    const flashBlock = options.flash ? Layout.renderFlash(options.flash) : safe('');
    const adminNav = options.isAdmin
      ? html`<a href="/admin/dashboard" class="transition hover:text-zinc-100">관리자 홈</a>
          <form method="POST" action="/admin/logout" class="inline">
            <input type="hidden" name="${CSRF_FIELD_NAME}" value="${options.csrfToken}" />
            <button type="submit" class="transition hover:text-zinc-100 underline underline-offset-2">로그아웃</button>
          </form>`
      : html`<a href="/admin" class="transition hover:text-zinc-100">관리자</a>`;
    const robotsMeta = options.noIndex ? html`<meta name="robots" content="noindex, nofollow">` : safe('');

    return html`<!DOCTYPE html>
<html lang="ko" class="dark">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="dark">
<meta name="description" content="${SITE_NAME} — 텍스트 기반 커뮤니티. 게시판별로 자유롭게 글을 쓰고 나눠보세요.">
<meta name="theme-color" content="#09090b">
${robotsMeta}
<title>${options.title} · ${SITE_NAME}</title>
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/css/tailwind.css">
</head>
<body class="min-h-screen flex flex-col bg-zinc-950 font-sans text-zinc-100 antialiased">
  <div class="pointer-events-none fixed inset-x-0 top-0 -z-10 h-96 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(99,102,241,0.16),transparent)]"></div>
  <header class="sticky top-0 z-10 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur">
    <div class="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
      <a href="/" class="flex items-center gap-2 text-lg font-semibold tracking-tight text-zinc-50">
        <span class="inline-block h-2 w-2 rounded-full bg-indigo-500"></span>
        ${SITE_NAME}
      </a>
      <nav class="flex items-center gap-4 text-sm text-zinc-400">${adminNav}</nav>
    </div>
  </header>
  <main class="flex-1 w-full max-w-4xl mx-auto px-4 py-10">
    ${flashBlock}
    ${body}
  </main>
  <footer class="border-t border-zinc-800/80 py-8 text-center text-xs text-zinc-600">
    <p>${SITE_NAME} — 텍스트 기반 커뮤니티</p>
    <p class="mt-1"><a href="/terms" class="transition hover:text-zinc-400">이용약관</a></p>
  </footer>
  <script src="/js/app.js" defer></script>
</body>
</html>`;
  }

  private static renderFlash(flash: { type: FlashType; message: string }): SafeHtml {
    const styles =
      flash.type === 'success'
        ? 'bg-emerald-950/40 text-emerald-300 border-emerald-900'
        : 'bg-rose-950/40 text-rose-300 border-rose-900';
    return html`<div class="mb-6 rounded-lg border px-4 py-3 text-sm ${styles}">${flash.message}</div>`;
  }
}
