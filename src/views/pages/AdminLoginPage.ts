import { html, SafeHtml } from '../../http/Html';
import { Layout, LayoutOptions } from '../Layout';
import { FormErrors } from '../components/FormErrors';
import { CSRF_FIELD_NAME } from '../../security/CsrfProtection';
import { INPUT_CLASS, LABEL_CLASS, PRIMARY_BUTTON_CLASS } from '../styles';

export class AdminLoginPage {
  static render(layoutOptions: LayoutOptions, errors: string[], csrfToken: string, username: string): SafeHtml {
    const body = html`<div class="max-w-sm mx-auto mt-6 space-y-6 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8">
      <h1 class="text-xl font-bold tracking-tight text-center text-zinc-50">관리자 로그인</h1>
      ${FormErrors.render(errors)}
      <form method="POST" action="/admin/login" class="space-y-4">
        <input type="hidden" name="${CSRF_FIELD_NAME}" value="${csrfToken}" />
        <div>
          <label for="username" class="${LABEL_CLASS}">아이디</label>
          <input
            id="username"
            name="username"
            type="text"
            required
            autocomplete="username"
            value="${username}"
            class="${INPUT_CLASS}"
          />
        </div>
        <div>
          <label for="password" class="${LABEL_CLASS}">비밀번호</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autocomplete="current-password"
            class="${INPUT_CLASS}"
          />
        </div>
        <button type="submit" class="w-full ${PRIMARY_BUTTON_CLASS}">로그인</button>
      </form>
    </div>`;

    return Layout.render(layoutOptions, body);
  }
}
