import { html, SafeHtml } from '../../http/Html';
import { Layout, LayoutOptions } from '../Layout';
import { Board } from '../../models/Board';
import { CSRF_FIELD_NAME } from '../../security/CsrfProtection';

export class AdminDashboardPage {
  static render(layoutOptions: LayoutOptions, boards: Board[], csrfToken: string): SafeHtml {
    const rows =
      boards.length === 0
        ? html`<tr><td colspan="4" class="py-8 text-center text-sm text-zinc-500">게시판이 없습니다.</td></tr>`
        : boards.map(
            (board) => html`<tr class="border-b border-zinc-800 last:border-0">
              <td class="py-3 pl-4 pr-4 text-sm text-zinc-500">${String(board.displayOrder)}</td>
              <td class="py-3 pr-4">
                <a href="/board/${board.slug}" class="font-medium text-zinc-100 hover:underline"
                  >${board.name}</a
                >
                <p class="text-xs text-zinc-500">/board/${board.slug}</p>
              </td>
              <td class="py-3 pr-4 text-sm text-zinc-400">${board.description}</td>
              <td class="py-3 pr-4 text-right whitespace-nowrap">
                <a
                  href="/admin/boards/${String(board.id)}/edit"
                  class="rounded-md border border-zinc-700 px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-800"
                  >수정</a
                >
                <form method="POST" action="/admin/boards/${String(board.id)}/delete" class="inline" data-confirm="정말 이 게시판과 모든 게시물을 삭제하시겠습니까?">
                  <input type="hidden" name="${CSRF_FIELD_NAME}" value="${csrfToken}" />
                  <button
                    type="submit"
                    class="rounded-md border border-rose-900 px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-950/40"
                  >
                    삭제
                  </button>
                </form>
              </td>
            </tr>`,
          );

    const body = html`<div class="space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-zinc-50">게시판 관리</h1>
        <div class="flex gap-2">
          <a href="/admin/password" class="rounded-md border border-zinc-700 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
            >비밀번호 변경</a
          >
          <a href="/admin/boards/new" class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
            >새 게시판</a
          >
        </div>
      </div>
      <div class="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900">
        <table class="w-full text-left">
          <thead>
            <tr class="border-b border-zinc-800 text-xs uppercase text-zinc-500">
              <th class="py-3 pl-4 pr-4 font-medium">순서</th>
              <th class="py-3 pr-4 font-medium">이름</th>
              <th class="py-3 pr-4 font-medium">설명</th>
              <th class="py-3 pr-4 font-medium text-right">관리</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;

    return Layout.render(layoutOptions, body);
  }
}
