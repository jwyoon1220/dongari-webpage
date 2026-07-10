import { html, safe, SafeHtml } from '../../http/Html';
import { Layout, LayoutOptions } from '../Layout';
import { Board } from '../../models/Board';
import { Post } from '../../models/Post';
import { Pagination } from '../components/Pagination';
import { PAGE_SIZE } from '../../config/constants';
import { formatDate } from '../format';

export class BoardPage {
  static render(
    layoutOptions: LayoutOptions,
    board: Board,
    posts: Post[],
    total: number,
    page: number,
  ): SafeHtml {
    const rows =
      posts.length === 0
        ? html`<li class="py-10 text-center text-sm text-slate-400">아직 게시물이 없습니다.</li>`
        : posts.map(
            (post) => html`<li class="border-b border-slate-100 last:border-0">
              <a href="/board/${board.slug}/post/${String(post.id)}" class="flex items-center justify-between gap-4 py-3 px-1 hover:bg-slate-50 rounded-md">
                <span class="truncate text-slate-900">${post.title}</span>
                <span class="shrink-0 text-xs text-slate-400 flex items-center gap-3">
                  <span>${post.authorNickname}</span>
                  <span>${formatDate(post.createdAt)}</span>
                  <span>조회 ${String(post.viewCount)}</span>
                </span>
              </a>
            </li>`,
          );

    const body = html`<div class="space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold">${board.name}</h1>
          ${board.description ? html`<p class="mt-1 text-sm text-slate-500">${board.description}</p>` : safe('')}
        </div>
        <a
          href="/board/${board.slug}/write"
          class="shrink-0 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >글쓰기</a
        >
      </div>
      <ul class="rounded-xl border border-slate-200 bg-white px-2">${rows}</ul>
      ${Pagination.render(`/board/${board.slug}`, page, total, PAGE_SIZE)}
      <div>
        <a href="/" class="text-sm text-slate-500 hover:text-slate-900">← 전체 게시판</a>
      </div>
    </div>`;

    return Layout.render(layoutOptions, body);
  }
}
