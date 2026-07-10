import { D1Client } from '../db/D1Client';

interface AdminSessionRow {
  admin_id: number;
  expires_at: string;
}

export class AdminSessionRepository {
  constructor(private readonly db: D1Client) {}

  async create(tokenHash: string, adminId: number, expiresAtIso: string): Promise<void> {
    await this.db.run('INSERT INTO admin_sessions (token_hash, admin_id, expires_at) VALUES (?, ?, ?)', [
      tokenHash,
      adminId,
      expiresAtIso,
    ]);
  }

  /** 유효(만료 전)한 세션이면 admin_id를 반환, 아니면 null */
  async findValidAdminId(tokenHash: string, nowIso: string): Promise<number | null> {
    const row = await this.db.first<AdminSessionRow>(
      'SELECT admin_id, expires_at FROM admin_sessions WHERE token_hash = ? AND expires_at > ?',
      [tokenHash, nowIso],
    );
    return row ? row.admin_id : null;
  }

  async deleteByTokenHash(tokenHash: string): Promise<void> {
    await this.db.run('DELETE FROM admin_sessions WHERE token_hash = ?', [tokenHash]);
  }

  async deleteExpired(nowIso: string): Promise<void> {
    await this.db.run('DELETE FROM admin_sessions WHERE expires_at <= ?', [nowIso]);
  }
}
