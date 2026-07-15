import { html, safe, SafeHtml } from '../../http/Html';
import { Board } from '../../models/Board';
import { Post } from '../../models/Post';
import { Comment } from '../../models/Comment';
import { AdminBadge } from './AdminBadge';
import { FormErrors } from './FormErrors';
import { EmoticonDataIsland, EmoticonListItem } from './EmoticonDataIsland';
import { EmoticonExpander } from '../content/EmoticonExpander';
import { CSRF_FIELD_NAME } from '../../security/CsrfProtection';
import { LIMITS } from '../../config/constants';
import { formatDate } from '../format';
import { INPUT_CLASS, PRIMARY_BUTTON_CLASS } from '../styles';

export interface CommentFormState {
  errors: string[];
  values: { nickname: string; content: string };
  isAdminUser: boolean;
  adminNicknamePreview?: string;
}

/** 게시물 상세 페이지에 삽입되는 댓글 목록 + 작성 폼. 댓글은 수정할 수 없고 생성/삭제만 가능하다. */
export class CommentsSection {
  static render(
    board: Board,
    post: Post,
    comments: Comment[],
    csrfToken: string,
    form: CommentFormState,
    emoticons: EmoticonListItem[],
  ): SafeHtml {
    const emoticonLookup = new Map(emoticons.map((e) => [e.name, e.url]));
    const list =
      comments.length === 0
        ? html`<p class="py-6 text-center text-sm text-zinc-500">아직 댓글이 없습니다.</p>`
        : comments.map(
            (comment) => html`<li class="border-b border-zinc-800/70 py-3 last:border-0">
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-1.5 text-xs text-zinc-500">
                  ${AdminBadge.renderOrEmpty(comment.isAdminComment)}
                  <span class="font-medium text-zinc-300">${comment.authorNickname}</span>
                  <span>${formatDate(comment.createdAt)}</span>
                </div>
                <a
                  href="/board/${board.slug}/post/${String(post.id)}/comments/${String(comment.id)}/delete"
                  class="text-xs text-zinc-600 transition hover:text-rose-400"
                  >삭제</a
                >
              </div>
              <p class="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-zinc-200">${safe(
                EmoticonExpander.expand(comment.content, emoticonLookup),
              )}</p>
            </li>`,
          );

    const nicknameField = form.isAdminUser
      ? html`<div class="rounded-md border border-indigo-900 bg-indigo-950/40 px-3 py-2 text-xs text-indigo-300">
          관리자 계정으로 작성됩니다 (닉네임: ${form.adminNicknamePreview ?? ''})
        </div>`
      : html`<div class="grid gap-3 sm:grid-cols-2">
          <input
            name="nickname"
            type="text"
            required
            maxlength="${String(LIMITS.NICKNAME_MAX)}"
            placeholder="닉네임"
            value="${form.values.nickname}"
            class="${INPUT_CLASS}"
          />
          <input
            name="password"
            type="password"
            required
            minlength="${String(LIMITS.POST_PASSWORD_MIN)}"
            maxlength="${String(LIMITS.POST_PASSWORD_MAX)}"
            placeholder="삭제용 비밀번호"
            class="${INPUT_CLASS}"
          />
        </div>`;

    return html`<section id="comments" class="space-y-4">
      <h2 class="text-sm font-semibold text-zinc-300">댓글 ${String(comments.length)}</h2>
      <ul class="rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4">${list}</ul>
      ${FormErrors.render(form.errors)}
      <form method="POST" action="/board/${board.slug}/post/${String(post.id)}/comments" class="space-y-3">
        <input type="hidden" name="${CSRF_FIELD_NAME}" value="${csrfToken}" />
        ${nicknameField}
        <textarea
          name="content"
          required
          maxlength="${String(LIMITS.COMMENT_CONTENT_MAX)}"
          rows="3"
          placeholder="댓글을 입력하세요 (작성 후 수정할 수 없습니다). %{이름}%으로 이모티콘을 쓸 수 있습니다."
          class="${INPUT_CLASS}"
          data-content-tools
          data-emoticon-source="comment-emoticon-data"
        >
${form.values.content}</textarea
        >
        ${EmoticonDataIsland.render('comment-emoticon-data', emoticons)}
        <div class="flex justify-end">
          <button type="submit" class="${PRIMARY_BUTTON_CLASS}">댓글 등록</button>
        </div>
      </form>
    </section>`;
  }
}
