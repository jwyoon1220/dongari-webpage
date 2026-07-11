import { BaseController } from './BaseController';
import { RequestContext } from '../http/RequestContext';
import { Respond } from '../http/Respond';
import { PostPage } from '../views/pages/PostPage';
import { PostContentRenderer } from '../views/content/PostContentRenderer';
import { CommentDeletePage } from '../views/pages/CommentDeletePage';
import { buildLayoutOptions } from '../views/layoutOptions';
import { Sanitize } from '../security/Sanitize';
import { PasswordHasher } from '../security/PasswordHasher';
import { Encoding } from '../security/Encoding';
import { adminNickname } from '../security/AdminIdentity';
import { LIMITS } from '../config/constants';
import { loadBoardBySlug, loadPostInBoard, loadCommentInPost } from './loaders';

/**
 * 댓글 생성/삭제. 요구사항에 따라 수정 기능은 없다.
 * 게시물과 동일하게 비회원은 닉네임+비밀번호로, 관리자는 세션만으로 처리한다.
 */
export class CommentController extends BaseController {
  create = async (ctx: RequestContext): Promise<Response> => {
    const board = await loadBoardBySlug(this.app, ctx.params.slug);
    const post = await loadPostInBoard(this.app, board, ctx.params.id);
    const form = await ctx.form();
    this.verifyCsrfOrThrow(ctx, form);

    const isAdminUser = ctx.adminId !== null;
    const content = Sanitize.cleanText(form.get('content'));

    const errors: string[] = [];
    if (!Sanitize.isNonEmptyWithin(content, LIMITS.COMMENT_CONTENT_MIN, LIMITS.COMMENT_CONTENT_MAX)) {
      errors.push(`댓글은 ${LIMITS.COMMENT_CONTENT_MIN}~${LIMITS.COMMENT_CONTENT_MAX}자로 입력하세요.`);
    }

    let nickname = '';
    let password = '';
    if (!isAdminUser) {
      nickname = Sanitize.cleanText(form.get('nickname'));
      password = form.get('password') ?? '';
      if (!Sanitize.isNonEmptyWithin(nickname, LIMITS.NICKNAME_MIN, LIMITS.NICKNAME_MAX)) {
        errors.push(`닉네임은 ${LIMITS.NICKNAME_MIN}~${LIMITS.NICKNAME_MAX}자로 입력하세요.`);
      }
      if (!Sanitize.isNonEmptyWithin(password, LIMITS.POST_PASSWORD_MIN, LIMITS.POST_PASSWORD_MAX)) {
        errors.push(`비밀번호는 ${LIMITS.POST_PASSWORD_MIN}~${LIMITS.POST_PASSWORD_MAX}자로 입력하세요.`);
      }
    }

    if (errors.length === 0) {
      const rateLimitError = await this.checkCreationRateLimit(ctx, 'comment_create');
      if (rateLimitError) errors.push(rateLimitError);
    }

    if (errors.length > 0) {
      const comments = await this.app.comments.findByPostId(post.id);
      const contentHtml = await PostContentRenderer.render(post.content, post.contentFormat);
      return Respond.badRequest(
        PostPage.render(buildLayoutOptions(ctx, post.title), board, post, contentHtml, comments, {
          errors,
          values: { nickname, content },
          isAdminUser,
          adminNicknamePreview: isAdminUser ? adminNickname(ctx.adminId as number) : undefined,
        }),
      );
    }

    const finalNickname = isAdminUser ? adminNickname(ctx.adminId as number) : nickname;
    const passwordHash = isAdminUser
      ? await PasswordHasher.hash(Encoding.randomToken(32))
      : await PasswordHasher.hash(password);
    await this.app.comments.create(post.id, content, finalNickname, passwordHash, isAdminUser);
    return Respond.redirect(`/board/${board.slug}/post/${post.id}#comments`);
  };

  deleteForm = async (ctx: RequestContext): Promise<Response> => {
    const board = await loadBoardBySlug(this.app, ctx.params.slug);
    const post = await loadPostInBoard(this.app, board, ctx.params.id);
    const comment = await loadCommentInPost(this.app, post, ctx.params.commentId);
    return Respond.html(
      CommentDeletePage.render(
        buildLayoutOptions(ctx, `${post.title} - 댓글 삭제`),
        board,
        post,
        comment,
        [],
        ctx.csrfToken,
        ctx.adminId !== null,
      ),
    );
  };

  destroy = async (ctx: RequestContext): Promise<Response> => {
    const board = await loadBoardBySlug(this.app, ctx.params.slug);
    const post = await loadPostInBoard(this.app, board, ctx.params.id);
    const comment = await loadCommentInPost(this.app, post, ctx.params.commentId);
    const form = await ctx.form();
    this.verifyCsrfOrThrow(ctx, form);

    const password = form.get('password') ?? '';
    const passwordError = await this.checkOwnerPassword(ctx, comment.passwordHash, password);

    if (passwordError) {
      return Respond.badRequest(
        CommentDeletePage.render(
          buildLayoutOptions(ctx, `${post.title} - 댓글 삭제`),
          board,
          post,
          comment,
          [passwordError],
          ctx.csrfToken,
          ctx.adminId !== null,
        ),
      );
    }

    await this.app.comments.delete(comment.id);
    return Respond.redirect(`/board/${board.slug}/post/${post.id}#comments`);
  };
}
