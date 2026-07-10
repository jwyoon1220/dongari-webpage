// Inside - 최소한의 점진적 향상(progressive enhancement) 스크립트.
// 이 파일이 없어도 모든 기능(글쓰기/수정/삭제/로그인 등)은 순수 HTML 폼 제출로 동작한다.
// 여기서는 data-confirm 속성이 붙은 폼에 삭제 확인 대화상자만 추가한다.
(function () {
  'use strict';

  document.addEventListener('submit', function (event) {
    var form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    var message = form.getAttribute('data-confirm');
    if (!message) return;
    if (!window.confirm(message)) {
      event.preventDefault();
    }
  });
})();
