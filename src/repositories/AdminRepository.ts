import { D1Client } from '../db/D1Client';
import { AdminUser, AdminUserRow } from '../models/Admin';

export class AdminRepository {
  constructor(private readonly db: D1Client) {}

  async findByUsername(username: string): Promise<AdminUser | null> {
    const row = await this.db.first<AdminUserRow>(
      'SELECT id, username, password_hash, created_at FROM admin_users WHERE username = ?',
      [username],
    );
    return row ? AdminUser.fromRow(row) : null;
  }

  async findById(id: number): Promise<AdminUser | null> {
    const row = await this.db.first<AdminUserRow>(
      'SELECT id, username, password_hash, created_at FROM admin_users WHERE id = ?',
      [id],
    );
    return row ? AdminUser.fromRow(row) : null;
  }

  async updatePassword(id: number, passwordHash: string): Promise<void> {
    await this.db.run('UPDATE admin_users SET password_hash = ? WHERE id = ?', [passwordHash, id]);
  }
}
