---
sidebar:
  order: 4
---

# 근무 데이터 관리

> **메뉴** 근무관리 › 근무 › 근무 데이터 관리  
> **URL** `/attendance/work/check_work_data`  
> **탭** 전사 근무현황 · 출퇴근 내역  
> **원본** `product/_legacy/admin-work-data.md`

## 개요

어드민이 사용자의 출퇴근 결과를 **조회 / 수정 / 삭제 / 엑셀 다운로드**하는 핵심 화면. 2개 탭 구조:

1. **전사 근무현황** — 일별/월별 집계 데이터 조회 + 엑셀
2. **출퇴근내역** — 출퇴근 원본 기록 조회 + **어드민이 직접 기록 생성·수정·삭제**

사용자가 출퇴근 위젯에서 만든 데이터가 → 백엔드 집계 → 이 화면으로 흐름. **3개 레포가 데이터 흐름으로 연결**되는 가장 중요한 영역.

## 진입 위치

- 어드민 메뉴: 근무관리 > 근무 데이터 관리
- URL: `/attendance/work/check_work_data`

## QA 체크리스트

`talenx-admin/.claude/qa-checklist/attendance.md` **L548 ~ L643** (95줄)

2개 서브 섹션:
1. 전사 근무현황 (L550–570) + 시간 정의 (확정/합산/인정)
2. 출퇴근내역 (L571–643) — 관리자 출퇴근 기록 생성/삭제/조회 + 사용자 관점 영향 테스트

## 코드 위치

### Admin 프론트 (`ad:src/`)

```
pages/attendance/work/check_work_data/         ← 페이지 진입점

components/attendance/work/check_work_data/
├── index.tsx                                  ← 2탭 컨테이너
└── contents/
    ├── all_employee_work_status_tab/          ← 전사 근무현황 탭
    │   ├── index.tsx
    │   └── contents/
    │       ├── Filter.tsx
    │       ├── WorkStatusList.tsx
    │       └── TableFilterContextProvider.tsx
    └── inout_records_tab/                     ← 출퇴근내역 탭
        ├── index.tsx
        └── contents/
            ├── Filter.tsx
            ├── InoutRecordsList.tsx
            ├── InoutRecordEditDialog.tsx      ⭐ 관리자 직접 편집 다이얼로그
            └── TableFilterContextProvider.tsx

hooks/attendance/work/check_work_data/
├── all_employee_work_status_tab/
│   ├── useFilterOptions.ts
│   ├── useExcelDownload.ts
│   └── useControlTableFilter.ts
└── inout_records_tab/
    ├── useFilterOptions.ts
    ├── useInoutRecordsExcelDownload.tsx
    └── useControlTableFilter.ts

config/api/attendance/
├── checkWorkData.ts                           ← 전사 근무현황 API 클라이언트
└── inoutRecords.ts                            ← 출퇴근내역 API 클라이언트
```

### 백엔드 (`be:com/hcg/optimiz/time/`)

**Main controller**: `controller/workadmin/WorkResultManagementController.java` — 이 화면의 거의 모든 엔드포인트

**Aggregation services** (집계 처리 — admin 화면 데이터의 원천):
- `service/aggregate/DailyAggregationService.java`
- `service/aggregate/DailyAggregationEventService.java` (이벤트 기반 집계 — 출퇴근 발생 시)
- `service/aggregate/MonthlyAggregationService.java`
- `service/aggregate/SyncMonthlyAggregationService.java`
- `service/aggregate/AggregationListener.java`
- `service/batch/TimeAggrBatchJob.java`

**Manual aggregation** (어드민 수동 트리거): `controller/aggregation/ManualAggregationController.java`
- `PUT /time/aggr/manual-aggr/daily` — 수동 일근무집계
- `PUT /time/aggr/manual-aggr/daily/bulk` — 수동 일근무집계 대량
- `PUT /time/aggr/manual-aggr/monthly` — 수동 월근무집계

### ppfront 연결 (`pp:src/`)

이 화면의 데이터가 사용자 측에 미치는 영향 (상세는 § "3-레포 데이터 흐름" 참고):

