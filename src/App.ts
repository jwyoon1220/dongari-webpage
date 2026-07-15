import { Env } from './config/Env';
import { AppContainer } from './AppContainer';
import { RequestContext } from './http/RequestContext';
import { Router } from './http/Router';
import { Respond } from './http/Respond';
import { HttpError } from './http/HttpError';
import { applySecurityHeaders } from './http/SecurityHeaders';
import { CsrfProtection } from './security/CsrfProtection';
import { ErrorPage } from './views/pages/ErrorPage';
import { buildLayoutOptions } from './views/layoutOptions';
import { PublicController } from './controllers/PublicController';
import { PostController } from './controllers/PostController';
import { CommentController } from './controllers/CommentController';
import { AdminController } from './controllers/AdminController';
import { ImageController } from './controllers/ImageController';
import { EmoticonController } from './controllers/EmoticonController';

function buildRouter(app: AppContainer): Router {
  const router = new Router();
  const publicController = new PublicController(app);
  const postController = new PostController(app);
  const commentController = new CommentController(app);
  const adminController = new AdminController(app);
  const imageController = new ImageController(app);
  const emoticonController = new EmoticonController(app);

  router.get('/', publicController.home);
  router.get('/terms', publicController.terms);
  router.get('/board/:slug', publicController.boardShow);

  router.get('/board/:slug/write', postController.newForm);
  router.post('/board/:slug/write', postController.create);
  router.get('/board/:slug/post/:id', postController.show);
  router.get('/board/:slug/post/:id/edit', postController.editForm);
  router.post('/board/:slug/post/:id/edit', postController.update);
  router.get('/board/:slug/post/:id/delete', postController.deleteForm);
  router.post('/board/:slug/post/:id/delete', postController.destroy);

  router.post('/board/:slug/post/:id/comments', commentController.create);
  router.get('/board/:slug/post/:id/comments/:commentId/delete', commentController.deleteForm);
  router.post('/board/:slug/post/:id/comments/:commentId/delete', commentController.destroy);

  router.post('/api/images', imageController.upload);
  router.get('/emotion', emoticonController.index);
  router.post('/emotion', emoticonController.create);

  router.get('/admin', adminController.loginForm);
  router.post('/admin/login', adminController.login);
  router.post('/admin/logout', adminController.logout);
  router.get('/admin/dashboard', adminController.dashboard);
  router.get('/admin/boards/new', adminController.newBoardForm);
  router.post('/admin/boards/new', adminController.createBoard);
  router.get('/admin/boards/:id/edit', adminController.editBoardForm);
  router.post('/admin/boards/:id/edit', adminController.updateBoard);
  router.post('/admin/boards/:id/delete', adminController.deleteBoard);
  router.get('/admin/password', adminController.changePasswordForm);
  router.post('/admin/password', adminController.changePassword);

  return router;
}

/** 애플리케이션 진입점. Pages Functions 핸들러가 이 클래스 하나만 호출한다. */
export class App {
  static async handle(request: Request, env: Env): Promise<Response> {
    const ctx = new RequestContext(request, env);
    const { token: csrfToken, setCookieHeader: csrfSetCookie } = CsrfProtection.ensureToken(ctx.cookies);
    ctx.csrfToken = csrfToken;

    const app = new AppContainer(env);
    ctx.adminId = await app.sessionService.resolveAdminId(ctx.cookies);

    let response: Response;
    try {
      const router = buildRouter(app);
      const matched = await router.dispatch(ctx);
      response = matched ?? Respond.notFound(ErrorPage.render(buildLayoutOptions(ctx, '페이지 없음'), 404, '페이지를 찾을 수 없습니다.'));
    } catch (err) {
      if (err instanceof HttpError) {
        response = Respond.html(ErrorPage.render(buildLayoutOptions(ctx, '오류'), err.status, err.message), {
          status: err.status,
        });
      } else {
        console.error('Unhandled error', err);
        response = Respond.serverError(
          ErrorPage.render(buildLayoutOptions(ctx, '오류'), 500, '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'),
        );
      }
    }

    if (csrfSetCookie) {
      response = new Response(response.body, response);
      response.headers.append('Set-Cookie', csrfSetCookie);
    }

    return applySecurityHeaders(response, { noIndex: ctx.url.pathname.startsWith('/admin') });
  }
}
