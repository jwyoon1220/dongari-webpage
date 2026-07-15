import { html, SafeHtml } from '../../http/Html';
import { Layout, LayoutOptions } from '../Layout';
import { Board } from '../../models/Board';
import { Post } from '../../models/Post';
import { Comment } from '../../models/Comment';
import { AdminBadge } from '../components/AdminBadge';
import { CommentsSection, CommentFormState } from '../components/CommentsSection';
import { EmoticonListItem } from '../components/EmoticonDataIsland';
import { formatDate } from '../format';

export class PostPage {
  static render(
    layoutOptions: LayoutOptions,
    board: Board,
    post: Post,
    contentHtml: SafeHtml,
    comments: Comment[],
    commentForm: CommentFormState,
    emoticons: EmoticonListItem[],
  ): SafeHtml {
    const body = html`<article class="space-y-6">
      <div>
        <p class="text-sm text-zinc-500">
          <a href="/board/${board.slug}" class="transition hover:text-zinc-300">${board.name}</a>
        </p>
        <h1 class="mt-1.5 text-2xl font-bold tracking-tight break-words text-zinc-50">${post.title}</h1>
        <div class="mt-2 flex items-center gap-2 text-xs text-zinc-500">
          ${AdminBadge.renderOrEmpty(post.isAdminPost)}
          <span>${post.authorNickname}</span>
          <span>${formatDate(post.createdAt)}</span>
          <span>조회 ${String(post.viewCount)}</span>
        </div>
      </div>
      <div class="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
        ${contentHtml}
      </div>
      <div class="flex items-center justify-between">
        <a href="/board/${board.slug}" class="text-sm text-zinc-500 transition hover:text-zinc-200">← 목록으로</a>
        <div class="flex gap-2">
          <a
            href="/board/${board.slug}/post/${String(post.id)}/edit"
            class="rounded-md border border-zinc-700 px-3 py-1.5 text-sm text-zinc-200 transition hover:bg-zinc-800"
            >수정</a
          >
          <a
            href="/board/${board.slug}/post/${String(post.id)}/delete"
            class="rounded-md border border-rose-900 px-3 py-1.5 text-sm text-rose-400 transition hover:bg-rose-950/40"
            >삭제</a
          >
        </div>
      </div>
      ${CommentsSection.render(board, post, comments, layoutOptions.csrfToken, commentForm, emoticons)}
    </article>`;

    return Layout.render(layoutOptions, body);
  }
}