- `pp:src/@types/customTypes/attendance/empDailyWorkDto.d.ts:371` — `hasModifiedWorkRecord: boolean` 정의
- `pp:src/components/main/work_commute/contents/CommuteButton.tsx:100` — `hasModifiedWorkRecord` 체크 후 "근무 내역 변경" 버튼 전환
- `pp:src/components/attendance/shared/admin_direct_dialog/AdminDirectOtherWorkDialog.tsx:154` — `ADMIN_DIRECT_OTHER_WORK.registeredByAdmin` 메시지 표시 ("관리자에 의해 등록되었습니다")
- `pp:src/locales/ko/attendance.json` — `registeredByAdmin: "해당 근무는 별도의 신청/승인 과정 없이 관리자에 의해 등록되었습니다."`

## 백엔드 API 엔드포인트

`be:controller/workadmin/WorkResultManagementController.java` + `controller/aggregation/ManualAggregationController.java`

### 전사 근무현황 탭

| Method | Path | 용도 | 어드민 함수 |
|--------|------|------|------|
| POST | `/time/aggr/daily/search` ⭐ | 일별 근무 결과 조회 | `loadWorkData` |
| POST | `/time/aggr/monthly/search` ⭐ | 월별 근무 결과 조회 | `loadMonthlyWorkData` |
| POST | `/time/aggr/daily/excel-download/search` | 일별 엑셀 (필터 적용) | `downloadWorkDataForExcel` |
| POST | `/time/aggr/daily/excel-download/all/search` | 일별 엑셀 (전체) | 어드민·ppfront 프론트 어디서도 호출하지 않음 (2026-11-05 `git grep` 확인). 서버 엔드포인트만 존재 |
| POST | `/time/aggr/monthly/excel-download/search` | 월별 엑셀 (필터 적용) | `downloadMonthlyWorkDataForExcel` |
| GET | `/time/work-grps/combo` | 필터 콤보용 근무그룹 | (필터 옵션 훅) |

### 출퇴근내역 탭

| Method | Path | 용도 | 어드민 함수 |
|--------|------|------|------|
| POST | `/time/aggr/inout-records/search` | 출퇴근 내역 조회 | `searchInputRecords` (오타: should be `searchInoutRecords`) |
| POST | `/time/aggr/inout-records` ⭐ | **관리자 직접 출퇴근 기록 생성/수정** | `postInoutRecords` |
| GET | `/time/aggr/inout-records/valid-date` ⭐ | 편집 가능 여부 확인 (충돌 체크) | `validateInoutDate` |
| POST | `/time/aggr/inout-records/excel-download/search` | 출퇴근 엑셀 다운로드 | `postInoutRecordsExcelDownload` |

### 수동 집계 (관리자 트리거)

| Method | Path | 용도 |
|--------|------|------|
| PUT | `/time/aggr/manual-aggr/daily` | 수동 일근무집계 (단건) |
| PUT | `/time/aggr/manual-aggr/daily/bulk` | 수동 일근무집계 대량 |
| PUT | `/time/aggr/manual-aggr/monthly` | 수동 월근무집계 |

> 자동 집계는 백엔드에서 이벤트 기반(`DailyAggregationEventService`) + 스케줄러(`TimeAggrBatchJob`)로 실행. 수동 트리거는 어드민이 즉시 집계가 필요할 때 사용.

### 관련 DB 테이블

**원본 기록 (사용자 출퇴근 위젯이 만듦)**:
- `TM_INOUT_REG` — 출퇴근 raw 기록
- `TM_INOUT_REG_ADJST_DTL` — **어드민 보정 상세** (어드민이 수정/삭제 시 기록)
- `TM_REST_REG` — 휴식(자리비움) raw 기록
- `TM_REST_REG_ADJST_DTL` — 휴식 보정 상세

**집계 결과 (이 화면이 보는 것)**:
- `TM_DD_ATTEND_AGGR` — 일별 근태 집계 ⭐
- `TM_DD_ATTEND_AGGR_LOG` — 일별 근태 집계 로그
- `TM_DD_ATTEND_AGGR_RSLT` — 일별 근태 집계 결과
- `TM_DD_WORK_AGGR` — 일별 근무 집계
- `TM_MM_ATTEND_AGGR` / `_LOG` / `_RSLT` — 월별 근태 집계
- `TM_MM_WORK_AGGR` — 월별 근무 집계
- `TM_PERIOD_ATTEND_AGGR` / `_WORK_AGGR` — 기간 집계

