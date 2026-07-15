import { BaseController } from './BaseController';
import { RequestContext } from '../http/RequestContext';
import { Respond } from '../http/Respond';
import { EmotionPage } from '../views/pages/EmotionPage';
import { buildLayoutOptions } from '../views/layoutOptions';
import { Sanitize } from '../security/Sanitize';
import { isValidEmoticonName } from '../models/Emoticon';
import { CDN_ORIGIN, MAX_EMOTICONS_PER_IP } from '../config/constants';

const UPLOADED_IMAGE_KEY_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.webp$/;

/** ImageController가 발급한 URL 형태(CDN_ORIGIN/img/<uuid>.webp)인지 확인한다. */
function parseUploadedImageKey(url: string): string | null {
  const prefix = `${CDN_ORIGIN}/img/`;
  if (!url.startsWith(prefix)) return null;
  const rest = url.slice(prefix.length);
  return UPLOADED_IMAGE_KEY_PATTERN.test(rest) ? `img/${rest}` : null;
}

/**
 * 이모티콘 목록 조회 및 생성(/emotion). 회원가입이 없으므로 비관리자도 만들 수 있지만
 * IP당 개수를 제한한다(MAX_EMOTICONS_PER_IP). 이미지는 별도의 /api/images 업로드
 * 엔드포인트에서 이미 WebP로 변환·저장된 뒤이므로, 여기서는 그 URL과 이름만 등록한다.
 */
export class EmoticonController extends BaseController {
  index = async (ctx: RequestContext): Promise<Response> => {
    const emoticons = await this.app.emoticons.list();
    const remaining = await this.remainingSlots(ctx);
    return Respond.html(
      EmotionPage.render(buildLayoutOptions(ctx, '이모티콘'), {
        emoticons,
        remaining,
        errors: [],
        values: { name: '' },
        csrfToken: ctx.csrfToken,
      }),
    );
  };

  create = async (ctx: RequestContext): Promise<Response> => {
    const form = await ctx.form();
    this.verifyCsrfOrThrow(ctx, form);

    const name = Sanitize.cleanText(form.get('name'));
    const imageUrl = form.get('image_url') ?? '';
    const errors: string[] = [];

    if (!isValidEmoticonName(name)) {
      errors.push('이모티콘 이름은 영문/숫자/-/_ 조합으로 1~20자여야 합니다.');
    }

    const imageKey = parseUploadedImageKey(imageUrl);
    if (!imageKey) {
      errors.push('이미지를 먼저 업로드해주세요.');
    } else if (!(await this.app.images.head(imageKey))) {
      errors.push('업로드된 이미지를 찾을 수 없습니다. 다시 업로드해주세요.');
    }

    const remaining = await this.remainingSlots(ctx);
    if (errors.length === 0 && remaining <= 0) {
      errors.push(`IP당 이모티콘은 ${MAX_EMOTICONS_PER_IP}개 미만으로만 만들 수 있습니다.`);
    }

    if (errors.length === 0) {
      try {
        await this.app.emoticons.create(name, imageUrl, ctx.clientIp());
        return Respond.redirect('/emotion?flash=emoticon_created');
      } catch (err) {
        errors.push(EmoticonController.describeCreateError(err));
      }
    }

    const emoticons = await this.app.emoticons.list();
    return Respond.badRequest(
      EmotionPage.render(buildLayoutOptions(ctx, '이모티콘'), {
        emoticons,
        remaining: await this.remainingSlots(ctx),
        errors,
        values: { name },
        csrfToken: ctx.csrfToken,
      }),
    );
  };

  private async remainingSlots(ctx: RequestContext): Promise<number> {
    if (ctx.adminId !== null) return MAX_EMOTICONS_PER_IP;
    const used = await this.app.emoticons.countByIp(ctx.clientIp());
    return Math.max(0, MAX_EMOTICONS_PER_IP - used);
  }

  private static describeCreateError(err: unknown): string {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('UNIQUE')) return '이미 사용 중인 이모티콘 이름입니다.';
    return '이모티콘을 저장하지 못했습니다.';
  }
}
