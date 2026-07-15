import { AppContainer } from '../AppContainer';
import { HttpError } from '../http/HttpError';
import { Sanitize } from '../security/Sanitize';
import { Board } from '../models/Board';
import { Post } from '../models/Post';
import { Comment } from '../models/Comment';
import { EmoticonListItem } from '../views/components/EmoticonDataIsland';

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

/** 해당 게시물 소속의 댓글을 id로 찾고, 없거나 소속이 다르면 404를 던진다. */
export async function loadCommentInPost(app: AppContainer, post: Post, idParam: string): Promise<Comment> {
  const id = Number.parseInt(idParam, 10);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(404, '댓글을 찾을 수 없습니다.');
  const comment = await app.comments.findById(id);
  if (!comment || comment.postId !== post.id) throw new HttpError(404, '댓글을 찾을 수 없습니다.');
  return comment;
}

/** 붙여넣기 업로드/이모티콘 자동완성 UI(content-tools.js)가 읽어갈 이모티콘 목록. */
export async function loadEmoticonItems(app: AppContainer): Promise<EmoticonListItem[]> {
  const emoticons = await app.emoticons.list();
  return emoticons.map((e) => ({ name: e.name, url: e.imageUrl }));
}