## 3-레포 데이터 흐름 ⭐

이 영역의 가장 중요한 부분. 데이터가 사용자 → 백엔드 → 어드민 → 다시 사용자로 흐릅니다.

```
[사용자 ppfront 출퇴근 위젯]
   ↓ goToWork / finishWork / pauseWork / resumeWork
[optimiz-time 백엔드]
   ↓ TM_INOUT_REG / TM_REST_REG에 raw 기록 저장
   ↓ DailyAggregationEventService (이벤트 발화)
   ↓ TM_DD_ATTEND_AGGR / TM_DD_WORK_AGGR 집계
[talenx-admin 근무 데이터 관리]
   ← POST /time/aggr/daily/search (전사 근무현황)
   ← POST /time/aggr/inout-records/search (출퇴근내역)
   
[어드민이 직접 수정 시]
   ↓ POST /time/aggr/inout-records (InoutRecordEditDialog)
   ↓ TM_INOUT_REG_ADJST_DTL에 보정 기록 추가
   ↓ 재집계
   ↓ EmpDailyWork.hasModifiedWorkRecord = true 설정
[사용자 ppfront]
   ← getDayWorkInfo 응답에 hasModifiedWorkRecord: true
   ← CommuteButton: 출퇴근 버튼 → "근무 내역 변경" 버튼으로 전환
   ← 근무내역 변경 신청 시도 시 → ~~"관리자에 의해 수정된 내역이 있어 신청할 수 없습니다"~~ → **(2026-11-05 원문)** "해당 일자의 근무내역은 어드민이 수정 및 확정하였습니다." (경고 + [요청] 비활성, `pp:RegEdit.tsx:1201-1205`)
```

### Cross-domain 핵심 포인트

| 어드민 동작 | 사용자 화면 영향 |
|------|------|
| 출퇴근내역 직접 생성 | 사용자 캘린더에 해당 기록 표시 + `registeredByAdmin` 메시지 |
| 출퇴근내역 직접 수정 | `hasModifiedWorkRecord = true` → 출퇴근 위젯 "근무 내역 변경" 버튼 노출 |
| 출퇴근내역 삭제 (무효화) | 사용자 화면에 "누락"으로 표시 (실제 row 삭제 X) |
| 어드민 수정 후 사용자가 변경 신청 시도 | 차단: ~~"관리자에 의해 수정된 내역이 있어 신청할 수 없습니다"~~ → **(2026-11-05 원문)** "해당 일자의 근무내역은 어드민이 수정 및 확정하였습니다." (경고 + [요청] 비활성, `pp:RegEdit.tsx:1201-1205`) |
| 수동 일/월 집계 실행 | 사용자의 근무 요약 정보 위젯, 내 근무 화면 데이터 재계산 |

## 핵심 동작 — 탭 1: 전사 근무현황

### 필터

| 필터 | 일별 | 월별 |
|------|------|------|
| 구성원 | ✅ | ✅ |
| 회사 | ✅ | ✅ |
| 조직 | ✅ | ✅ |
| 근무 구분 (`workYmdTypeList`) — 옵션 "근무일" / "휴무일" / "휴일" | ✅ | ❌ |
| 근무 그룹 | ✅ | ✅ |
| 활성 여부 | ✅ | ✅ |

**디폴트**: 일별 = 이번 달 1일 ~ 오늘, 월별 = "조회 월" 이번 달. [필터 재설정] 클릭 시 모든 옵션 초기화 + 라디오는 일별로 전환. 라디오 라벨 "일별 근무기록" / "월별 근무기록".

**조회 제약** (2026-11-05, `ad:.../all_employee_work_status_tab/contents/Filter.tsx:405-424`):
- 기간 미입력 → "조회 실패" / "조회 기간을 설정해주세요."
- 일별 조회 기간이 시작~종료 차이 61일 이상 → "조회 실패" / "조회 기간은 60일 이내로 해주십시오."

