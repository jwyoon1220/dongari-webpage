/**
 * D1Database에 대한 얇은 래퍼.
 *
 * 이 클래스를 거치는 모든 쿼리는 반드시 파라미터 바인딩을 사용해야 하며,
 * 어떤 상황에서도 사용자 입력을 SQL 문자열에 직접 이어붙이지 않는다.
 * (Repository 계층은 오직 이 클래스를 통해서만 D1에 접근한다.)
 */
export class D1Client {
  constructor(private readonly db: D1Database) {}

  async first<T = unknown>(sql: string, params: unknown[] = []): Promise<T | null> {
    const stmt = this.db.prepare(sql).bind(...params);
    const row = await stmt.first<T>();
    return row ?? null;
  }

  async all<T = unknown>(sql: string, params: unknown[] = []): Promise<T[]> {
    const stmt = this.db.prepare(sql).bind(...params);
    const result = await stmt.all<T>();
    return result.results ?? [];
  }

  async run(sql: string, params: unknown[] = []): Promise<D1Result> {
    const stmt = this.db.prepare(sql).bind(...params);
    return stmt.run();
  }

  prepare(sql: string, params: unknown[] = []): D1PreparedStatement {
    return this.db.prepare(sql).bind(...params);
  }

  async batch(statements: D1PreparedStatement[]): Promise<D1Result[]> {
    return this.db.batch(statements);
  }
}
