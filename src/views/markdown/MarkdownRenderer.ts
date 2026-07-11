import { html, safe, SafeHtml } from '../../http/Html';
import { Sanitize } from '../../security/Sanitize';

const ALLOWED_URL_SCHEMES = ['https://', 'http://', 'mailto:', '/'];

function isSafeUrl(url: string): boolean {
  return ALLOWED_URL_SCHEMES.some((prefix) => url.startsWith(prefix));
}

/**
 * 자체 콘텐츠(우리가 직접 작성한 이용약관 등) 전용의 아주 작은 마크다운 서브셋 렌더러.
 * 범용 CommonMark 파서가 아니라 우리가 실제로 쓰는 문법(#, ##, 목록, 굵게, 링크)만 지원한다.
 * 외부 의존성이 없어 공급망 위험이 없고, 모든 텍스트는 삽입 전 escapeHtml을 거친다.
 */
export class MarkdownRenderer {
  static toHtml(markdown: string): SafeHtml {
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
        blocks.push(html`<h2 class="mt-2 text-base font-semibold text-zinc-100">${MarkdownRenderer.renderInline(line.slice(3))}</h2>`);
        i++;
        continue;
      }

      if (line.startsWith('# ')) {
        blocks.push(html`<h1 class="text-2xl font-bold tracking-tight text-zinc-50">${MarkdownRenderer.renderInline(line.slice(2))}</h1>`);
        i++;
        continue;
      }

      if (line.startsWith('- ')) {
        const items: SafeHtml[] = [];
        while (i < lines.length && lines[i].startsWith('- ')) {
          items.push(html`<li>${MarkdownRenderer.renderInline(lines[i].slice(2))}</li>`);
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
        html`<p class="text-sm leading-relaxed text-zinc-400">${MarkdownRenderer.renderInline(paragraphLines.join(' '))}</p>`,
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

  /** [label](url)과 **bold**만 지원하는 인라인 렌더러. 그 외 텍스트는 전부 이스케이프된다. */
  private static renderInline(text: string): SafeHtml {
    const pattern = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*/g;
    let result = '';
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(text)) !== null) {
      result += Sanitize.escapeHtml(text.slice(lastIndex, match.index));

      if (match[1] !== undefined) {
        const label = Sanitize.escapeHtml(match[1]);
        const url = match[2];
        if (isSafeUrl(url)) {
          result += `<a href="${Sanitize.escapeHtml(url)}" class="text-indigo-400 underline underline-offset-2 hover:text-indigo-300" rel="noopener noreferrer" target="_blank">${label}</a>`;
        } else {
          result += label;
        }
      } else {
        result += `<strong class="text-zinc-200">${Sanitize.escapeHtml(match[3])}</strong>`;
      }

      lastIndex = pattern.lastIndex;
    }

    result += Sanitize.escapeHtml(text.slice(lastIndex));
    return safe(result);
  }
}

function stripInlineMarkers(text: string): string {
  return text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)').replace(/\*\*([^*]+)\*\*/g, '$1');
}

function stripInlineLength(text: string): number {
  return stripInlineMarkers(text).length;
}
