export const SITE_NAME = 'Inside';

export const PAGE_SIZE = 20;

export const LIMITS = {
  BOARD_NAME_MIN: 1,
  BOARD_NAME_MAX: 40,
  BOARD_DESCRIPTION_MAX: 200,
  POST_TITLE_MIN: 1,
  POST_TITLE_MAX: 100,
  POST_CONTENT_MIN: 1,
  POST_CONTENT_MAX: 5000,
  NICKNAME_MIN: 1,
  NICKNAME_MAX: 20,
  POST_PASSWORD_MIN: 4,
  POST_PASSWORD_MAX: 64,
  COMMENT_CONTENT_MIN: 1,
  COMMENT_CONTENT_MAX: 1000,
  ADMIN_PASSWORD_MIN: 10,
  ADMIN_PASSWORD_MAX: 128,
  EMOTICON_NAME_MIN: 1,
  EMOTICON_NAME_MAX: 20,
} as const;

/** 폼 바디 최대 허용 크기(바이트). DoS성 대용량 요청 차단용. */
export const MAX_FORM_BODY_BYTES = 20_000;

/** 업로드된 이미지가 최종 공개되는 CDN 오리진. HTML/마크다운 렌더링에서 img src 허용 목록으로도 쓰인다. */
export const CDN_ORIGIN = 'https://cdn.parin.asia';

/** 업로드 원본 최대 크기(바이트). WASM 인코딩 CPU 시간을 예측 가능한 범위로 묶어 둔다. */
export const MAX_UPLOAD_BYTES = 6_000_000;

/** 업로드 이미지의 가로/세로 최대 픽셀. 초과 시 리사이즈 없이 거부한다(리사이즈는 추가 CPU 비용이 큼). */
export const MAX_IMAGE_DIMENSION = 2400;

/** IP당 생성 가능한 이모티콘 개수 상한(미만). */
export const MAX_EMOTICONS_PER_IP = 15;
