import { RequestContext } from './RequestContext';

export type Handler = (ctx: RequestContext) => Promise<Response>;

interface Route {
  method: string;
  pattern: RegExp;
  keys: string[];
  handler: Handler;
}

/** 경로 파라미터(:id)를 지원하는 최소한의 라우터. 프레임워크 의존성 없음. */
export class Router {
  private readonly routes: Route[] = [];

  get(path: string, handler: Handler): this {
    return this.add('GET', path, handler);
  }

  post(path: string, handler: Handler): this {
    return this.add('POST', path, handler);
  }

  private add(method: string, path: string, handler: Handler): this {
    const { pattern, keys } = Router.compile(path);
    this.routes.push({ method, pattern, keys, handler });
    return this;
  }

  private static compile(path: string): { pattern: RegExp; keys: string[] } {
    const keys: string[] = [];
    const escaped = path
      .split('/')
      .map((segment) => {
        if (segment.startsWith(':')) {
          keys.push(segment.slice(1));
          return '([^/]+)';
        }
        return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      })
      .join('/');
    return { pattern: new RegExp(`^${escaped}$`), keys };
  }

  async dispatch(ctx: RequestContext): Promise<Response | null> {
    const pathname = ctx.url.pathname;
    for (const route of this.routes) {
      if (route.method !== ctx.request.method) continue;
      const match = route.pattern.exec(pathname);
      if (!match) continue;

      const params: Record<string, string> = {};
      route.keys.forEach((key, index) => {
        params[key] = decodeURIComponent(match[index + 1]);
      });
      ctx.params = params;
      return route.handler(ctx);
    }
    return null;
  }
}
