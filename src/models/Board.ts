export interface BoardRow {
  id: number;
  slug: string;
  name: string;
  description: string;
  display_order: number;
  created_at: string;
}

/** 게시판 도메인 모델. 각 게시판은 독립적인 게시물 목록을 가진다. */
export class Board {
  constructor(
    public readonly id: number,
    public readonly slug: string,
    public readonly name: string,
    public readonly description: string,
    public readonly displayOrder: number,
    public readonly createdAt: string,
  ) {}

  static fromRow(row: BoardRow): Board {
    return new Board(row.id, row.slug, row.name, row.description, row.display_order, row.created_at);
  }
}
