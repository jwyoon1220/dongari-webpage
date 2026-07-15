import { Env } from './config/Env';
import { D1Client } from './db/D1Client';
import { BoardRepository } from './repositories/BoardRepository';
import { PostRepository } from './repositories/PostRepository';
import { CommentRepository } from './repositories/CommentRepository';
import { AdminRepository } from './repositories/AdminRepository';
import { AdminSessionRepository } from './repositories/AdminSessionRepository';
import { LoginAttemptRepository } from './repositories/LoginAttemptRepository';
import { EmoticonRepository } from './repositories/EmoticonRepository';
import { SessionService } from './security/SessionService';
import { RateLimiter } from './security/RateLimiter';

/**
 * 요청마다 생성되는 의존성 컨테이너.
 * 모든 Repository/Service는 이 컨테이너를 통해서만 조립되어
 * 컨트롤러가 D1Database 바인딩을 직접 다루지 않도록 한다.
 */
export class AppContainer {
  readonly db: D1Client;
  readonly boards: BoardRepository;
  readonly posts: PostRepository;
  readonly comments: CommentRepository;
  readonly admins: AdminRepository;
  readonly adminSessions: AdminSessionRepository;
  readonly loginAttempts: LoginAttemptRepository;
  readonly emoticons: EmoticonRepository;
  readonly sessionService: SessionService;
  readonly loginRateLimiter: RateLimiter;
  readonly postAuthRateLimiter: RateLimiter;
  readonly creationRateLimiter: RateLimiter;
  readonly uploadRateLimiter: RateLimiter;
  readonly images: R2Bucket;

  constructor(env: Env) {
    this.db = new D1Client(env.DB);
    this.boards = new BoardRepository(this.db);
    this.posts = new PostRepository(this.db);
    this.comments = new CommentRepository(this.db);
    this.admins = new AdminRepository(this.db);
    this.adminSessions = new AdminSessionRepository(this.db);
    this.loginAttempts = new LoginAttemptRepository(this.db);
    this.emoticons = new EmoticonRepository(this.db);
    this.sessionService = new SessionService(this.adminSessions);
    this.loginRateLimiter = new RateLimiter(this.loginAttempts, 5, 15);
    // 게시물/댓글 비밀번호 확인 시도에 공통으로 적용되는 무차별 대입 방어.
    this.postAuthRateLimiter = new RateLimiter(this.loginAttempts, 10, 15);
    // 게시물/댓글 도배(스팸) 방지: IP당 5분에 8건까지.
    this.creationRateLimiter = new RateLimiter(this.loginAttempts, 8, 5);
    // 이미지 업로드 남용 방지: IP당 15분에 20건까지.
    this.uploadRateLimiter = new RateLimiter(this.loginAttempts, 20, 15);
    this.images = env.IMAGES;
  }
}
