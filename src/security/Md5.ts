/**
 * 순수 코스메틱 용도(관리자 표시용 짧은 식별자 생성)로만 사용하는 MD5 구현.
 * 보안 목적(비밀번호/세션 해싱 등)으로는 절대 사용하지 않는다 — 그런 용도는
 * PasswordHasher(PBKDF2)와 SessionService(SHA-256)를 사용한다. MD5는 여기서
 * 충돌 저항성이 필요 없는, 사람이 읽기 좋은 짧은 태그를 만드는 데에만 쓰인다.
 */
export class Md5 {
  static hex(message: string): string {
    const bytes = new TextEncoder().encode(message);
    const digest = Md5.digest(bytes);
    return Array.from(digest)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private static digest(bytes: Uint8Array): Uint8Array {
    const origLenBits = bytes.length * 8;
    const withOne = new Uint8Array(bytes.length + 1);
    withOne.set(bytes);
    withOne[bytes.length] = 0x80;

    let totalLen = withOne.length;
    while (totalLen % 64 !== 56) totalLen++;

    const padded = new Uint8Array(totalLen + 8);
    padded.set(withOne);
    const lenView = new DataView(padded.buffer);
    const lo = origLenBits >>> 0;
    const hi = Math.floor(origLenBits / 0x100000000) >>> 0;
    lenView.setUint32(padded.length - 8, lo, true);
    lenView.setUint32(padded.length - 4, hi, true);

    let a0 = 0x67452301;
    let b0 = 0xefcdab89;
    let c0 = 0x98badcfe;
    let d0 = 0x10325476;

    const dv = new DataView(padded.buffer);
    for (let chunkStart = 0; chunkStart < padded.length; chunkStart += 64) {
      const M = new Int32Array(16);
      for (let i = 0; i < 16; i++) {
        M[i] = dv.getInt32(chunkStart + i * 4, true);
      }

      let A = a0;
      let B = b0;
      let C = c0;
      let D = d0;

      for (let i = 0; i < 64; i++) {
        let F: number;
        let g: number;
        if (i < 16) {
          F = (B & C) | (~B & D);
          g = i;
        } else if (i < 32) {
          F = (D & B) | (~D & C);
          g = (5 * i + 1) % 16;
        } else if (i < 48) {
          F = B ^ C ^ D;
          g = (3 * i + 5) % 16;
        } else {
          F = C ^ (B | ~D);
          g = (7 * i) % 16;
        }
        F = (F + A + Md5.K[i] + M[g]) | 0;
        A = D;
        D = C;
        C = B;
        B = (B + ((F << Md5.S[i]) | (F >>> (32 - Md5.S[i])))) | 0;
      }

      a0 = (a0 + A) | 0;
      b0 = (b0 + B) | 0;
      c0 = (c0 + C) | 0;
      d0 = (d0 + D) | 0;
    }

    const out = new Uint8Array(16);
    const outView = new DataView(out.buffer);
    outView.setInt32(0, a0, true);
    outView.setInt32(4, b0, true);
    outView.setInt32(8, c0, true);
    outView.setInt32(12, d0, true);
    return out;
  }

  private static readonly S = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14,
    20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6,
    10, 15, 21,
  ];

  private static readonly K = new Int32Array([
    -680876936, -389564586, 606105819, -1044525330, -176418897, 1200080426, -1473231341, -45705983, 1770035416,
    -1958414417, -42063, -1990404162, 1804603682, -40341101, -1502002290, 1236535329, -165796510, -1069501632,
    643717713, -373897302, -701558691, 38016083, -660478335, -405537848, 568446438, -1019803690, -187363961,
    1163531501, -1444681467, -51403784, 1735328473, -1926607734, -378558, -2022574463, 1839030562, -35309556,
    -1530992060, 1272893353, -155497632, -1094730640, 681279174, -358537222, -722521979, 76029189, -640364487,
    -421815835, 530742520, -995338651, -198630844, 1126891415, -1416354905, -57434055, 1700485571, -1894986606,
    -1051523, -2054922799, 1873313359, -30611744, -1560198380, 1309151649, -145523070, -1120210379, 718787259,
    -343485551,
  ]);
}
