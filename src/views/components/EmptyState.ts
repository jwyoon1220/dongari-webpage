import { html, SafeHtml } from '../../http/Html';

/** 목록이 비었을 때 공통으로 쓰는 안내 블록. */
export class EmptyState {
  static render(message: string): SafeHtml {
    return html`<div class="flex flex-col items-center gap-2 py-14 text-center">
      <svg viewBox="0 0 24 24" fill="none" class="h-8 w-8 text-zinc-700">
        <path
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v9a2.5 2.5 0 0 1-2.5 2.5H9l-4 3v-3H6.5A2.5 2.5 0 0 1 4 15.5v-9Z"
        />
      </svg>
      <p class="text-sm text-zinc-500">${message}</p>
    </div>`;
  }
}
