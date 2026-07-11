-- 매 조회마다 마크다운/HTML을 다시 파싱·정제하면 Workers CPU 시간 제한(특히 무료 플랜
-- 10ms)을 넘기기 쉽다. 작성/수정 시점에 딱 한 번 렌더링해서 여기에 저장해두고,
-- 조회 시에는 이 값을 그대로 사용한다(PostContentRenderer, PostController 참고).
ALTER TABLE posts ADD COLUMN rendered_content TEXT NOT NULL DEFAULT '';
