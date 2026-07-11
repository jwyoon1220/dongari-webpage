import { html, safe, SafeHtml } from '../../http/Html';
import { PostContentFormat } from '../../models/Post';
import { HtmlSanitizer } from '../../security/HtmlSanitizer';
import { MarkdownRenderer } from '../markdown/MarkdownRenderer';

// 마크다운/HTML 형식으로 렌더링된 태그(a, ul, blockquote, pre, code 등)에
// 다크 테마와 어울리는 기본 스타일을 입혀주는 래퍼 클래스.
const PROSE_CLASS = [
  'space-y-3 text-sm leading-relaxed text-zinc-200',
  '[&_a]:text-indigo-400 [&_a]:underline [&_a]:underline-offset-2',
  '[&_strong]:text-zinc-100',
  '[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5',
  '[&_blockquote]:border-l-2 [&_blockquote]:border-zinc-700 [&_blockquote]:pl-3 [&_blockquote]:text-zinc-400',
  '[&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-zinc-950 [&_pre]:p-3',
  '[&_code]:text-indigo-300',
  '[&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-zinc-100',
  '[&_h4]:text-base [&_h4]:font-semibold [&_h4]:text-zinc-100',
  '[&_table]:w-full [&_td]:border [&_td]:border-zinc-800 [&_td]:p-1.5 [&_th]:border [&_th]:border-zinc-800 [&_th]:p-1.5',
].join(' ');

/** 게시물 content_format에 맞춰 안전하게 렌더링한다. HTML/마크다운은 모두 정제를 거친다. */
export class PostContentRenderer {
  static async render(content: string, format: PostContentFormat): Promise<SafeHtml> {
    if (format === 'html') {
      const sanitized = await HtmlSanitizer.sanitize(content);
      return html`<div class="${PROSE_CLASS}">${safe(sanitized)}</div>`;
    }

    if (format === 'markdown') {
      return html`<div class="${PROSE_CLASS}">${MarkdownRenderer.toHtml(content)}</div>`;
    }

    return html`<p class="whitespace-pre-wrap break-words text-sm leading-relaxed text-zinc-200">${content}</p>`;
  }
}
