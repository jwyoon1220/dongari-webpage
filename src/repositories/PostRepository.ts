import { D1Client } from '../db/D1Client';
import { Post, PostContentFormat, PostRow } from '../models/Post';

export interface PostPage {
  posts: Post[];
  total: number;
}

const POST_COLUMNS =
  'id, board_id, title, content, author_nickname, password_hash, view_count, created_at, updated_at, is_admin_post, content_format, rendered_content';

/** 게시물 데이터 접근 계층. 모든 쿼리는 파라미터 바인딩으로만 실행된다. */
export class PostRepository {
  constructor(private readonly db: D1Client) {}

  async findByBoardId(boardId: number, limit: number, offset: number): Promise<PostPage> {
    const [posts, countRow] = await Promise.all([
      this.db.all<PostRow>(
        `SELECT ${POST_COLUMNS} FROM posts WHERE board_id = ? ORDER BY id DESC LIMIT ? OFFSET ?`,
        [boardId, limit, offset],
      ),
      this.db.first<{ count: number }>('SELECT COUNT(*) AS count FROM posts WHERE board_id = ?', [boardId]),
    ]);
    return { posts: posts.map(Post.fromRow), total: Number(countRow?.count ?? 0) };
  }

  async findById(id: number): Promise<Post | null> {
    const row = await this.db.first<PostRow>(`SELECT ${POST_COLUMNS} FROM posts WHERE id = ?`, [id]);
    return row ? Post.fromRow(row) : null;
  }

  async create(
    boardId: number,
    title: string,
    content: string,
    authorNickname: string,
    passwordHash: string,
    isAdminPost: boolean,
    contentFormat: PostContentFormat,
    renderedContent: string,
  ): Promise<Post> {
    const row = await this.db.first<PostRow>(
      `INSERT INTO posts (board_id, title, content, author_nickname, password_hash, is_admin_post, content_format, rendered_content)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING ${POST_COLUMNS}`,
      [boardId, title, content, authorNickname, passwordHash, isAdminPost ? 1 : 0, contentFormat, renderedContent],
    );
    if (!row) throw new Error('게시물 생성에 실패했습니다.');
    return Post.fromRow(row);
  }

  async update(
    id: number,
    title: string,
    content: string,
    contentFormat: PostContentFormat,
    renderedContent: string,
  ): Promise<void> {
    await this.db.run(
      `UPDATE posts
       SET title = ?, content = ?, content_format = ?, rendered_content = ?,
           updated_at = STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now')
       WHERE id = ?`,
      [title, content, contentFormat, renderedContent, id],
    );
  }

  async delete(id: number): Promise<void> {
    await this.db.run('DELETE FROM posts WHERE id = ?', [id]);
  }

  async incrementViewCount(id: number): Promise<void> {
    await this.db.run('UPDATE posts SET view_count = view_count + 1 WHERE id = ?', [id]);
  }
}
