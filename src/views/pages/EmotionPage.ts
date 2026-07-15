import { html, SafeHtml } from '../../http/Html';
import { Layout, LayoutOptions } from '../Layout';
import { Emoticon } from '../../models/Emoticon';
import { FormErrors } from '../components/FormErrors';
import { CSRF_FIELD_NAME } from '../../security/CsrfProtection';
import { LIMITS, MAX_EMOTICONS_PER_IP } from '../../config/constants';
import { INPUT_CLASS, LABEL_CLASS, PRIMARY_BUTTON_CLASS } from '../styles';

export interface EmotionPageOptions {
  emoticons: Emoticon[];
  remaining: number;
  errors: string[];
  values: { name: string };
  csrfToken: string;
}

/** 이모티콘 목록 + 생성 폼(/emotion). 회원가입 없이 누구나 만들 수 있지만 IP당 개수 제한이 있다. */
export class EmotionPage {
  static render(layoutOptions: LayoutOptions, options: EmotionPageOptions): SafeHtml {
    const { emoticons, remaining, errors, values, csrfToken } = options;

    const grid =
      emoticons.length === 0
        ? html`<p class="py-6 text-center text-sm text-zinc-500">아직 이모티콘이 없습니다.</p>`
        : html`<div class="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
            ${emoticons.map(
              (e) => html`<div
                class="flex flex-col items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 text-center"
              >
                <img src="${e.imageUrl}" alt="${e.name}" class="h-10 w-10 object-contain" loading="lazy" />
                <code class="w-full truncate text-xs text-zinc-400">%{${e.name}}%</code>
              </div>`,
            )}
          </div>`;

    const body = html`<div class="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-zinc-50">이모티콘</h1>
        <p class="mt-1 text-sm text-zinc-500">
          게시물/댓글 작성 시 <code>%{이름}%</code> 형식으로 사용할 수 있습니다. 회원가입 없이 누구나 만들 수 있지만,
          IP당 ${String(MAX_EMOTICONS_PER_IP)}개 미만으로 제한됩니다.
        </p>
      </div>

      ${grid}

      <div class="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
        <h2 class="text-sm font-semibold text-zinc-300">새 이모티콘 만들기</h2>
        <p class="mt-1 text-xs text-zinc-500">남은 생성 가능 개수: ${String(remaining)}개</p>
        ${FormErrors.render(errors)}
        <form method="POST" action="/emotion" class="mt-3 space-y-4" data-emoticon-form>
          <input type="hidden" name="${CSRF_FIELD_NAME}" value="${csrfToken}" />
          <input type="hidden" name="image_url" id="emoticon-image-url" required />
          <div>
            <label for="emoticon-image-file" class="${LABEL_CLASS}">이미지 (PNG/JPEG/WebP, 자동으로 WebP 변환)</label>
            <input
              id="emoticon-image-file"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              class="${INPUT_CLASS}"
              data-image-upload
              data-image-upload-target="emoticon-image-url"
              data-image-upload-preview="emoticon-image-preview"
              data-image-upload-status="emoticon-image-status"
              required
            />
            <img id="emoticon-image-preview" alt="" class="mt-2 hidden h-16 w-16 rounded-md border border-zinc-800 object-contain" />
            <p id="emoticon-image-status" class="mt-1 text-xs text-zinc-500"></p>
          </div>
          <div>
            <label for="emoticon-name" class="${LABEL_CLASS}">이름</label>
            <input
              id="emoticon-name"
              name="name"
              type="text"
              required
              maxlength="${String(LIMITS.EMOTICON_NAME_MAX)}"
              placeholder="예: heart"
              value="${values.name}"
              class="${INPUT_CLASS}"
            />
            <p class="mt-1 text-xs text-zinc-500">영문/숫자/-/_ 조합, 1~${String(LIMITS.EMOTICON_NAME_MAX)}자.</p>
          </div>
          <div class="flex justify-end">
            <button type="submit" class="${PRIMARY_BUTTON_CLASS}">등록</button>
          </div>
        </form>
      </div>
    </div>`;

    return Layout.render(layoutOptions, body);
  }
}
