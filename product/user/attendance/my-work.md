---
sidebar:
  order: 1
---

# 내 근무

> **메뉴** 근무관리 › 내 근무  
> **URL** `/attendance/work`  
> **탭** (요약) 실근무 · 소정근무 · 잔여근무 + 근무 캘린더  
> **원본** `product/_legacy/user-my-work-calendar.md`

## 개요

사용자가 매일 보는 핵심 화면. 한 달의 모든 근무·휴가·신청서가 **하나의 캘린더 셀에 종합**되어 표시됩니다. **15가지 셀 표현 타입** + **16가지 아이콘** + **6가지 색상 체계** + **24가지 상태 flag**가 복합 작용하는 영역.

다른 모든 영역(출퇴근/휴가/신청서 7종/근무계획)의 결과물이 이 화면으로 모입니다.

### 진입 위치

- 근무관리 GNB 탭 > 내 근무
- URL: ~~`/attendance/personal-work` 또는 유사 (정확 URL [TBD])~~ → **(2026-11-05 해소)** `/attendance/work` → `pages/attendance/personal_work` (`pp:src/App.jsx:1029`). 쿼리 `?newAttendance=YYYYMMDD`로 진입하면 해당 일자의 근무내역 변경 신청서가 자동으로 열림 (`MyWorkCalendarCell.tsx` `newAttendance` effect)
- 화면 구성: 좌측 캘린더 (메인) + 우측 **출퇴근 위젯**(`WorkCommuteWidget`, 팀 근무현황·아바타 숨김) + **근무 요약 정보**(`WorkSummaryWidget`, 기간 헤더·단위 표시) (`pp:src/components/attendance/personal_work/index.tsx`)
  - ~~워크플로우 위젯~~ → **(2026-11-05 해소)** 우측 영역에 워크플로우 위젯은 없음. 근무 요약 정보는 근무그룹 `workTimeVisibleCd === "DENIED"`(근무시간 표시 안 함)이면 숨김. 모바일(lg 미만)에서는 출퇴근 위젯 → 캘린더 → 근무 요약 순으로 세로 배치

### QA 체크리스트

`ppfront/.claude/qa-checklist/attendance.md` **L179 ~ L209** (31줄, 짧지만 모든 셀의 동작을 함축)

## 코드 위치

### ppfront 핵심 파일

```
pages/attendance/personal_work/index.tsx                       ← 페이지 진입점 (/attendance/work)

components/attendance/personal_work/
├── index.tsx                                                  ← 메인 컨테이너 (캘린더 + 위젯)
└── contents/
    ├── CalendarContextProvider.tsx                            ← 컨텍스트
    ├── MyWorkCalendar.tsx                                     ← 캘린더 본체 (월 이동, 데이터 로드)
    ├── MyWorkCalendarHeader.tsx                               ← 캘린더 헤더 (월 표시, 화살표)
    └── my_work_calendar_cell/
        ├── MyWorkCalendarCell.tsx          ⭐ 1088줄         ← 셀 컨테이너 (오늘 표시, drawer 관리, 클릭 핸들러)
        ├── CalendarCellContents.tsx                          ← 셀의 N개 컨텐츠 묶음 + 모바일 우선순위
        └── CalendarCellContent.tsx                           ← 단일 컨텐츠 렌더링 (스타일, 색상)

components/attendance/shared/work_status/
├── WorkStatusIcon.tsx                                         ← 16개 아이콘 종류
└── WorkStatusDescription.tsx                                  ← 설명 텍스트

components/attendance/shared/
├── WorkDailyDrawer.tsx                                        ← 일자 클릭 시 상세 drawer
└── (다양한 신청서 drawer)

lib/attendance/personalWork.ts                                 ⭐ 3000줄+ — 캘린더 핵심 로직
   ├── getTotalDayData            ← 셀에 보여줄 타입들 결정 (line ~1866)
   ├── makeMyInfo                 ← 타입별 icon/title/color/description 생성 (line 721)
   ├── getWorkMemoFromDayContents ← workMemo flag 24개 계산
   ├── getWorkRegInfo             ← WorkReg 타입의 상세 렌더링
   ├── getWorkAttendData          ← 출퇴근 데이터 + 근무 계획 결합
   ├── checkNextDayAndBeforeAggrTime ← 자정 이후 cutoff 판정
   └── makeMemberInfo             ← 매니저 관점 (구성원 근무에서 사용)

modules/attendance/personal_work.ts                            ← Redux 모듈
   ├── loadCalendarData(ym)       ← 월 단위 캘린더 데이터 로드
   ├── loadCalendarDayData(ymd)   ← 단일 일자 데이터
   ├── loadValidWorkPlan          ← 근무계획 유효성
   └── loadWorkInfo               ← 근무 정보

hooks/attendance/personal_work/
└── useMyWorkCalendar.ts                                       ← 캘린더 상태 (ym, 월 이동, refresh)

@types/customTypes/attendance/
├── unionType.d.ts                                             ← AttendType, WorkStatus 등 타입 정의
└── empDailyWorkDto.d.ts                                       ← EmpDailyWorkDto (셀의 원본 데이터)
```

### 백엔드 (`be:`)

```
controller/me/                                                 ← 사용자 본인 API
controller/widget/                                             ← 위젯 (출퇴근 위젯 등)
controller/timeold/                                            ← 캘린더 API (legacy 추정)
```

**핵심 API** (`pp:src/config/api.js` ATTENDANCE 상수 기반):
- `GET /time/calendars/calendar?ym=YYYYMM` — 월 단위 캘린더 데이터
- `GET /time/calendars/day?ymd=YYYYMMDD&currentYn=Y/N` — 단일 일자 데이터
- `POST /pgms/time/monitoring/PersonalWorkMonitoring/validWorkPlan` — 근무계획 유효성

---

## 데이터 모델: 셀 1개의 입력

### `EmpDailyWorkDto` (서버 응답)

캘린더 1셀 = 1개의 `EmpDailyWorkDto`. 주요 필드:

| 필드 | 의미 |
|------|------|
| `ymd` | 일자 (YYYYMMDD) |
| `workStatus` | 출퇴근 상태 (`OFF`/`ON`/`PAUSE`/`FINISH`/`RESUME`) |
| `inHm`, `outHm` | 출근/퇴근 시각 (HHMM) |
| `inYmdhms`, `outYmdhms` | 출근/퇴근 일시 (YYYYMMDDHHmmss) |
| `workMinutes` | 근무 분 수 |
| `workPlan` | 근무 계획 (`workStaHm`, `workEndHm`, `workTimeCd`, `workStaTimeFix`, `workTimeType`, `ddWorkPlanNm`, `workYmdType`) |
| `workGrpVo` | 근무그룹 (룰 코드 `holiWorkPmitCd`/`otPmitCd`/`nightPmitCd`/`validWorkCd`/`workTimeVisibleCd`) |
| `holidayYn` | 휴일 여부 (`Y`/`N`) |
| `workForHomeYn` | 재택 여부 |
| `allDayLeaveYn` | 종일 휴가 여부 |
| `holiCalen` | 휴일 캘린더 (법정/회사) |
| `leaveUseHistory` | 휴가 사용 내역 배열 |
| `otherWork` | 기타근무 사용 배열 |
| `inoutReg` | 출퇴근 raw 기록 |
| `applsInProgress` | **요청중 신청서 12종 배열** (가장 중요) |
| `missingInoutRegYn` | 출퇴근 누락 여부 |
| `hasModifiedWorkRecord` | ~~어드민 수정 여부~~ → **(2026-11-05 정정)** 해당 일자에 **승인 완료된 (통합) 근무내역 변경 또는 출퇴근 내역 변경 신청**(최종본)이 있는지 (`be:timeold/service/calendar/CalendarService.java:1172–1205`, `CalendarMapper.xml#hasModifiedWorkRecord` — `work-reg-adjst-appl-all` 에서 `APPL_STAT_CD=COMPLETE`, `LAST_YN=Y`). 일자 단건 조회(`/time/calendars/day`)에서만 채워짐 |
| `missingInoutRegYn` / `missingRestRegYn` | 출퇴근 / 자리비움 누락 여부 (백엔드 계산, 아래 "누락 조건") |
| `workPlanNotEstablished` | 선택적 근로제 근무일에 승인된 개인 근무계획이 없으면 `true`, 수립되어 있으면 `false`, 해당 없으면 `null` |
| `holidayWorkAppl` / `overtimeWorkAppl` (최상위) | **승인된** 사전 휴일근무 / 사전 연장·야간근무 신청 raw (→ `ApprovedHolidayWork` / `ApprovedOvertimeWork`) |
| `isClosed` | 마감 여부 (`closeYn === "Y"`) |

