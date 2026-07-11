-- 게시물 작성 형식(텍스트/마크다운/HTML)을 저장한다.
-- 렌더링 시 형식에 따라 서로 다른 안전한 변환을 거친다(PostContentRenderer 참고).
ALTER TABLE posts ADD COLUMN content_format TEXT NOT NULL DEFAULT 'text';
