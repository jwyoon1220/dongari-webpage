import { Sanitize } from '../../security/Sanitize';

const EMOTICON_TOKEN_PATTERN = /%\{([a-zA-Z0-9_-]{1,20})\}%/g;

/**
 * %{name}% 토큰을 <img> 태그로 치환하고 나머지 텍스트는 그대로 이스케이프한다.
 *
 * 반드시 "텍스트 노드로 확정된 구간"에서만 호출해야 한다. HTML 태그/속성 문맥과
 * 무관하게 문자열을 통째로 치환하면 이미 정제된 마크업을 깨뜨려 인젝션 통로가 될 수
 * 있기 때문이다(예: href 속성값 안의 %{name}%을 순진하게 <img>로 바꾸면 속성을
 * 탈출하는 마크업이 만들어짐). 그래서 호출부는 항상 다음 셋 중 하나다:
 * - PostContentRenderer: text 포맷은 전체가 하나의 텍스트 노드이므로 안전
 * - MarkdownRenderer: escapeHtml을 호출하던 인라인 텍스트 런(태그/속성이 아님)
 * - HtmlSanitizer: HTMLRewriter의 text() 콜백(텍스트 노드 전용, 속성은 별도 API)
 */
export class EmoticonExpander {
  static expand(text: string, lookup: ReadonlyMap<string, string>): string {
    if (lookup.size === 0 || !text.includes('%{')) {
      return Sanitize.escapeHtml(text);
    }

    let result = '';
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    EMOTICON_TOKEN_PATTERN.lastIndex = 0;
    while ((match = EMOTICON_TOKEN_PATTERN.exec(text)) !== null) {
      result += Sanitize.escapeHtml(text.slice(lastIndex, match.index));
      const url = lookup.get(match[1]);
      if (url) {
        const name = Sanitize.escapeHtml(match[1]);
        result += `<img src="${Sanitize.escapeHtml(url)}" alt=":${name}:" title=":${name}:" class="inline-block h-5 w-5 align-text-bottom" loading="lazy">`;
      } else {
        result += Sanitize.escapeHtml(match[0]);
      }
      lastIndex = EMOTICON_TOKEN_PATTERN.lastIndex;
    }
    result += Sanitize.escapeHtml(text.slice(lastIndex));
    return result;
  }
}
