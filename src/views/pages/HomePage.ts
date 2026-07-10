import { html, safe, SafeHtml } from '../../http/Html';
import { Layout, LayoutOptions } from '../Layout';
import { BoardWithPostCount } from '../../repositories/BoardRepository';

export class HomePage {
  static render(layoutOptions: LayoutOptions, boards: BoardWithPostCount[]): SafeHtml {
    const cards =
      boards.length === 0
        ? html`<p class="text-sm text-zinc-500">아직 게시판이 없습니다.</p>`
        : boards.map(
            ({ board, postCount }) => html`<a
              href="/board/${board.slug}"
              class="block rounded-xl border border-zinc-800 bg-zinc-900 p-5 hover:border-zinc-700 hover:bg-zinc-800/60 transition"
            >
              <div class="flex items-center justify-between">
                <h2 class="text-lg font-semibold text-zinc-100">${board.name}</h2>
                <span class="text-xs text-zinc-500">게시물 ${String(postCount)}</span>
              </div>
              ${board.description
                ? html`<p class="mt-1 text-sm text-zinc-400">${board.description}</p>`
                : safe('')}
            </a>`,
          );

    const body = html`<div class="space-y-4">
      <h1 class="text-2xl font-bold text-zinc-50">게시판</h1>
      <div class="grid gap-4 sm:grid-cols-2">${cards}</div>
    </div>`;

    return Layout.render(layoutOptions, body);
  }
}