### `applsInProgress` (요청중 신청서) — 2026-11-05 dev 기준 19종

"요청하여 완료되기 전까지(검토중·승인중·처리중)" 진행 중인 신청서만 담김 (`be:timeold/dto/work/EmpDailyWorkDto.java` `ApplsInProgressDto`). `getTotalDayData` 가 이 목록을 보고 셀에 표시할 타입을 결정:

```
workRegAdjstAppl           // (통합) 근무내역 변경 신청
inoutRecordChangeAppl      // 출퇴근 내역 변경 신청 (2026-08 추가, 별도 테이블)
psnWorkPlanAppl            // 개인 근무계획 변경 신청
compensatoryWorkAppl       // 대체근무 신청
psnHoliWorkAppl            // (Deprecated) 구 휴일근무 신청 — 백엔드가 항상 빈 배열 반환, "프론트 정리 후 필드 제거" TODO
inAppl / outAppl           // 출근 / 퇴근 요청
leaveAppl / leaveCancelAppl            // 휴가 신청 / 휴가 취소 신청
otherWorkApplDtl / otherWorkCancelAppl // 기타근무 신청 / 취소 신청
holidayWorkAppl / holidayWorkCancelAppl          // 사전 휴일근무 신청 / 취소 신청 (요청중)
postHolidayWorkAppl / postHolidayWorkCancelAppl  // 사후 휴일근무 신청 / 취소 신청
overtimeWorkAppl / overtimeWorkCancelAppl        // 사전 연장·야간근무 신청 / 취소 신청 (요청중)
postOvertimeWorkAppl / postOvertimeWorkCancelAppl // 사후 연장·야간근무 신청 / 취소 신청
```

> ~~[TBD] holidayWork vs psnHoliWork 차이~~ → **(2026-11-05 해소)** `psnHoliWorkAppl`은 구 휴일근무 신청 필드로 **Deprecated(항상 빈 배열)**, 현재 휴일근무 요청중은 `holidayWorkAppl`. 같은 이름의 **최상위** `EmpDailyWorkDto.holidayWorkAppl` / `overtimeWorkAppl`은 "신청 기록 raw"로 **승인된** 사전 신청을 담아 `ApprovedHolidayWork` / `ApprovedOvertimeWork` 표시에 쓰임 (요청중 목록과 별개).

### `WorkMemoType` (24개 boolean flag)

각 셀에 대해 `getWorkMemoFromDayContents` 가 계산:

```ts
{
  // 시점 분기
  isToday, isPast, isFuture,
  
  // 일자 성격
  isHoliday,          // 법정/회사 공휴일
  isOff,              // 휴무일 (휴일과 별개)
  isWorkDay,          // 근무일
  
  // 근무 계획 분기
  isFlexTime,         // 출근시간 고정 X (자율) — workPlan.workStaTimeFix !== "S"
  isFixTime,          // 근무시간 고정 — workPlan.workTimeType === "FIX"
  
  // 휴가 상태
  hasLeave,           // 휴가 있음
  isAllDayLeave,      // 종일 휴가
  isLeaveWork,        // 휴가근무 (휴가 + 근무 동시)
  
  // 출퇴근 상태
  isInoutRegMissing,  // 출퇴근 누락
  isRestRegMissing,   // 자리비움 누락
  
  // 신청 진행 상태 (8가지)
  isRequestInPending,         // 출근 요청중
  isRequestOutPending,        // 퇴근 요청중
  isWorkRegPending,           // 근무기록 수정 요청중
  isWorkPlanPending,          // 근무계획 수정 요청중
  isCompensatoryWorkPending,  // 대체근무 신청중
  isOtherWorkRequestPending,  // 기타근무 요청중
  isOtherWorkCancelRequestPending, // 기타근무 취소 요청중
  
  // 기타
  isHolidayWork,              // 휴일근무 여부
  isOffDayWork,               // 휴무일 근무 여부
  isHomeWork,                 // 재택근무
  isAllDayOtherWork,          // 종일 기타근무
  calendarHoliday,            // 법정/회사 공휴일 정보 (객체)
}
```

이 24개 flag의 조합으로 캘린더 셀의 표현이 결정됩니다.

---

## ⭐ 셀 표현 타입 15종 (AttendType) — 케이스별 완전 정리

`pp:src/@types/customTypes/attendance/unionType.d.ts:125` 정의. **모든 셀은 이 15개 중 하나 이상의 타입**으로 표시됨.

각 타입의 메타데이터:
- **아이콘**: WorkStatusIcon의 어떤 케이스가 노출되는지
- **타이틀**: 셀의 메인 텍스트
- **색상**: 6가지 색상 코드 중 (gray / complete / normal / missing / undetermined / leave)
- **설명**: 부가 텍스트 (시간대 등)
- **클릭 동작**: 클릭 시 어떤 모달/drawer가 열리는지

### 색상 6종 (`CalendarCellContent.tsx`)

| 색상 코드 | HEX | 용도 |
|------|------|------|
| `gray` | `#C2C8CF` | 비활성/과거 휴일/모바일 dimmed |
| `complete` | `#0091EA` (파란색) | 모바일 캘린더 요청 중 |
| `normal` | `#1F1F1F` (검정) | 일반 텍스트 |
| `missing` | `#EF3F55` (빨간색) | 누락/에러 |
| `undetermined` | `#FF8A00` (주황색) | 근무 계획 미정 |
| `leave` | `#7DA75E` (녹색) | 휴가 |

### Type 1: `WorkReg` (근무 기록) ⭐

**가장 자주 등장하는 타입.** 오늘(또는 "전 근무일 종료 시각 이전")과 과거에서 출퇴근 기록을 표시.

> **(2026-11-05 코드 검증, `pp:src/lib/attendance/personalWork.ts` `getWorkRegInfo`)** 이전 표는 추정 기반이라 실제와 달랐음. 화면 문구는 `pp:src/locales/ko/sharedFunction.json` `attendance.*`, `attendance.json`.
> - ~~"근무 내역 변경이 필요합니다" / "근무 내역 변경 요청 중"~~ → 이 두 문구는 **캘린더 셀이 아니라 출퇴근 위젯**(`WorkStatusSummary`)의 문구. 캘린더 셀에서는 각각 **"누락"**(빨강), **WorkRequest "요청중"** 으로 보임 (근무내역 변경 요청중이면 `isPendingRequest`로 WorkReg 자체가 빠짐)
> - ~~`validWorkCd === "PLAN"` → "근무 중" 텍스트만~~ → `getWorkRegInfo`에 계획 그룹 분기 없음. 계획 그룹은 **셀 클릭(오늘) 시 아무 동작 안 함**만 다름

