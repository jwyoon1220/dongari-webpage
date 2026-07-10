import { BaseController } from './BaseController';
import { RequestContext } from '../http/RequestContext';
import { Respond } from '../http/Respond';
import { PostPage } from '../views/pages/PostPage';
import { PostFormPage, PostFormValues } from '../views/pages/PostFormPage';
import { PostDeletePage } from '../views/pages/PostDeletePage';
import { buildLayoutOptions } from '../views/layoutOptions';
import { Sanitize } from '../security/Sanitize';
import { PasswordHasher } from '../security/PasswordHasher';
import { LIMITS } from '../config/constants';
import { loadBoardBySlug, loadPostInBoard } from './loaders';
import { Post } from '../models/Post';

/** 게시물 CRUD. 작성자 인증은 회원가입 없이 게시물 비밀번호로만 수행한다. */
export class PostController extends BaseController {
  newForm = async (ctx: RequestContext): Promise<Response> => {
    const board = await loadBoardBySlug(this.app, ctx.params.slug);
    const values: PostFormValues = { title: '', content: '', nickname: '' };
    return Respond.html(
      PostFormPage.render(buildLayoutOptions(ctx, `${board.name} - 글쓰기`), {
        mode: 'create',
        board,
        action: `/board/${board.slug}/write`,
        values,
        errors: [],
        csrfToken: ctx.csrfToken,
      }),
    );
  };

  create = async (ctx: RequestContext): Promise<Response> => {
    const board = await loadBoardBySlug(this.app, ctx.params.slug);
    const form = await ctx.form();
    this.verifyCsrfOrThrow(ctx, form);

    const nickname = Sanitize.cleanText(form.get('nickname'));
    const title = Sanitize.cleanText(form.get('title'));
    const content = Sanitize.cleanText(form.get('content'));
    const password = form.get('password') ?? '';
    const passwordConfirm = form.get('password_confirm') ?? '';

    const errors: string[] = [];
    if (!Sanitize.isNonEmptyWithin(nickname, LIMITS.NICKNAME_MIN, LIMITS.NICKNAME_MAX)) {
      errors.push(`닉네임은 ${LIMITS.NICKNAME_MIN}~${LIMITS.NICKNAME_MAX}자로 입력하세요.`);
    }
    if (!Sanitize.isNonEmptyWithin(title, LIMITS.POST_TITLE_MIN, LIMITS.POST_TITLE_MAX)) {
      errors.push(`제목은 ${LIMITS.POST_TITLE_MIN}~${LIMITS.POST_TITLE_MAX}자로 입력하세요.`);
    }
    if (!Sanitize.isNonEmptyWithin(content, LIMITS.POST_CONTENT_MIN, LIMITS.POST_CONTENT_MAX)) {
      errors.push(`내용은 ${LIMITS.POST_CONTENT_MIN}~${LIMITS.POST_CONTENT_MAX}자로 입력하세요.`);
    }
    if (!Sanitize.isNonEmptyWithin(password, LIMITS.POST_PASSWORD_MIN, LIMITS.POST_PASSWORD_MAX)) {
      errors.push(`비밀번호는 ${LIMITS.POST_PASSWORD_MIN}~${LIMITS.POST_PASSWORD_MAX}자로 입력하세요.`);
    } else if (password !== passwordConfirm) {
      errors.push('비밀번호 확인이 일치하지 않습니다.');
    }

    if (errors.length > 0) {
      return Respond.badRequest(
        PostFormPage.render(buildLayoutOptions(ctx, `${board.name} - 글쓰기`), {
          mode: 'create',
          board,
          action: `/board/${board.slug}/write`,
          values: { title, content, nickname },
          errors,
          csrfToken: ctx.csrfToken,
        }),
      );
    }

    const passwordHash = await PasswordHasher.hash(password);
    const post = await this.app.posts.create(board.id, title, content, nickname, passwordHash);
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
    );
    return Respond.html(PostPage.render(buildLayoutOptions(ctx, post.title), board, displayPost));
  };

  editForm = async (ctx: RequestContext): Promise<Response> => {
    const board = await loadBoardBySlug(this.app, ctx.params.slug);
    const post = await loadPostInBoard(this.app, board, ctx.params.id);
    return Respond.html(
      PostFormPage.render(buildLayoutOptions(ctx, `${post.title} - 수정`), {
        mode: 'edit',
        board,
        action: `/board/${board.slug}/post/${post.id}/edit`,
        values: { title: post.title, content: post.content, nickname: post.authorNickname },
        errors: [],
        csrfToken: ctx.csrfToken,
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
    const password = form.get('password') ?? '';

    const errors: string[] = [];
    if (!Sanitize.isNonEmptyWithin(title, LIMITS.POST_TITLE_MIN, LIMITS.POST_TITLE_MAX)) {
      errors.push(`제목은 ${LIMITS.POST_TITLE_MIN}~${LIMITS.POST_TITLE_MAX}자로 입력하세요.`);
    }
    if (!Sanitize.isNonEmptyWithin(content, LIMITS.POST_CONTENT_MIN, LIMITS.POST_CONTENT_MAX)) {
      errors.push(`내용은 ${LIMITS.POST_CONTENT_MIN}~${LIMITS.POST_CONTENT_MAX}자로 입력하세요.`);
    }

    if (errors.length === 0) {
      const passwordError = await this.checkPostPassword(ctx, post.passwordHash, password);
      if (passwordError) errors.push(passwordError);
    }

    if (errors.length > 0) {
      return Respond.badRequest(
        PostFormPage.render(buildLayoutOptions(ctx, `${post.title} - 수정`), {
          mode: 'edit',
          board,
          action: `/board/${board.slug}/post/${post.id}/edit`,
          values: { title, content, nickname: post.authorNickname },
          errors,
          csrfToken: ctx.csrfToken,
        }),
      );
    }

    await this.app.posts.update(post.id, title, content);
    return Respond.redirect(`/board/${board.slug}/post/${post.id}?flash=post_updated`);
  };

  deleteForm = async (ctx: RequestContext): Promise<Response> => {
    const board = await loadBoardBySlug(this.app, ctx.params.slug);
    const post = await loadPostInBoard(this.app, board, ctx.params.id);
    return Respond.html(
      PostDeletePage.render(buildLayoutOptions(ctx, `${post.title} - 삭제`), board, post, [], ctx.csrfToken),
    );
  };

  destroy = async (ctx: RequestContext): Promise<Response> => {
    const board = await loadBoardBySlug(this.app, ctx.params.slug);
    const post = await loadPostInBoard(this.app, board, ctx.params.id);
    const form = await ctx.form();
    this.verifyCsrfOrThrow(ctx, form);

    const password = form.get('password') ?? '';
    const errors: string[] = [];
    const passwordError = await this.checkPostPassword(ctx, post.passwordHash, password);
    if (passwordError) errors.push(passwordError);

    if (errors.length > 0) {
      return Respond.badRequest(
        PostDeletePage.render(buildLayoutOptions(ctx, `${post.title} - 삭제`), board, post, errors, ctx.csrfToken),
      );
    }

    await this.app.posts.delete(post.id);
    return Respond.redirect(`/board/${board.slug}?flash=post_deleted`);
  };

  /** 비밀번호 검증 + 무차별 대입 방어. 문제가 있으면 사용자에게 보여줄 오류 메시지를 반환한다. */
  private async checkPostPassword(ctx: RequestContext, passwordHash: string, password: string): Promise<string | null> {
    const identifier = `post_auth:${ctx.clientIp()}`;
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