### 컬럼 그룹 (항목 설정 단위) ✅ (2026-11-05, `WorkStatusList.tsx:105-360`, locale `workData.columnHeader`/`monthlyGroup`)

- **일별**: 기본 정보(No·사번·이름·회사·조직·직급·활성 여부·근무그룹·마감여부·날짜) · 근무 계획(근무계획명·구분·출근·퇴근) · 연장/야간/휴일근무 승인 시간(시작 시각·종료 시각·승인 시간) · 확정 출퇴근 시간(출근·출근 인정 시각·퇴근) · 지각/조퇴 · 근무 외 시간(총 근무 외 시간·휴게 시간·자리비움 시간·기타 근무 외 시간) · 확정 근무 시간(총 근무 시간·기본 근무 시간·연장 근무 시간·야간 근무 시간) · 휴가 정보(휴가 사용시간(근무)·휴가 사용시간(근무 미인정)) · 기타근무(근무) · 합산 근무 시간(기본 숨김) · 인정 근무시간
- **월별**: 기본 정보 · 근무 계획 · 승인 추가 근무시간 · 지각/조퇴 · 확정 근무 시간 (근무일/휴무일/휴일) · 휴가 정보 · 기타근무(근무) · 합산 근무 시간(근무일/휴무일/휴일, 기본 숨김) · 인정 근무시간 · 잔여근무

### 시간 정의 3종 (가장 중요한 비즈니스 룰)

QA L565–569:

| 종류 | 정의 | 산출 |
|------|------|------|
| **확정 근무시간** | 출퇴근 기록으로 계산된 유효 근무시간 | 출퇴근만 |
| **합산 근무시간** | 확정근무 + 근무인정 기타근무 − 휴가 (중복 구간 제외) | 출퇴근 + 기타근무 − 휴가 |
| **인정 근무시간** | 확정근무 + 근무인정 기타근무 + 근무인정 휴가 (중복 구간 제외) | 출퇴근 + 기타근무 + 휴가 |

**근무시간 산정 우선순위: 휴가 > 기타근무 > 출퇴근**
- 같은 시간대에 휴가와 출퇴근이 겹치면 휴가가 우선 인정
- 휴가와 기타근무가 겹치면 휴가 우선
- 기타근무와 출퇴근이 겹치면 기타근무 우선

> 백엔드 계산 위치: `be:service/aggregate/DailyAggregationService.java` [TBD] 정확한 우선순위 적용 로직 라인

### 출근 인정 시각 컬럼 (일별만)

설정된 출근 인정 시각이 컬럼에 노출. 인정 시각 이전 출근은 근무시간 미인정 (출퇴근 위젯 § 6 참조).

### 항목 설정 / 엑셀 다운로드

- **항목 설정** ([항목 설정] 버튼): 테이블에 표시할 컬럼 선택. **엑셀 다운로드 시에는 모든 항목 조회** (항목 설정 무시)
- **엑셀 다운로드**: 사유 입력 모달(공용 `ExcelDownloadReasonDialog` — 사유가 비어 있으면 [확인] 비활성) → 사유는 `TALENX-LOG-REASON` 키로 body에 담겨 백엔드 감사 로그용
- 다운로드 엔드포인트: `/time/aggr/daily|monthly/excel-download/search`

## 핵심 동작 — 탭 2: 출퇴근내역

### 어드민 직접 출퇴근 기록 (가장 복잡한 흐름)

**컴포넌트**: `ad:src/components/attendance/work/check_work_data/contents/inout_records_tab/contents/InoutRecordEditDialog.tsx`

#### 시나리오 1: 신규 기록 생성 (QA L577–584)

1. 특정 직원의 과거 날짜 선택
2. 출근/퇴근/자리비움 기록 입력 + **등록 사유** 작성
3. 저장 → `POST /time/aggr/inout-records`
4. 백엔드: `TM_INOUT_REG_ADJST_DTL`에 보정 기록 추가 → 재집계 → 사용자 측에 반영

