import { D1Client } from '../db/D1Client';
import { Board, BoardRow } from '../models/Board';

export interface BoardWithPostCount {
  board: Board;
  postCount: number;
}

/**
 * 게시판 데이터 접근 계층. 모든 쿼리는 D1Client를 통해 바인딩 파라미터로만 실행되어
 * SQL 인젝션 가능성을 원천적으로 차단한다.
 */
export class BoardRepository {
  constructor(private readonly db: D1Client) {}

  async findAll(): Promise<Board[]> {
    const rows = await this.db.all<BoardRow>(
      'SELECT id, slug, name, description, display_order, created_at FROM boards ORDER BY display_order ASC, id ASC',
    );
    return rows.map(Board.fromRow);
  }

  async findAllWithPostCounts(): Promise<BoardWithPostCount[]> {
    const rows = await this.db.all<BoardRow & { post_count: number }>(
      `SELECT b.id, b.slug, b.name, b.description, b.display_order, b.created_at,
              COUNT(p.id) AS post_count
       FROM boards b
       LEFT JOIN posts p ON p.board_id = b.id
       GROUP BY b.id
       ORDER BY b.display_order ASC, b.id ASC`,
    );
    return rows.map((row) => ({ board: Board.fromRow(row), postCount: Number(row.post_count) }));
  }

  async findBySlug(slug: string): Promise<Board | null> {
    const row = await this.db.first<BoardRow>(
      'SELECT id, slug, name, description, display_order, created_at FROM boards WHERE slug = ?',
      [slug],
    );
    return row ? Board.fromRow(row) : null;
  }

  async findById(id: number): Promise<Board | null> {
    const row = await this.db.first<BoardRow>(
      'SELECT id, slug, name, description, display_order, created_at FROM boards WHERE id = ?',
      [id],
    );
    return row ? Board.fromRow(row) : null;
  }

  async create(slug: string, name: string, description: string, displayOrder: number): Promise<Board> {
    const row = await this.db.first<BoardRow>(
      `INSERT INTO boards (slug, name, description, display_order)
       VALUES (?, ?, ?, ?)
       RETURNING id, slug, name, description, display_order, created_at`,
      [slug, name, description, displayOrder],
    );
    if (!row) throw new Error('게시판 생성에 실패했습니다.');
    return Board.fromRow(row);
  }

  async update(id: number, name: string, description: string, displayOrder: number): Promise<void> {
    await this.db.run('UPDATE boards SET name = ?, description = ?, display_order = ? WHERE id = ?', [
      name,
      description,
      displayOrder,
      id,
    ]);
  }

  /** 게시판과 그 안의 모든 게시물을 원자적으로 삭제한다. */
  async deleteWithPosts(id: number): Promise<void> {
    await this.db.batch([
      this.db.prepare('DELETE FROM posts WHERE board_id = ?', [id]),
      this.db.prepare('DELETE FROM boards WHERE id = ?', [id]),
    ]);
  }
}
