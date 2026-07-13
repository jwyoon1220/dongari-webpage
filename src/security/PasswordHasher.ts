import { Encoding } from './Encoding';

// 관리자 계정 비밀번호(로그인 성공 시 사이트 전체 제어권)에 쓰는 반복 횟수. 드물게만 호출됨.
export const ADMIN_PASSWORD_ITERATIONS = 100_000;
// 게시물/댓글 삭제용 비밀번호에 쓰는 반복 횟수. 계정 탈취가 아니라 익명 글 하나의
// 소유권만 지키면 되고(고유 salt + IP 레이트리밋으로 이미 보호됨), 글 작성마다
// 매번 실행되는 경로라 Workers CPU 시간 제한(무료 플랜 10ms) 안에 들어와야 한다.
// PBKDF2-SHA256 100,000회는 실측 시 수십 ms가 걸려 그 한도를 훌쩍 넘긴다.
export const CONTENT_PASSWORD_ITERATIONS = 20_000;

const KEY_LENGTH_BYTES = 32;
const HASH_ALGORITHM = 'SHA-256';
const SALT_LENGTH_BYTES = 16;

/**
 * PBKDF2-HMAC-SHA256 기반 비밀번호 해싱.
 * 저장 형식: "<iterations>:<saltBase64>:<hashBase64>" — 반복 횟수를 해시에 함께
 * 저장하므로, verify()는 hash() 호출 시 어떤 반복 횟수를 썼든 항상 올바르게 검증한다.
 * 매 비밀번호마다 랜덤 salt를 사용하고, 검증은 상수 시간 비교로 수행한다.
 */
export class PasswordHasher {
  static async hash(password: string, iterations: number = ADMIN_PASSWORD_ITERATIONS): Promise<string> {
    const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH_BYTES));
    const derived = await PasswordHasher.derive(password, salt, iterations);
    return `${iterations}:${Encoding.toBase64(salt)}:${Encoding.toBase64(derived)}`;
  }

  static async verify(password: string, stored: string): Promise<boolean> {
    const parts = stored.split(':');
    if (parts.length !== 3) return false;

    const [iterationsRaw, saltB64, hashB64] = parts;
    const iterations = Number.parseInt(iterationsRaw, 10);
    if (!Number.isInteger(iterations) || iterations <= 0) return false;

    let salt: Uint8Array;
    let expected: Uint8Array;
    try {
      salt = Encoding.fromBase64(saltB64);
      expected = Encoding.fromBase64(hashB64);
    } catch {
      return false;
    }

    const actual = await PasswordHasher.derive(password, salt, iterations);
    return PasswordHasher.timingSafeEqual(actual, expected);
  }

  private static async derive(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      'PBKDF2',
      false,
      ['deriveBits'],
    );
    const bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', hash: HASH_ALGORITHM, salt, iterations },
      keyMaterial,
      KEY_LENGTH_BYTES * 8,
    );
    return new Uint8Array(bits);
  }

  private static timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) {
      diff |= a[i] ^ b[i];
    }
    return diff === 0;
  }
}
