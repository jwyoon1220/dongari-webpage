import { BaseController } from './BaseController';
import { RequestContext } from '../http/RequestContext';
import { Respond } from '../http/Respond';
import { AdminLoginPage } from '../views/pages/AdminLoginPage';
import { AdminDashboardPage } from '../views/pages/AdminDashboardPage';
import { AdminChangePasswordPage } from '../views/pages/AdminChangePasswordPage';
import { BoardFormPage, BoardFormValues } from '../views/pages/BoardFormPage';
import { buildLayoutOptions } from '../views/layoutOptions';
import { Sanitize } from '../security/Sanitize';
import { PasswordHasher } from '../security/PasswordHasher';
import { LIMITS } from '../config/constants';
import { loadBoardById } from './loaders';

// PBKDF2 형식은 맞지만 어떤 실제 비밀번호와도 일치하지 않는 더미 해시.
// 존재하지 않는 계정으로 로그인 시도할 때도 동일한 연산 비용을 지불시켜
// 아이디 존재 여부가 응답 시간으로 새어나가지 않도록 한다.
const DUMMY_PASSWORD_HASH =
  '100000:AAAAAAAAAAAAAAAAAAAAAA==:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';

export class AdminController extends BaseController {
  loginForm = async (ctx: RequestContext): Promise<Response> => {
    if (ctx.adminId !== null) return Respond.redirect('/admin/dashboard');
    return Respond.html(AdminLoginPage.render(buildLayoutOptions(ctx, '관리자 로그인'), [], ctx.csrfToken, ''));
  };

  login = async (ctx: RequestContext): Promise<Response> => {
    if (ctx.adminId !== null) return Respond.redirect('/admin/dashboard');
    const form = await ctx.form();
    this.verifyCsrfOrThrow(ctx, form);

    const username = Sanitize.cleanText(form.get('username'));
    const password = form.get('password') ?? '';
    const identifier = `admin_login:${ctx.clientIp()}`;

    let errorMessage: string | null = null;
    if (await this.app.loginRateLimiter.isBlocked(identifier)) {
      errorMessage = '로그인 시도 횟수를 초과했습니다. 잠시 후 다시 시도해주세요.';
    } else {
      const admin = username ? await this.app.admins.findByUsername(username) : null;
      const validPassword = await PasswordHasher.verify(password, admin ? admin.passwordHash : DUMMY_PASSWORD_HASH);

      if (!admin || !validPassword) {
        await this.app.loginRateLimiter.recordFailure(identifier);
        errorMessage = '아이디 또는 비밀번호가 올바르지 않습니다.';
      } else {
        await this.app.loginRateLimiter.clear(identifier);
        const { setCookieHeader } = await this.app.sessionService.createSession(admin.id);
        return Respond.redirect('/admin/dashboard?flash=logged_in', [['Set-Cookie', setCookieHeader]]);
      }
    }

    return Respond.badRequest(
      AdminLoginPage.render(buildLayoutOptions(ctx, '관리자 로그인'), [errorMessage], ctx.csrfToken, username),
    );
  };

  logout = async (ctx: RequestContext): Promise<Response> => {
    const form = await ctx.form();
    this.verifyCsrfOrThrow(ctx, form);
    const setCookieHeader = await this.app.sessionService.destroySession(ctx.cookies);
    return Respond.redirect('/?flash=logged_out', [['Set-Cookie', setCookieHeader]]);
  };

  dashboard = this.withAdmin(async (ctx) => {
    const boards = await this.app.boards.findAll();
    return Respond.html(AdminDashboardPage.render(buildLayoutOptions(ctx, '게시판 관리'), boards, ctx.csrfToken));
  });

  newBoardForm = this.withAdmin(async (ctx) => {
    const values: BoardFormValues = { slug: '', name: '', description: '', displayOrder: 0 };
    return Respond.html(
      BoardFormPage.render(buildLayoutOptions(ctx, '새 게시판'), 'create', '/admin/boards/new', values, [], ctx.csrfToken),
    );
  });

  createBoard = this.withAdmin(async (ctx) => {
    const form = await ctx.form();
    this.verifyCsrfOrThrow(ctx, form);

    const slug = Sanitize.cleanText(form.get('slug')).toLowerCase();
    const name = Sanitize.cleanText(form.get('name'));
    const description = Sanitize.cleanText(form.get('description'));
    const displayOrder = AdminController.parseDisplayOrder(form.get('display_order'));

    const errors = AdminController.validateBoardFields(slug, name, description, { requireSlug: true });

    if (errors.length === 0) {
      try {
        await this.app.boards.create(slug, name, description, displayOrder);
        return Respond.redirect('/admin/dashboard?flash=board_created');
      } catch (err) {
        errors.push(AdminController.describeBoardWriteError(err));
      }
    }

    return Respond.badRequest(
      BoardFormPage.render(
        buildLayoutOptions(ctx, '새 게시판'),
        'create',
        '/admin/boards/new',
        { slug, name, description, displayOrder },
        errors,
        ctx.csrfToken,
      ),
    );
  });

