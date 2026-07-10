import { html, safe, SafeHtml } from '../../http/Html';
import { Layout, LayoutOptions } from '../Layout';
import { Board } from '../../models/Board';
import { Post } from '../../models/Post';
import { FormErrors } from '../components/FormErrors';
import { CSRF_FIELD_NAME } from '../../security/CsrfProtection';
import { LIMITS } from '../../config/constants';

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
          <label for="password" class="block text-sm font-medium text-slate-700">비밀번호</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minlength="${String(LIMITS.POST_PASSWORD_MIN)}"
            maxlength="${String(LIMITS.POST_PASSWORD_MAX)}"
            class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>`;

    const body = html`<div class="max-w-lg mx-auto space-y-6">
      <div>
        <p class="text-sm text-slate-400">${board.name}</p>
        <h1 class="mt-1 text-2xl font-bold">게시물 삭제</h1>
        <p class="mt-2 text-sm text-slate-500">${description}</p>
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
          <a
            href="/board/${board.slug}/post/${String(post.id)}"
            class="rounded-md px-4 py-2 text-sm text-slate-500 hover:bg-slate-100"
            >취소</a
          >
          <button type="submit" class="rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-500">
            삭제
          </button>
        </div>
      </form>
    </div>`;

    return Layout.render(layoutOptions, body);
  }
}
