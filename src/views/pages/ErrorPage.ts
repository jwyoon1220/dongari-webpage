import { html, SafeHtml } from '../../http/Html';
import { Layout, LayoutOptions } from '../Layout';
import { PRIMARY_BUTTON_CLASS } from '../styles';

export class ErrorPage {
  static render(layoutOptions: LayoutOptions, status: number, message: string): SafeHtml {
    const body = html`<div class="flex flex-col items-center justify-center py-24 text-center">
      <p class="text-sm font-medium tracking-wide text-indigo-400">${String(status)}</p>
      <h1 class="mt-2 text-xl font-bold tracking-tight text-zinc-50">${message}</h1>
      <a href="/" class="mt-6 ${PRIMARY_BUTTON_CLASS}">홈으로</a>
    </div>`;
    return Layout.render(layoutOptions, body);
  }
}
