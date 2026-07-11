import { RequestContext } from '../http/RequestContext';
import { LayoutOptions } from './Layout';
import { resolveFlash } from './FlashMessages';

/** 컨트롤러에서 공통적으로 필요한 LayoutOptions(관리자 여부, CSRF 토큰, 플래시, 색인 여부)를 구성한다. */
export function buildLayoutOptions(ctx: RequestContext, title: string): LayoutOptions {
  return {
    title,
    isAdmin: ctx.adminId !== null,
    csrfToken: ctx.csrfToken,
    flash: resolveFlash(ctx.url.searchParams.get('flash')),
    noIndex: ctx.url.pathname.startsWith('/admin'),
  };
}
