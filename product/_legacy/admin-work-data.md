# 근무 데이터 관리 (어드민)

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
| POST | `/time/aggr/daily/excel-download/all/search` | 일별 엑셀 (전체) | [TBD] 어디서 사용? |
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
   ← 근무내역 변경 신청 시도 시 → "관리자에 의해 수정된 내역이 있어 신청할 수 없습니다"
```

### Cross-domain 핵심 포인트

| 어드민 동작 | 사용자 화면 영향 |
|------|------|
| 출퇴근내역 직접 생성 | 사용자 캘린더에 해당 기록 표시 + `registeredByAdmin` 메시지 |
| 출퇴근내역 직접 수정 | `hasModifiedWorkRecord = true` → 출퇴근 위젯 "근무 내역 변경" 버튼 노출 |
| 출퇴근내역 삭제 (무효화) | 사용자 화면에 "누락"으로 표시 (실제 row 삭제 X) |
| 어드민 수정 후 사용자가 변경 신청 시도 | 차단: "관리자에 의해 수정된 내역이 있어 신청할 수 없습니다" |
| 수동 일/월 집계 실행 | 사용자의 근무 요약 정보 위젯, 내 근무 화면 데이터 재계산 |

## 핵심 동작 — 탭 1: 전사 근무현황

### 필터

| 필터 | 일별 | 월별 |
|------|------|------|
| 구성원 | ✅ | ✅ |
| 회사 | ✅ | ✅ |
| 조직 | ✅ | ✅ |
| 근무 구분 (`workYmdTypeList`) | ✅ | ❌ |
| 근무 그룹 | ✅ | ✅ |
| 활성 여부 | ✅ | ✅ |

**디폴트**: 이번 달 기간 입력됨. [필터 재설정] 클릭 시 모든 옵션 초기화 + 라디오는 일별로 전환.

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
- **엑셀 다운로드**: 사유 입력 모달 → 미입력 시 다운로드 불가. 사유는 `TALENX-LOG-REASON` 헤더 (실제로는 body)에 담겨 백엔드 감사 로그용
- 다운로드 엔드포인트: `/time/aggr/daily|monthly/excel-download/search`

## 핵심 동작 — 탭 2: 출퇴근내역

### 어드민 직접 출퇴근 기록 (가장 복잡한 흐름)

**컴포넌트**: `ad:src/components/attendance/work/check_work_data/contents/inout_records_tab/contents/InoutRecordEditDialog.tsx`

#### 시나리오 1: 신규 기록 생성 (QA L577–584)

1. 특정 직원의 과거 날짜 선택
2. 출근/퇴근/자리비움 기록 입력 + **등록 사유** 작성
3. 저장 → `POST /time/aggr/inout-records`
4. 백엔드: `TM_INOUT_REG_ADJST_DTL`에 보정 기록 추가 → 재집계 → 사용자 측에 반영

#### 시나리오 2: 충돌 케이스 (QA L585–591) ⭐

직원이 결재중인 날짜 또는 마감된 날짜:
- 편집 시도 시 `GET /time/aggr/inout-records/valid-date?memberId=X&workYmd=YYYYMMDD` 호출
- 응답에 "진행 중인 신청서 있음" 또는 "근무가 마감됨" 표시
- → **기록 생성/수정 UI 비활성화** 또는 저장 시도 시 에러 메시지

#### 시나리오 3: 초과근무 유효성 검증 (QA L593–597)

- 직원의 잔여 연장근무 시간 초과하는 기록 입력 시
- → **"연장근무 가능 시간을 초과했습니다"** 에러 → 저장 실패

### 어드민 직접 출퇴근 기록 삭제 (QA L599–612)

**중요**: 실제 row 삭제가 아니라 **무효화 기록 생성** → "누락"으로 간주

- 시나리오 1: 사용자 근무내역 삭제
  - 어드민 근무 내역 변경 → 계정/날짜 선택 → 출퇴근 내역 조회
  - **삭제 버튼 활성화 조건** 있음 (다음 시나리오 참고)
  - 삭제 → 메시지 확인 → 적용 → 보정 기록 생성
- 시나리오 2: 근무 내역 없는 날의 첫 내역 삭제 불가
  - `'출퇴근1'` 항목의 삭제 버튼 → **비활성화** (첫 기록은 삭제 불가)
  - `'출퇴근2'` 추가 후 → 삭제 버튼 활성화
  - 의미: 적어도 1개 기록은 남겨야 함 (완전 삭제 방지)

### 조회 및 다운로드 (QA L613–627)

- 조회: `POST /time/aggr/inout-records/search` (기간/근무그룹/직원 등 필터)
- **등록 방식 컬럼**에 "어드민 변경" 표시 (어드민이 만든 기록 구분)
- 엑셀 다운로드: `POST /time/aggr/inout-records/excel-download/search`

## 사용자 관점 검증 시나리오 (QA L629–643)

어드민 수정 → 사용자 측 영향:

| 사용자 동작 | 예상 동작 |
|------|------|
| 자신의 캘린더 / 근무 기록 페이지 확인 | 관리자가 수정한 내용 정상 표시 |
| 어드민 수정된 날짜에 근무내역 변경 신청 시도 | **"관리자에 의해 수정된 내역이 있어 신청할 수 없습니다"** 안내 + 신청 차단 |

→ 출퇴근 위젯 측 `hasModifiedWorkRecord` flag로 검증됨

## 비즈니스 룰 정리

1. **근무시간 산정 우선순위**: 휴가 > 기타근무 > 출퇴근 (중복 구간 제외 시 적용)
2. **3종 시간 종류**: 확정 / 합산 / 인정 — 의미 다름, 화면 컬럼 구분 필요
3. **어드민 직접 기록 = 보정 추가**: 실제 raw 데이터 삭제 X. `TM_INOUT_REG_ADJST_DTL`에 보정 기록 추가
4. **삭제 불가 케이스**: 근무 내역이 없는 날의 첫 항목 (`출퇴근1`)은 삭제 불가
5. **편집 차단 케이스**: (a) 결재중인 신청서가 해당 날짜에 있음 (b) 해당 날짜가 마감됨
6. **편집 후 차단 케이스**: 어드민이 수정한 날짜에 대해 사용자가 근무내역 변경 신청 시도 시 차단
7. **잔여 연장근무 시간 초과 시 저장 실패**: 어드민도 그룹 룰을 우회 불가
8. **엑셀 다운로드 사유 필수**: 감사 로그 목적

## 알려진 제약 / 임시 동작

- 어드민 함수명 `searchInputRecords`는 오타로 보임 (`searchInoutRecords`가 맞을 듯). 코드 정리 대기
- 일별 엑셀 다운로드는 두 엔드포인트(`excel-download/search` vs `excel-download/all/search`) — 사용 분기 [TBD]

## 검증 / [TBD]

- [ ] `TimeDailyAggrResultDto` / `TimeMonthlyAggrResultDto` 응답 필드 — 컬럼 정확히 무엇이 노출되는지
- [ ] `InoutRecordsAdjustmentPayload` 구조 — 어드민 편집 시 어떤 필드를 보내는지 (`TM_INOUT_REG_ADJST_DTL`의 컬럼과 매핑)
- [ ] `validateInoutDate` 응답 구조 — 차단 사유 종류 (결재중 신청서 vs 마감)
- [ ] `/time/aggr/daily/excel-download/all/search` (all 변형) 의 정확한 용도
- [ ] `근무 구분` (`workYmdTypeList`) 옵션 종류 — 일별만 적용되는 필터
- [ ] `등록 방식` 컬럼 코드 체계 (`어드민 변경` 외에 어떤 값들?)
- [ ] `DailyAggregationService`의 우선순위(휴가 > 기타근무 > 출퇴근) 적용 로직 정확한 위치
- [ ] 어드민 직접 삭제 시 첫 출퇴근(`출퇴근1`) 보호 룰의 코드 위치
- [ ] 어드민이 직접 등록한 기타근무 — `pp:src/components/attendance/shared/admin_direct_dialog/AdminDirectOtherWorkDialog.tsx`가 사용자 측에 별도 다이얼로그를 띄움. 이 흐름의 전체 정리는 [기타근무] 영역에서 별도 deep-dive 필요

## 관련 문서

- `KB:product/user-checkin-widget.md` — 사용자 측 데이터 생성. `hasModifiedWorkRecord` 분기 처리
- `KB:product/admin-work-group.md` — 그룹별 룰(연장/야간/휴일/근무시간 인정)이 집계에 영향
- `KB:domain/business-rules.md` — § 1 근무시간 인정 로직 (확정/합산/인정 시간 정의)
- `KB:code/backend-tables.md` — `TM_DD_*_AGGR`, `TM_INOUT_REG*`, `TM_MM_*_AGGR` 테이블 정리