**편집 창 구성** ✅ (2026-11-05, `InoutRecordEditDialog.tsx`, locale `workData.inoutRecords`): 제목 "통합 근무내역 변경" · "변경 대상"(구성원 검색) · "근무일"(날짜 선택) · "출퇴근 시간"(출퇴근 1, 2 … 시작시각/종료시각 + 당일/익일) · "자리비움" · "등록 사유"(선택 입력, 필수 아님) · "적용일"(오늘, 수정 불가) · [취소]/[적용]
- 근무일은 오늘 이전만: "근무일은 현재 날짜 이전으로만 선택할 수 있습니다."
- 적용 시 확인창 "통합 근무내역 변경 확인" / "{이름}님의 통합 근무내역을 변경합니다. (적용일 : YYYY.MM.DD)" → 완료 스낵바 "통합 근무내역 변경을 완료하였습니다."

#### 시나리오 2: 충돌 케이스 (QA L585–591) ⭐ ✅ (2026-11-05 해소)

구성원·근무일을 고르면 `GET /time/aggr/inout-records/valid-date` 호출 (`be:service/workadmin/InoutDataAdminService.getValidDate:785`):

| 순서 | 판정 | 화면 처리 (근무일 아래 빨간 안내 + [적용] 비활성) |
|---|---|---|
| 1 | 해당 일자 근무 마감 (`isClosed`) — 마감이면 여기서 바로 반환 | "선택한 일자의 근무가 마감되어 통합 근무내역을 변경할 수 없습니다." |
| 2 | 해당 일자에 **출근 신청 / 퇴근 신청 / 통합 근무내역 변경 신청** 중 상태가 결재중 또는 수신처 처리중인 것이 있음 (`applicationTypeInProgress`) | "동일한 일자에 요청 중인 통합 근무내역 변경 신청이 있어, 통합 근무내역을 변경할 수 없습니다." |

- 저장 시도 전 UI 단계에서 막힘(에러 팝업이 아니라 버튼 비활성). 출퇴근 내역 변경 신청 등 다른 신청서는 검사 대상 아님
- 기록 불러오기 우선순위: 어드민 변경 기록 → 사용자 근무내역 변경(완료) 기록 → 실제 출퇴근 기록. 어드민이 이미 삭제(clear)한 날이면 빈 목록
- 비활성·삭제 조직 소속 구성원은 목록엔 보이지만 편집은 "요청 대상 구성원을 확인할 수 없습니다."로 차단 (의도된 정책, 코드 주석)

#### 시나리오 3: 초과근무 유효성 검증 (QA L593–597)

- 직원의 잔여 연장근무 시간 초과하는 기록 입력 시 → 저장 실패
- ~~"연장근무 가능 시간을 초과했습니다"~~ → **(2026-11-05 정정)** 실제 서버 메시지는 초과한 제한 단위별로: "일 단위 초과근무 제한시간을 초과합니다" / "주 단위 초과근무 제한시간을 초과합니다" / "월 단위 초과근무 제한시간을 초과합니다" / "월(휴일) 단위 초과근무 제한시간을 초과합니다" (`be:service/overtime/RemainingOvertime.java:178-220`, 호출 `InoutDataAdminService.validateOvertimeLimit`)

### 어드민 직접 출퇴근 기록 삭제 (QA L599–612)

**중요**: 실제 row 삭제가 아니라 **무효화 기록 생성** → "누락"으로 간주

- 시나리오 1: 사용자 근무내역 삭제
  - 어드민 근무 내역 변경 → 계정/날짜 선택 → 출퇴근 내역 조회
  - **삭제 버튼 활성화 조건** 있음 (다음 시나리오 참고)
  - 삭제 → 메시지 확인 → 적용 → 보정 기록 생성
- 시나리오 2: 근무 내역 없는 날의 첫 내역 삭제 불가
  - 출퇴근 기록이 없는 날을 열면 "해당 날짜의 근무내역 존재하지 않습니다." / "(근무 내역 누락 상태)" 안내 + 빈 '출퇴근 1' 행
  - 이때 '출퇴근 1' 삭제 버튼 → **비활성화**, 툴팁 "출퇴근 내역이 없는 날짜이므로 근무 내역 삭제가 불가합니다" (`InoutRecordEditDialog.tsx:662-676`, 조건 `idx === 0 && hasNoInoutRecordDay`)
  - '출퇴근 2' 추가 후 → 그 행은 삭제 가능
  - 기록이 있는 날은 '출퇴근 1'도 삭제 가능(툴팁 "근무 내역 삭제") — "첫 기록은 항상 삭제 불가"가 아님

