import { AppContainer } from '../AppContainer';
import { RequestContext } from '../http/RequestContext';
import { Handler } from '../http/Router';
import { Respond } from '../http/Respond';
import { HttpError } from '../http/HttpError';
import { CsrfProtection, CSRF_FIELD_NAME } from '../security/CsrfProtection';
import { PasswordHasher } from '../security/PasswordHasher';

/** 컨트롤러 공통 기능(CSRF 검증, 관리자 인증 가드, 게시물/댓글 소유자 비밀번호 검증)을 제공하는 베이스 클래스. */
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

  /**
   * 게시물/댓글 비밀번호 검증 + 무차별 대입 방어. 관리자 세션이면 어떤 게시물/댓글이든
   * 비밀번호 확인 없이 통과시킨다(모더레이션 권한). 문제가 있으면 사용자에게
   * 보여줄 오류 메시지를, 통과하면 null을 반환한다.
   */
  protected async checkOwnerPassword(ctx: RequestContext, passwordHash: string, password: string): Promise<string | null> {
    if (ctx.adminId !== null) return null;

    const identifier = `content_auth:${ctx.clientIp()}`;
    if (await this.app.postAuthRateLimiter.isBlocked(identifier)) {
      return '시도 횟수를 초과했습니다. 잠시 후 다시 시도해주세요.';
    }
    const valid = password.length > 0 && (await PasswordHasher.verify(password, passwordHash));
    if (!valid) {
      await this.app.postAuthRateLimiter.recordFailure(identifier);
      return '비밀번호가 일치하지 않습니다.';
    }
    return null;
  }
}
