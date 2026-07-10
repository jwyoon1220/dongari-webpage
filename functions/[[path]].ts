import { App } from '../src/App';
import { Env } from '../src/config/Env';

export const onRequest: PagesFunction<Env> = async (context) => {
  return App.handle(context.request, context.env);
};
