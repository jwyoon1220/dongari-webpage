import { EmoticonExpander } from '../views/content/EmoticonExpander';
import { CDN_ORIGIN } from '../config/constants';

/**
 * 화이트리스트 기반 HTML 새니타이저. 서드파티 파서 라이브러리 없이 Cloudflare Workers에
 * 내장된 HTMLRewriter(실제 브라우저급 스트리밍 HTML 파서, lol-html 기반)를 사용해
 * 사용자가 입력한 임의의 HTML을 안전하게 정제한다.
 *
 * 원칙: 기본은 전부 거부(default-deny). 허용 목록에 없는 태그는 내용만 남기고 벗겨내며,
 * script/style/iframe 등 그 자체로 위험한 태그는 내용째로 제거한다. 허용된 태그도
 * class/id/style/on* 등 모든 속성을 제거하고, <a>의 href만 안전한 스킴일 때, <img>의 src만
 * 업로드 CDN 오리진일 때 남긴다.
 */
export class HtmlSanitizer {
  private static readonly ALLOWED_TAGS = new Set([
    'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'a',
    'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'hr', 'img',
    'h3', 'h4', 'table', 'thead', 'tbody', 'tr', 'td', 'th',
  ]);

  // 태그 자체가 위험해서 내용까지 통째로 제거해야 하는 것들.
  private static readonly STRIP_WITH_CONTENT = new Set([
    'script', 'style', 'iframe', 'object', 'embed', 'link', 'meta', 'base',
    'form', 'input', 'button', 'textarea', 'select', 'option',
    'video', 'audio', 'source', 'track', 'canvas', 'svg', 'math',
    'template', 'noscript', 'applet', 'frame', 'frameset', 'title',
  ]);

  private static readonly SAFE_URL_PREFIXES = ['https://', 'http://', 'mailto:', '/'];

  static async sanitize(rawHtml: string, emoticons: ReadonlyMap<string, string> = new Map()): Promise<string> {
    const token = crypto.randomUUID();
    const startMarker = `<!--S-${token}-->`;
    const endMarker = `<!--E-${token}-->`;
    const wrapped = `<!doctype html><html><body>${startMarker}${rawHtml}${endMarker}</body></html>`;

    const response = new Response(wrapped, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    let textBuffer = '';
    const rewritten = new HTMLRewriter()
      .on('*', {
        element(element: Element) {
          const tag = element.tagName.toLowerCase();

          if (HtmlSanitizer.STRIP_WITH_CONTENT.has(tag)) {
            element.remove();
            return;
          }

          if (!HtmlSanitizer.ALLOWED_TAGS.has(tag)) {
            element.removeAndKeepContent();
            return;
          }

          const attributeNames: string[] = [];
          for (const [name] of element.attributes) attributeNames.push(name);

          for (const name of attributeNames) {
            if (tag === 'a' && name === 'href') {
              const value = element.getAttribute('href') ?? '';
              if (!HtmlSanitizer.isSafeUrl(value)) element.removeAttribute('href');
              continue;
            }
            if (tag === 'img' && (name === 'src' || name === 'alt')) {
              if (name === 'src') {
                const value = element.getAttribute('src') ?? '';
                if (!HtmlSanitizer.isSafeImageSrc(value)) element.removeAttribute('src');
              }
              continue;
            }
            element.removeAttribute(name);
          }

          if (tag === 'a') {
            element.setAttribute('rel', 'noopener noreferrer ugc nofollow');
            element.setAttribute('target', '_blank');
          }

          if (tag === 'img') {
            // src가 안전하지 않아 제거되었다면(외부/알 수 없는 오리진) 깨진 이미지 대신 통째로 제거한다.
            if (!element.getAttribute('src')) {
              element.remove();
              return;
            }
            element.setAttribute('loading', 'lazy');
          }
        },
        text(chunk: Text) {
          textBuffer += chunk.text;
          if (chunk.lastInTextNode) {
            const expanded = EmoticonExpander.expand(textBuffer, emoticons);
            textBuffer = '';
            chunk.replace(expanded, { html: true });
          } else {
            chunk.remove();
          }
        },
      })
      .transform(response);

    const html = await rewritten.text();
    const start = html.indexOf(startMarker);
    const end = html.indexOf(endMarker);
    if (start === -1 || end === -1 || end < start) return '';
    return html.slice(start + startMarker.length, end);
  }

  private static isSafeUrl(value: string): boolean {
    const normalized = value.trim().toLowerCase();
    return HtmlSanitizer.SAFE_URL_PREFIXES.some((prefix) => normalized.startsWith(prefix));
  }

  private static isSafeImageSrc(value: string): boolean {
    return value.trim().startsWith(`${CDN_ORIGIN}/`);
  }
}
