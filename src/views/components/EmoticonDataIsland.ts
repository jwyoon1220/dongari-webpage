import { html, safe, SafeHtml } from '../../http/Html';

export interface EmoticonListItem {
  name: string;
  url: string;
}

/**
 * content-tools.js(%{ 자동완성, 붙여넣기 업로드)가 읽어가는 이모티콘 목록 데이터 아일랜드.
 * type=application/json 스크립트는 브라우저가 실행하지 않으므로 CSP script-src의 영향을 받지 않는다.
 * script/style 태그 내부는 HTML 엔티티가 디코딩되지 않는 raw text 요소이므로, 일반적인
 * HTML 이스케이프 대신 </script> 이탈 방지를 위한 유니코드 이스케이프만 적용한다.
 */
export class EmoticonDataIsland {
  static render(id: string, items: EmoticonListItem[]): SafeHtml {
    const json = JSON.stringify(items).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
    return html`<script type="application/json" id="${id}">${safe(json)}</script>`;
  }
}
