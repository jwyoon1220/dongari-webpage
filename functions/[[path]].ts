import { App } from '../src/App';
import { Env } from '../src/config/Env';

// 정적 자산(예: /css/tailwind.css, /js/app.js)이 먼저 서빙되도록 시도하고,
// 해당 경로에 자산이 없을 때만(404) 동적 애플리케이션 라우터로 넘어간다.
// 이 순서를 지키지 않으면 정적 파일 요청도 전부 애플리케이션이 가로채서
// 404 HTML을 돌려주게 된다.
export const onRequest: PagesFunction<Env> = async (context) => {
  const assetResponse = await context.next();
  if (assetResponse.status !== 404) {
    return assetResponse;
  }
  return App.handle(context.request, context.env);
};
