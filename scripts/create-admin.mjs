#!/usr/bin/env node
// 최초 관리자 계정 시드 SQL(migrations/0002_seed_admin.sql)을 생성한다.
// 저장 형식은 src/security/PasswordHasher.ts 의 PBKDF2 구현과 100% 동일해야 검증이 가능하다:
//   "<iterations>:<saltBase64>:<hashBase64>"  (PBKDF2-HMAC-SHA256, 32바이트 키)
import { pbkdf2Sync, randomBytes } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ITERATIONS = 100_000;
const KEY_LENGTH = 32;
const SALT_LENGTH = 16;

function hashPassword(password) {
  const salt = randomBytes(SALT_LENGTH);
  const derived = pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, 'sha256');
  return `${ITERATIONS}:${salt.toString('base64')}:${derived.toString('base64')}`;
}

function randomPassword(length = 24) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';
  const bytes = randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

const username = process.argv[2] || 'admin';
const password = process.argv[3] || randomPassword();

if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
  console.error('사용자명은 영문/숫자/밑줄 3~20자여야 합니다.');
  process.exit(1);
}

const hash = hashPassword(password);
const sql = `-- 최초 관리자 계정 시드. scripts/create-admin.mjs 로 생성됨.
INSERT OR IGNORE INTO admin_users (username, password_hash) VALUES ('${username}', '${hash}');
`;

const outPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'migrations', '0002_seed_admin.sql');
writeFileSync(outPath, sql, 'utf8');

console.log('관리자 계정 시드 SQL을 생성했습니다:', outPath);
console.log('');
console.log('아이디:', username);
console.log('비밀번호:', password);
console.log('');
console.log('※ 이 비밀번호는 지금 이 순간에만 출력됩니다. 안전한 곳에 보관하고, 배포 후 반드시');
console.log('   관리자 화면(/admin/password)에서 변경하세요.');
