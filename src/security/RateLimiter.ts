import { LoginAttemptRepository } from '../repositories/LoginAttemptRepository';

/**
 * 범용 시도 횟수 기반 레이트 리미터.
 * 관리자 로그인뿐 아니라 게시물 비밀번호 확인(수정/삭제) 등
 * 무차별 대입 공격이 우려되는 모든 지점에서 재사용한다.
 */
export class RateLimiter {
  constructor(
    private readonly attempts: LoginAttemptRepository,
    private readonly maxAttempts = 5,
    private readonly windowMinutes = 15,
  ) {}

  async isBlocked(identifier: string): Promise<boolean> {
    const since = new Date(Date.now() - this.windowMinutes * 60 * 1000).toISOString();
    const count = await this.attempts.countSince(identifier, since);
    return count >= this.maxAttempts;
  }

  async recordFailure(identifier: string): Promise<void> {
    await this.attempts.record(identifier);
  }

  /** recordFailure의 별칭. 실패가 아니라 "이벤트 발생 자체"를 세는 용도(예: 게시물 생성 빈도 제한)로 쓸 때 의미가 더 명확하다. */
  async recordEvent(identifier: string): Promise<void> {
    await this.attempts.record(identifier);
  }

  async clear(identifier: string): Promise<void> {
    await this.attempts.clear(identifier);
  }
}
