import { html, safe, SafeHtml } from '../../http/Html';

export class FormErrors {
  static render(errors: string[]): SafeHtml {
    if (errors.length === 0) return safe('');
    const items = errors.map((e) => html`<li>${e}</li>`);
    return html`<div class="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
      <ul class="list-disc list-inside space-y-0.5">
        ${items}
      </ul>
    </div>`;
  }
}
