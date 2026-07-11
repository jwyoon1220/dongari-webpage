import { html, SafeHtml } from '../../http/Html';
import { Layout, LayoutOptions } from '../Layout';
import { TERMS_MARKDOWN } from '../../content/termsContent';
import { MarkdownRenderer } from '../markdown/MarkdownRenderer';

/** 이용약관 페이지. GFDL 게시물 라이선스 안내, 이용자간 면책, 연락처를 담은 마크다운을 HTML로 렌더링한다. */
export class TermsPage {
  static render(layoutOptions: LayoutOptions): SafeHtml {
    const body = html`<article class="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-zinc-50">이용약관</h1>
        <p class="mt-1 text-sm text-zinc-500">Inside 커뮤니티 서비스 이용약관</p>
      </div>

      <div class="space-y-5 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 sm:p-8">
        ${MarkdownRenderer.toHtml(TermsPage.sectionsOnly(TERMS_MARKDOWN))}
      </div>

      <footer class="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 text-xs text-zinc-500">
        <p class="font-medium text-zinc-400">문의 및 신고</p>
        <ul class="mt-2 space-y-1">
          <li>
            이메일:
            <a href="mailto:contact@parin.asia" class="text-indigo-400 underline underline-offset-2 hover:text-indigo-300"
              >contact@parin.asia</a
            >
          </li>
          <li>
            소스코드:
            <a
              href="https://github.com/jwyoon1220/dongari-webpage"
              class="text-indigo-400 underline underline-offset-2 hover:text-indigo-300"
              rel="noopener noreferrer"
              target="_blank"
              >github.com/jwyoon1220/dongari-webpage</a
            >
          </li>
        </ul>
      </footer>
    </article>`;

    return Layout.render(layoutOptions, body);
  }

  /** 페이지 상단에서 이미 제목/부제를 보여주므로, 카드 안에서는 첫 "## " 절부터만 렌더링한다. */
  private static sectionsOnly(markdown: string): string {
    const firstSectionIndex = markdown.indexOf('\n## ');
    return firstSectionIndex === -1 ? markdown : markdown.slice(firstSectionIndex + 1);
  }
}