**오늘 (또는 현재 시각이 전 근무일의 종료 시각 이전인 과거 일자)**

| 상황 | 아이콘 | 타이틀 (데스크톱 / 모바일 캘린더) | 색상 | 설명 |
|------|------|------|------|------|
| 출근 기록 없이 퇴근만 있음 (출근 요청 반려 등) | `error` | "누락" | missing | — |
| `ON` 근무중 | 근무계획 변경 사용 시 `pending` | "근무중" / `HH:MM ~` | normal | `HH:MM ~` (출근 시각) |
| `OFF` 출근 전 | 근무계획 변경 사용 + 표시조건 시 `plan` | "근무전" / `계획출근 ~` | normal | `계획출근 ~ 계획퇴근` (자율이면 "자율") |
| `PAUSE` 자리비움 | 근무계획 변경 사용 시 `pause` | "자리비움" / `HH:MM ~` | normal | `자리비움 시작 ~ 복귀예정` |
| `FINISH` 퇴근 | `check` | "퇴근" / 총 근무시간 `H:MM` | normal (모바일 complete) | 총 근무시간 `H:MM` |

- `OFF` 표시조건: 종일휴가·휴일·휴무일이 아니거나, 그런 날이라도 이미 출근 상태(`workStatus !== "OFF"`)
- 선택적 근로제 근무계획이 수립(승인)된 날은 템플릿이 자율이어도 수립된 시작/종료 시각으로 표시 ([근무계획 수립](../applications/work-plan-establishment.md))

**과거**

| 상황 | 아이콘 | 타이틀 | 색상 | 설명 |
|------|------|------|------|------|
| 출퇴근 누락 (`missingInoutRegYn === "Y"`, 단 승인된 종일 기타근무일 제외) | `error` | "누락" | missing | — |
| 자리비움 누락 (`missingRestRegYn === "Y"`) | `error` | "누락" | missing | — |
| 과거인데 아직 출근 상태 (`ON`) | `pending` | "근무중" / 모바일 `HH:MM ~` | normal | `HH:MM ~` |
| 근무 완료 (근무일 / 휴일근무 / 휴무일근무 / 휴가+근무) | 데스크톱 없음, 모바일 드로워 `check` | 데스크톱: 총 근무시간 `H:MM` / 모바일 드로워·시간숨김 그룹: "근무완료" | complete | 모바일 드로워만 `출근 ~ 퇴근` |
| 승인된 종일 기타근무 + 근무시간 0 | — | (빈) | — | — |

- `workTimeVisibleCd === "DENIED"`(근무시간 표시 안 함): 시간 대신 상태 텍스트("근무중"/"퇴근"/"근무완료")만, 설명 비움

**누락 조건** (~~QA L200–205 "모두 만족 시"~~ → **(2026-11-05 해소)** 백엔드가 계산해 `missingInoutRegYn`으로 내려줌, `be:timeold/dto/work/EmpDailyWorkDto.java:143–160` 스키마 설명):
- **데이터 기준 누락** (하나라도 해당):
  - 출퇴근 기록 쌍이 안 맞음 (IN→OUT→IN→OUT)
  - 출퇴근 기록이 없거나, 집계된 근무시간이 0
  - 근무일이 아니면 판단 안 함. 단, 비근무일에도 기록이 생기면 근무일과 동일하게 판단
- **누락으로 표시하지 않는 경우**: 과거가 아님 / 종일휴가 / 종일휴가 요청중 / 출퇴근(출근·퇴근) 요청중 / 근무내역 변경 요청중
- 프론트 추가 예외: **승인된 종일 기타근무**(`allDayOtherWorkYn === "Y"`, 휴일·휴무일 제외)인 날은 누락 표시 안 함
- **자리비움 누락**(`missingRestRegYn`): 출퇴근 기록이 있을 때만 판단, 자리비움 기록 쌍(STA→END)이 안 맞으면 누락. 표시 제외 조건은 출퇴근 누락과 동일

**시간 표시 보정** (근무내역 변경 신청서 진입 시, QA L214):
- `workTimeVisibleCd === "DENIED"` + 출근인정시각 이전 출근 → **첫 출근시간 = 출근인정시각으로 보정** 표시

### Type 2: `WorkPlan` (근무 계획) ⭐

> **용어**: `WorkPlan` = **근무 계획 = 근무 스케줄** (동의어). `workPlan.ddWorkPlanNm`은 적용된 근무 템플릿 이름.

**미래 일자 또는 종일 휴가 미래에 표시.** 사용자가 어떤 근무를 할 예정인지.

| 상황 | 아이콘 | 타이틀 | 색상 | 설명 |
|------|------|------|------|------|
| 선택적 근로제 근무일 + 근무계획 미수립 (`workPlanNotEstablished === true`) | `undetermined` (! 주황) | "미수립" | undetermined | (빈) |
| `workPlan.ddWorkPlanNm` 있음 + 근무계획 변경 사용 가능 | `plan` (Create 파랑테두리) | 데스크톱: "계획" / 모바일: `HH:MM ~` | normal (모바일 과거·미래 gray) | `HH:MM ~ HH:MM` |
| `workPlan.ddWorkPlanNm` 있음 + 근무계획 변경 사용 안함 | (없음) | (빈) | normal/gray | (동일) |
| `workPlan.ddWorkPlanNm` 없음 (스케줄 없음) | `undetermined` (! 주황) | "미정" | undetermined | (빈) |

> **(2026-11-05 정정)** 데스크톱 타이틀 ~~"예정됨"~~ → 실제 문구 **"계획"** (`sharedFunction.json` `attendance.planned`). "미수립" 행은 선택적 근로제 도입으로 추가됨.
| 출근시간 자율 (`isFlexTime`) | (위와 동일) | "자율 ~" 등 | (위와 동일) | "자율 ~ ..." |
| 근무시간 자율 (`!isFixTime`) | (위와 동일) | (위와 동일) | (위와 동일) | "... ~ 자율" |

**클릭 가능 조건** (`canOpenWorkPlanEdit`):
- 오늘 또는 미래 일자
- `isWorkDay === true` (근무일)
- `requiredPlanEditAppl === true` (그룹 설정에서 근무계획 변경 사용 ON)

→ 클릭 시 **근무계획 변경 신청서** drawer 오픈

### Type 3: `WorkRequest` (근무 관련 요청)

**근무 관련 요청중 신청서**가 있을 때 1건당 1개씩 표시: `workRegAdjstAppl`, `inoutRecordChangeAppl`, `psnHoliWorkAppl`(deprecated), `inAppl`, `outAppl`, `holidayWorkAppl`, `holidayWorkCancelAppl`, `postHolidayWorkAppl`, `postHolidayWorkCancelAppl`, `overtimeWorkAppl`, `overtimeWorkCancelAppl`, `postOvertimeWorkAppl`, `postOvertimeWorkCancelAppl`.

| 상황 | 아이콘 | 타이틀 | 색상 | 설명 |
|------|------|------|------|------|
| 일반 요청 | `pending` (3 dots 파랑) | "요청중" | normal / 모바일 complete | — |
| 휴일근무 취소 / 연장 취소 / 사후 연장 취소 진행중 | `holidayWorkCancelPending` (- 파랑) | "취소중" | normal / 모바일 complete | — |

