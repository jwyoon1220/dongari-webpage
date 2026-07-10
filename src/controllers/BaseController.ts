import { AppContainer } from '../AppContainer';
import { RequestContext } from '../http/RequestContext';
import { Handler } from '../http/Router';
import { Respond } from '../http/Respond';
import { HttpError } from '../http/HttpError';
import { CsrfProtection, CSRF_FIELD_NAME } from '../security/CsrfProtection';

/** 컨트롤러 공통 기능(CSRF 검증, 관리자 인증 가드)을 제공하는 베이스 클래스. */
export abstract class BaseController {
  constructor(protected readonly app: AppContainer) {}

  protected verifyCsrfOrThrow(ctx: RequestContext, form: URLSearchParams): void {
    const submitted = form.get(CSRF_FIELD_NAME);
    if (!CsrfProtection.verify(ctx.request, ctx.cookies, submitted)) {
      throw new HttpError(403, '요청을 검증할 수 없습니다. 새로고침 후 다시 시도해주세요.');
    }
  }

  /** ctx.adminId가 없으면 로그인 페이지로 리다이렉트하는 핸들러 래퍼 */
  protected withAdmin(handler: (ctx: RequestContext, adminId: number) => Promise<Response>): Handler {
    return async (ctx: RequestContext) => {
      if (ctx.adminId === null) return Respond.redirect('/admin');
      return handler(ctx, ctx.adminId);
    };
  }
}
