---
sidebar:
  order: 5
---

# 근무 신청 내역 관리

> **메뉴** 근무관리 › 근무 › 근무 신청 내역 관리  
> **URL** `/attendance/work/appl_management` (탭은 URL 파라미터로 유지, 기본 탭 = 근무계획 변경 신청)  
> **탭** 근무계획 변경 신청 · 통합 근무내역 변경 신청 · 출퇴근 내역 변경 신청 · 기타근무 신청 · 재택근무 신청 · 연장/야간 근무(사전) 신청 · 연장/야간 근무(사후) 신청 · 휴일근무(사전) 신청 · 휴일근무(사후) 신청 · 대체근무 신청  
> **원본** `product/_legacy/admin-appl-management.md`

> ~~⚠️ 실제 화면과 차이: 문서는 4탭 기준~~ → **(2026-11-05 해소)** talenx-admin `origin/dev` 코드 기준으로 10탭 전체를 정리했습니다. 근거: `ad:src/components/attendance/work/appl_management/index.tsx:28-89`, 백엔드 `be:controller/workadmin/WorkApplManagementController.java`.

## 개요

사용자가 올린 근무 관련 신청서를 **어드민이 조회·모니터링**하는 화면. 신청서 종류별로 10개 탭이 있고, 탭마다 사용자 신청서 1종과 1:1로 짝을 이룹니다.

- **승인/반려 기능 없음 (조회 전용)** — 페이지 전체에 승인·반려 버튼, 행 클릭 상세 다이얼로그가 없음 (2026-11-05 코드 확인, `onRowClick`/`onCellClick` 0건). 결재는 워크플로우(결재)에서 처리
- **유일한 쓰기 기능**: 기타근무 탭의 "근무 수동등록"(엑셀 업로드)과 "삭제"(어드민 등록분 취소)
- 휴가 신청은 이 화면에 없음 → 연차 관리 / 연차 외 휴가 관리 화면에서 확인 (`KB:product/admin/leave/annual-management.md`)
- 출근/퇴근 요청(출퇴근 위젯)도 이 화면에 없음 → 워크플로우(결재)에서 처리

```
사용자 화면 신청 → 백엔드 저장 + 결재 진행 → 어드민이 여기서 조회·엑셀 다운로드
```

## 탭 추가 이력 (talenx-admin `git log --diff-filter=A`)

| 시점 | 탭 | PR |
|---|---|---|
| 2026-03-19 | 컨테이너 최초 생성 ("근무내역 변경신청 내역") | hcgtheplus/talenx-admin#3354 |
| 2026-04-06 | 근무계획 변경 · 통합 근무내역 변경 · 기타근무 (릴리스 머지) | hcgtheplus/talenx-admin#3447 |
| 2026-04-16 | 연장/야간(사전) | hcgtheplus/talenx-admin#3488 |
| 2026-05-29 | 재택근무 | hcgtheplus/talenx-admin#3738 |
| 2026-06-25 | 대체근무 | hcgtheplus/talenx-admin#3896 |
| 2026-07-10 | 휴일근무(사전) | hcgtheplus/talenx-admin#3993 |
| 2026-10-07 | 출퇴근 내역 변경 | hcgtheplus/talenx-admin#4381 |
| 2026-10-07 | 연장/야간(사후) | hcgtheplus/talenx-admin#4362 |
| 2026-10-07 | 휴일근무(사후) | hcgtheplus/talenx-admin#4512 |

> 2026-05 QA 체크리스트(`ad-qa:L645-729`)는 4탭 시점 기준이라 필터 표기 일부가 현재와 다름 (아래 "QA 대비 변경점").

## 10탭 ↔ 사용자 신청서 매핑

