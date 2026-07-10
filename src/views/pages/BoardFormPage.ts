import { html, SafeHtml } from '../../http/Html';
import { Layout, LayoutOptions } from '../Layout';
import { FormErrors } from '../components/FormErrors';
import { CSRF_FIELD_NAME } from '../../security/CsrfProtection';
import { LIMITS } from '../../config/constants';

export interface BoardFormValues {
  slug: string;
  name: string;
  description: string;
  displayOrder: number;
}

export class BoardFormPage {
  static render(
    layoutOptions: LayoutOptions,
    mode: 'create' | 'edit',
    action: string,
    values: BoardFormValues,
    errors: string[],
    csrfToken: string,
  ): SafeHtml {
    const heading = mode === 'create' ? '새 게시판 만들기' : '게시판 수정';
    const slugField =
      mode === 'create'
        ? html`<div>
            <label for="slug" class="block text-sm font-medium text-slate-700">주소(slug)</label>
            <input
              id="slug"
              name="slug"
              type="text"
              required
              pattern="[a-z0-9-]{2,30}"
              placeholder="notice"
              value="${values.slug}"
              class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono focus:border-slate-500 focus:outline-none"
            />
            <p class="mt-1 text-xs text-slate-400">영문 소문자, 숫자, 하이픈만 사용 (예: notice, lunch-menu). 생성 후 변경 불가.</p>
          </div>`
        : html`<div>
            <label class="block text-sm font-medium text-slate-700">주소(slug)</label>
            <p class="mt-1 rounded-md bg-slate-100 px-3 py-2 text-sm font-mono text-slate-500">${values.slug}</p>
          </div>`;

    const body = html`<div class="max-w-xl mx-auto space-y-6">
      <h1 class="text-2xl font-bold">${heading}</h1>
      ${FormErrors.render(errors)}
      <form method="POST" action="${action}" class="space-y-4">
        <input type="hidden" name="${CSRF_FIELD_NAME}" value="${csrfToken}" />
        ${slugField}
        <div>
          <label for="name" class="block text-sm font-medium text-slate-700">게시판 이름</label>
          <input
            id="name"
            name="name"
            type="text"
            required
            maxlength="${String(LIMITS.BOARD_NAME_MAX)}"
            value="${values.name}"
            class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>
        <div>
          <label for="description" class="block text-sm font-medium text-slate-700">설명</label>
          <input
            id="description"
            name="description"
            type="text"
            maxlength="${String(LIMITS.BOARD_DESCRIPTION_MAX)}"
            value="${values.description}"
            class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>
        <div>
          <label for="display_order" class="block text-sm font-medium text-slate-700">정렬 순서</label>
          <input
            id="display_order"
            name="display_order"
            type="number"
            value="${String(values.displayOrder)}"
            class="mt-1 w-32 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
          <p class="mt-1 text-xs text-slate-400">숫자가 작을수록 먼저 표시됩니다.</p>
        </div>
        <div class="flex items-center justify-end gap-2 pt-2">
          <a href="/admin/dashboard" class="rounded-md px-4 py-2 text-sm text-slate-500 hover:bg-slate-100">취소</a>
          <button type="submit" class="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
            저장
          </button>
        </div>
      </form>
    </div>`;

    return Layout.render(layoutOptions, body);
  }
}
