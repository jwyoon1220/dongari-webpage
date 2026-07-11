import { html, safe, SafeHtml } from '../../http/Html';
import { Layout, LayoutOptions } from '../Layout';
import { Board } from '../../models/Board';
import { Post } from '../../models/Post';
import { FormErrors } from '../components/FormErrors';
import { CSRF_FIELD_NAME } from '../../security/CsrfProtection';
import { LIMITS } from '../../config/constants';
import { INPUT_CLASS, LABEL_CLASS, GHOST_BUTTON_CLASS, DANGER_BUTTON_CLASS } from '../styles';

export class PostDeletePage {
  static render(
    layoutOptions: LayoutOptions,
    board: Board,
    post: Post,
    errors: string[],
    csrfToken: string,
    isAdminUser: boolean,
  ): SafeHtml {
    const description = isAdminUser
      ? `"${post.title}" 게시물을 관리자 권한으로 삭제합니다. 이 작업은 되돌릴 수 없습니다.`
      : `"${post.title}" 게시물을 삭제하려면 비밀번호를 입력하세요. 이 작업은 되돌릴 수 없습니다.`;

    const passwordField = isAdminUser
      ? safe('')
      : html`<div>
          <label for="password" class="${LABEL_CLASS}">비밀번호</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minlength="${String(LIMITS.POST_PASSWORD_MIN)}"
            maxlength="${String(LIMITS.POST_PASSWORD_MAX)}"
            class="${INPUT_CLASS}"
          />
        </div>`;

    const body = html`<div class="max-w-lg mx-auto space-y-6">
      <div>
        <p class="text-sm text-zinc-500">${board.name}</p>
        <h1 class="mt-1 text-2xl font-bold tracking-tight text-zinc-50">게시물 삭제</h1>
        <p class="mt-2 text-sm text-zinc-400">${description}</p>
      </div>
      ${FormErrors.render(errors)}
      <form
        method="POST"
        action="/board/${board.slug}/post/${String(post.id)}/delete"
        class="space-y-4"
      >
        <input type="hidden" name="${CSRF_FIELD_NAME}" value="${csrfToken}" />
        ${passwordField}
        <div class="flex items-center justify-end gap-2 pt-2">
          <a href="/board/${board.slug}/post/${String(post.id)}" class="${GHOST_BUTTON_CLASS}">취소</a>
          <button type="submit" class="${DANGER_BUTTON_CLASS}">삭제</button>
        </div>
      </form>
    </div>`;

    return Layout.render(layoutOptions, body);
  }
}
