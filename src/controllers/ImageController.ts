import { BaseController } from './BaseController';
import { RequestContext } from '../http/RequestContext';
import { HttpError } from '../http/HttpError';
import { ImageProcessor } from '../media/ImageProcessor';
import { CDN_ORIGIN, MAX_UPLOAD_BYTES } from '../config/constants';

const ALLOWED_UPLOAD_CONTENT_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

/**
 * 게시물/댓글 본문에 붙여넣거나 이모티콘으로 등록할 이미지를 업로드한다.
 * 일반 폼 제출이 아니라 클라이언트 스크립트의 fetch()로 호출되므로 CSRF 토큰은
 * X-CSRF-Token 헤더로 전달받는다. 업로드된 원본은 서버에서 검증 후 WebP로
 * 재인코딩되어 R2에 저장되며, 원본 바이트는 저장하지 않는다.
 */
export class ImageController extends BaseController {
  /**
   * 이 엔드포인트는 fetch()로만 호출되므로 오류도 항상 JSON으로 응답한다
   * (App.ts의 전역 오류 처리는 HTML 오류 페이지를 만들어 JSON을 기대하는
   * 클라이언트 스크립트와 맞지 않으므로 여기서 직접 처리한다).
   */
  upload = async (ctx: RequestContext): Promise<Response> => {
    try {
      this.verifyCsrfTokenOrThrow(ctx, ctx.request.headers.get('X-CSRF-Token'));

      const contentType = (ctx.request.headers.get('Content-Type') ?? '').split(';')[0].trim().toLowerCase();
      if (!ALLOWED_UPLOAD_CONTENT_TYPES.has(contentType)) {
        throw new HttpError(415, 'PNG, JPEG, WebP 이미지만 업로드할 수 있습니다.');
      }

      const rateLimitError = await this.checkRateLimit(
        ctx,
        this.app.uploadRateLimiter,
        'image_upload',
        '업로드 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.',
      );
      if (rateLimitError) throw new HttpError(429, rateLimitError);

      const body = await ctx.binaryBody(MAX_UPLOAD_BYTES);
      if (body.byteLength === 0) throw new HttpError(400, '빈 파일입니다.');

      const processed = await ImageProcessor.toWebp(body);
      const key = `img/${crypto.randomUUID()}.webp`;
      await this.app.images.put(key, processed.bytes, {
        httpMetadata: { contentType: processed.contentType },
      });

      return ImageController.json({ url: `${CDN_ORIGIN}/${key}` }, 201);
    } catch (err) {
      if (err instanceof HttpError) {
        return ImageController.json({ error: err.message }, err.status);
      }
      console.error('이미지 업로드 실패', err);
      return ImageController.json({ error: '이미지를 처리하지 못했습니다.' }, 500);
    }
  };

  private static json(body: unknown, status: number): Response {
    return new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'private, no-store' },
    });
  }
}