| # | 어드민 탭 (화면 표기) | 탭 키 | 사용자 신청서 | DB 테이블 |
|---|---|---|---|---|
| 1 | 근무계획 변경 신청 | `work_plan_change_appls_management` | 근무계획 변경 (`KB:product/user/applications/plan-change.md`) | `TM_DD_WORK_PLAN_CHG_APPL(_DTL)` |
| 2 | 통합 근무내역 변경 신청 | `work_record_change_appls_management` | 통합 근무내역 변경 (출퇴근 + 휴게/자리비움, `KB:product/user/applications/reg-adjust.md`) | `TM_WORK_REG_ADJST_APPL` + `TM_INOUT_REG_ADJST_DTL` / `TM_REST_REG_ADJST_DTL` |
| 3 | 출퇴근 내역 변경 신청 | `inout_record_change_appls_management` | 출퇴근 내역 변경 (출퇴근 전용) | `TM_INOUT_REG_ADJST_APPL` + `TM_INOUT_REG_ADJST_TIME_DTL` / `TM_INOUT_REG_ADJST_REST_DTL` |
| 4 | 기타근무 신청 | `other_work_status` | 기타근무 (`KB:product/user/applications/other-work.md`) + 어드민 수동 등록 | `TM_OTHER_WORK_APPL` + `TM_OTHER_WORK_APPL_DTL` (마스터 `TM_OTHER_WORK`) |
| 5 | 재택근무 신청 | `work_for_home_appls_management` | 재택근무 (`KB:product/user/applications/remote-work.md`) | `TM_WORK_FOR_HOME_APPL(_DTL)`, 취소 `TM_WORK_FOR_HOME_CANCEL_APPL(_DTL)` |
| 6 | 연장/야간 근무(사전) 신청 | `overtime_request` | 사전 연장/야간 (`KB:product/user/applications/overtime.md`) | `TM_PSN_OT_PLAN_APPL` |
| 7 | 연장/야간 근무(사후) 신청 | `post_overtime_request` | 사후 연장/야간 | `TM_PSN_OT_POST_APPL` |
| 8 | 휴일근무(사전) 신청 | `pre_holiday_work_request` | 사전 휴일근무 (`KB:product/user/applications/holiday-work.md`) | `TM_HOLIDAY_WORK_APPL`, 취소 `TM_HOLIDAY_WORK_CANCEL_APPL` |
| 9 | 휴일근무(사후) 신청 | `post_holiday_work_request` | 사후 휴일근무 | `TM_POST_HOLIDAY_WORK_APPL` |
| 10 | 대체근무 신청 | `compensatory_work_request` | 대체근무 (`KB:product/user/applications/compensatory-work.md`) | `TM_COMPENSATORY_WORK_APPL` |

> ~~`TM_OTHER_WORK_APPL` 또는 `TM_WORK_FOR_HOME_APPL` (테이블 이름 [TBD])~~ → **(2026-11-05 해소)** 기타근무 = `TM_OTHER_WORK_APPL` / `TM_OTHER_WORK_APPL_DTL`. JPA `@Table` 엔티티 없이 MyBatis(`be:resources/SQL/time/workadmin/OtherWorkDataAdminMapper.xml`)로만 접근.  
> 탭 VALID_TABS 배열(`index.tsx:28-39`) 순서는 화면 순서와 다름(사후 연장/야간이 배열 맨 끝) — 동작 영향 없음.

## 코드 위치

### Admin 프론트 (`ad:src/`)

```
pages/attendance/work/appl_management/                         ← 페이지 진입점
components/attendance/work/appl_management/
├── index.tsx                                                  ← 10탭 컨테이너 (useTabParam)
└── contents/
    ├── work_plan_change_appls_management_tab/                 ← 1 근무계획 변경
    ├── work_record_change_appls_management_tab/               ← 2 통합 근무내역 변경
    ├── inout_record_change_appls_management_tab/              ← 3 출퇴근 내역 변경
    ├── other_work_status_tab/                                 ← 4 기타근무 (OtherWorkExcelUpload*.tsx 포함)
    ├── work_for_home_appls_management/                        ← 5 재택근무
    ├── overtime_request_tab/                                  ← 6 연장/야간(사전)
    ├── post_overtime_request_tab/                             ← 7 연장/야간(사후)
    ├── pre_holiday_work_request_tab/                          ← 8 휴일근무(사전)
    ├── post_holiday_work_request_tab/                         ← 9 휴일근무(사후)
    └── compensatory_work_request_tab/                         ← 10 대체근무
       (각 탭: *Filter.tsx / *Table|List.tsx / TableFilterContextProvider.tsx)

hooks/attendance/work/appl_management/<탭>/                    ← useFilterOptions / useExcelDownload / useControlTableFilter
hooks/attendance/work/appl_management/holiday_work_request/    ← 휴일근무 사전·사후 공용 (필터 옵션·엑셀)
helpers/attendance/work/appl_management/constants.ts           ← 상태 라벨 매핑
config/api/attendance/applManagement.ts                         ← API 클라이언트 (근무계획 검색은 workPlanChangeHistory.ts, 기타근무 검색은 time.ts:48)
components/attendance/shared/ExcelDownloadReasonDialog.tsx      ← 엑셀 사유 입력
```

### 백엔드 (`be:com/hcg/optimiz/time/`)