> **(2026-11-05 정정)** 문구 ~~"요청 중" / "취소 요청 중"~~ → 실제 **"요청중" / "취소중"** (`sharedFunction.json` `attendance.requestPending` / `cancelPending`). Type 6~9도 동일.

**클릭 시**: 해당 요청서 상세 drawer 오픈

### Type 4: `OtherWork` (기타근무 — 확정/사용)

**기타근무가 등록되어 사용 중**일 때.

| 상황 | 아이콘 | 타이틀 | 색상 | 설명 |
|------|------|------|------|------|
| 데스크톱 + 시간 단위 | `attend` (Location 갈색) | `otherWorkName` (예: "출장") | normal | `HH:MM ~ HH:MM` |
| 데스크톱 + 종일 (`useUnit === "DAY"`) | `attend` | 기타근무 이름 | normal | (빈) |
| 모바일 캘린더 | `attend` | `HH:MM ~ ` | gray | (없음) |

**제목 툴팁**: ~~모든 타입 공통 4글자 초과~~ → **(2026-11-05 정정)** `OtherWork`는 **항상** 툴팁(말줄임 대비), `ApprovedOvertimeWork`는 제목이 4글자 초과일 때만 툴팁. 그 외 타입은 툴팁 없음 (`CalendarCellContent.tsx:297–299`).

- 취소 요청중(`cancelingYn !== "N"`)인 기타근무는 `OtherWork`로 표시하지 않음 (`OtherWorkRequest` "취소중"만 표시)
- 어드민 직접 등록(`inputType === "DIRECT"`) 기타근무 클릭 시 신청서 대신 `AdminDirectOtherWorkDialog`

**클릭 시**: 기타근무 상세 모달 오픈

### Type 5: `LeaveReg` (휴가 사용 기록)

**휴가가 등록되어 사용 중**일 때.

| 상황 | 아이콘 | 타이틀 | 색상 | 설명 |
|------|------|------|------|------|
| `workTimeVisibleCd === "DENIED"` | `leave` (커피 녹색) | "휴가" | normal | (빈) |
| 과거 + 비모바일 | (없음) | `HH:MM` (사용 시간 표시) | leave | (빈) |
| 과거 + 모바일 drawer | `leave` | "휴가" | leave | `HH:MM` |
| 종일 휴가 (`isAllDayLeave + useUnit === "DAY"`) | `leave` | "휴가" | normal | (빈) |
| 시간 단위 휴가 | `leave` | "휴가" | normal / 모바일 leave | `HH:MM ~ HH:MM` |

- **휴가 취소 신청이 진행중인 휴가**는 `LeaveReg`로 표시하지 않음 (취소 신청 `cancelApplId`와 같은 `applId` 제외 → `LeaveRequest` "취소중"만 보임)

**관리자 등록 휴가** 클릭 시 → **별도 확인 모달** (`AdminDirectLeaveDialog`, 모바일은 바텀드로워)
**일반 신청 휴가** 클릭 시 → 휴가 신청서 상세

### Type 6: `LeaveRequest` (휴가 신청/취소 신청 진행중)

`leaveAppl` 또는 `leaveCancelAppl` 진행중.

| 상황 | 아이콘 | 타이틀 | 색상 | 설명 |
|------|------|------|------|------|
| 휴가 신청 진행중 | `leavePending` (3 dots 녹색) | "요청 중" | normal / 모바일 leave | `HH:MM ~ HH:MM` 또는 종일 시 빈 |
| 휴가 취소 신청 진행중 | `leaveCancelPending` (- 녹색) | "취소 요청 중" | normal / 모바일 leave | (시간 또는 빈) |

### Type 7: `OtherWorkRequest` (기타근무 신청/취소 신청 진행중)

`otherWorkApplDtl` 또는 `otherWorkCancelAppl` 진행중.

| 상황 | 아이콘 | 타이틀 | 색상 | 설명 |
|------|------|------|------|------|
| 신청 진행중 | `otherWorkPending` (3 dots 갈색) | "요청 중" | normal / 모바일 leave | `HH:MM ~ HH:MM` 또는 빈 |
| 취소 신청 진행중 | `otherWorkCancelPending` (- 갈색) | "취소 요청 중" | normal / 모바일 leave | (시간 또는 빈) |

### Type 8: `WorkPlanRequest` (근무계획 변경 신청 진행중)

`psnWorkPlanAppl` 진행중.

| 상황 | 아이콘 | 타이틀 | 색상 | 설명 |
|------|------|------|------|------|
| 진행중 | `pending` (3 dots 파랑) | "요청 중" | normal / 모바일 complete | (빈) |

### Type 9: `CompensatoryWorkRequest` (대체근무 신청 진행중)

`compensatoryWorkAppl` 진행중.

| 상황 | 아이콘 | 타이틀 | 색상 | 설명 |
|------|------|------|------|------|
| 진행중 (데스크톱) | `pending` | "요청 중" | normal | (빈) |
| 진행중 (모바일) | `pending` | "요청중" | complete (**2026-11-05 정정**: ~~leave (?)~~) | 모바일 일자 드로워에서만 `근무일 -> 휴일`/`근무일 -> 휴무일`/`휴일 -> 근무일`/`휴무일 -> 근무일` (현재 `workYmdType` → 근무일이면 신청의 `offWorkYmdTypeCd`, 아니면 근무일) |

### Type 10: `ApprovedHolidayWork` (사전 휴일근무 승인됨)

**휴일인데 사전 휴일근무 신청이 승인된 경우.** `isHoliday + holidayWorkAppl 승인 완료`.

| 상황 | 아이콘 | 타이틀 | 색상 | 설명 |
|------|------|------|------|------|
| 휴일 + 승인 휴일근무 | `briefcase` (가방 파랑테두리) | "휴일근무" | normal / 모바일 gray(오늘은 normal) | `HH:MM ~ HH:MM` (계획 시각) |

### Type 11: `ApprovedOvertimeWork` (사전 연장/야간 승인됨)

**휴일 아닌 일자 + 사전 연장 신청 승인됨.** `!isHoliday + overtimeWorkAppl 승인 완료`.

| 상황 | 아이콘 | 타이틀 | 색상 | 설명 |
|------|------|------|------|------|
| 평일 + 승인 연장근무 | `briefcase` | "연장/야간근무" (**2026-11-05 정정**: ~~"연장근무"~~, `attendance.json` `PERSONAL_WORK.overtimeWork`) | normal / 모바일 gray(오늘은 normal) | `HH:MM ~ HH:MM` (계획 시각) |

**Type 10·11 공통 표시 조건 (2026-11-05 해소, `getTotalDayData`)**: 최상위 `holidayWorkAppl` / `overtimeWorkAppl`(승인된 사전 신청 raw) 중
- 근무일자가 **오늘 이후**(과거 일자는 표시 안 함)
- **오늘인데 출퇴근 기록(`inoutReg`)이 있으면 표시 안 함** (실제 근무 기록으로 대체)
- 취소 진행중(`cancelingYn !== "N"`)이면 표시 안 함

### Type 12: `HomeWork` (재택근무)

`workForHomeYn === "Y"` 일 때.

| 상황 | 아이콘 | 타이틀 | 색상 | 설명 |
|------|------|------|------|------|
| 데스크톱 | `home` (집 진한 파랑) | "재택" | normal | (빈) |
| 모바일 캘린더 | `home` | (빈) | normal/gray | (빈) |