### 조회 및 다운로드 (QA L613–627)

- 조회: `POST /time/aggr/inout-records/search`
  - "일별 근무기록"/"월별 근무기록" 라디오 + 필터: 조회 기간(또는 조회 월) · 구성원 · 회사 · 조직 · 근무 그룹 · 등록 방식 · 상태 구분 · 활성 여부
  - 서버 조회 기간 제한 31일: "조회 기간은 최대 31일 이내여야 합니다." (`be:InoutDataAdminService.java:411`)
- **등록 방식** 값 ✅ (2026-11-05, `InoutRecordsList.tsx:223-235`): "출퇴근 기록" / "외부 시스템 연동" / "통합 근무내역 변경 신청" / "출퇴근 내역 변경 신청" / "어드민 변경"
- **상태 구분** 값: "근무" / "자리비움"
- 컬럼: No · 사번 · 이름 · 회사 · 조직 · 직급 · 퇴사 여부 · 활성 여부 · 근무그룹 · 마감여부 · 근무일 · 구분 · 시작시각(당일/익일) · 시작시각 · 종료시각(당일/익일) · 종료시각 · 등록 방식 · 등록 사유 · 출근지(주소) · 퇴근지(주소)
- 엑셀 다운로드: `POST /time/aggr/inout-records/excel-download/search` — **사유 입력 모달 필수**(모달 제목 "일별 출퇴근 내역 엑셀 다운로드"/"월별 출퇴근 내역 엑셀 다운로드"), 사유는 body `TALENX-LOG-REASON`. 위치 정보 포함 옵션(`includeLocationInfo`) 사용 시 조회 기록이 남음("위치 정보 조회 시 기록이 저장되며, 조회 대상자가 확인 가능합니다.")

## 사용자 관점 검증 시나리오 (QA L629–643)

어드민 수정 → 사용자 측 영향:

| 사용자 동작 | 예상 동작 |
|------|------|
| 자신의 캘린더 / 근무 기록 페이지 확인 | 관리자가 수정한 내용 정상 표시 |
| 어드민 수정된 날짜에 근무내역 변경 신청 시도 | ~~"관리자에 의해 수정된 내역이 있어 신청할 수 없습니다"~~ → **(2026-11-05 원문)** "해당 일자의 근무내역은 어드민이 수정 및 확정하였습니다." (경고 + [요청] 비활성, `pp:RegEdit.tsx:1201-1205`) 안내 + 신청 차단 |

→ 출퇴근 위젯 측 `hasModifiedWorkRecord` flag로 검증됨

## 비즈니스 룰 정리

1. **근무시간 산정 우선순위**: 휴가 > 기타근무 > 출퇴근 (중복 구간 제외 시 적용)
2. **3종 시간 종류**: 확정 / 합산 / 인정 — 의미 다름, 화면 컬럼 구분 필요
3. **어드민 직접 기록 = 보정 추가**: 실제 raw 데이터 삭제 X. `TM_INOUT_REG_ADJST_DTL`에 보정 기록 추가
4. **삭제 불가 케이스**: 근무 내역이 없는 날의 첫 항목 (`출퇴근1`)은 삭제 불가 (기록 있는 날은 가능)
5. **편집 차단 케이스**: (a) 해당 날짜가 마감됨 (b) 출근/퇴근/통합 근무내역 변경 신청이 결재중·수신처 처리중 — [적용] 버튼 비활성 + 안내문
6. **편집 후 차단 케이스**: 어드민이 수정한 날짜에 대해 사용자가 근무내역 변경 신청 시도 시 차단
7. **잔여 연장근무 시간 초과 시 저장 실패**: 어드민도 그룹 룰을 우회 불가
8. **엑셀 다운로드 사유 필수**: 전사 근무현황(일/월)·출퇴근 내역(일/월) 모두. 감사 로그 목적. (편집 창의 "등록 사유"는 필수 아님)
9. **조회 기간 제한**: 전사 근무현황 일별 60일, 출퇴근 내역 31일(서버)

