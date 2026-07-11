import { html, safe, SafeHtml } from '../../http/Html';
import { Layout, LayoutOptions } from '../Layout';
import { BoardWithPostCount } from '../../repositories/BoardRepository';
import { EmptyState } from '../components/EmptyState';

export class HomePage {
  static render(layoutOptions: LayoutOptions, boards: BoardWithPostCount[]): SafeHtml {
    const cards =
      boards.length === 0
        ? EmptyState.render('아직 게시판이 없습니다.')
        : boards.map(
            ({ board, postCount }) => html`<a
              href="/board/${board.slug}"
              class="group block rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 transition hover:-translate-y-0.5 hover:border-indigo-900/60 hover:bg-zinc-900 hover:shadow-glow"
            >
              <div class="flex items-center justify-between">
                <h2 class="text-lg font-semibold text-zinc-100 transition group-hover:text-white">${board.name}</h2>
                <span class="shrink-0 rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">${String(postCount)}</span>
              </div>
              ${board.description
                ? html`<p class="mt-1.5 text-sm leading-relaxed text-zinc-400">${board.description}</p>`
                : safe('')}
            </a>`,
          );

    const body = html`<div class="space-y-5">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-zinc-50">게시판</h1>
        <p class="mt-1 text-sm text-zinc-500">원하는 게시판을 골라 둘러보세요.</p>
      </div>
      <div class="grid gap-4 sm:grid-cols-2">${cards}</div>
    </div>`;

    return Layout.render(layoutOptions, body);
  }
}
