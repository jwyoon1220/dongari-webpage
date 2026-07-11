import { BaseController } from './BaseController';
import { RequestContext } from '../http/RequestContext';
import { Respond } from '../http/Respond';
import { PostPage } from '../views/pages/PostPage';
import { PostFormPage, PostFormValues } from '../views/pages/PostFormPage';
import { PostDeletePage } from '../views/pages/PostDeletePage';
import { PostContentRenderer } from '../views/content/PostContentRenderer';
import { buildLayoutOptions } from '../views/layoutOptions';
import { Sanitize } from '../security/Sanitize';
import { PasswordHasher } from '../security/PasswordHasher';
import { Encoding } from '../security/Encoding';
import { adminNickname } from '../security/AdminIdentity';
import { LIMITS } from '../config/constants';
import { loadBoardBySlug, loadPostInBoard } from './loaders';
import { Post, parsePostContentFormat } from '../models/Post';

/**
 * 게시물 CRUD.
 * - 일반 방문자: 회원가입 없이 닉네임 + 게시물 비밀번호로 작성/수정/삭제.
 * - 관리자 세션: 비밀번호 없이 작성 가능하며, 닉네임은 admin_XXXXX로 고정되고
 *   체크 배지가 표시된다. 관리자는 어떤 게시물이든 비밀번호 확인 없이 수정/삭제할 수 있다(모더레이션).
 * - 작성 형식은 텍스트/마크다운/HTML 중 선택 가능하며, 마크다운·HTML은 렌더링 시
 *   화이트리스트 기반으로 정제된다(PostContentRenderer, HtmlSanitizer 참고).
 */
export class PostController extends BaseController {
  newForm = async (ctx: RequestContext): Promise<Response> => {
    const board = await loadBoardBySlug(this.app, ctx.params.slug);
    const isAdminUser = ctx.adminId !== null;
    const values: PostFormValues = { title: '', content: '', nickname: '', contentFormat: 'text' };
    return Respond.html(
      PostFormPage.render(buildLayoutOptions(ctx, `${board.name} - 글쓰기`), {
        mode: 'create',
        board,
        action: `/board/${board.slug}/write`,
        values,
        errors: [],
        csrfToken: ctx.csrfToken,
        isAdminUser,
        adminNicknamePreview: isAdminUser ? adminNickname(ctx.adminId as number) : undefined,
      }),
    );
  };

  create = async (ctx: RequestContext): Promise<Response> => {
    const board = await loadBoardBySlug(this.app, ctx.params.slug);
    const form = await ctx.form();
    this.verifyCsrfOrThrow(ctx, form);

    const isAdminUser = ctx.adminId !== null;
    const title = Sanitize.cleanText(form.get('title'));
    const content = Sanitize.cleanText(form.get('content'));
    const contentFormat = parsePostContentFormat(form.get('content_format'));

    const errors: string[] = [];
    if (!Sanitize.isNonEmptyWithin(title, LIMITS.POST_TITLE_MIN, LIMITS.POST_TITLE_MAX)) {
      errors.push(`제목은 ${LIMITS.POST_TITLE_MIN}~${LIMITS.POST_TITLE_MAX}자로 입력하세요.`);
    }
    if (!Sanitize.isNonEmptyWithin(content, LIMITS.POST_CONTENT_MIN, LIMITS.POST_CONTENT_MAX)) {
      errors.push(`내용은 ${LIMITS.POST_CONTENT_MIN}~${LIMITS.POST_CONTENT_MAX}자로 입력하세요.`);
    }

    let nickname = '';
    let password = '';
    if (!isAdminUser) {
      nickname = Sanitize.cleanText(form.get('nickname'));
      password = form.get('password') ?? '';
      const passwordConfirm = form.get('password_confirm') ?? '';

      if (!Sanitize.isNonEmptyWithin(nickname, LIMITS.NICKNAME_MIN, LIMITS.NICKNAME_MAX)) {
        errors.push(`닉네임은 ${LIMITS.NICKNAME_MIN}~${LIMITS.NICKNAME_MAX}자로 입력하세요.`);
      }
      if (!Sanitize.isNonEmptyWithin(password, LIMITS.POST_PASSWORD_MIN, LIMITS.POST_PASSWORD_MAX)) {
        errors.push(`비밀번호는 ${LIMITS.POST_PASSWORD_MIN}~${LIMITS.POST_PASSWORD_MAX}자로 입력하세요.`);
      } else if (password !== passwordConfirm) {
        errors.push('비밀번호 확인이 일치하지 않습니다.');
      }
    }

    if (form.get('license_agree') !== 'on') {
      errors.push('GFDL 라이선스 및 이용약관에 동의해야 게시물을 작성할 수 있습니다.');
    }

    if (errors.length === 0) {
      const rateLimitError = await this.checkCreationRateLimit(ctx, 'post_create');
      if (rateLimitError) errors.push(rateLimitError);
    }

    if (errors.length > 0) {
      return Respond.badRequest(
        PostFormPage.render(buildLayoutOptions(ctx, `${board.name} - 글쓰기`), {
          mode: 'create',
          board,
          action: `/board/${board.slug}/write`,
          values: { title, content, nickname, contentFormat },
          errors,
          csrfToken: ctx.csrfToken,
          isAdminUser,
          adminNicknamePreview: isAdminUser ? adminNickname(ctx.adminId as number) : undefined,
        }),
      );
    }

    const finalNickname = isAdminUser ? adminNickname(ctx.adminId as number) : nickname;
    // 관리자 글은 게시물 비밀번호를 쓰지 않으므로(관리자 세션으로만 수정/삭제) 추측 불가능한 임의 값을 해싱해 둔다.
    const passwordHash = isAdminUser ? await PasswordHasher.hash(Encoding.randomToken(32)) : await PasswordHasher.hash(password);
    const post = await this.app.posts.create(
      board.id,
      title,
      content,
      finalNickname,
      passwordHash,
      isAdminUser,
      contentFormat,
    );
    return Respond.redirect(`/board/${board.slug}/post/${post.id}?flash=post_created`);
  };

