import { D1Client } from '../db/D1Client';
import { Comment, CommentRow } from '../models/Comment';

const COMMENT_COLUMNS = 'id, post_id, content, author_nickname, password_hash, is_admin_comment, created_at';

/** 댓글 데이터 접근 계층. 수정(UPDATE)은 의도적으로 제공하지 않는다 — 생성/조회/삭제만 있다. */
export class CommentRepository {
  constructor(private readonly db: D1Client) {}

  async findByPostId(postId: number): Promise<Comment[]> {
    const rows = await this.db.all<CommentRow>(
      `SELECT ${COMMENT_COLUMNS} FROM comments WHERE post_id = ? ORDER BY id ASC`,
      [postId],
    );
    return rows.map(Comment.fromRow);
  }

  async findById(id: number): Promise<Comment | null> {
    const row = await this.db.first<CommentRow>(`SELECT ${COMMENT_COLUMNS} FROM comments WHERE id = ?`, [id]);
    return row ? Comment.fromRow(row) : null;
  }

  async create(
    postId: number,
    content: string,
    authorNickname: string,
    passwordHash: string,
    isAdminComment: boolean,
  ): Promise<Comment> {
    const row = await this.db.first<CommentRow>(
      `INSERT INTO comments (post_id, content, author_nickname, password_hash, is_admin_comment)
       VALUES (?, ?, ?, ?, ?)
       RETURNING ${COMMENT_COLUMNS}`,
      [postId, content, authorNickname, passwordHash, isAdminComment ? 1 : 0],
    );
    if (!row) throw new Error('댓글 생성에 실패했습니다.');
    return Comment.fromRow(row);
  }

  async delete(id: number): Promise<void> {
    await this.db.run('DELETE FROM comments WHERE id = ?', [id]);
  }
}
