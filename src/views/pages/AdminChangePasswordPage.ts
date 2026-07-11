import { html, SafeHtml } from '../../http/Html';
import { Layout, LayoutOptions } from '../Layout';
import { FormErrors } from '../components/FormErrors';
import { CSRF_FIELD_NAME } from '../../security/CsrfProtection';
import { LIMITS } from '../../config/constants';
import { INPUT_CLASS, LABEL_CLASS, PRIMARY_BUTTON_CLASS } from '../styles';

export class AdminChangePasswordPage {
  static render(layoutOptions: LayoutOptions, errors: string[], csrfToken: string): SafeHtml {
    const body = html`<div class="max-w-sm mx-auto space-y-6">
      <h1 class="text-2xl font-bold tracking-tight text-zinc-50">비밀번호 변경</h1>
      ${FormErrors.render(errors)}
      <form method="POST" action="/admin/password" class="space-y-4">
        <input type="hidden" name="${CSRF_FIELD_NAME}" value="${csrfToken}" />
        <div>
          <label for="current_password" class="${LABEL_CLASS}">현재 비밀번호</label>
          <input
            id="current_password"
            name="current_password"
            type="password"
            required
            autocomplete="current-password"
            class="${INPUT_CLASS}"
          />
        </div>
        <div>
          <label for="new_password" class="${LABEL_CLASS}">새 비밀번호</label>
          <input
            id="new_password"
            name="new_password"
            type="password"
            required
            minlength="${String(LIMITS.ADMIN_PASSWORD_MIN)}"
            maxlength="${String(LIMITS.ADMIN_PASSWORD_MAX)}"
            autocomplete="new-password"
            class="${INPUT_CLASS}"
          />
          <p class="mt-1 text-xs text-zinc-500">최소 ${String(LIMITS.ADMIN_PASSWORD_MIN)}자 이상.</p>
        </div>
        <div>
          <label for="new_password_confirm" class="${LABEL_CLASS}">새 비밀번호 확인</label>
          <input
            id="new_password_confirm"
            name="new_password_confirm"
            type="password"
            required
            minlength="${String(LIMITS.ADMIN_PASSWORD_MIN)}"
            maxlength="${String(LIMITS.ADMIN_PASSWORD_MAX)}"
            autocomplete="new-password"
            class="${INPUT_CLASS}"
          />
        </div>
        <button type="submit" class="w-full ${PRIMARY_BUTTON_CLASS}">변경</button>
      </form>
    </div>`;

    return Layout.render(layoutOptions, body);
  }
}
