// 상단 헤더의 KB / 명세서 탭에 따라 좌측 사이드바를 나눠 보여주는 Starlight route middleware.
// - astro.config.mjs 사이드바에는 KB 그룹들 + '명세서' 그룹(SPEC_GROUP_LABEL)이 함께 정의돼 있음
// - /spec/ 경로 → '명세서' 그룹의 하위(어드민·사용자)만 노출
// - 그 외 경로 → '명세서' 그룹을 뺀 KB 사이드바 노출
// - 이전/다음 페이지 링크도 걸러진 사이드바 기준으로 다시 계산
import { defineRouteMiddleware } from '@astrojs/starlight/route-data';

export const SPEC_GROUP_LABEL = '명세서';
export const isSpecPath = (pathname: string) => /^\/spec(\/|$)/.test(pathname);

type Entry = any;

const flatten = (entries: Entry[]): Entry[] =>
  entries.flatMap((e) => (e.type === 'group' ? flatten(e.entries) : [e]));

export const onRequest = defineRouteMiddleware((context) => {
  const route = context.locals.starlightRoute;
  const specGroup = route.sidebar.find((e: Entry) => e.type === 'group' && e.label === SPEC_GROUP_LABEL);
  if (!specGroup) return;

  const spec = isSpecPath(context.url.pathname);
  route.sidebar = spec ? specGroup.entries : route.sidebar.filter((e: Entry) => e !== specGroup);

  const links = flatten(route.sidebar);
  const i = links.findIndex((l) => l.isCurrent);
  const { prev, next } = route.entry.data;
  route.pagination = {
    prev: prev === false || i < 1 ? undefined : links[i - 1],
    next: next === false || i < 0 ? undefined : links[i + 1],
  };
});
