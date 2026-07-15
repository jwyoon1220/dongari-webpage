import { AppContainer } from '../AppContainer';
import { RequestContext } from '../http/RequestContext';
import { Handler } from '../http/Router';
import { Respond } from '../http/Respond';
import { HttpError } from '../http/HttpError';
import { CsrfProtection, CSRF_FIELD_NAME } from '../security/CsrfProtection';
import { PasswordHasher } from '../security/PasswordHasher';
import { RateLimiter } from '../security/RateLimiter';

/** 컨트롤러 공통 기능(CSRF 검증, 관리자 인증 가드, 게시물/댓글 소유자 비밀번호 검증)을 제공하는 베이스 클래스. */
export abstract class BaseController {
  constructor(protected readonly app: AppContainer) {}

  protected verifyCsrfOrThrow(ctx: RequestContext, form: URLSearchParams): void {
    this.verifyCsrfTokenOrThrow(ctx, form.get(CSRF_FIELD_NAME));
  }

  /** 폼 필드가 아니라 커스텀 헤더(fetch 기반 업로드 등)로 전달된 CSRF 토큰을 검증한다. */
  protected verifyCsrfTokenOrThrow(ctx: RequestContext, submitted: string | null): void {
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

  /**
   * 게시물/댓글 도배(스팸) 방지. 관리자 세션은 제한하지 않는다.
   * 통과 시 이번 시도를 즉시 기록하고 null을, 초과 시 오류 메시지를 반환한다.
   */
  protected async checkCreationRateLimit(ctx: RequestContext, kind: string): Promise<string | null> {
    return this.checkRateLimit(ctx, this.app.creationRateLimiter, kind, '너무 빠르게 작성하고 있습니다. 잠시 후 다시 시도해주세요.');
  }

  /** kind별로 다른 RateLimiter 인스턴스를 재사용할 수 있는 범용 버전. 관리자 세션은 제한하지 않는다. */
  protected async checkRateLimit(
    ctx: RequestContext,
    limiter: RateLimiter,
    kind: string,
    message = '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
  ): Promise<string | null> {
    if (ctx.adminId !== null) return null;

    const identifier = `${kind}:${ctx.clientIp()}`;
    if (await limiter.isBlocked(identifier)) {
      return message;
    }
    await limiter.recordEvent(identifier);
    return null;
  }
}
