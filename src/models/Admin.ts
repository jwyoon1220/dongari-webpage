export interface AdminUserRow {
  id: number;
  username: string;
  password_hash: string;
  created_at: string;
}

export class AdminUser {
  constructor(
    public readonly id: number,
    public readonly username: string,
    public readonly passwordHash: string,
    public readonly createdAt: string,
  ) {}

  static fromRow(row: AdminUserRow): AdminUser {
    return new AdminUser(row.id, row.username, row.password_hash, row.created_at);
  }
}
