# 3개 레포 개요

## ppfront — 사용자 화면 프론트

- **경로**: `~/Documents/ppfront`
- **스택**: React 17 + TypeScript + Vite + Redux (구식 redux + redux-pender + redux-thunk + redux-actions)
- **UI**: Material UI v4 + v5 혼재, MUI X DataGrid Pro, ag-grid Enterprise, ag-charts
- **데이터 fetching**: @tanstack/react-query v4 + axios + actioncable (websocket)
- **i18n**: i18next, 8개 언어 (ko, en, ja-JP, zh-CN, vi-VN, th-TH, id-ID + 한국어 번역 fallback)
- **테스트**: Jest, Playwright, 일부 단위 테스트
- **빌드/배포**: vite, env-cmd로 환경 분리 (talenx-pp-staging, talenx-tx-staging, talenx-ap-staging, dump, demo, main 등)
- **기타**: react-router-dom v5, formik 2.2.5, redux-persist, datadog RUM, sentry, lodash, moment

### 근무 도메인 코드 위치 (확인된 것)

```
src/
├── components/attendance/      ← UI 컴포넌트
│   ├── work_info/              ← 근무 요약 정보 위젯
│   ├── member_work/            ← 구성원 근무
│   │   └── contents/work_status_tab/
│   ├── member_leave/           ← 구성원 휴가
│   │   └── contents/
│   │       ├── member_leave_summary_tab/
│   │       └── member_leave_schedule_tab/
│   └── personal_leave/
│       └── contents/ResidualAnnualLeave.tsx (잔여 연차)
├── modules/attendance/         ← Redux 모듈 (action/reducer)
│   ├── member_work.ts
│   └── member_leave.ts
├── hooks/attendance/           ← 커스텀 훅
│   ├── useHolidayWorkRequestValidation.ts
│   ├── useAdminDirectOtherWorkDisplay.tsx
│   └── useAdminDirectLeaveDisplay.tsx
├── lib/attendance/             ← 유틸/도메인 로직
│   ├── personalWork.ts
│   └── __tests__/leaveValidation.test.ts
└── locales/<lang>/attendance.json   ← 다국어 리소스 (8개 언어)
```

## talenx-admin — 어드민 화면 프론트

- **경로**: `~/Documents/talenx-admin`
- **스택**: React 18 + TypeScript + Vite + Redux Toolkit + redux-saga
- **UI**: Material UI v5 (베타 lab v7), MUI X DataGrid Pro, ag-grid Enterprise, ag-charts
- **데이터 fetching**: @tanstack/react-query v5 + axios v0.21 (구식)
- **i18n**: i18next v19, 7개 언어 (admin도 다국어)
- **테스트**: Playwright (e2e 메인), vitest (unit)
- **빌드/배포**: vite, 다양한 환경 (pp-staging, tx-staging, ap-staging, staging, production, dump, demo, system-staging)
- **Node**: >=24.0.0 강제

### 근무 도메인 코드 위치 (확인된 것)

```
src/
├── pages/attendance/                    ← 라우팅 진입점
│   └── work/
│       └── personal_work_template_management/
├── components/attendance/               ← 페이지 단위 컴포넌트
│   ├── work/
│   │   └── close_work_data/
│   │       └── individual_close_work_status_tab/
│   │           └── BulkCloseWorkDialog.tsx
│   └── leave/management/
│       └── annual_leave_summary_record_tab/edit/
├── containers/attendance/               ← 컨테이너 (page-container 패턴 추정)
│   └── work/personal_work_template_management/
├── hooks/attendance/                    ← 페이지별 훅
│   ├── work/
│   │   ├── personal_work_template_management/  (4개: ExcelUpload/FilterOptions/ExcelDownload/ControlTableFilter)
│   │   ├── close_work_data/useFilterOptions.ts
│   │   ├── check_work_data/
│   │   │   ├── inout_records_tab/useFilterOptions.ts
│   │   │   └── all_employee_work_status_tab/   (FilterOptions/ExcelDownload/ControlTableFilter)
│   │   └── appl_management/
│   │       ├── work_record_change_appls_management_tab/useFilterOptions.ts
│   │       ├── overtime_request_tab/useFilterOptions.ts
│   │       └── other_work_status_tab/useFilterOptions.ts
│   ├── shared/                          ← 공용 훅 (옵션 fetch 등)
│   │   ├── useWorkTemplateOptions.ts
│   │   ├── useWorkGroupOptions.ts
│   │   ├── useOrganizationOptions.ts
│   │   └── useCompanyOptions.ts
│   └── module_setting/useFilterOptions.ts
├── helpers/attendance/work/personal_work_template_management/
└── tests/e2e/attendance/                ← Playwright e2e
    └── managerAuthGroupOrgHead.spec.ts
```

## optimiz-time — 백엔드

- **경로**: `~/Documents/optimiz/optimiz-time`
- **스택**: Java + Spring Boot + Gradle
- **패키지 베이스**: `com.hcg.optimiz.time`
- **DB 테이블 prefix**: `TM_` (Time Module)

### 패키지 구조 (일부 확인됨)

```
src/main/java/com/hcg/optimiz/
├── time/
│   ├── dto/
│   │   └── appls/                ← 신청서 DTO들
│   │       ├── WorkApplyCheckDto.java
│   │       ├── WorkForHomeApplSmrDto.java
│   │       └── WorkForHomeCancelApplSmrDto.java
│   └── ... [TBD: controller/service/repository/entity 구조]
└── core/
    └── service/
        └── TimeBasicService.java
```

### DB 초기 셋업 SQL (`src/main/resources/db/initialSetting/`)

매우 많음 (50+개). 자세한 테이블 인벤토리는 `code/backend-tables.md` 참고.

## 공통 패턴 (관찰)

- 두 프론트 모두 `attendance/` 라는 도메인 폴더 컨벤션
- `.claude/qa-checklist/attendance.md`가 ppfront, talenx-admin 양쪽에 존재
- ppfront/talenx-admin 모두 다국어 분리, ko가 1차
- 백엔드 단일 — 두 프론트가 같은 백엔드 호출 (추정, 검증 필요)

## [TBD] 필요한 추가 확인

- 백엔드 controller/service/repository 패키지 구조
- 백엔드 ↔ 프론트 API 계약 (어떻게 제공되는지: Swagger? 별도 문서?)
- Redux store 구조 (특히 ppfront)
- 라우팅 맵 (어떤 URL → 어떤 페이지)