**표시 조건 (2026-11-05 코드 검증, `getTotalDayData`)**:
- 휴가 사용 내역이 있는 날: 종일휴가가 아니거나, 종일휴가라도 근무가 있으면(`isLeaveWork`) 표시
- 휴가 없는 날: 휴일인데 휴일근무 없음 / 휴무일인데 휴무일근무 없음이면 숨김, 그 외 표시
- 클릭 시 재택근무 신청서 상세(`applIdWorkForHome`)

**우선순위**: ~~기타근무 Chip이 있으면 재택 Chip은 노출 안 됨~~ → **⚠️ (2026-11-05) 현재 내 근무 캘린더 코드에는 기타근무 유무 조건이 없음** — `homeWork` 생성 조건에 `otherWork` 체크가 없어 두 칩이 함께 표시될 수 있음 (`git log -S "!otherWork.length"` 상 해당 조건 이력 없음). `KB:product/user/applications/remote-work.md` § 1 의 "기타근무 > 재택" 룰은 다른 화면(출퇴근 위젯 등) 기준이거나 기획 의도일 수 있음 → **기획 ≠ 구현 여부 확인 필요**
> **(2026-11-05 Slack 검색 — 부분)** "기타근무 > 재택" 룰의 출처는 **출퇴근 위젯 칩**이었음: #030 체크리스트 2025-02-07 "[디자인] 출퇴근위젯의 재택/기타근무 칩 — 기타근무와 재택여부가 하나의 칩 공간을 공유, 우선순위는 기타근무" (https://hcgtheplus.slack.com/archives/C08CPRL8BRN/p1738906946224039?thread_ts=1738906905.526529&cid=C08CPRL8BRN). 근거는 "재택보다 근무가 중요도 높음 + 기타근무(대부분 외근)와 재택이 동시에 나올 경우는 실사용상 없을 것"이고, 홈 위젯에서 재택이 가려지는 문제에 대해 아코디언/+1 표시를 검토하기로 함(결론 없음). 전사 근무계획 캘린더(구성원 근무 일정)는 우선순위 휴가 > 기타근무 > 재택 > 기본근무, "기타근무와 재택이 겹치면 툴팁 등으로 재택 표시(디자인 필요)" — #ch-plan 2025-06-18 (https://hcgtheplus.slack.com/archives/C02VCP9MBQV/p1750229718322709?thread_ts=1750227993.860649&cid=C02VCP9MBQV). #ch-ux 2024-10-23 칩 우선순위 "근무 → 휴가 → 재택"도 출퇴근 위젯 근무현황 기준. **내 근무 캘린더에 "재택 숨김"을 적용하기로 한 결정은 Slack에 없음** → 현재 둘 다 표시는 결정 누락이지 버그로 확정할 근거 없음. 캘린더는 셀에 여러 항목을 나열하는 구조라 숨길 필요가 없었을 가능성(추정)

### Type 13: `Holiday` (휴일)

`isHoliday` 이면 항상 셀 첫 항목으로 들어감. `workMinutes <= 0`이면 근무 기록/계획은 숨김.

| 상황 | 아이콘 | 타이틀 | 색상 | 설명 |
|------|------|------|------|------|
| 휴일 | (없음) | "휴일" | gray | (빈) |

- ~~"휴일" 또는 휴일명~~ → **(2026-11-05 정정)** 타이틀은 항상 "휴일". 법정(`LAW`)/회사(`CTRT`) 공휴일명은 **날짜 숫자 옆 툴팁/강조**로 표시 (모바일 제외)

### Type 14: `DayOff` (휴무일)

`isOff` 이면 항상 들어감. `workMinutes <= 0`이면 근무 기록/계획은 숨김.

| 상황 | 아이콘 | 타이틀 | 색상 | 설명 |
|------|------|------|------|------|
| 휴무일 | (없음) | "휴무" (**2026-11-05 정정**: ~~"휴무일"~~, `attendance.dayOff`) | gray | (빈) |

### Type 15: `RestReg` (자리비움 기록)

> ~~[TBD] 정확한 노출 케이스~~ → **(2026-11-05 해소)** 타입 정의(`unionType.d.ts:165`)만 남아 있고 **생성하는 코드가 없는 미사용 타입**. 자리비움 관련 표시는 `WorkReg`가 담당 — 오늘 `PAUSE`는 "자리비움", 과거 자리비움 누락(`missingRestRegYn`)은 "누락".

---

## 표시 우선순위 / 구성 로직 (`getTotalDayData`)

`pp:src/lib/attendance/personalWork.ts:1959` — 셀의 N개 컨텐츠 결정 로직 (2026-11-05 dev 기준).

### 데이터 그룹화 + 셀 내 표시 순서

셀 항목은 **아래 순서대로** 배열됨 (`compact([...])`) — 데스크톱은 앞에서부터 N개만 보이므로 이 순서가 곧 노출 우선순위:

```
1. holiday          := isHoliday ? Holiday
2. dayOff           := isOff ? DayOff
3. workAttend.workPlan  ┐ getWorkAttendData 결과 (아래)
4. workAttend.workReg   ┘
5. workRequest      := 근무 관련 요청중 13종(Type 3 목록) 각 1건씩
6. leaveReg         := leaveUseHistory 중 취소 요청중이 아닌 것
7. leaveRequest     := leaveAppl + leaveCancelAppl
8. otherWork        := otherWork 중 cancelingYn === "N"
9. homeWork         := Type 12 표시 조건
10. otherWorkRequest := otherWorkApplDtl + otherWorkCancelAppl
11. workPlanRequest  := psnWorkPlanAppl
12. compensatoryWorkRequest := compensatoryWorkAppl
13. approvedHolidayWork  := Type 10·11 공통 표시 조건
14. approvedOvertimeWork
```

### `getWorkAttendData` — 근무 계획 vs 근무 기록 선택 (2026-11-05 해소)

내 근무 캘린더(`showAlwaysWorkPlan = false`) 기준:

| 조건 | 결과 |
|------|------|
| `isWorkEntryNull` | 둘 다 없음 |
| `isPendingRequest` | 둘 다 없음 (요청 항목만 보임) |
| 그 외 + `isPastOrToday` | `WorkReg` |
| 그 외 + 아직 cutoff 전(미래 포함) | `WorkPlan` |

> 구성원 근무 캘린더(`showAlwaysWorkPlan = true`)는 요청중이어도 근무계획(있으면)을 보여주고, 오늘 출근 전(`OFF`)이면 계획, 그 외 과거/오늘은 기록을 같이 보여줌. `ApprovedHolidayWork`/`ApprovedOvertimeWork`는 `getWorkAttendData`가 아니라 별도 목록(13·14)에서 생성됨.

### 자정 cutoff 동적 계산 (`workDayStartHour`)

```ts
workDayStartHour = workPlan.workStaHm 
  ? (계획출근시각 - 3시간).hours()  // 백엔드 룰과 일치
  : 6                                // 시스템 기본
```

`isPastOrToday = isPast || (isToday && 현재시각 >= workDayStartHour)`

> 이전 deep-dive에서 확인된 동적 cutoff 룰 (`KB:product/user/home/checkin-widget.md` § "자정 이후 특수 동작")이 캘린더 셀 판정에도 일관 적용됨.

### `isPendingRequest` (요청중 우선 노출)

다음 중 하나라도 참이면 근무 계획을 안 보여줌 (요청 정보만):

