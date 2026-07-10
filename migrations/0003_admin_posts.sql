-- 관리자가 직접 작성한 게시물을 구분하기 위한 플래그.
-- 관리자 글은 닉네임이 admin_XXXXX로 고정되고 체크 배지가 표시되며,
-- 게시물 비밀번호 없이 관리자 세션만으로 수정/삭제가 허용된다.
ALTER TABLE posts ADD COLUMN is_admin_post INTEGER NOT NULL DEFAULT 0;
