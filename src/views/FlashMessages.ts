export type FlashType = 'success' | 'error';

/**
 * 리다이렉트 후 표시할 안내 메시지를 코드로만 주고받는다.
 * 쿼리스트링으로 임의 문자열을 그대로 렌더링하면 XSS 통로가 되므로,
 * 반드시 이 화이트리스트에 정의된 코드만 화면에 노출한다.
 */
export const FLASH_MESSAGES: Record<string, { type: FlashType; message: string }> = {
  post_created: { type: 'success', message: '게시물이 등록되었습니다.' },
  post_updated: { type: 'success', message: '게시물이 수정되었습니다.' },
  post_deleted: { type: 'success', message: '게시물이 삭제되었습니다.' },
  board_created: { type: 'success', message: '게시판이 생성되었습니다.' },
  board_updated: { type: 'success', message: '게시판 정보가 수정되었습니다.' },
  board_deleted: { type: 'success', message: '게시판이 삭제되었습니다.' },
  logged_in: { type: 'success', message: '로그인되었습니다.' },
  logged_out: { type: 'success', message: '로그아웃되었습니다.' },
  password_changed: { type: 'success', message: '비밀번호가 변경되었습니다.' },
  emoticon_created: { type: 'success', message: '이모티콘이 등록되었습니다.' },
};

export function resolveFlash(code: string | null): { type: FlashType; message: string } | null {
  if (!code) return null;
  return FLASH_MESSAGES[code] ?? null;
}
