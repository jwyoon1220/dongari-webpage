import { D1Client } from '../db/D1Client';

/** 로그인 무차별 대입 공격 방지를 위한 시도 기록 저장소 */
export class LoginAttemptRepository {
  constructor(private readonly db: D1Client) {}

  async record(identifier: string): Promise<void> {
    await this.db.run('INSERT INTO login_attempts (identifier) VALUES (?)', [identifier]);
  }

  async countSince(identifier: string, sinceIso: string): Promise<number> {
    const row = await this.db.first<{ count: number }>(
      'SELECT COUNT(*) AS count FROM login_attempts WHERE identifier = ? AND attempted_at > ?',
      [identifier, sinceIso],
    );
    return Number(row?.count ?? 0);
  }

  async clear(identifier: string): Promise<void> {
    await this.db.run('DELETE FROM login_attempts WHERE identifier = ?', [identifier]);
  }
}
