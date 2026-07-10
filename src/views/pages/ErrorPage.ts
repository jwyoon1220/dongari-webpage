import { html, SafeHtml } from '../../http/Html';
import { Layout, LayoutOptions } from '../Layout';

export class ErrorPage {
  static render(layoutOptions: LayoutOptions, status: number, message: string): SafeHtml {
    const body = html`<div class="flex flex-col items-center justify-center py-24 text-center">
      <p class="text-sm font-medium text-slate-400">${String(status)}</p>
      <h1 class="mt-2 text-xl font-bold text-slate-900">${message}</h1>
      <a href="/" class="mt-6 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >홈으로</a
      >
    </div>`;
    return Layout.render(layoutOptions, body);
  }
}
