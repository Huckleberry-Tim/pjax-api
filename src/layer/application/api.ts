import { Cancelable, Left } from 'spica';
import { Config } from '../domain/data/config';
import { scope } from './config/scope';
import { RouterEvent } from '../domain/event/router';
import { route as route_, RouterEntity, RouterResult, RouterResultData } from '../domain/router/api';
import { CanonicalUrl } from '../data/model/canonicalization/url';
import { ApplicationError } from './data/error';

export {Config}

export function route(
  config: Config,
  event: Event,
  state: {
    scripts: Set<CanonicalUrl>;
    cancelable: Cancelable<Error>
  },
  io: {
    document: Document;
  }
): RouterResult {
  const location = new RouterEvent(event).location;
  return scope(
    config,
    {
      orig: location.orig.pathname,
      dest: location.dest.pathname
    })
    .extract<RouterResult>(
      () =>
        Promise.resolve<RouterResultData>(Left(new ApplicationError(`Disabled to use pjax by config.`))),
      config =>
        route_(
          new RouterEntity(
            new RouterEvent(event),
            config,
            new RouterEntity.State(state.scripts, state.cancelable)),
          io));
}

export * from './store/path';
export { parse } from '../domain/router/module/fetch/html';
