import { html, safe, SafeHtml } from '../../http/Html';
import { Layout, LayoutOptions } from '../Layout';
import { Board } from '../../models/Board';
import { FormErrors } from '../components/FormErrors';
import { CSRF_FIELD_NAME } from '../../security/CsrfProtection';
import { LIMITS } from '../../config/constants';
import { INPUT_CLASS, LABEL_CLASS, PRIMARY_BUTTON_CLASS, GHOST_BUTTON_CLASS } from '../styles';

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
  /** 관리자 세션으로 작성/수정하는 경우 닉네임·비밀번호 입력을 생략하고 안내만 보여준다. */
  isAdminUser: boolean;
  /** mode === 'create' && isAdminUser 일 때 표시할 고정 닉네임 미리보기(admin_XXXXX) */
  adminNicknamePreview?: string;
}

export class PostFormPage {
  static render(layoutOptions: LayoutOptions, options: PostFormPageOptions): SafeHtml {
    const { mode, board, action, values, errors, csrfToken, isAdminUser, adminNicknamePreview } = options;
    const heading = mode === 'create' ? '새 게시물 작성' : '게시물 수정';

    const adminNotice = (message: string) =>
      html`<div class="rounded-md border border-indigo-900 bg-indigo-950/40 px-3 py-2 text-xs text-indigo-300">${message}</div>`;

    let nicknameField: SafeHtml;
    let passwordFields: SafeHtml;

    if (isAdminUser) {
      nicknameField =
        mode === 'create'
          ? adminNotice(`관리자 계정으로 작성됩니다 (닉네임: ${adminNicknamePreview ?? ''})`)
          : safe('');
      passwordFields =
        mode === 'edit' ? adminNotice('관리자 권한으로 비밀번호 확인 없이 처리됩니다.') : safe('');
    } else {
      nicknameField =
        mode === 'create'
          ? html`<div>
              <label for="nickname" class="${LABEL_CLASS}">닉네임</label>
              <input
                id="nickname"
                name="nickname"
                type="text"
                required
                maxlength="${String(LIMITS.NICKNAME_MAX)}"
                value="${values.nickname}"
                class="${INPUT_CLASS}"
              />
            </div>`
          : safe('');

      passwordFields =
        mode === 'create'
          ? html`<div class="grid gap-4 sm:grid-cols-2">
              <div>
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
                <p class="mt-1 text-xs text-zinc-500">수정/삭제 시 필요합니다. 잊지 마세요.</p>
              </div>
              <div>
                <label for="password_confirm" class="${LABEL_CLASS}">비밀번호 확인</label>
                <input
                  id="password_confirm"
                  name="password_confirm"
                  type="password"
                  required
                  minlength="${String(LIMITS.POST_PASSWORD_MIN)}"
                  maxlength="${String(LIMITS.POST_PASSWORD_MAX)}"
                  class="${INPUT_CLASS}"
                />
              </div>
            </div>`
          : html`<div>
              <label for="password" class="${LABEL_CLASS}">비밀번호 확인</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minlength="${String(LIMITS.POST_PASSWORD_MIN)}"
                maxlength="${String(LIMITS.POST_PASSWORD_MAX)}"
                class="${INPUT_CLASS}"
              />
              <p class="mt-1 text-xs text-zinc-500">작성 시 설정한 비밀번호를 입력하세요.</p>
            </div>`;
    }

    const body = html`<div class="max-w-xl mx-auto space-y-6">
      <div>
        <p class="text-sm text-zinc-500">${board.name}</p>
        <h1 class="mt-1 text-2xl font-bold tracking-tight text-zinc-50">${heading}</h1>
      </div>
      ${FormErrors.render(errors)}
      <form method="POST" action="${action}" class="space-y-4">
        <input type="hidden" name="${CSRF_FIELD_NAME}" value="${csrfToken}" />
        ${nicknameField}
        <div>
          <label for="title" class="${LABEL_CLASS}">제목</label>
          <input
            id="title"
            name="title"
            type="text"
            required
            maxlength="${String(LIMITS.POST_TITLE_MAX)}"
            value="${values.title}"
            class="${INPUT_CLASS}"
          />
        </div>
        <div>
          <label for="content" class="${LABEL_CLASS}">내용</label>
          <textarea
            id="content"
            name="content"
            required
            maxlength="${String(LIMITS.POST_CONTENT_MAX)}"
            rows="10"
            class="${INPUT_CLASS}"
          >
${values.content}</textarea
          >
        </div>
        ${passwordFields}
        ${mode === 'create' ? PostFormPage.renderLicenseCheckbox() : safe('')}
        <div class="flex items-center justify-end gap-2 pt-2">
          <a href="/board/${board.slug}" class="${GHOST_BUTTON_CLASS}">취소</a>
          <button type="submit" class="${PRIMARY_BUTTON_CLASS}">저장</button>
        </div>
      </form>
    </div>`;

    return Layout.render(layoutOptions, body);
  }

  private static renderLicenseCheckbox(): SafeHtml {
    return html`<label class="flex items-start gap-2 text-xs text-zinc-400">
      <input
        type="checkbox"
        name="license_agree"
        required
        class="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-zinc-600 bg-zinc-900 text-indigo-500 focus:ring-indigo-500/40"
      />
      <span
        >이 게시물은
        <a href="https://www.gnu.org/licenses/fdl-1.3.html" class="text-indigo-400 underline underline-offset-2 hover:text-indigo-300" rel="noopener noreferrer" target="_blank"
          >GNU 자유 문서 사용 허가서(GFDL) 1.3</a
        >에 따라 이용이 허락되며, <a href="/terms" class="text-indigo-400 underline underline-offset-2 hover:text-indigo-300" target="_blank">이용약관</a>에 동의합니다.</span
      >
    </label>`;
  }
}