- `controller/workadmin/WorkApplManagementController.java` — **10탭 전체** 담당. 권한 `@Secured({WORK_APPL_MANAGE, TALENX_TIME_ADMIN})`, 서버 페이지네이션 pageSize 100
- 서비스: `WorkPlanChangeApplManagementService`(1), `WorkApplManagementService`(2·3, `inoutOnlyYn` N/Y), `OtherWorkAdminQueryService`/`OtherWorkAdminCommandService`(4), `WorkForHomeApplAdminQueryService`(5), `OvertimeApplAdminQueryService`(6·7, `search`/`searchPost`), `HolidayWorkApplAdminQueryService`(8·9, `search`/`searchPost`), `CompensatoryWorkApplAdminQueryService`(10)

---

## 10탭 공통 패턴

```
[Filter (필수 라디오 + 선택 필터)] [조회] [필터 재설정]
[Table (서버 페이징)]  [컬럼 고정 설정] [엑셀 다운로드(사유 필수)]
```

### 필수 필터 — 전 탭 동일 (월별/일별)

- 라디오 **[월별 조회 | 일별 조회]**, **기본 = 월별** (월별 라디오가 앞)
  - 월별: "조회 월" (YYYY.MM) → payload는 그 달 1일~말일 (`WorkPlanChangeHistoryTable.tsx:94-100`)
  - 일별: "조회 기간" range picker
  - 라디오 전환 시 날짜 초기화: 일별 = 이번 달 1일 ~ 오늘, 월별 = 이번 달 (`WorkPlanChangeHistoryFilter.tsx:231-251`, `other_work_status_tab/contents/Filter.tsx:213-246`)
- 기간 미선택/잘못된 값으로 조회 시 얼럿 "조회 실패" / "기간을 선택합니다."

> ~~근무계획 탭 디폴트 = 일별, 기타근무 탭 = 연도별/기간 조회, 사전 연장·야간만 월별 디폴트~~ → **(2026-11-05 해소)** 현재 코드는 **10탭 모두 월별/일별 라디오 + 월별 기본**. 기타근무 탭의 "연도별 조회 / 기간 조회"와 "연도 옵션 = 가장 오래된 내역 ~ 내년"은 현재 화면에 없음.

### 공통 선택 필터

| 필터 | 비고 |
|---|---|
| 구성원 | — |
| 회사 | 기본 = 로그인 사용자 회사 (`TableFilterContextProvider:46-53`) |
| 조직 | 하위 조직 포함 조회 |
| 근무 그룹 | — |
| 상태 | 기타근무 탭에는 없음. 탭별 옵션은 아래 "상태 표시" |
| 활성 여부 | 활성 / 비활성 |

**필터 연동 초기화**: 회사 변경 → 조직·구성원·근무그룹 초기화 / 조직 변경 → 구성원 초기화. (근무계획 탭 추가 규칙은 § 1)

### 공통 버튼

- **필터 재설정** — 디폴트 복원
- **컬럼 고정 설정** (`ColumnPinSettingDialog`)
- **엑셀 다운로드** — `ExcelDownloadReasonDialog`로 사유 필수(공백만 입력도 차단, `ExcelDownloadReasonDialog.tsx:45,112`), payload `TALENX-LOG-REASON`. 백엔드도 사유 없으면 400 (`WorkApplManagementController.java:112-114`)

### 공통 기본 컬럼

No · 사번 · 이름 · 회사 · 조직 · 직급 · 퇴사 여부(퇴사/재직) · 활성 여부 · 근무그룹 · (마감 여부) · 근무일 — 이후 탭별 정보 그룹 컬럼.

### 상태 라벨 (`helpers/attendance/work/appl_management/constants.ts`)

| 화면 상태 | 코드 | DB 결재 상태(APPL_STAT) |
|---|---|---|
| 요청중 | `PENDING` | 110 검토중 · 200 결재중 · 700 수신처 처리중 |
| 승인완료 | `APPROVED` | 900 최종완료 |
| 취소 | `CANCELED` | 310 사용자 취소 |
| 반려 | `REJECTED` | 300 결재반려 |
| 승인완료 후 취소 | `APPROVED_CANCELED` | 930 승인 완료 후 취소 (또는 원 신청 `CANCEL_YN='Y'`) |

`CANCELING`(취소 요청중)은 주석 처리되어 미사용 ("260707 중간점검" 주석). DB 코드 의미는 optimiz-system `CONST_APPLY`(로컬 브랜치 확인, `origin/dev` 미검증).

---

## § 1. 근무계획 변경 신청 탭

- **추가 필터**: **최종 근무계획**(변경 후 근무계획 기준, payload `changedPlanIds`), 상태(다중)
  - 근무그룹·근무계획 옵션은 `GET /time/aggr/work-plan-change-appls/filter-options`(회사 → 근무그룹 → 근무계획 트리)로 선택한 회사/근무그룹 하위만 노출
  - 회사 변경 → 근무계획도 초기화 / 근무그룹 변경 → 근무계획 초기화 (`WorkPlanChangeHistoryFilter.tsx:111-137, 352-361, 399-401`)