  show = async (ctx: RequestContext): Promise<Response> => {
    const board = await loadBoardBySlug(this.app, ctx.params.slug);
    const post = await loadPostInBoard(this.app, board, ctx.params.id);
    await this.app.posts.incrementViewCount(post.id);
    const displayPost = new Post(
      post.id,
      post.boardId,
      post.title,
      post.content,
      post.authorNickname,
      post.passwordHash,
      post.viewCount + 1,
      post.createdAt,
      post.updatedAt,
      post.isAdminPost,
      post.contentFormat,
    );
    const contentHtml = await PostContentRenderer.render(displayPost.content, displayPost.contentFormat);
    const comments = await this.app.comments.findByPostId(post.id);
    const isAdminUser = ctx.adminId !== null;
    return Respond.html(
      PostPage.render(buildLayoutOptions(ctx, post.title), board, displayPost, contentHtml, comments, {
        errors: [],
        values: { nickname: '', content: '' },
        isAdminUser,
        adminNicknamePreview: isAdminUser ? adminNickname(ctx.adminId as number) : undefined,
      }),
    );
  };

  editForm = async (ctx: RequestContext): Promise<Response> => {
    const board = await loadBoardBySlug(this.app, ctx.params.slug);
    const post = await loadPostInBoard(this.app, board, ctx.params.id);
    return Respond.html(
      PostFormPage.render(buildLayoutOptions(ctx, `${post.title} - 수정`), {
        mode: 'edit',
        board,
        action: `/board/${board.slug}/post/${post.id}/edit`,
        values: { title: post.title, content: post.content, nickname: post.authorNickname, contentFormat: post.contentFormat },
        errors: [],
        csrfToken: ctx.csrfToken,
        isAdminUser: ctx.adminId !== null,
      }),
    );
  };

  update = async (ctx: RequestContext): Promise<Response> => {
    const board = await loadBoardBySlug(this.app, ctx.params.slug);
    const post = await loadPostInBoard(this.app, board, ctx.params.id);
    const form = await ctx.form();
    this.verifyCsrfOrThrow(ctx, form);

    const title = Sanitize.cleanText(form.get('title'));
    const content = Sanitize.cleanText(form.get('content'));
    const contentFormat = parsePostContentFormat(form.get('content_format'));
    const password = form.get('password') ?? '';

    const errors: string[] = [];
    if (!Sanitize.isNonEmptyWithin(title, LIMITS.POST_TITLE_MIN, LIMITS.POST_TITLE_MAX)) {
      errors.push(`제목은 ${LIMITS.POST_TITLE_MIN}~${LIMITS.POST_TITLE_MAX}자로 입력하세요.`);
    }
    if (!Sanitize.isNonEmptyWithin(content, LIMITS.POST_CONTENT_MIN, LIMITS.POST_CONTENT_MAX)) {
      errors.push(`내용은 ${LIMITS.POST_CONTENT_MIN}~${LIMITS.POST_CONTENT_MAX}자로 입력하세요.`);
    }

    if (errors.length === 0) {
      const passwordError = await this.checkOwnerPassword(ctx, post.passwordHash, password);
      if (passwordError) errors.push(passwordError);
    }

    if (errors.length > 0) {
      return Respond.badRequest(
        PostFormPage.render(buildLayoutOptions(ctx, `${post.title} - 수정`), {
          mode: 'edit',
          board,
          action: `/board/${board.slug}/post/${post.id}/edit`,
          values: { title, content, nickname: post.authorNickname, contentFormat },
          errors,
          csrfToken: ctx.csrfToken,
          isAdminUser: ctx.adminId !== null,
        }),
      );
    }

    await this.app.posts.update(post.id, title, content, contentFormat);
    return Respond.redirect(`/board/${board.slug}/post/${post.id}?flash=post_updated`);
  };

  deleteForm = async (ctx: RequestContext): Promise<Response> => {
    const board = await loadBoardBySlug(this.app, ctx.params.slug);
    const post = await loadPostInBoard(this.app, board, ctx.params.id);
    return Respond.html(
      PostDeletePage.render(
        buildLayoutOptions(ctx, `${post.title} - 삭제`),
        board,
        post,
        [],
        ctx.csrfToken,
        ctx.adminId !== null,
      ),
    );
  };

  destroy = async (ctx: RequestContext): Promise<Response> => {
    const board = await loadBoardBySlug(this.app, ctx.params.slug);
    const post = await loadPostInBoard(this.app, board, ctx.params.id);
    const form = await ctx.form();
    this.verifyCsrfOrThrow(ctx, form);

    const password = form.get('password') ?? '';
    const errors: string[] = [];
    const passwordError = await this.checkOwnerPassword(ctx, post.passwordHash, password);
    if (passwordError) errors.push(passwordError);

    if (errors.length > 0) {
      return Respond.badRequest(
        PostDeletePage.render(
          buildLayoutOptions(ctx, `${post.title} - 삭제`),
          board,
          post,
          errors,
          ctx.csrfToken,
          ctx.adminId !== null,
        ),
      );
    }

    await this.app.posts.delete(post.id);
    return Respond.redirect(`/board/${board.slug}?flash=post_deleted`);
  };
}
