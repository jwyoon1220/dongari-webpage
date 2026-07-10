import { html, SafeHtml } from '../../http/Html';
import { Layout, LayoutOptions } from '../Layout';
import { Board } from '../../models/Board';
import { FormErrors } from '../components/FormErrors';
import { CSRF_FIELD_NAME } from '../../security/CsrfProtection';
import { LIMITS } from '../../config/constants';

export interface PostFormValues {
  title: string;
  content: string;
  nickname: string;
}

export interface PostFormPageOptions {
  mode: 'create' | 'edit';
  board: Board;
  action: string;
  values: PostFormValues;
  errors: string[];
  csrfToken: string;
}

export class PostFormPage {
  static render(layoutOptions: LayoutOptions, options: PostFormPageOptions): SafeHtml {
    const { mode, board, action, values, errors, csrfToken } = options;
    const heading = mode === 'create' ? '새 게시물 작성' : '게시물 수정';

    const nicknameField =
      mode === 'create'
        ? html`<div>
            <label for="nickname" class="block text-sm font-medium text-slate-700">닉네임</label>
            <input
              id="nickname"
              name="nickname"
              type="text"
              required
              maxlength="${String(LIMITS.NICKNAME_MAX)}"
              value="${values.nickname}"
              class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>`
        : html``;

    const passwordFields =
      mode === 'create'
        ? html`<div class="grid gap-4 sm:grid-cols-2">
            <div>
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
              <p class="mt-1 text-xs text-slate-400">수정/삭제 시 필요합니다. 잊지 마세요.</p>
            </div>
            <div>
              <label for="password_confirm" class="block text-sm font-medium text-slate-700">비밀번호 확인</label>
              <input
                id="password_confirm"
                name="password_confirm"
                type="password"
                required
                minlength="${String(LIMITS.POST_PASSWORD_MIN)}"
                maxlength="${String(LIMITS.POST_PASSWORD_MAX)}"
                class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              />
            </div>
          </div>`
        : html`<div>
            <label for="password" class="block text-sm font-medium text-slate-700">비밀번호 확인</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minlength="${String(LIMITS.POST_PASSWORD_MIN)}"
              maxlength="${String(LIMITS.POST_PASSWORD_MAX)}"
              class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
            <p class="mt-1 text-xs text-slate-400">작성 시 설정한 비밀번호를 입력하세요.</p>
          </div>`;

    const body = html`<div class="max-w-xl mx-auto space-y-6">
      <div>
        <p class="text-sm text-slate-400">${board.name}</p>
        <h1 class="mt-1 text-2xl font-bold">${heading}</h1>
      </div>
      ${FormErrors.render(errors)}
      <form method="POST" action="${action}" class="space-y-4">
        <input type="hidden" name="${CSRF_FIELD_NAME}" value="${csrfToken}" />
        ${nicknameField}
        <div>
          <label for="title" class="block text-sm font-medium text-slate-700">제목</label>
          <input
            id="title"
            name="title"
            type="text"
            required
            maxlength="${String(LIMITS.POST_TITLE_MAX)}"
            value="${values.title}"
            class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>
        <div>
          <label for="content" class="block text-sm font-medium text-slate-700">내용</label>
          <textarea
            id="content"
            name="content"
            required
            maxlength="${String(LIMITS.POST_CONTENT_MAX)}"
            rows="10"
            class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          >
${values.content}</textarea
          >
        </div>
        ${passwordFields}
        <div class="flex items-center justify-end gap-2 pt-2">
          <a href="/board/${board.slug}" class="rounded-md px-4 py-2 text-sm text-slate-500 hover:bg-slate-100"
            >취소</a
          >
          <button type="submit" class="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
            저장
          </button>
        </div>
      </form>
    </div>`;

    return Layout.render(layoutOptions, body);
  }
}