- **컬럼** (`WorkPlanChangeHistoryTable.tsx:193-424`): 기본 컬럼(마감 여부 없음) + 근무일 → **[기존 근무계획 정보]** 근무 계획 · 근무 정보 → **[변경된 근무계획 정보]** 근무 계획 · 근무 정보 · 변경 신청일 · 상태 · 코멘트
  - "근무 정보" = `HH:mm ~ (익일) HH:mm`. 시작이 자율(SEL)이면 "자율출근 ~ N시간 근무", 종료가 자율이면 "~ 자율퇴근" (`helpers/.../work_plan_change_appls_management_tab/index.ts:22-60`)
  - 엑셀 헤더는 "변경 전 근무 계획 / 변경 전 근무 정보 / 변경 후 근무 계획 / 변경 후 근무 정보"로 다르게 붙음
- **상태 (4종)**: 요청중 / 승인완료 / 취소 / 반려 — 백엔드 기본 조회 110·200·700·900·310·300, **930 미포함** (`be:service/workadmin/WorkPlanChangeApplManagementService.java:201-246`)
- API: `GET .../work-plan-change-appls/filter-options`, `POST /time/aggr/work-plan-change-appls/search`, `POST .../excel-download/search`

## § 2. 통합 근무내역 변경 신청 탭 / § 3. 출퇴근 내역 변경 신청 탭

두 탭은 **같은 서비스·쿼리**를 쓰고 `inoutOnlyYn`만 다름 (N = 통합 근무내역 변경 `TM_WORK_REG_ADJST_APPL`, Y = 출퇴근 내역 변경 `TM_INOUT_REG_ADJST_APPL`). 화면 구성·상태·병합 동일. 3번 탭은 hcgtheplus/talenx-admin#4381 "근무내역·출퇴근 내역 변경 신청서 설정 및 출퇴근 내역 변경 신청 관리 탭 추가"(2026-10-07)로 추가.

- **상태 필터**: **단일 선택**, 옵션 요청중 / 승인완료 2개 (프론트 하드코딩, `hooks/.../work_record_change_appls_management_tab/useFilterOptions.ts:23-39`)
- **컬럼** (`WorkRecordChangeApplsTable.tsx:202-410`): 기본 컬럼(마감 여부 없음) + 근무일 → **[근무 정보]** 근무 구분(근무/자리비움) · 시작시각(당일/익일) · 시작시각 · 종료시각(당일/익일) · 종료시각 · 상태 · 코멘트
- **행 병합**: 신청 1건이 출퇴근 구간·휴게 구간 여러 행으로 펼쳐지고 `unstable_rowSpanning`으로 기본 정보·근무일·상태를 병합 (근무 구분·시각·코멘트는 병합 안 함). No는 신청 단위로 하나 (`:490-506, :570`)
- **상태 2종만 표시되는 이유** — ~~§ 2가 반려/취소 미표시 [TBD]~~ → **(2026-11-05 해소)** 백엔드가 상태 미지정 시 **110·200·700·900만 조회**(PENDING=110/200/700, APPROVED=900, 그 외 입력은 BadRequest), 응답 매핑도 900→APPROVED 나머지→PENDING (`be:service/workadmin/WorkApplManagementService.java:72-101`). 반려(300)·사용자 취소(310)·승인 후 취소(930)는 **쿼리 단계에서 제외**. 설계 의도를 적은 주석은 없음 — "유효한 근무기록 변경분만 보여주려는 의도"(추정)
- API: `POST /time/aggr/work-record-change-appls/search` · `.../excel-download/search` / `POST /time/aggr/inout-record-change-appls/search` · `.../excel-download/search` (Controller:85-170)

## § 4. 기타근무 신청 탭 — 쓰기 기능 있음

- 본문 locale은 `workData` 네임스페이스(`ad:src/locales/ko/workData.json` otherWork). 설명: "구성원별 기타근무 내역을 조회하고 관리합니다."
- **추가 필터**: **기타근무 유형**(미사용 유형은 "이름 (사용안함)", `useFilterOptions.ts:41`, 옵션 `GET /time/other-works/filter-options`), **등록 방식** — "신청/승인"(`APPLY`, 구성원 신청서) / "어드민 등록"(`DIRECT`, 엑셀 수동등록) (`Filter.tsx:411-416`, payload `inputType`). **상태 필터 없음**
- **컬럼** (`OtherWorkList.tsx:157-485`): 체크박스 + 기본 컬럼 + **마감여부(마감/마감 전)** + 근무일 → **[근무 정보]** 기타근무 유형 · 근무시간 · 시작시각 · 종료시각(당일/익일 반영) · 등록방식 · 상태 · 근무 인정 여부(근무 인정/근무 미인정) · 유/무급 · 코멘트 · 등록사유
- **상태 (2종)**: 요청중(200) / 승인완료(900) — 백엔드 `APPL_STAT_CD IN (200, 900) AND CANCEL_YN='N'` (`be:service/workadmin/OtherWorkAdminQueryService.java:75-114`, `OtherWorkDataAdminMapper.xml:31-32`). 반려·취소·검토중(110)·수신처 처리중(700)은 미조회

