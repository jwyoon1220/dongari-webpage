import { Encoding } from './Encoding';

const ITERATIONS = 100_000;
const KEY_LENGTH_BYTES = 32;
const HASH_ALGORITHM = 'SHA-256';
const SALT_LENGTH_BYTES = 16;

/**
 * PBKDF2-HMAC-SHA256 기반 비밀번호 해싱.
 * 저장 형식: "<iterations>:<saltBase64>:<hashBase64>"
 * 매 비밀번호마다 랜덤 salt를 사용하고, 검증은 상수 시간 비교로 수행한다.
 */
export class PasswordHasher {
  static async hash(password: string): Promise<string> {
    const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH_BYTES));
    const derived = await PasswordHasher.derive(password, salt, ITERATIONS);
    return `${ITERATIONS}:${Encoding.toBase64(salt)}:${Encoding.toBase64(derived)}`;
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
