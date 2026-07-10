import { html, SafeHtml } from '../../http/Html';
import { Layout, LayoutOptions } from '../Layout';
import { FormErrors } from '../components/FormErrors';
import { CSRF_FIELD_NAME } from '../../security/CsrfProtection';

export class AdminLoginPage {
  static render(layoutOptions: LayoutOptions, errors: string[], csrfToken: string, username: string): SafeHtml {
    const body = html`<div class="max-w-sm mx-auto space-y-6">
      <h1 class="text-2xl font-bold text-center text-zinc-50">관리자 로그인</h1>
      ${FormErrors.render(errors)}
      <form method="POST" action="/admin/login" class="space-y-4">
        <input type="hidden" name="${CSRF_FIELD_NAME}" value="${csrfToken}" />
        <div>
          <label for="username" class="block text-sm font-medium text-zinc-300">아이디</label>
          <input
            id="username"
            name="username"
            type="text"
            required
            autocomplete="username"
            value="${username}"
            class="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <div>
          <label for="password" class="block text-sm font-medium text-zinc-300">비밀번호</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autocomplete="current-password"
            class="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          class="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          로그인
        </button>
      </form>
    </div>`;

    return Layout.render(layoutOptions, body);
  }
}
