import { D1Client } from '../db/D1Client';
import { Post, PostRow } from '../models/Post';

export interface PostPage {
  posts: Post[];
  total: number;
}

/** 게시물 데이터 접근 계층. 모든 쿼리는 파라미터 바인딩으로만 실행된다. */
export class PostRepository {
  constructor(private readonly db: D1Client) {}

  async findByBoardId(boardId: number, limit: number, offset: number): Promise<PostPage> {
    const [posts, countRow] = await Promise.all([
      this.db.all<PostRow>(
        `SELECT id, board_id, title, content, author_nickname, password_hash, view_count, created_at, updated_at
         FROM posts WHERE board_id = ? ORDER BY id DESC LIMIT ? OFFSET ?`,
        [boardId, limit, offset],
      ),
      this.db.first<{ count: number }>('SELECT COUNT(*) AS count FROM posts WHERE board_id = ?', [boardId]),
    ]);
    return { posts: posts.map(Post.fromRow), total: Number(countRow?.count ?? 0) };
  }

  async findById(id: number): Promise<Post | null> {
    const row = await this.db.first<PostRow>(
      `SELECT id, board_id, title, content, author_nickname, password_hash, view_count, created_at, updated_at
       FROM posts WHERE id = ?`,
      [id],
    );
    return row ? Post.fromRow(row) : null;
  }

  async create(
    boardId: number,
    title: string,
    content: string,
    authorNickname: string,
    passwordHash: string,
  ): Promise<Post> {
    const row = await this.db.first<PostRow>(
      `INSERT INTO posts (board_id, title, content, author_nickname, password_hash)
       VALUES (?, ?, ?, ?, ?)
       RETURNING id, board_id, title, content, author_nickname, password_hash, view_count, created_at, updated_at`,
      [boardId, title, content, authorNickname, passwordHash],
    );
    if (!row) throw new Error('게시물 생성에 실패했습니다.');
    return Post.fromRow(row);
  }

  async update(id: number, title: string, content: string): Promise<void> {
    await this.db.run(
      "UPDATE posts SET title = ?, content = ?, updated_at = STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?",
      [title, content, id],
    );
  }

  async delete(id: number): Promise<void> {
    await this.db.run('DELETE FROM posts WHERE id = ?', [id]);
  }

  async incrementViewCount(id: number): Promise<void> {
    await this.db.run('UPDATE posts SET view_count = view_count + 1 WHERE id = ?', [id]);
  }
}