## 알려진 제약 / 임시 동작

- 어드민 함수명 `searchInputRecords`는 오타로 보임 (`searchInoutRecords`가 맞을 듯). 코드 정리 대기
- 일별 엑셀 `excel-download/all/search`는 서버에만 있고 프론트 미사용 (2026-11-05)

## 검증 / [TBD]

- [x] ~~화면 컬럼 구성~~ → § "컬럼 그룹" (2026-11-05). 응답 DTO 필드 매핑 자체는 미정리
- [ ] `InoutRecordsAdjustmentPayload` 구조 — 어드민 편집 시 어떤 필드를 보내는지 (`TM_INOUT_REG_ADJST_DTL`의 컬럼과 매핑)
- [x] ~~`validateInoutDate` 응답 구조~~ → `isClosed`, `applicationTypeInProgress`(IN/OUT/WORK_RECORD_CHANGE), `isWorkRecordCleared`, `inoutRecords`, `restRecords` (2026-11-05)
- [x] ~~all 변형 엑셀 용도~~ → 프론트 미사용 (2026-11-05)
- [x] ~~근무 구분 옵션~~ → 근무일/휴무일/휴일 (2026-11-05)
- [x] ~~등록 방식 코드 체계~~ → WORK_RECORD/EXTERNAL_RECORD/WORK_RECORD_ADJUSTMENT/INOUT_RECORD_ADJUSTMENT/ADMIN_ADJUSTMENT (2026-11-05)
- [ ] `DailyAggregationService`의 우선순위(휴가 > 기타근무 > 출퇴근) 적용 로직 정확한 위치
- [x] ~~첫 출퇴근 보호 룰 코드 위치~~ → `ad:InoutRecordEditDialog.tsx:676` (프론트 전용, 2026-11-05)
- [ ] 어드민이 직접 등록한 기타근무 — `pp:src/components/attendance/shared/admin_direct_dialog/AdminDirectOtherWorkDialog.tsx`가 사용자 측에 별도 다이얼로그를 띄움. 이 흐름의 전체 정리는 [기타근무] 영역에서 별도 deep-dive 필요 — (2026-11-05 Slack 확인, 부분) 사용자 화면 3곳(내 근무 캘린더 · 근무내역 상세 · 구성원 근무 현황)에서 등록 방식이 직접 등록이면 어드민 전용 다이얼로그 + 등록 사유 표시(사유 없으면 미표시). 어드민 삭제 시 사용자 화면 반영 누락 버그가 있었고 2026-09-09 수정(optimiz-time#1696). Slack #sq-time (#054) (https://hcgtheplus.slack.com/archives/C04QC2RJJBU/p1772065269988409), #cx 2026-09-09
- [ ] (2026-11-05 Slack 신규) 진행 중 신청 차단 문구가 "통합 근무내역 변경 신청"으로 고정 — 실제 CS 사례(2026-11-03)에서 진행 중인 건이 **출근 요청**이었는데 근무 신청 내역 관리의 통합 근무내역 변경 탭에서 찾지 못해 혼선. 문구 분리 계획은 Slack에 없음, 대신 "출근/퇴근 신청 내역 탭 고도화" 과제 등록 예정 — Slack #channeltalk 2026-11-03 (https://hcgtheplus.slack.com/archives/C06ULEEM88M/p1793670910494619?thread_ts=1793668630.185329&cid=C06ULEEM88M)

## 관련 문서

- `KB:product/user/home/checkin-widget.md` — 사용자 측 데이터 생성. `hasModifiedWorkRecord` 분기 처리
- `KB:product/admin/work/group-setting.md` — 그룹별 룰(연장/야간/휴일/근무시간 인정)이 집계에 영향
- `KB:domain/business-rules.md` — § 1 근무시간 인정 로직 (확정/합산/인정 시간 정의)
- `KB:code/backend-tables.md` — `TM_DD_*_AGGR`, `TM_INOUT_REG*`, `TM_MM_*_AGGR` 테이블 정리