### ✍️ 근무 수동등록 (엑셀 업로드)

```
["근무 수동등록" 버튼] → 다이얼로그 "근무 수동등록" → [양식 다운로드] → [작성 + 업로드]
   ↓ 밸리데이션
   ├─ 형식 오류 / 빈 값 / 잘못된 기타근무 항목 → 업로드 실패
   ├─ 근무 중복 / 마감일 포함 + 정상 내역 있음 → "이어서 진행" 시 정상 내역만 등록 (allowPartial)
   └─ 모든 내역이 중복/마감 → 확인만 가능, 이어서 진행 불가
   ↓
[등록 완료] — 상태 900, inputType DIRECT 로 저장
```

### 삭제 (어드민 등록분 취소)

- 체크박스 선택 가능 행 = `inputType === "DIRECT" && !isClosed` (어드민 등록 + 마감 전) (`OtherWorkList.tsx:545-547`)
- 확인 문구: "수동으로 등록한 기타근무 N건을 삭제합니다."
- 실제 동작은 **물리 삭제가 아니라 상태를 930(승인 완료 후 취소)으로 변경** + 일별 집계 이벤트 발행 (`be:service/workadmin/OtherWorkAdminCommandService.java:706-772`) → 이후 조회 대상(200/900)에서 빠져 화면에서 사라짐

### API

| Method | Path | 용도 |
|---|---|---|
| GET | `/time/other-works/filter-options` | 필터 옵션 (기타근무 유형) |
| POST | `/time/aggr/other-works/search` | 조회 |
| POST | `/time/aggr/other-works/excel-download/search` | 엑셀 다운로드 (다이얼로그 제목 "기타근무 현황 엑셀 다운로드") |
| POST | `/time/other-work-admin/excel-upload` | 근무 수동등록 |
| PUT | `/time/other-work-admin/direct-registrations/cancel` | 어드민 등록분 삭제(취소) |

### 어드민 등록 → 사용자 화면 영향

- 사용자 화면에 `AdminDirectOtherWorkDialog` 표시: "해당 근무는 별도의 신청/승인 과정 없이 관리자에 의해 등록되었습니다." (`KB:product/admin/work/check-work-data.md`)
- 사용자 내 근무 캘린더에 `OtherWork` 타입으로 표시 (`KB:product/user/attendance/my-work.md` § "Type 4: OtherWork")

## § 5. 재택근무 신청 탭

- **상태 필터**: 다중, 시스템코드 `APPROVED_CANCEL_APPL_STATUS_FILTERS`에서 **승인완료 후 취소를 프론트에서 제외** → 요청중 / 승인완료 / 취소 / 반려 (`hooks/.../work_for_home_appls_management/useFilterOptions.ts:30-41`)
- **컬럼** (`WorkForHomeApplsList.tsx:179-420`): 기본 컬럼 + 마감 여부 + 근무일 → **[재택근무 정보]** 상태 · **취소 상태** · 코멘트 · 신청일시 · 완료일시
- **취소 표시**: 취소 신청서는 별도 행이 아니라, 원 신청이 승인완료(900)인 행의 **"취소 상태" 컬럼**에 표시 — `TM_WORK_FOR_HOME_CANCEL_APPL` 상태 900 → "승인완료", 진행 중 → "요청중" (`be:service/workadmin/WorkForHomeApplAdminQueryService.java:63-96`). 원 신청 자체의 취소(310)·반려(300)는 상태 컬럼에 그대로
- API: `POST /time/aggr/work-for-home-appls/search` · `.../excel-download/search` (Controller:332-350)

## § 6. 연장/야간 근무(사전) 신청 탭 / § 7. 연장/야간 근무(사후) 신청 탭

