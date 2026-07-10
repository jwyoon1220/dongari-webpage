import { html, SafeHtml } from '../../http/Html';
import { Layout, LayoutOptions } from '../Layout';
import { FormErrors } from '../components/FormErrors';
import { CSRF_FIELD_NAME } from '../../security/CsrfProtection';
import { LIMITS } from '../../config/constants';

export class AdminChangePasswordPage {
  static render(layoutOptions: LayoutOptions, errors: string[], csrfToken: string): SafeHtml {
    const body = html`<div class="max-w-sm mx-auto space-y-6">
      <h1 class="text-2xl font-bold">비밀번호 변경</h1>
      ${FormErrors.render(errors)}
      <form method="POST" action="/admin/password" class="space-y-4">
        <input type="hidden" name="${CSRF_FIELD_NAME}" value="${csrfToken}" />
        <div>
          <label for="current_password" class="block text-sm font-medium text-slate-700">현재 비밀번호</label>
          <input
            id="current_password"
            name="current_password"
            type="password"
            required
            autocomplete="current-password"
            class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>
        <div>
          <label for="new_password" class="block text-sm font-medium text-slate-700">새 비밀번호</label>
          <input
            id="new_password"
            name="new_password"
            type="password"
            required
            minlength="${String(LIMITS.ADMIN_PASSWORD_MIN)}"
            maxlength="${String(LIMITS.ADMIN_PASSWORD_MAX)}"
            autocomplete="new-password"
            class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
          <p class="mt-1 text-xs text-slate-400">최소 ${String(LIMITS.ADMIN_PASSWORD_MIN)}자 이상.</p>
        </div>
        <div>
          <label for="new_password_confirm" class="block text-sm font-medium text-slate-700">새 비밀번호 확인</label>
          <input
            id="new_password_confirm"
            name="new_password_confirm"
            type="password"
            required
            minlength="${String(LIMITS.ADMIN_PASSWORD_MIN)}"
            maxlength="${String(LIMITS.ADMIN_PASSWORD_MAX)}"
            autocomplete="new-password"
            class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          class="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          변경
        </button>
      </form>
    </div>`;

    return Layout.render(layoutOptions, body);
  }
}
