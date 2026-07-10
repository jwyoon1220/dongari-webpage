import { html, safe, SafeHtml } from '../../http/Html';

/** 관리자가 작성한 게시물/댓글임을 나타내는 작은 체크 아이콘. */
export class AdminBadge {
  static render(): SafeHtml {
    return html`<svg
      viewBox="0 0 20 20"
      fill="currentColor"
      class="h-3 w-3 shrink-0 text-indigo-400"
      title="관리자"
      ><path
        fill-rule="evenodd"
        d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
        clip-rule="evenodd"
      /></svg
    >`;
  }

  static renderOrEmpty(isAdminPost: boolean): SafeHtml {
    return isAdminPost ? AdminBadge.render() : safe('');
  }
}
