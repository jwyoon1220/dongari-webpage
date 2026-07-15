/** 이모티콘 이름: 게시물/댓글 본문에서 %{name}% 로 참조되므로 안전한 문자만 허용한다. */
const EMOTICON_NAME_PATTERN = /^[a-zA-Z0-9_-]{1,20}$/;

export function isValidEmoticonName(name: string): boolean {
  return EMOTICON_NAME_PATTERN.test(name);
}

export interface EmoticonRow {
  id: number;
  name: string;
  image_url: string;
  creator_ip: string;
  created_at: string;
}

/** 비회원도 만들 수 있는 이모티콘(%{name}% 문법으로 게시물/댓글에서 참조됨). */
export class Emoticon {
  constructor(
    public readonly id: number,
    public readonly name: string,
    public readonly imageUrl: string,
    public readonly creatorIp: string,
    public readonly createdAt: string,
  ) {}

  static fromRow(row: EmoticonRow): Emoticon {
    return new Emoticon(row.id, row.name, row.image_url, row.creator_ip, row.created_at);
  }
}
