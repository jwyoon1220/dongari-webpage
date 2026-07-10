# Inside

D1을 백엔드로 쓰는 텍스트 전용 커뮤니티 서비스. Cloudflare Pages + Pages Functions로 서버에서
HTML을 직접 렌더링하며, 클라이언트 자바스크립트는 삭제 확인 대화상자 하나만 사용할 정도로
최소화되어 있습니다.

## 아키텍처

```
src/
  config/        환경 타입, 상수(글자 수 제한 등)
  db/            D1Database 얇은 래퍼 (모든 쿼리는 여기를 거쳐 파라미터 바인딩으로 실행)
  models/        Board / Post / AdminUser 도메인 모델
  repositories/  D1 접근 계층 (SQL은 전부 이곳에만 존재)
  security/      비밀번호 해싱, 세션, CSRF, 입력 검증/이스케이프, 레이트 리미터
  http/          라우터, 요청 컨텍스트, 응답 빌더, 자동 이스케이프 html`` 템플릿
  views/         Layout + 페이지별 뷰 클래스 (Tailwind 유틸리티 클래스로만 스타일링)
  controllers/   요청 처리 흐름 (공개 열람 / 게시물 CRUD / 관리자)
  App.ts         라우팅 테이블 조립 + 보안 헤더 적용 진입점
functions/
  [[path]].ts    Cloudflare Pages Functions 엔트리 (App.handle 호출만 함)
public/
  css/tailwind.css  빌드된 정적 CSS
  js/app.js         삭제 확인 대화상자만 담당하는 최소 스크립트
migrations/      D1 스키마 및 초기 관리자 계정 시드
```

각 계층은 아래 방향으로만 의존합니다: `controllers → views/security/repositories → models/db`.
새 기능을 추가할 때도 이 방향을 유지하면 유지보수가 쉬워집니다.

## 보안 설계 요약

- **SQL 인젝션 방지**: `D1Client`(src/db/D1Client.ts)를 거치는 모든 쿼리는 `prepare().bind()`로만
  실행됩니다. Repository 계층 밖에서는 D1에 직접 접근할 수 없습니다.
- **XSS 방지**: 서버 템플릿은 `html` 태그드 템플릿(src/http/Html.ts)만 사용하며, 보간되는 값은
  `safe()`로 명시적으로 감싸지 않는 한 자동으로 HTML 이스케이프됩니다. 게시물 본문은
  `white-space: pre-wrap`으로만 줄바꿈을 표현해 마크업 삽입 여지를 없앴습니다.
- **CSRF 방지**: 모든 쿠키는 `SameSite=Strict; Secure`로 발급되고, 상태 변경 요청은 이중 제출
  토큰(csrf 쿠키 값 = 폼 hidden 필드 값)과 `Origin`/`Referer` 검증을 함께 거칩니다.
- **비밀번호 저장**: PBKDF2-HMAC-SHA256(100,000회, salt 16바이트)로 해싱하고 상수 시간 비교로
  검증합니다. 관리자 세션 토큰도 원문이 아닌 SHA-256 해시만 DB에 저장합니다.
- **무차별 대입 방지**: 관리자 로그인과 게시물 비밀번호 확인 모두 IP 기준 레이트 리미터
  (`login_attempts` 테이블)를 거칩니다. 존재하지 않는 관리자 계정에도 동일한 연산 비용을
  들여 계정 존재 여부가 타이밍으로 새어나가지 않도록 했습니다.
- **응답 헤더**: 엄격한 CSP(`script-src 'self'`, 인라인 스크립트 전면 금지), HSTS,
  X-Frame-Options, X-Content-Type-Options 등을 모든 응답에 적용합니다.
- **이미지 업로드 없음**: 파일 스토리지가 없으므로 게시물은 텍스트만 받습니다(요구사항).

## 로컬 개발

```bash
npm install
npm run db:migrate:local   # 로컬 D1(SQLite)에 스키마 적용
npm run dev                 # tailwind 빌드 + wrangler pages dev (로컬 D1 바인딩)
```

`http://localhost:8788` 에서 확인할 수 있습니다.

## 관리자 계정

이미 초기 관리자 계정이 `migrations/0002_seed_admin.sql`에 시드되어 있습니다(최초 1회 생성됨).
다른 계정으로 새로 만들고 싶다면:

```bash
node scripts/create-admin.mjs <아이디> <비밀번호>   # 인자를 생략하면 무작위로 생성됩니다
```

생성된 SQL은 `migrations/0002_seed_admin.sql`에 덮어써지며, 콘솔에 비밀번호가 **그 순간에만**
출력됩니다. 반드시 안전하게 보관하고, 배포 후 `/admin/password`에서 변경하세요.

## Cloudflare D1 / Pages 배포

이 저장소는 이미 존재하는 D1 데이터베이스(`database_id`가 `wrangler.toml`에 지정됨)를 사용합니다.

```bash
# 1) 원격 D1에 스키마 + 관리자 시드 적용
npx wrangler d1 execute inside-db --remote --file=./migrations/0001_init.sql
npx wrangler d1 execute inside-db --remote --file=./migrations/0002_seed_admin.sql

# 2) 빌드 후 Pages에 배포
npm run deploy
```

Cloudflare 대시보드에서 Git 연동 배포를 쓰는 경우, Pages 프로젝트 설정에서 다음을 지정하세요.

- Build command: `npm run build`
- Build output directory: `public`
- D1 바인딩: `DB` → `inside-db` (`wrangler.toml`의 `[[d1_databases]]`와 동일)

## 게시판 만들기

관리자로 로그인(`/admin`) 후 `/admin/dashboard`에서 "새 게시판"으로 만듭니다. 각 게시판은
`slug`(URL 경로)로 완전히 독립적으로 동작하며, 게시물은 회원가입 없이 닉네임 + 글 비밀번호로
작성/수정/삭제합니다(수정·삭제 시 작성 시 입력한 비밀번호 확인 필요).
