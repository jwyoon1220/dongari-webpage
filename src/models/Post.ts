export interface PostRow {
  id: number;
  board_id: number;
  title: string;
  content: string;
  author_nickname: string;
  password_hash: string;
  view_count: number;
  created_at: string;
  updated_at: string;
  is_admin_post: number;
}

/**
 * 게시물 도메인 모델. 비회원 작성이므로 기본적으로 password_hash로 소유권을 증명하지만,
 * isAdminPost인 경우 관리자 세션만으로 수정/삭제가 허용된다(PostController 참고).
 */
export class Post {
  constructor(
    public readonly id: number,
    public readonly boardId: number,
    public readonly title: string,
    public readonly content: string,
    public readonly authorNickname: string,
    public readonly passwordHash: string,
    public readonly viewCount: number,
    public readonly createdAt: string,
    public readonly updatedAt: string,
    public readonly isAdminPost: boolean,
  ) {}

  static fromRow(row: PostRow): Post {
    return new Post(
      row.id,
      row.board_id,
      row.title,
      row.content,
      row.author_nickname,
      row.password_hash,
      row.view_count,
      row.created_at,
      row.updated_at,
      row.is_admin_post === 1,
    );
  }
}
