import { App } from '../src/App';
import { Env } from '../src/config/Env';

// 정적 자산(예: /css/tailwind.css, /js/app.js)이 먼저 서빙되도록 시도하고,
// 해당 경로에 자산이 없을 때만(404) 동적 애플리케이션 라우터로 넘어간다.
// 정적 자산 핸들러는 GET/HEAD 외의 메서드에는 404가 아니라 405를 반환하므로,
// POST 등 상태 변경 요청(로그인/글쓰기/삭제 등)은 애초에 자산 조회를 거치지 않고
// 곧바로 애플리케이션으로 보낸다.
export const onRequest: PagesFunction<Env> = async (context) => {
  const { method } = context.request;
  if (method === 'GET' || method === 'HEAD') {
    const assetResponse = await context.next();
    if (assetResponse.status !== 404) {
      return assetResponse;
    }
  }
  return App.handle(context.request, context.env);
};
