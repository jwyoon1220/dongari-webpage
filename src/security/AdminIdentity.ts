import { Md5 } from './Md5';

/** 관리자 작성 글에 표시되는 고정 닉네임: admin_XXXXX (XXXXX = MD5(admin id) 앞 5자리) */
export function adminNickname(adminId: number): string {
  const serial = Md5.hex(`admin:${adminId}`).slice(0, 5);
  return `admin_${serial}`;
}
