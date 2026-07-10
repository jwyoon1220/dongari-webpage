import { AppContainer } from '../AppContainer';
import { HttpError } from '../http/HttpError';
import { Sanitize } from '../security/Sanitize';
import { Board } from '../models/Board';
import { Post } from '../models/Post';

/** slug로 게시판을 찾고, 없으면 404를 던진다. */
export async function loadBoardBySlug(app: AppContainer, slug: string): Promise<Board> {
  if (!Sanitize.isValidSlug(slug)) throw new HttpError(404, '게시판을 찾을 수 없습니다.');
  const board = await app.boards.findBySlug(slug);
  if (!board) throw new HttpError(404, '게시판을 찾을 수 없습니다.');
  return board;
}

/** id로 게시판을 찾고, 없으면 404를 던진다. (관리자 화면용) */
export async function loadBoardById(app: AppContainer, idParam: string): Promise<Board> {
  const id = Number.parseInt(idParam, 10);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(404, '게시판을 찾을 수 없습니다.');
  const board = await app.boards.findById(id);
  if (!board) throw new HttpError(404, '게시판을 찾을 수 없습니다.');
  return board;
}

/** 해당 게시판 소속의 게시물을 id로 찾고, 없거나 소속이 다르면 404를 던진다. */
export async function loadPostInBoard(app: AppContainer, board: Board, idParam: string): Promise<Post> {
  const id = Number.parseInt(idParam, 10);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(404, '게시물을 찾을 수 없습니다.');
  const post = await app.posts.findById(id);
  if (!post || post.boardId !== board.id) throw new HttpError(404, '게시물을 찾을 수 없습니다.');
  return post;
}
