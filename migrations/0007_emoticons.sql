-- 이모티콘. 비회원도 만들 수 있으며 IP당 생성 개수 상한은 애플리케이션 레이어에서 강제한다
-- (MAX_EMOTICONS_PER_IP, EmoticonController 참고). 이미지 자체는 R2에 WebP로 저장되고
-- image_url에는 공개 CDN(cdn.parin.asia) 주소만 저장된다.
CREATE TABLE IF NOT EXISTS emoticons (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL UNIQUE,
  image_url     TEXT NOT NULL,
  creator_ip    TEXT NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_emoticons_creator_ip ON emoticons(creator_ip);