1. **!isPastOrToday (미래) + 근무계획 변경 신청중**: 요청중만 노출
2. **근무 관련 요청중 문서(Type 3 목록) 있음** — 단, 사전/사후 연장·야간 신청 또는 그 취소 신청이 **하나라도** 있으면 예외(가리지 않음)

> 연장/야간 신청·취소는 예외 — 근무 계획과 함께 표시 가능 (계획 시간 외 추가로 보여야 하므로)
>
> **(2026-11-05 정정)** ~~대체근무 요청중 → 근무 계획 가림~~: 현재 `isPendingRequest` 조건에 대체근무(`compensatoryWorkAppl`)는 **포함되지 않음**. 대체근무 요청중이어도 근무 계획/기록은 함께 표시되고 "요청중" 항목이 추가됨. 휴가·기타근무 요청도 계획을 가리지 않음.

### `isWorkEntryNull` (워크 정보 자체 가림)

다음 조건 중 하나면 출퇴근 데이터 자체 가림:
- 종일 휴가 + 미래
- 종일 휴가 요청중 또는 종일 휴가 + `workMinutes <= 0`
- 휴일 + `workMinutes <= 0`
- 휴무일 + `workMinutes <= 0`

### 모바일 vs 데스크톱 표시

**데스크톱/태블릿**: `dayData.slice(0, visibleCount)` — `visibleCount` = **3개**(태블릿 sm~md 구간은 **2개**). 모듈 사용 시작일 이전 항목은 제외  
**모바일(sm 미만)**: `checkMobileTopPriorityDayContent`로 1개만 선택해서 표시

**모바일 1셀 1항목 우선순위 (2026-11-05 해소, `MyWorkCalendarCell.tsx:439–463`)** — 별도 가중치 없이 위 "표시 순서"의 첫 항목이 기본:
1. **휴일근무 / 휴무일근무** 날(휴일·휴무일 + 근무시간 > 0 또는 `ON`/`FINISH`/`PAUSE`) → `WorkReg`(근무 기록)
2. **종일휴가가 아닌** 날 → 첫 번째 항목 (휴일이면 "휴일", 휴무일이면 "휴무", 아니면 근무 계획/기록 …)
3. **종일휴가**(휴일 아님, 과거/오늘, 근무 0 또는 `OFF`)이고 휴가 사용 내역이 **1건** → `LeaveReg`(휴가)
4. 그 외 → 첫 번째 항목

- 모바일에서 대표 항목 외 나머지는 **색 점(dot)** 으로 날짜 아래 표시: 휴가(휴가 요청 포함)=휴가색, 재택=재택색, 근무(근무 요청·근무계획 변경·대체근무·승인 휴일/연장 포함)=근무색, 기타근무(요청 포함)=기타근무색. 같은 종류는 1개로 합침

---

## 시점별 표시 분기 (Past / Today / Future)

QA L194–197 + 코드 분석 종합:

### 과거 (Past)

- **집계 기준 근무 정보 표시** (백엔드 집계 후)
- 휴일이면 → `Holiday` 타입
- 누락 조건 모두 해당 시 → `WorkReg`에 `missing` 색상으로 "누락" 표시
- 휴가/기타근무는 사용 내역으로 표시

### 오늘 (Today)

- **출퇴근 위젯 이벤트 결과에 따라 실시간 변경**
- `workStatus` 상태별 분기 (`WorkReg` Type 1 참고)
- 우측 출퇴근 위젯과 양방향 동기화 (`KB:product/user/home/checkin-widget.md`)

### 미래 (Future)

- **근무 스케줄 계획 정보** 표시 (`WorkPlan` 타입)
- 스케줄 없음 → "미정" (`undetermined` 색상)
- 근무계획 변경 신청 가능한 그룹이면 → 클릭하여 신청서 오픈

---

## 셀 클릭 동작 (`handleClickDetail`)

`MyWorkCalendarCell.tsx` `handleClickDetail` (2026-11-05 dev 기준 `:600–787`, 해소). 데스크톱/태블릿은 항목(칩) 클릭 시 바로 실행, **모바일(sm 미만)은 셀 전체 클릭 → 일자 드로워(`WorkDailyDrawer`) 목록 → 항목 클릭 시 실행**.

### 항목별 동작 (위에서부터 먼저 걸리는 것)

| 클릭 항목 / 상황 | 동작 |
|------|------|
| `HomeWork` | 재택근무 신청서 상세 |
| `WorkRequest` / `LeaveRequest` | 해당 요청중 신청서 상세 (오늘 또는 전 근무일 종료 전이면 승인 후 출퇴근 위젯도 재조회) |
| `OtherWorkRequest` / `OtherWork` | 어드민 직접 등록(`DIRECT`)이면 `AdminDirectOtherWorkDialog`, 아니면 기타근무 신청서 상세 |
| `LeaveReg` | 신청서로 쓴 휴가면 휴가 신청서 상세, 어드민 직접 등록(`DIRECT`)이면 `AdminDirectLeaveDialog` |
| `WorkPlanRequest` / `CompensatoryWorkRequest` | 해당 신청서 상세 |
| `ApprovedHolidayWork` / `ApprovedOvertimeWork` | 승인된 휴일근무 / 연장·야간근무 신청서 상세 |
| 그 밖(근무 기록·계획·휴일 등) + **오늘(또는 전 근무일 종료 전)** | 계획 그룹(`validWorkCd === "PLAN"`)이면 **아무 동작 없음**. 출근 없이 퇴근만 있으면 기본 근무시간 기록 변경 신청서. 그 외 근무일 + 근무계획 변경 사용이면 근무계획 변경 신청서 |
| 그 밖 + **과거** | 기본 근무시간 기록 변경 신청서 (누락·근무 내역 있음·휴일 모두) |
| 그 밖 + **미래** | 근무일 + 근무계획 변경 사용이면 근무계획 변경 신청서 |

- **기본 근무시간 기록 변경 신청서** = 근무그룹에서 사용 가능한 것 중 **통합 근무내역 변경** 또는 **출퇴근 내역 변경**. 둘 다 사용 가능하면 **출퇴근 내역 변경 우선**([출퇴근 내역 변경](../applications/inout-record-change.md)), 둘 다 미사용이면 열리지 않음. 열린 드로어의 유형 드롭다운에서 다른 사용 가능 유형(+ 근무계획 변경 사용 시 근무계획 변경)으로 바꿀 수 있음. 근무계획 변경으로 연 경우 드롭다운 비활성
- 문서 상태 변경 시 캘린더 데이터 갱신 (QA L208)
- **근무 마감 일자**: ~~셀 클릭 시 신청서 진입 차단~~ → **(2026-11-05 정정)** 셀 클릭 단계에서는 차단하지 않음. 신청서 드로어는 열리고, 드로어 안에서 경고 문구 + 요청 비활성: 근무내역/출퇴근 내역 변경 "선택한 일자의 근무가 마감되어 근무내역을 변경할 수 없습니다.", 근무계획 변경 "선택한 기간의 근무가 마감되어 근무계획 변경을 할 수 없습니다." (`pp:src/locales/ko/workflow.json:192,490,566`, `RegEdit.tsx:1191,2453`, `InoutRecordChange.tsx:1195`)

### `MoreHorizIcon` (더보기)

