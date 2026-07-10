import { html, safe, SafeHtml } from '../../http/Html';

export class Pagination {
  static render(basePath: string, currentPage: number, totalItems: number, pageSize: number): SafeHtml {
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    if (totalPages <= 1) return safe('');

    const items: SafeHtml[] = [];
    for (let page = 1; page <= totalPages; page++) {
      const isCurrent = page === currentPage;
      const classes = isCurrent
        ? 'bg-slate-900 text-white'
        : 'text-slate-600 hover:bg-slate-100 border border-slate-200';
      items.push(
        html`<a href="${basePath}?page=${String(page)}" class="px-3 py-1.5 rounded-md text-sm ${classes}"
          >${String(page)}</a
        >`,
      );
    }

    return html`<nav class="mt-8 flex flex-wrap gap-2 justify-center">${items}</nav>`;
  }
}
