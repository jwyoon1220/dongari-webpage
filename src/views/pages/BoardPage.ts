import { html, safe, SafeHtml } from '../../http/Html';
import { Layout, LayoutOptions } from '../Layout';
import { Board } from '../../models/Board';
import { Post } from '../../models/Post';
import { Pagination } from '../components/Pagination';
import { AdminBadge } from '../components/AdminBadge';
import { EmptyState } from '../components/EmptyState';
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
        ? html`<li>${EmptyState.render('아직 게시물이 없습니다.')}</li>`
        : posts.map(
            (post) => html`<li class="border-b border-zinc-800 last:border-0">
              <a href="/board/${board.slug}/post/${String(post.id)}" class="flex items-center justify-between gap-4 rounded-md px-2 py-3 transition hover:bg-zinc-800/50">
                <span class="truncate text-[0.95rem] text-zinc-100">${post.title}</span>
                <span class="shrink-0 flex items-center gap-2 text-xs text-zinc-500">
                  ${AdminBadge.renderOrEmpty(post.isAdminPost)}
                  <span>${post.authorNickname}</span>
                  <span class="hidden sm:inline">${formatDate(post.createdAt)}</span>
                  <span>조회 ${String(post.viewCount)}</span>
                </span>
              </a>
            </li>`,
          );

    const body = html`<div class="space-y-5">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-zinc-50">${board.name}</h1>
          ${board.description ? html`<p class="mt-1 text-sm text-zinc-400">${board.description}</p>` : safe('')}
        </div>
        <a
          href="/board/${board.slug}/write"
          class="shrink-0 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-glow transition hover:bg-indigo-500"
          >글쓰기</a
        >
      </div>
      <ul class="rounded-2xl border border-zinc-800 bg-zinc-900/60 px-2">${rows}</ul>
      ${Pagination.render(`/board/${board.slug}`, page, total, PAGE_SIZE)}
      <div>
        <a href="/" class="text-sm text-zinc-500 transition hover:text-zinc-200">← 전체 게시판</a>
      </div>
    </div>`;

    return Layout.render(layoutOptions, body);
  }
}
