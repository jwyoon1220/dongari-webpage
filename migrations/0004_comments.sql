-- 게시물 댓글. 요구사항에 따라 수정 기능은 없다(생성/삭제만 가능).
CREATE TABLE IF NOT EXISTS comments (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id           INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  content           TEXT NOT NULL,
  author_nickname   TEXT NOT NULL,
  password_hash     TEXT NOT NULL,
  is_admin_comment  INTEGER NOT NULL DEFAULT 0,
  created_at        TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_comments_post_id_id ON comments(post_id, id ASC);