~~모바일에서 MoreHorizIcon → SwipeableDrawer (추정)~~ → **(2026-11-05 해소)** 항목 수가 `visibleCount`(3, 태블릿 2)를 넘으면 셀 하단에 `···` 버튼 노출 → 클릭 시 **일자 드로워(`WorkDailyDrawer`)** 에 그날 전체 항목 목록 표시, 각 항목 클릭 시 위 동작. 모바일(sm 미만)은 버튼 대신 셀 전체 클릭으로 같은 드로워가 열림 (`MyWorkCalendarCell.tsx:924–1045`).

---

## ⭐ Cross-domain 종합 효과

이 캘린더는 **거의 모든 attendance 영역의 결과물이 모이는 곳**:

| 다른 영역 동작 | 캘린더 셀 영향 |
|------|------|
| 사용자 출퇴근 위젯 출근 | 오늘 셀 `WorkReg`에 `ON` 상태 표시 |
| 사용자 출퇴근 위젯 퇴근 | 오늘 셀 `WorkReg`에 `FINISH` 상태 표시 |
| 사용자 자리비움 | 오늘 셀 `WorkReg`에 `PAUSE` 표시 |
| 사용자 휴가 신청 | 해당 일자에 `LeaveRequest` 표시 |
| 사용자 휴가 승인 | `LeaveReg`로 전환 |
| 사용자 기타근무 신청 | `OtherWorkRequest` 표시 |
| 사용자 기타근무 승인 | `OtherWork` 표시 + 누락 조건 회피 (종일 시) |
| 사용자 재택근무 승인 | `HomeWork` 표시 (~~기타근무 있으면 가려짐~~ → 현재 코드는 기타근무와 함께 표시, § 우선순위 참고) |
| 사용자 사전 휴일근무 승인 | 휴일 일자에 `ApprovedHolidayWork` 추가 |
| 사용자 사전 연장/야간 승인 | 평일 일자에 `ApprovedOvertimeWork` 추가 |
| 사용자 근무내역 변경 신청 | `WorkRequest` (workRegAdjstAppl) 표시 |
| 사용자 근무계획 변경 신청 | `WorkPlanRequest` 표시 (계획 가림) |
| 사용자 대체근무 신청 | `CompensatoryWorkRequest` 표시 (계획은 그대로 표시 — 2026-11-05 정정) |
| 근무내역/출퇴근 내역 변경 신청 **승인 완료** | `hasModifiedWorkRecord = true` → (오늘이면) 출퇴근 위젯이 출근/퇴근 버튼 대신 [근무 내역 변경] 버튼만 노출. 캘린더 셀 클릭·변경 신청은 차단하지 않음 (아래 주석) |
| 어드민 휴가 수동 등록 | 사용자 화면에 `LeaveReg` + `AdminDirectLeaveDialog` |
| 어드민 기타근무 직접 등록 | 사용자 화면에 `OtherWork` + `AdminDirectOtherWorkDialog` |
| 어드민 근무 마감 | `isClosed = true` → 신청서 드로어에서 경고 + 요청 비활성 (셀 클릭 자체는 가능) |

