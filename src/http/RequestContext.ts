import { Env } from '../config/Env';
import { MAX_FORM_BODY_BYTES } from '../config/constants';
import { ClientIp } from './ClientIp';
import { Cookies } from '../security/Cookies';
import { HttpError } from './HttpError';

/**
 * 요청 하나의 생애주기 동안 필요한 상태(파싱된 쿠키, 폼, 라우트 파라미터)를
 * 한 곳에 모아 컨트롤러에 전달하는 컨텍스트 객체.
 */
export class RequestContext {
  readonly url: URL;
  readonly cookies: Map<string, string>;
  params: Record<string, string> = {};

  /** App.handle()이 요청 초입에 채워 넣는 값들 */
  csrfToken = '';
  adminId: number | null = null;

  private formCache: URLSearchParams | null = null;

  constructor(
    public readonly request: Request,
    public readonly env: Env,
  ) {
    this.url = new URL(request.url);
    this.cookies = Cookies.parse(request.headers.get('Cookie'));
  }

  /** application/x-www-form-urlencoded 바디를 안전하게 파싱한다 (크기 제한 포함). */
  async form(): Promise<URLSearchParams> {
    if (this.formCache) return this.formCache;

    const contentType = this.request.headers.get('Content-Type') ?? '';
    if (!contentType.includes('application/x-www-form-urlencoded')) {
      throw new HttpError(400, '잘못된 요청 형식입니다.');
    }

    const contentLength = Number(this.request.headers.get('Content-Length') ?? '0');
    if (contentLength > MAX_FORM_BODY_BYTES) {
      throw new HttpError(413, '요청 본문이 너무 큽니다.');
    }

    const text = await this.request.text();
    if (text.length > MAX_FORM_BODY_BYTES) {
      throw new HttpError(413, '요청 본문이 너무 큽니다.');
    }

    this.formCache = new URLSearchParams(text);
    return this.formCache;
  }

  async formField(name: string): Promise<string> {
    const form = await this.form();
    return form.get(name) ?? '';
  }

  /** 바이너리(이미지 업로드 등) 바디를 크기 제한과 함께 안전하게 읽는다. */
  async binaryBody(maxBytes: number): Promise<ArrayBuffer> {
    const contentLength = Number(this.request.headers.get('Content-Length') ?? '0');
    if (contentLength > maxBytes) {
      throw new HttpError(413, '업로드 용량이 너무 큽니다.');
    }

    const buffer = await this.request.arrayBuffer();
    if (buffer.byteLength > maxBytes) {
      throw new HttpError(413, '업로드 용량이 너무 큽니다.');
    }
    return buffer;
  }

  clientIp(): string {
    return ClientIp.from(this.request);
  }
}
