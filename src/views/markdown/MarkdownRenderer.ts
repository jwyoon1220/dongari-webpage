import { html, safe, SafeHtml } from '../../http/Html';
import { Sanitize } from '../../security/Sanitize';
import { EmoticonExpander } from '../content/EmoticonExpander';
import { CDN_ORIGIN } from '../../config/constants';

const ALLOWED_URL_SCHEMES = ['https://', 'http://', 'mailto:', '/'];
const NO_EMOTICONS: ReadonlyMap<string, string> = new Map();

function isSafeUrl(url: string): boolean {
  return ALLOWED_URL_SCHEMES.some((prefix) => url.startsWith(prefix));
}

function isSafeImageUrl(url: string): boolean {
  return url.startsWith(`${CDN_ORIGIN}/`);
}

/**
 * 자체 콘텐츠(우리가 직접 작성한 이용약관 등) 전용의 아주 작은 마크다운 서브셋 렌더러.
 * 범용 CommonMark 파서가 아니라 우리가 실제로 쓰는 문법(#, ##, 목록, 굵게, 링크)만 지원한다.
 * 외부 의존성이 없어 공급망 위험이 없고, 모든 텍스트는 삽입 전 escapeHtml을 거친다.
 */
export class MarkdownRenderer {
  static toHtml(markdown: string, emoticons: ReadonlyMap<string, string> = NO_EMOTICONS): SafeHtml {
    const lines = markdown.replace(/\r\n/g, '\n').split('\n');
    const blocks: SafeHtml[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      if (line.trim() === '') {
        i++;
        continue;
      }

      if (line.startsWith('## ')) {
        blocks.push(html`<h2 class="mt-2 text-base font-semibold text-zinc-100">${MarkdownRenderer.renderInline(line.slice(3), emoticons)}</h2>`);
        i++;
        continue;
      }

      if (line.startsWith('# ')) {
        blocks.push(html`<h1 class="text-2xl font-bold tracking-tight text-zinc-50">${MarkdownRenderer.renderInline(line.slice(2), emoticons)}</h1>`);
        i++;
        continue;
      }

      if (line.startsWith('- ')) {
        const items: SafeHtml[] = [];
        while (i < lines.length && lines[i].startsWith('- ')) {
          items.push(html`<li>${MarkdownRenderer.renderInline(lines[i].slice(2), emoticons)}</li>`);
          i++;
        }
        blocks.push(html`<ul class="list-disc space-y-1 pl-5 text-sm leading-relaxed text-zinc-400">${items}</ul>`);
        continue;
      }

      const paragraphLines: string[] = [];
      while (i < lines.length && lines[i].trim() !== '' && !lines[i].startsWith('#') && !lines[i].startsWith('- ')) {
        paragraphLines.push(lines[i]);
        i++;
      }
      blocks.push(
        html`<p class="text-sm leading-relaxed text-zinc-400">${MarkdownRenderer.renderInline(paragraphLines.join(' '), emoticons)}</p>`,
      );
    }

    return html`${blocks}`;
  }

  static toPlainText(markdown: string): string {
    return markdown
      .replace(/\r\n/g, '\n')
      .replace(/^# (.+)$/gm, (_m, text: string) => `${text}\n${'='.repeat(stripInlineLength(text))}`)
      .replace(/^## (.+)$/gm, (_m, text: string) => `${text}\n${'-'.repeat(stripInlineLength(text))}`)
      .replace(/^- (.+)$/gm, (_m, text: string) => `  · ${stripInlineMarkers(text)}`)
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, label: string, url: string) => `${label} (${url})`)
      .replace(/\*\*([^*]+)\*\*/g, '$1');
  }

  /**
   * ![alt](url), [label](url), **bold**, %{emoticon}% 을 지원하는 인라인 렌더러.
   * 그 외 텍스트는 전부 이스케이프된다(EmoticonExpander가 텍스트 런 단위로 처리).
   */
  private static renderInline(text: string, emoticons: ReadonlyMap<string, string>): SafeHtml {
    const pattern = /!\[([^\]]*)\]\(([^)]+)\)|\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*/g;
    let result = '';
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(text)) !== null) {
      result += EmoticonExpander.expand(text.slice(lastIndex, match.index), emoticons);

      if (match[2] !== undefined) {
        // 이미지: ![alt](url). 업로드 CDN 오리진이 아니면 대체 텍스트만 남긴다.
        const url = match[2];
        if (isSafeImageUrl(url)) {
          const alt = Sanitize.escapeHtml(match[1] ?? '');
          result += `<img src="${Sanitize.escapeHtml(url)}" alt="${alt}" class="inline-block max-w-full rounded-md" loading="lazy">`;
        } else if (match[1]) {
          result += EmoticonExpander.expand(match[1], emoticons);
        }
      } else if (match[4] !== undefined) {
        const label = EmoticonExpander.expand(match[3] ?? '', emoticons);
        const url = match[4];
        if (isSafeUrl(url)) {
          result += `<a href="${Sanitize.escapeHtml(url)}" class="text-indigo-400 underline underline-offset-2 hover:text-indigo-300" rel="noopener noreferrer" target="_blank">${label}</a>`;
        } else {
          result += label;
        }
      } else {
        result += `<strong class="text-zinc-200">${EmoticonExpander.expand(match[5], emoticons)}</strong>`;
      }

      lastIndex = pattern.lastIndex;
    }

    result += EmoticonExpander.expand(text.slice(lastIndex), emoticons);
    return safe(result);
  }
}

function stripInlineMarkers(text: string): string {
  return text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)').replace(/\*\*([^*]+)\*\*/g, '$1');
}

function stripInlineLength(text: string): number {
  return stripInlineMarkers(text).length;
}