> **(2026-11-05 해소) "어드민 수정 일자 → 변경 신청 차단" 모순 정리**: 이전 문서의 "어드민 출퇴근내역 직접 수정 → `hasModifiedWorkRecord` → 변경 신청 시도 시 차단('관리자에 의해 수정된 내역이 있어 신청할 수 없습니다')"은 **현재 코드와 다름**.
> - `hasModifiedWorkRecord`는 어드민 직접 수정이 아니라 **승인 완료된 (통합) 근무내역 변경·출퇴근 내역 변경 신청 존재 여부** (`be:CalendarMapper.xml#hasModifiedWorkRecord`). 해당 신청 테이블에 쓰는 곳은 신청서 처리 경로뿐
> - 프론트 사용처는 출퇴근 위젯(`pp:src/components/main/work_commute/contents/CommuteButton.tsx:113–117`) 한 곳: 출근/퇴근 버튼 대신 [근무 내역 변경] 버튼으로 전환 (= 변경 신청으로 유도, 차단 아님)
> - "관리자에 의해 수정된 내역이 있어 신청할 수 없습니다" 문구는 ppfront ko locale·백엔드 어디에도 없음
> - **단, 어드민 직접 수정 일자의 신청 차단 자체는 존재** (별도 flag): 신청서 기준일 조회 응답의 `hasAdminModifiedWork` = true → 신청서 드로어에 "해당 일자의 근무내역은 어드민이 수정 및 확정하였습니다." 경고 + 입력·[요청] 비활성 (`pp:src/components/workflow/shared/template_drawer/contents/InoutRecordChange.tsx:1213-1219, 1037`, `RegEdit.tsx`, locale `workflow.json:485`). 즉 "차단"은 맞고, 틀렸던 건 flag 이름(`hasModifiedWorkRecord`)과 문구였음 — 2026-11-05 교차 검증
> - 의도: 근무내역 변경 신청이 승인되면 그 날 출퇴근 기록이 확정되어 재출근이 불가하므로 출퇴근 버튼을 막아둠 (Slack #channeltalk 2026-08-13 "당일 근무내역 변경 막아둔 이유")
| 어드민 휴일 추가 | 미래 셀에 `Holiday` 노출 |
| 어드민 출근지/근무템플릿 변경 | 미래 셀의 `WorkPlan` 정보 변경 |
| 어드민 근무그룹 설정 변경 | 셀 동작의 거의 모든 룰 (otPmitCd/holiWorkPmitCd 등) 분기 |

---

## 비즈니스 룰 (캘린더 한정)

QA L181–209 + 코드 분석 정리:

### 시점 분기 (4가지)

1. **과거**: 집계 기준 근무 정보. 누락 조건 모두 해당 시 누락 표시
2. **오늘**: 출퇴근 위젯 이벤트 결과 실시간 반영
3. **미래**: 근무 스케줄 계획 정보. 스케줄 없으면 "미정"
4. **자정~새벽**: 동적 cutoff (계획출근-3시간 또는 6시) 이전이면 어제 데이터

### 누락 조건 (과거 한정)

~~1. 근무일임 2. 출퇴근 정보 없음 3. 출퇴근/기타근무 쌍이 안 맞음 4. 요청중/확정 기타근무 없음 5. 요청중/확정 휴가 정보가 근무그룹 표준 근로시간 미만 — "모두 만족 시"~~ (QA 원문. "정보 없음"과 "쌍이 안 맞음"을 동시에 요구해 논리적으로 성립 안 함)

→ **(2026-11-05 해소)** 백엔드 `missingInoutRegYn` 기준 — Type 1 "누락 조건" 참고:
1. 근무일(또는 비근무일이지만 기록 발생)에서 **출퇴근 쌍 불일치 또는 기록 없음 또는 집계 근무시간 0** 이면 누락
2. 단, 종일휴가 / 종일휴가 요청중 / 출퇴근 요청중 / 근무내역 변경 요청중이면 누락 아님
3. 승인된 종일 기타근무일은 화면에서 누락 표시 안 함
4. 자리비움 쌍 불일치(출퇴근 기록 있을 때)도 "누락"

### 근무시간 인정 룰 (QA L181–188)

> 스프린트 #38 배포 이후 집계된 데이터만 유효함. 이전 집계 데이터는 로직이 다름.

| 케이스 | 인정 결과 |
|------|------|
| 근무내역 승인 받음 | 입력한 대로 모두 인정 |
| 연장근무 자유 허용 | 입력한 대로 모두 인정 |
| 연장근무 미승인 | 표준근무시간 내만 인정, 나머지 비근무 |
| 연장근무 일부 승인 | 표준 + 승인분만 인정, 나머지 비근무 |
| 휴일 | 사전 휴일근무 신청 승인 시간 내만 인정 |

### 우선순위 / 가림 룰

- **근무 관련 요청중 신청서 있으면 근무 계획·기록 가림** (연장/야간 신청·취소 예외)
- ~~대체근무 요청 → 근무계획 가림~~ (2026-11-05 정정: 현재 코드는 가리지 않음)
- **미래 + 근무계획변경 요청중 → 요청중만 노출**
- **종일 휴가 미래 → workEntry 자체 가림**
- ~~기타근무 Chip > 재택 Chip~~ → ⚠️ 현재 캘린더 코드는 둘 다 표시 (Type 12 참고, 기획 ≠ 구현 확인 필요)
- **휴가 취소 요청중인 휴가 / 취소 요청중인 기타근무는 원래 항목 숨김**
- **모바일은 1셀에 1개 컨텐츠만** (`checkMobileTopPriorityDayContent` — 휴일·휴무일 근무는 근무 기록, 종일휴가 1건은 휴가, 그 외 표시 순서 첫 항목)

### 클릭 가능 조건 (`canOpenWorkPlanEdit`)

근무계획 변경 신청서 진입 가능:
- 오늘 또는 미래 일자
- `isWorkDay`
- `requiredPlanEditAppl` (그룹 설정 ON)

### 워크플로우 신청서 ↔ 캘린더 동기화

- 신청서 상태 변경 시 → 캘린더 즉시 갱신 (QA L208)
- 캘린더 셀 클릭 → 신청서 상세 → 액션 → 상태 변경 → 캘린더 갱신
- `useMyWorkCalendar.changeCalendarStatus(date, total?)` 로 갱신 트리거

---

## 알려진 제약 / 임시 동작

- **스프린트 #38 이전 집계 데이터는 로직이 다름** — 현재 룰은 #38 배포 후 데이터에만 적용
- **모듈 사용 시작일 (`moduleUsageStartYmd`) 이전 데이터 가림**: `getTotalDayData`에서 해당 일자보다 이전이면 셀 데이터 표시 안 됨

---

## 검증 / [TBD]

### 핵심 로직 (2026-11-05 모두 해소 — 본문 반영)

- [x] `checkMobileTopPriorityDayContent` → § "모바일 1셀 1항목 우선순위"
- [x] `getWorkAttendData` → § "getWorkAttendData — 근무 계획 vs 근무 기록 선택"
- [x] `getWorkRegInfo` → Type 1 표 (코드 검증으로 재작성)
- [x] `RestReg` → 미사용 타입
- [x] 클릭 분기 → § "셀 클릭 동작"

### 도메인 모델

- [x] `holidayWorkAppl` vs `psnHoliWorkAppl` → `psnHoliWorkAppl` Deprecated(항상 빈 배열)
- [x] `overtimeWorkAppl` → `applsInProgress` 안은 요청중, 최상위는 승인된 사전 신청 raw. `ApprovedOvertimeWork` 표시 조건은 Type 10·11 공통 조건
- [x] `holiCalen` → 배열, `holiClass === "LAW"`(법정) 우선, 없으면 `"CTRT"`(회사) 항목을 `calendarHoliday`로 사용 (`getWorkMemoFromDayContents`)

### UI

- [x] `MoreHorizIcon` 동작, 캘린더 URL, 우측 위젯 구성 → 본문 반영
- [ ] 재택 칩과 기타근무 칩 동시 노출이 의도인지 (Type 12 ⚠️) — (2026-11-05 Slack 검색: '기타근무 > 재택' 결정은 출퇴근 위젯·전사 근무계획 캘린더 대상. 내 근무 캘린더 대상 결정 없음)

### 다국어

- [x] `sharedFunction.json` `attendance.*`: 휴일 "휴일", 휴무 "휴무", 요청중 "요청중", 취소 "취소중", 계획 "계획", 미정 "미정", 미수립 "미수립", 누락 "누락", 상태 "근무중/근무전/퇴근/자리비움", 재택 "재택", 휴가 "휴가". `attendance.json`: "근무완료"(`PERSONAL_WORK.workCompleted`), "연장/야간근무"(`PERSONAL_WORK.overtimeWork`), "휴일근무"(`HOLIDAY_WORK.calendar.holidayWork`)

---

## 두현님께 질문 (선택)

1. **재택 칩 vs 기타근무 칩** — 신청서 문서(remote-work)에는 "기타근무 있으면 재택 숨김"으로 되어 있는데, 현재 내 근무 캘린더는 둘 다 표시합니다. 의도된 변경인가요?
2. ~~**대체근무 요청중일 때 근무 계획 표시** — 예전 문서는 "가림"이었지만 현재 코드는 계획을 그대로 보여줍니다. 의도 맞나요?~~ → **(2026-11-05 Slack 확인) 의도.** 대체근무 신청서 잔여 작업 회의 결론 "캘린더에 요청중 대체근무 정보는 안 보여줘도 될 듯! (다른 신청서들과 동일하게)" — Slack #sq-time 2025-11-12 (https://hcgtheplus.slack.com/archives/C04QC2RJJBU/p1762926468097889?thread_ts=1762912671.172489&cid=C04QC2RJJBU). 즉 요청중 신청은 근무 계획을 바꾸거나 가리지 않음(계획은 승인 시 swap — #sq-time 2026-07-01 "대체근무 승인 시 근무일/휴무일 두 날짜의 확정 스케줄 swap"). 휴가·기타근무 요청도 계획을 가리지 않는 것과 동일 원칙. ⚠️ 단 2025-11-12 결론은 "요청중 대체근무 정보 자체를 캘린더에 안 보여줘도 됨"이었는데 현재 코드는 Type 9 "요청중" 항목을 **표시**함 — 이후 캘린더 요청중 표시 작업(#sq-time 2025-12-03 "신청서 > 대체근무: 조회")에서 추가된 것으로 보임(추정). 계획 표시 여부와는 무관

---

## 관련 문서

- `KB:product/user/home/checkin-widget.md` — 오늘 일자 셀의 출퇴근 상태 변화 트리거
- `KB:product/user/applications/overview.md` — `ApprovedHolidayWork` / `ApprovedOvertimeWork` 표시 조건
- `KB:product/user/applications/overview.md` — `OtherWorkRequest` / `CompensatoryWorkRequest` / `WorkPlanRequest` / 변경 신청
- **(2026-11-05)** `KB:product/user/applications/inout-record-change.md` — 출퇴근 내역 변경(과거 날짜 기본 신청서) / `KB:product/user/applications/work-plan-establishment.md` — 근무계획 수립("미수립" 표시, 수립 시각 표시)
- `KB:product/admin/leave/overview.md` — `LeaveReg` / `LeaveRequest` 표시 + 관리자 등록 휴가
- `KB:product/admin/work/check-work-data.md` — `hasModifiedWorkRecord` flag (어드민 수정 일자 차단은 `hasAdminModifiedWork` 기준 — 본 문서 § Cross-domain 주석 참고)
- `KB:product/admin/work/close-work-data.md` — `isClosed` flag (마감 → 신청서 드로어에서 경고 + 요청 비활성)
- `KB:product/admin/work/group-setting.md` — `workGrpVo` 권한 코드 (otPmitCd/holiWorkPmitCd/validWorkCd)
- `KB:product/admin/work/base-setting.md` — 휴일 / 근무 템플릿이 캘린더에 반영되는 경로
- `KB:domain/glossary.md` — AttendType 15종, WorkStatus 5종, WorkMemo 24개 flag
