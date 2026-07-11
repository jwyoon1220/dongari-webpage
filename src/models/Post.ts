export const POST_CONTENT_FORMATS = ['text', 'markdown', 'html'] as const;
export type PostContentFormat = (typeof POST_CONTENT_FORMATS)[number];

export function parsePostContentFormat(value: string | null): PostContentFormat {
  return (POST_CONTENT_FORMATS as readonly string[]).includes(value ?? '')
    ? (value as PostContentFormat)
    : 'text';
}

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
  content_format: string;
  rendered_content: string;
}

/**
 * 게시물 도메인 모델. 비회원 작성이므로 기본적으로 password_hash로 소유권을 증명하지만,
 * isAdminPost인 경우 관리자 세션만으로 수정/삭제가 허용된다(PostController 참고).
 *
 * renderedContent는 작성/수정 시점에 PostContentRenderer로 한 번만 생성해 저장해 둔
 * 안전한 HTML이다. 조회할 때마다 마크다운/HTML을 다시 파싱하면 Workers CPU 시간
 * 제한을 넘기기 쉬우므로, 화면에는 항상 이 값을 그대로 사용한다.
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
    public readonly contentFormat: PostContentFormat,
    public readonly renderedContent: string,
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
      parsePostContentFormat(row.content_format),
      row.rendered_content,
    );
  }
}
