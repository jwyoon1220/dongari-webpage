import { html, SafeHtml } from '../../http/Html';
import { Layout, LayoutOptions } from '../Layout';
import { Board } from '../../models/Board';
import { Post } from '../../models/Post';
import { AdminBadge } from '../components/AdminBadge';
import { formatDate } from '../format';

export class PostPage {
  static render(layoutOptions: LayoutOptions, board: Board, post: Post): SafeHtml {
    const body = html`<article class="space-y-6">
      <div>
        <p class="text-sm text-slate-400">
          <a href="/board/${board.slug}" class="hover:text-slate-700">${board.name}</a>
        </p>
        <h1 class="mt-1 text-2xl font-bold break-words">${post.title}</h1>
        <div class="mt-2 flex items-center gap-2 text-xs text-slate-400">
          ${AdminBadge.renderOrEmpty(post.isAdminPost)}
          <span>${post.authorNickname}</span>
          <span>${formatDate(post.createdAt)}</span>
          <span>조회 ${String(post.viewCount)}</span>
        </div>
      </div>
      <div class="rounded-xl border border-slate-200 bg-white p-5">
        <p class="whitespace-pre-wrap break-words leading-relaxed text-slate-800">${post.content}</p>
      </div>
      <div class="flex items-center justify-between">
        <a href="/board/${board.slug}" class="text-sm text-slate-500 hover:text-slate-900">← 목록으로</a>
        <div class="flex gap-2">
          <a
            href="/board/${board.slug}/post/${String(post.id)}/edit"
            class="rounded-md border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-50"
            >수정</a
          >
          <a
            href="/board/${board.slug}/post/${String(post.id)}/delete"
            class="rounded-md border border-rose-200 px-3 py-1.5 text-sm text-rose-600 hover:bg-rose-50"
            >삭제</a
          >
        </div>
      </div>
    </article>`;

    return Layout.render(layoutOptions, body);
  }
}