- **선택 필터**: 구성원 · 회사 · 조직 · 근무 그룹 · 상태(다중) · 활성 여부 (`OvertimeRequestFilter.tsx:292-376`, `PostOvertimeRequestFilter.tsx:275-355`)
  - ~~QA L714 "기타근무 유형" 필터 — 오타 추정 [TBD]~~ → **(2026-11-05 해소)** **기타근무 유형 필터 없음**(QA 오기). "등록 방식" 필터도 없음
  - "야간근무 여부" 필터는 옵션(`includesNightWorkOptions`)·locale(`isNightWorkPlaceholder`)만 정의되고 **화면에 렌더링되지 않음** (`hooks/.../overtime_request_tab/useFilterOptions.ts:47-56`)
  - 상태 옵션 = `APPROVED_CANCEL_APPL_STATUS_FILTERS` 전체 5종 (`be:constant/CONST_TIME_CODE.java:5397-5401`)
- **컬럼** (`OvertimeRequestList.tsx:194-367`, `PostOvertimeRequestList.tsx:221-388`): 기본 컬럼 + 마감(마감/마감 전) + 근무일 → **[연장/야간 근무 정보]** 시작기준(당일/익일) · 시작시각 · 종료기준 · 종료시각 · 상태 · **야간 포함 여부** · 코멘트
  - 야간 포함 여부는 체크박스가 아니라 **"포함"/"미포함" 텍스트** (신청 데이터 값 표시. 야간 판정 22:00~06:00은 신청서 쪽 로직 — `KB:product/admin/work/group-setting.md` § "야간 시간대")
- **상태 (5종)**: 요청중 / 승인완료 / 취소 / 반려 / 승인완료 후 취소 — `CANCEL_YN='Y'` 또는 930이면 "승인완료 후 취소", 별도 취소 행 없음 (`be:service/workadmin/OvertimeApplAdminQueryService.java:29-38, 140-155`)
- API: 사전 `POST /time/aggr/ot-appls/search` · `.../excel-download/search` (Controller:282-300) / 사후 `POST /time/aggr/post-ot-appls/search` · `.../excel-download/search` (Controller:307-325)

## § 8. 휴일근무(사전) 신청 탭 / § 9. 휴일근무(사후) 신청 탭

- 사후 탭 locale(`POST_HOLIDAY_WORK_REQUEST`)은 제목·엑셀 키만 있고 나머지는 `PRE_HOLIDAY_WORK_REQUEST` 재사용
- **상태 필터**: `APPROVED_CANCEL_APPL_STATUS_FILTERS` 5종 (`HOLIDAY_WORK_APPL_STATUS_FILTERS`(CANCELING 포함)는 주석 처리, `hooks/.../holiday_work_request/useHolidayWorkRequestFilterOptions.ts:14-16`)
- **컬럼** (`PreHolidayWorkRequestTable.tsx:225-456`, 사후 동일): 기본 컬럼 + 마감 여부 + 근무일 → **[휴일근무 정보]** 시작 기준(전일/당일/익일) · 시작시각 · 종료 기준 · 종료시각 · 상태 · 코멘트 → **[신청 시점 정보]** 신청일시 · 완료일시
- **취소 표시**:
  - 사전: 원 신청 900 + `TM_HOLIDAY_WORK_CANCEL_APPL` 완료 → 원 행 상태 "승인완료 후 취소". 취소 진행 중이면 "승인완료" 유지 (`be:service/workadmin/HolidayWorkApplAdminQueryService.java:88-95, 151-171`)
  - 사후: 취소 완료 시 원 신청 `CANCEL_YN` 갱신 → 그 값으로 "승인완료 후 취소" (`:102-140`)
- API: 사전 `POST /time/aggr/holiday-work-appls/search` · `.../excel-download/search` (Controller:379-397) / 사후 `POST /time/aggr/post-holiday-work-appls/search` · `.../excel-download/search` (Controller:401-421)

## § 10. 대체근무 신청 탭

- **상태 필터**: 시스템코드 `APPL_STATUS_FILTERS` — 요청중 / 승인완료 / 취소 / 반려 (승인완료 후 취소 없음, `hooks/.../compensatory_work_request_tab/useFilterOptions.ts:14`)
- **컬럼** (`CompensatoryWorkRequestTable.tsx:173-396`): 기본 컬럼 + 마감 여부 → **[대체 근무일 정보]** 근무일 · 기존 근무 정보 → **[대체 휴일/휴무일 정보]** 휴일/휴무일 · 상태 · 코멘트 · 신청일시 · 완료일시
- 상태 매핑: `be:constant/CONST_TIME_APPLS.java:143-174` (`COMPENSATORY_APPL_STATUS_MAPPING`)
- API: `POST /time/aggr/compensatory-work-appls/search` · `.../excel-download/search` (Controller:357-375)

---

## 취소 신청서 표시 방식 (탭별 정리)

