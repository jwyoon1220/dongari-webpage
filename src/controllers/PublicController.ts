import { BaseController } from './BaseController';
import { RequestContext } from '../http/RequestContext';
import { Respond } from '../http/Respond';
import { HomePage } from '../views/pages/HomePage';
import { BoardPage } from '../views/pages/BoardPage';
import { TermsPage } from '../views/pages/TermsPage';
import { buildLayoutOptions } from '../views/layoutOptions';
import { Sanitize } from '../security/Sanitize';
import { PAGE_SIZE } from '../config/constants';
import { loadBoardBySlug } from './loaders';
import { TERMS_MARKDOWN } from '../content/termsContent';
import { MarkdownRenderer } from '../views/markdown/MarkdownRenderer';

/** 비회원도 접근 가능한 공개 조회 화면(홈, 게시판 목록, 이용약관) */
export class PublicController extends BaseController {
  home = async (ctx: RequestContext): Promise<Response> => {
    const boards = await this.app.boards.findAllWithPostCounts();
    return Respond.html(HomePage.render(buildLayoutOptions(ctx, '홈'), boards));
  };

  terms = async (ctx: RequestContext): Promise<Response> => {
    return Respond.html(TermsPage.render(buildLayoutOptions(ctx, '이용약관')));
  };

  /** 이용약관 원문을 마크다운 그대로 반환한다(모드: 마크다운). */
  termsMarkdown = async (): Promise<Response> => {
    return Respond.text(TERMS_MARKDOWN);
  };

  /** 이용약관을 마크다운 문법을 제거한 순수 텍스트로 반환한다(모드: 텍스트). */
  termsText = async (): Promise<Response> => {
    return Respond.text(MarkdownRenderer.toPlainText(TERMS_MARKDOWN));
  };

  boardShow = async (ctx: RequestContext): Promise<Response> => {
    const board = await loadBoardBySlug(this.app, ctx.params.slug);
    const page = Sanitize.parsePositiveInt(ctx.url.searchParams.get('page'), 1);
    const offset = (page - 1) * PAGE_SIZE;
    const { posts, total } = await this.app.posts.findByBoardId(board.id, PAGE_SIZE, offset);
    return Respond.html(BoardPage.render(buildLayoutOptions(ctx, board.name), board, posts, total, page));
  };
}
