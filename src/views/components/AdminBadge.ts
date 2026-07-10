import { html, safe, SafeHtml } from '../../http/Html';

/** 관리자가 작성한 게시물임을 나타내는 체크 배지. */
export class AdminBadge {
  static render(): SafeHtml {
    return html`<span
      class="inline-flex items-center gap-0.5 rounded-full bg-blue-50 px-1.5 py-0.5 text-[11px] font-medium text-blue-600"
      title="관리자 작성 게시물"
      >
      <svg viewBox="0 0 20 20" fill="currentColor" class="h-3 w-3"
        ><path
          fill-rule="evenodd"
          d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
          clip-rule="evenodd"
        /></svg
      >관리자</span
    >`;
  }

  static renderOrEmpty(isAdminPost: boolean): SafeHtml {
    return isAdminPost ? AdminBadge.render() : safe('');
  }
}