> ~~취소 신청서들 [TBD] 본 화면에서 함께 표시? 또는 별도?~~ → **(2026-11-05 해소)** 어느 탭에서도 **별도 행으로 나오지 않음**.

| 탭 | 표시 방식 |
|---|---|
| 재택근무 | 원 행의 "취소 상태" 별도 컬럼 (요청중/승인완료) |
| 연장/야간(사전·사후), 휴일근무(사전·사후) | 원 행의 상태가 "승인완료 후 취소"로 바뀜 |
| 근무계획 변경, 대체근무 | 사용자 취소(310)가 "취소"로 표시 |
| 통합 근무내역 변경, 출퇴근 내역 변경, 기타근무 | 취소 건은 조회에서 제외 |

## QA 대비 변경점 (2026-05 QA 체크리스트 → 현재 코드)

| 항목 | QA / 이전 KB | 현재 코드 |
|---|---|---|
| 탭 수 | 4탭 | 10탭 |
| 근무계획 탭 기간 디폴트 | 일별 기본 | 월별 기본 |
| 기타근무 탭 기간 | 연도별 조회 / 기간 조회 | 월별 / 일별 |
| 사전 연장·야간 필터 | 기타근무 유형 · 등록 방식 | 없음 (상태 필터만 추가) |
| 근무계획 탭 "(사용안함)" 표시 | 탭 1·3 | 코드상 확인되는 곳은 기타근무 유형 필터 옵션 |

---

## 신청서별 어드민 처리 매핑 (종합)

| 신청서 | 사용자 컴포넌트 | 어드민 조회 위치 | 결재 처리 |
|------|------|------|------|
| 출근/퇴근 요청 | 출퇴근 위젯 | 이 화면 없음 | 워크플로우 |
| 통합 근무내역 변경 | RegEdit | **이 화면 § 2** | 워크플로우 |
| 출퇴근 내역 변경 | — (**(2026-11-05)** `InoutRecordChange` — [출퇴근 내역 변경](../../user/applications/inout-record-change.md)) | **이 화면 § 3** | 워크플로우 |
| 근무계획 수립 (2026-11-05 추가) | `WorkPlanEstablishment` — [근무계획 수립](../../user/applications/work-plan-establishment.md) | **이 화면에 탭 없음** — 조회는 [개인 근무 스케줄 관리](./personal-schedule.md) 선택적 근로 스케줄 탭 | 워크플로우 |
| 근무계획 변경 | PlanEdit | **이 화면 § 1** | 워크플로우 |
| 기타근무 | OtherWorkApplications | **이 화면 § 4** (+ 어드민 수동 등록) | 워크플로우 / 수동 등록은 결재 없음 |
| 재택근무 | HomeWork | **이 화면 § 5** | 워크플로우 |
| 연장/야간 (사전/사후) | Overtime | **이 화면 § 6 / § 7** | 워크플로우 |
| 휴일근무 (사전/사후) | DayOff 등 | **이 화면 § 8 / § 9** | 워크플로우 |
| 대체근무 | CompensatoryWork | **이 화면 § 10** | 워크플로우 |
| 휴가 | Leave | 연차 관리 / 연차 외 휴가 관리 (`KB:product/admin/leave/`) | 워크플로우 |

## Cross-domain 효과

| 어드민 동작 | 다른 영역 영향 |
|------|------|
| 기타근무 수동 등록 (엑셀) | 사용자 캘린더에 `OtherWork` + `AdminDirectOtherWorkDialog` 표시 |
| 기타근무 수동 등록 삭제 | 상태 930 + 일별 집계 재계산 → 사용자 캘린더에서 제거, 누락 판정 변경 가능 |
| 신청서 조회 (10탭) | 데이터 변경 없음 |
| 엑셀 다운로드 | 감사 로그 (`TALENX-LOG-REASON`) |

## 비즈니스 룰

1. **이 화면은 조회 전용** — 승인/반려 불가. 유일한 쓰기는 기타근무 수동 등록·삭제
2. **10탭**, 휴가·출퇴근 요청만 이 화면 밖
3. **공통 필터**: 월별/일별(기본 월별) + 구성원/회사/조직/근무그룹/(상태)/활성여부
4. **회사 필터 디폴트 = 본인 회사**, 조직 필터는 하위 조직 포함
5. **미사용 기타근무 유형**: 기타근무 유형 필터 옵션에 "(사용안함)" 표시
6. **엑셀 다운로드 사유 필수** (프론트 + 백엔드 양쪽 검증)
7. **기타근무 어드민 등록분만, 마감 전인 건만 삭제 가능** — 실제로는 상태 930 처리
8. **표시 상태 종류는 탭마다 다름**: 근무계획·대체근무 4종 / 통합 근무내역·출퇴근 내역·기타근무 2종 / 재택근무 4종(+취소 상태 컬럼) / 연장·야간·휴일근무 5종
9. **취소 신청서는 별도 행 없음** — 위 "취소 신청서 표시 방식" 표

