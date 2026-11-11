// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  integrations: [
    starlight({
      title: '근무 KB',
      description: 'Talenx 근무(Attendance) 도메인 지식 베이스',
      defaultLocale: 'root',
      locales: { root: { label: '한국어', lang: 'ko' } },
      customCss: ['./src/styles/custom.css'],
      lastUpdated: true,
      // 헤더 KB / 명세서 탭 + 탭별 사이드바 전환 (src/route-data.ts)
      components: { Header: './src/components/Header.astro' },
      routeMiddleware: './src/route-data.ts',
      // autogenerate 디렉터리는 site/ 기준 KB 원본 경로 (kb-loader가 filePath를 ../<폴더>/... 로 저장)
      sidebar: [
        { label: '시작하기', items: [{ label: '크로스 레퍼런스 인덱스', link: '/' }, { label: 'KB 안내', slug: 'readme' }] },
        { label: '운영 플레이북', items: [{ autogenerate: { directory: '../operations' } }] },
        {
          label: '어드민 화면',
          items: [
            { label: '모듈 설정', collapsed: true, items: [{ autogenerate: { directory: '../product/admin/module-setting' } }] },
            { label: '권한', collapsed: true, items: [{ autogenerate: { directory: '../product/admin/authority' } }] },
            { label: '근무', collapsed: true, items: [{ autogenerate: { directory: '../product/admin/work' } }] },
            { label: '휴가', collapsed: true, items: [{ autogenerate: { directory: '../product/admin/leave' } }] },
            { label: '과거 데이터 관리', collapsed: true, items: [{ autogenerate: { directory: '../product/admin/old-data' } }] },
            { label: '메뉴 외', collapsed: true, items: [{ autogenerate: { directory: '../product/admin/etc' } }] },
          ],
        },
        {
          label: '사용자 화면',
          items: [
            { label: '통합홈 위젯', collapsed: true, items: [{ autogenerate: { directory: '../product/user/home' } }] },
            { label: '근무관리', collapsed: true, items: [{ autogenerate: { directory: '../product/user/attendance' } }] },
            { label: '근무 신청서', collapsed: true, items: [{ autogenerate: { directory: '../product/user/applications' } }] },
          ],
        },
        { label: '기능 명세 작성 안내', slug: 'product/readme' },
        { label: '도메인 룰·용어', items: [{ autogenerate: { directory: '../domain' } }] },
        { label: '코드 맵', items: [{ autogenerate: { directory: '../code' } }] },
        { label: '학습 노트', collapsed: true, items: [{ autogenerate: { directory: '../_learnings' } }] },
        { label: '리포트', collapsed: true, items: [{ autogenerate: { directory: '../Claude outputs' } }] },
        // ↓ 명세서 탭 전용. route-data.ts 가 /spec/ 경로에서만 이 그룹의 하위(어드민·사용자)를 사이드바로 꺼내 씀
        //   라벨 '명세서'는 route-data.ts 의 SPEC_GROUP_LABEL 과 같아야 함
        {
          label: '명세서',
          items: [
            {
              label: '어드민',
              items: [
                { label: '모듈 설정', collapsed: true, items: [{ autogenerate: { directory: '../spec/admin/module-setting' } }] },
                { label: '권한', collapsed: true, items: [{ autogenerate: { directory: '../spec/admin/authority' } }] },
                { label: '근무', collapsed: true, items: [{ autogenerate: { directory: '../spec/admin/work' } }] },
                { label: '휴가', collapsed: true, items: [{ autogenerate: { directory: '../spec/admin/leave' } }] },
                { label: '과거 데이터 관리', collapsed: true, items: [{ autogenerate: { directory: '../spec/admin/old-data' } }] },
                { label: '메뉴 외', collapsed: true, items: [{ autogenerate: { directory: '../spec/admin/etc' } }] },
              ],
            },
            {
              label: '사용자',
              items: [
                { label: '통합홈 위젯', collapsed: true, items: [{ autogenerate: { directory: '../spec/user/home' } }] },
                { label: '근무관리', collapsed: true, items: [{ autogenerate: { directory: '../spec/user/attendance' } }] },
                { label: '근무 신청서', collapsed: true, items: [{ autogenerate: { directory: '../spec/user/applications' } }] },
              ],
            },
          ],
        },
      ],
    }),
  ],
});
