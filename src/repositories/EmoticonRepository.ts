import { D1Client } from '../db/D1Client';
import { Emoticon, EmoticonRow } from '../models/Emoticon';

const EMOTICON_COLUMNS = 'id, name, image_url, creator_ip, created_at';

/** 이모티콘 데이터 접근 계층. 모든 쿼리는 D1Client를 통해 바인딩 파라미터로만 실행된다. */
export class EmoticonRepository {
  constructor(private readonly db: D1Client) {}

  /** 최근 생성 순으로 최대 500개까지 반환한다(전체 목록/자동완성 데이터에 사용, 응답 크기 방어). */
  async list(limit = 500): Promise<Emoticon[]> {
    const rows = await this.db.all<EmoticonRow>(
      `SELECT ${EMOTICON_COLUMNS} FROM emoticons ORDER BY id DESC LIMIT ?`,
      [limit],
    );
    return rows.map(Emoticon.fromRow);
  }

  /** 렌더링(%{name}% 치환)에 쓸 이름→URL 조회표. */
  async lookupMap(): Promise<Map<string, string>> {
    const rows = await this.db.all<Pick<EmoticonRow, 'name' | 'image_url'>>(
      'SELECT name, image_url FROM emoticons',
    );
    return new Map(rows.map((row) => [row.name, row.image_url]));
  }

  async countByIp(ip: string): Promise<number> {
    const row = await this.db.first<{ count: number }>(
      'SELECT COUNT(*) AS count FROM emoticons WHERE creator_ip = ?',
      [ip],
    );
    return Number(row?.count ?? 0);
  }

  async create(name: string, imageUrl: string, creatorIp: string): Promise<Emoticon> {
    const row = await this.db.first<EmoticonRow>(
      `INSERT INTO emoticons (name, image_url, creator_ip)
       VALUES (?, ?, ?)
       RETURNING ${EMOTICON_COLUMNS}`,
      [name, imageUrl, creatorIp],
    );
    if (!row) throw new Error('이모티콘 생성에 실패했습니다.');
    return Emoticon.fromRow(row);
  }
}