  editBoardForm = this.withAdmin(async (ctx) => {
    const board = await loadBoardById(this.app, ctx.params.id);
    const values: BoardFormValues = {
      slug: board.slug,
      name: board.name,
      description: board.description,
      displayOrder: board.displayOrder,
    };
    return Respond.html(
      BoardFormPage.render(
        buildLayoutOptions(ctx, `${board.name} - 수정`),
        'edit',
        `/admin/boards/${board.id}/edit`,
        values,
        [],
        ctx.csrfToken,
      ),
    );
  });

  updateBoard = this.withAdmin(async (ctx) => {
    const board = await loadBoardById(this.app, ctx.params.id);
    const form = await ctx.form();
    this.verifyCsrfOrThrow(ctx, form);

    const name = Sanitize.cleanText(form.get('name'));
    const description = Sanitize.cleanText(form.get('description'));
    const displayOrder = AdminController.parseDisplayOrder(form.get('display_order'));

    const errors = AdminController.validateBoardFields(board.slug, name, description, { requireSlug: false });

    if (errors.length === 0) {
      await this.app.boards.update(board.id, name, description, displayOrder);
      return Respond.redirect('/admin/dashboard?flash=board_updated');
    }

    return Respond.badRequest(
      BoardFormPage.render(
        buildLayoutOptions(ctx, `${board.name} - 수정`),
        'edit',
        `/admin/boards/${board.id}/edit`,
        { slug: board.slug, name, description, displayOrder },
        errors,
        ctx.csrfToken,
      ),
    );
  });

  deleteBoard = this.withAdmin(async (ctx) => {
    const board = await loadBoardById(this.app, ctx.params.id);
    const form = await ctx.form();
    this.verifyCsrfOrThrow(ctx, form);
    await this.app.boards.deleteWithPosts(board.id);
    return Respond.redirect('/admin/dashboard?flash=board_deleted');
  });

  changePasswordForm = this.withAdmin(async (ctx) => {
    return Respond.html(AdminChangePasswordPage.render(buildLayoutOptions(ctx, '비밀번호 변경'), [], ctx.csrfToken));
  });

  changePassword = this.withAdmin(async (ctx, adminId) => {
    const form = await ctx.form();
    this.verifyCsrfOrThrow(ctx, form);

    const currentPassword = form.get('current_password') ?? '';
    const newPassword = form.get('new_password') ?? '';
    const newPasswordConfirm = form.get('new_password_confirm') ?? '';

    const errors: string[] = [];
    const admin = await this.app.admins.findById(adminId);
    const currentValid = admin ? await PasswordHasher.verify(currentPassword, admin.passwordHash) : false;
    if (!admin || !currentValid) {
      errors.push('현재 비밀번호가 올바르지 않습니다.');
    }
    if (!Sanitize.isNonEmptyWithin(newPassword, LIMITS.ADMIN_PASSWORD_MIN, LIMITS.ADMIN_PASSWORD_MAX)) {
      errors.push(`새 비밀번호는 ${LIMITS.ADMIN_PASSWORD_MIN}~${LIMITS.ADMIN_PASSWORD_MAX}자로 입력하세요.`);
    } else if (newPassword !== newPasswordConfirm) {
      errors.push('새 비밀번호 확인이 일치하지 않습니다.');
    }

    if (errors.length > 0) {
      return Respond.badRequest(AdminChangePasswordPage.render(buildLayoutOptions(ctx, '비밀번호 변경'), errors, ctx.csrfToken));
    }

    await this.app.admins.updatePassword(adminId, await PasswordHasher.hash(newPassword));
    return Respond.redirect('/admin/dashboard?flash=password_changed');
  });

  private static validateBoardFields(
    slug: string,
    name: string,
    description: string,
    opts: { requireSlug: boolean },
  ): string[] {
    const errors: string[] = [];
    if (opts.requireSlug && !Sanitize.isValidSlug(slug)) {
      errors.push('주소는 영문 소문자/숫자/하이픈 2~30자로 입력하세요.');
    }
    if (!Sanitize.isNonEmptyWithin(name, LIMITS.BOARD_NAME_MIN, LIMITS.BOARD_NAME_MAX)) {
      errors.push(`게시판 이름은 ${LIMITS.BOARD_NAME_MIN}~${LIMITS.BOARD_NAME_MAX}자로 입력하세요.`);
    }
    if (description.length > LIMITS.BOARD_DESCRIPTION_MAX) {
      errors.push(`설명은 ${LIMITS.BOARD_DESCRIPTION_MAX}자 이내로 입력하세요.`);
    }
    return errors;
  }

  private static parseDisplayOrder(value: string | null): number {
    const n = Number.parseInt(value ?? '0', 10);
    if (!Number.isInteger(n)) return 0;
    return Math.max(-1000, Math.min(1000, n));
  }

  private static describeBoardWriteError(err: unknown): string {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('UNIQUE')) return '이미 사용 중인 주소(slug)입니다.';
    return '게시판을 저장하지 못했습니다.';
  }
}
