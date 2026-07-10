export interface CommentRow {
  id: number;
  post_id: number;
  content: string;
  author_nickname: string;
  password_hash: string;
  is_admin_comment: number;
  created_at: string;
}

/**
 * 댓글 도메인 모델. 수정 기능은 의도적으로 없다 — 작성 후 내용은 고정되며
 * 삭제(비밀번호 확인 또는 관리자 권한)만 가능하다.
 */
export class Comment {
  constructor(
    public readonly id: number,
    public readonly postId: number,
    public readonly content: string,
    public readonly authorNickname: string,
    public readonly passwordHash: string,
    public readonly isAdminComment: boolean,
    public readonly createdAt: string,
  ) {}

  static fromRow(row: CommentRow): Comment {
    return new Comment(
      row.id,
      row.post_id,
      row.content,
      row.author_nickname,
      row.password_hash,
      row.is_admin_comment === 1,
      row.created_at,
    );
  }
}
