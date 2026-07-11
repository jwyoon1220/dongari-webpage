import { html, SafeHtml } from '../../http/Html';
import { Layout, LayoutOptions } from '../Layout';
import { SITE_NAME } from '../../config/constants';

/** 이용약관(EULA) 정적 페이지. GFDL 게시물 라이선스 안내와 이용자간 면책 조항을 포함한다. */
export class TermsPage {
  static render(layoutOptions: LayoutOptions): SafeHtml {
    const body = html`<article class="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-zinc-50">이용약관</h1>
        <p class="mt-1 text-sm text-zinc-500">${SITE_NAME} 커뮤니티 서비스 이용약관</p>
      </div>

      <section class="space-y-2">
        <h2 class="text-base font-semibold text-zinc-100">1. 목적</h2>
        <p class="text-sm leading-relaxed text-zinc-400">
          이 약관은 ${SITE_NAME}(이하 "서비스")이 제공하는 게시판 서비스의 이용 조건과 절차, 회원(이용자)과
          서비스 운영자(이하 "운영자")의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.
        </p>
      </section>

      <section class="space-y-2">
        <h2 class="text-base font-semibold text-zinc-100">2. 게시물의 저작권 및 이용 허락(라이선스)</h2>
        <p class="text-sm leading-relaxed text-zinc-400">
          이용자가 서비스에 게시하는 모든 게시물(글, 댓글 등)의 저작권은 해당 게시물을 작성한 이용자에게
          있습니다. 다만 이용자가 게시물을 등록하는 행위는 해당 게시물을
          <strong class="text-zinc-200">GNU 자유 문서 사용 허가서(GNU Free Documentation License, GFDL)
          버전 1.3 이상</strong>의 조건에 따라 이용을 허락하는 것에 동의하는 것으로 간주됩니다. 이는 원저작자
          표시 및 동일한 라이선스 사본 유지를 조건으로 누구나 해당 게시물을 복제·배포·수정할 수 있음을
          의미합니다. 라이선스 전문은
          <a href="https://www.gnu.org/licenses/fdl-1.3.html" class="text-indigo-400 underline underline-offset-2 hover:text-indigo-300" rel="noopener noreferrer" target="_blank"
            >gnu.org의 GFDL 1.3 전문</a
          >에서 확인할 수 있습니다.
        </p>
      </section>

      <section class="space-y-2">
        <h2 class="text-base font-semibold text-zinc-100">3. 이용자의 책임</h2>
        <p class="text-sm leading-relaxed text-zinc-400">
          이용자는 자신이 작성한 게시물 및 자신이 행한 모든 활동에 대해 스스로 책임을 집니다. 이용자는 관계
          법령, 이 약관의 규정, 이용안내 및 서비스와 관련하여 공지한 사항을 준수해야 하며, 타인의 권리를
          침해하거나 불법적인 목적으로 서비스를 이용해서는 안 됩니다.
        </p>
      </section>

      <section class="space-y-2">
        <h2 class="text-base font-semibold text-zinc-100">4. 이용자간 거래 및 분쟁에 관한 면책</h2>
        <p class="text-sm leading-relaxed text-zinc-400">
          서비스는 이용자 간 정보 교류의 장을 제공할 뿐이며, 이용자 상호간 이루어지는 약속, 거래, 대화 및
          그로부터 발생하는 일체의 분쟁에 관여하지 않습니다. 이용자 간 거래·약속의 이행 여부, 진실성, 적법성에
          대해 운영자는 어떠한 보증도 하지 않으며, 이로 인해 이용자에게 발생한 손해(불법적인 거래, 사기,
          기타 위법 행위로 인한 손해를 포함하되 이에 한정되지 않음)에 대해 운영자는 법령이 허용하는 최대
          범위에서 책임을 지지 않습니다. 다만 운영자는 관계 법령에 따라 수사기관 등 관계 기관의 적법한 요청이
          있는 경우 협조할 수 있습니다.
        </p>
      </section>

      <section class="space-y-2">
        <h2 class="text-base font-semibold text-zinc-100">5. 금지행위</h2>
        <p class="text-sm leading-relaxed text-zinc-400">
          이용자는 불법적인 물품·서비스의 거래, 타인의 권리 침해, 명예훼손, 음란물 게시, 서비스 운영을
          방해하는 행위 등 관계 법령 및 공서양속에 반하는 행위를 해서는 안 되며, 이를 위반한 게시물은 운영자가
          사전 통지 없이 삭제하거나 이용을 제한할 수 있습니다.
        </p>
      </section>

      <section class="space-y-2">
        <h2 class="text-base font-semibold text-zinc-100">6. 서비스 제공자의 면책</h2>
        <p class="text-sm leading-relaxed text-zinc-400">
          운영자는 천재지변, 불가항력적 사유로 서비스를 제공할 수 없는 경우 책임이 면제되며, 이용자의 귀책
          사유로 인한 서비스 이용 장애에 대해서도 책임을 지지 않습니다. 서비스는 "있는 그대로" 제공되며,
          운영자는 게시물의 신뢰성, 정확성에 대해 보증하지 않습니다.
        </p>
      </section>

      <section class="space-y-2">
        <h2 class="text-base font-semibold text-zinc-100">7. 약관의 변경</h2>
        <p class="text-sm leading-relaxed text-zinc-400">
          운영자는 필요한 경우 관계 법령을 위배하지 않는 범위에서 이 약관을 변경할 수 있으며, 변경된 약관은
          서비스 내 공지를 통해 효력이 발생합니다.
        </p>
      </section>
    </article>`;

    return Layout.render(layoutOptions, body);
  }
}