## 검증 / [TBD]

- [x] ~~이 화면에서 신청 승인/반려 처리 가능한지~~ → 불가, 조회 전용 (2026-11-05 코드)
- [x] ~~§ 4의 필터 "기타근무 유형"~~ → 없음, QA 오기
- [x] ~~§ 2가 반려/취소를 표시하지 않는 이유~~ → 백엔드 쿼리에서 제외 (의도 주석은 없음)
- [x] ~~각 탭의 정확한 테이블 컬럼 구성~~ → 탭별 § 참조
- [x] ~~재택/대체/사전휴일근무 어드민 처리 위치~~ → 이 화면 § 5 / § 10 / § 8 (조회), 결재는 워크플로우
- [x] ~~출근/퇴근 요청 어드민 처리 흐름~~ → 이 화면 없음, 워크플로우 처리
- [ ] 통합 근무내역·출퇴근 내역 변경 탭에서 반려/취소를 제외한 것이 기획 의도인지 (코드 주석 없음) — (2026-11-05 Slack 검색: 부분) 탭 신설 당시 목적은 "출퇴근 내역(근무 데이터 관리)은 승인된 확정 변경건만 나오므로 **요청중까지** 보려는 것"([그룹 DM 2026-03-10](https://hcgtheplus.slack.com/archives/C0972K4H86Q/p1773122249004409)). 반려·취소 제외를 정한 결정은 없음. 출퇴근 내역 변경 1차 QA에서도 "반려/취소"는 미확인 항목으로 남음([#sq-time 2026-10-07](https://hcgtheplus.slack.com/archives/C04QC2RJJBU/p1791375200514449?thread_ts=1791372323.280559&cid=C04QC2RJJBU))
- [x] ~~어드민 등록 기타근무가 사용자 캘린더 `OtherWork`에서 사용자 신청분과 시각적으로 어떻게 구분되는지~~ → **(2026-11-05 Slack 확인)** 사용자 화면 3곳(내 근무 캘린더 · 근무내역 상세 · 구성원 근무 현황) 응답에 등록 방식(신청/직접 등록) 구분값을 추가해, **직접 등록 건을 열면 어드민 전용 안내 다이얼로그**("관리자에 의해 등록" + 등록 사유, 사유가 없으면 미표시)를 띄우는 방식으로 구분. 캘린더 표시 자체(색·아이콘)를 달리하는 결정은 없음 — Slack #sq-time 2026-02-26~03 "(#054) 기타근무 수동 등록" 스레드 (https://hcgtheplus.slack.com/archives/C04QC2RJJBU/p1772065269988409)
- [ ] (2026-11-05 Slack 신규) **출근/퇴근 요청은 이 화면 어느 탭에도 나오지 않음** — CS 사례에서 어드민 편집이 "요청 중" 차단됐는데 통합 근무내역 변경 탭에 데이터가 없어 혼선. "출근/퇴근 신청 내역 탭 고도화"를 로드맵 과제로 등록하기로 함([#channeltalk 2026-11-03](https://hcgtheplus.slack.com/archives/C06ULEEM88M/p1793670910494619?thread_ts=1793668630.185329&cid=C06ULEEM88M))

## 관련 문서

- `KB:product/user/applications/overview.md` — 사용자 신청서 공통
- `KB:product/user/applications/plan-change.md` / `reg-adjust.md` / `other-work.md` / `remote-work.md` / `overtime.md` / `holiday-work.md` / `compensatory-work.md` — 각 탭의 짝 신청서
- **(2026-11-05)** `KB:product/user/applications/inout-record-change.md`(§ 3 탭) / `overtime-post.md`(§ 7) / `holiday-work-post.md`(§ 9) — 각 탭의 짝 신청서. `KB:product/user/applications/work-plan-establishment.md` — 근무계획 수립은 이 화면에 탭 없음
- `KB:product/admin/leave/annual-management.md` — 휴가의 어드민 처리 (이 화면 밖)
- `KB:product/admin/work/check-work-data.md` — 출퇴근내역 직접 편집, 어드민 등록 기타근무 다이얼로그
- `KB:product/admin/work/close-work-data.md` — 마감일 수동 등록·삭제 제약
- `KB:product/admin/work/group-setting.md` — 야간 시간 22-06 고정
- `KB:product/user/attendance/my-work.md` — 어드민 등록 기타근무의 사용자 캘린더 표시
