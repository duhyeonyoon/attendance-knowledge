# 내 근무 캘린더 (사용자 U6) — 케이스별 완전 정리

## 개요

사용자가 매일 보는 핵심 화면. 한 달의 모든 근무·휴가·신청서가 **하나의 캘린더 셀에 종합**되어 표시됩니다. **15가지 셀 표현 타입** + **16가지 아이콘** + **6가지 색상 체계** + **24가지 상태 flag**가 복합 작용하는 영역.

다른 모든 영역(출퇴근/휴가/신청서 7종/근무계획)의 결과물이 이 화면으로 모입니다.

### 진입 위치

- 근무관리 GNB 탭 > 내 근무
- URL: `/attendance/personal-work` 또는 유사 (정확 URL [TBD])
- 화면 구성: 좌측 캘린더 (메인) + 우측 출퇴근 위젯 + 근무 요약 정보 + 워크플로우 위젯

### QA 체크리스트

`ppfront/.claude/qa-checklist/attendance.md` **L179 ~ L209** (31줄, 짧지만 모든 셀의 동작을 함축)

## 코드 위치

### ppfront 핵심 파일

```
pages/attendance/                                              ← 페이지 진입점 [TBD URL]

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
| `hasModifiedWorkRecord` | 어드민 수정 여부 |
| `isClosed` | 마감 여부 (`closeYn === "Y"`) |

### `applsInProgress` 12종 (요청중 신청서)

`getTotalDayData` 가 이 12종을 보고 셀에 표시할 타입을 결정:

```
workRegAdjstAppl       // 근무 등록 보정 신청 (= 근무내역 변경)
psnWorkPlanAppl        // 개인 근무계획 변경 신청
compensatoryWorkAppl   // 대체근무 신청
psnHoliWorkAppl        // 사전 휴일근무 신청
inAppl                 // 출근 신청 (출퇴근 요청)
outAppl                // 퇴근 신청
leaveAppl              // 휴가 신청
leaveCancelAppl        // 휴가 취소 신청
otherWorkApplDtl       // 기타근무 신청
otherWorkCancelAppl    // 기타근무 취소 신청
holidayWorkAppl        // 휴일근무 (?) — overtimeWorkAppl 도 함께 — [TBD] holidayWork vs psnHoliWork 차이
holidayWorkCancelAppl  // 휴일근무 취소 신청
overtimeWorkAppl       // 연장/야간근무 (사전 신청 승인)
overtimeWorkCancelAppl // 연장/야간 취소 신청
```

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

**가장 자주 등장하는 타입.** 오늘/과거에서 출퇴근 기록을 표시.

| 상황 | 아이콘 | 타이틀 | 색상 | 설명 |
|------|------|------|------|------|
| 오늘 + 출근 요청 반려 후 퇴근만 있음 (`workHistoryChangeRequired`) | `error` (PriorityHigh 빨강) | "근무 내역 변경이 필요합니다" | missing | — |
| 오늘 + 근무내역 변경 진행중 | `pending` (3 dots 파랑) | "근무 내역 변경 요청 중" | normal | — |
| 오늘 + `workStatus === "ON"` (근무중) | (없음, 모바일 캘린더 시간 표시) | "근무중" 또는 `HH:MM ~` | normal | `HH:MM ~ ` |
| 오늘 + `workStatus === "OFF"` (출근 전) | `plan` (Create 아이콘) | "예정됨" or 시간 | normal/gray | 계획 출근~퇴근 |
| 오늘 + `workStatus === "PAUSE"` (자리비움) | `pause` (3 dots 주황) | "자리비움" | normal | 자리비움 종료시간 |
| 오늘 + `workStatus === "FINISH"` (퇴근 완료) | `check` (체크 파랑) | "퇴근" | complete | 출근~퇴근 시간 |
| 과거 + 정상 근무 | `check` | "근무" | complete | `HH:MM ~ HH:MM` |
| 과거 + **누락** (인정 조건 모두 실패) | `error` (빨강) | "누락" | missing | — |
| `workGrpVo.validWorkCd === "PLAN"` (계획 그룹) | `plan` | "근무 중" 텍스트만 | normal | — |
| `workTimeVisibleCd === "DENIED"` (시간 숨김) | (상태별) | "근무중" 등 텍스트만 | (상태별) | (description 비움) |

**근무내역 변경 진행중 우선순위**: `workRegAdjstAppl`이 진행중이면 "근무 내역 변경 요청 중" 표시가 우선.

**누락 조건** (QA L200–205, 과거 일자 한정):
- 근무일임
- 출퇴근 정보 없음
- 출퇴근/기타근무 쌍이 안 맞음
- 요청중/확정된 기타근무 없음
- 요청중/확정된 휴가 정보가 근무그룹 표준 근로시간 미만

**시간 표시 보정** (근무내역 변경 신청서 진입 시, QA L214):
- `workTimeVisibleCd === "DENIED"` + 출근인정시각 이전 출근 → **첫 출근시간 = 출근인정시각으로 보정** 표시

### Type 2: `WorkPlan` (근무 계획) ⭐

> **용어**: `WorkPlan` = **근무 계획 = 근무 스케줄** (동의어). `workPlan.ddWorkPlanNm`은 적용된 근무 템플릿 이름.

**미래 일자 또는 종일 휴가 미래에 표시.** 사용자가 어떤 근무를 할 예정인지.

| 상황 | 아이콘 | 타이틀 | 색상 | 설명 |
|------|------|------|------|------|
| `workPlan.ddWorkPlanNm` 있음 + 근무계획 변경 사용 가능 | `plan` (Create 파랑테두리) | 데스크톱: "예정됨" / 모바일: `HH:MM ~` | normal/gray | `HH:MM ~ HH:MM` |
| `workPlan.ddWorkPlanNm` 있음 + 근무계획 변경 사용 안함 | (없음) | (빈) | normal/gray | (동일) |
| `workPlan.ddWorkPlanNm` 없음 (스케줄 없음) | `undetermined` (! 주황) | "미정" | undetermined | (빈) |
| 출근시간 자율 (`isFlexTime`) | (위와 동일) | "자율 ~" 등 | (위와 동일) | "자율 ~ ..." |
| 근무시간 자율 (`!isFixTime`) | (위와 동일) | (위와 동일) | (위와 동일) | "... ~ 자율" |

**클릭 가능 조건** (`canOpenWorkPlanEdit`):
- 오늘 또는 미래 일자
- `isWorkDay === true` (근무일)
- `requiredPlanEditAppl === true` (그룹 설정에서 근무계획 변경 사용 ON)

→ 클릭 시 **근무계획 변경 신청서** drawer 오픈

### Type 3: `WorkRequest` (근무 관련 요청)

**`applsInProgress`의 8종 중 하나가 진행중**일 때 표시 (`workRegAdjstAppl`, `psnHoliWorkAppl`, `inAppl`, `outAppl`, `holidayWorkAppl`, `holidayWorkCancelAppl`, `overtimeWorkAppl`, `overtimeWorkCancelAppl`).

| 상황 | 아이콘 | 타이틀 | 색상 | 설명 |
|------|------|------|------|------|
| 일반 요청 (휴일/연장 취소 X) | `pending` (3 dots 파랑) | "요청 중" | normal / 모바일 complete | — |
| 휴일근무 취소 / 연장 취소 진행중 | `holidayWorkCancelPending` (- 파랑) | "취소 요청 중" | normal / 모바일 complete | — |

**클릭 시**: 해당 요청서 상세 drawer 오픈

### Type 4: `OtherWork` (기타근무 — 확정/사용)

**기타근무가 등록되어 사용 중**일 때.

| 상황 | 아이콘 | 타이틀 | 색상 | 설명 |
|------|------|------|------|------|
| 데스크톱 + 시간 단위 | `attend` (Location 갈색) | `otherWorkName` (예: "출장") | normal | `HH:MM ~ HH:MM` |
| 데스크톱 + 종일 (`useUnit === "DAY"`) | `attend` | 기타근무 이름 | normal | (빈) |
| 모바일 캘린더 | `attend` | `HH:MM ~ ` | gray | (없음) |

**제목 4글자 초과 시 툴팁** 표시 (모든 타입 공통, 코드 L294: `(info.title ?? "").length > 4`).

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
| 진행중 (모바일 drawer) | `pending` | "요청 중" | leave (?) | `근무일 -> 휴일` 또는 `휴일 -> 근무일` (workYmdType 매핑) |

### Type 10: `ApprovedHolidayWork` (사전 휴일근무 승인됨)

**휴일인데 사전 휴일근무 신청이 승인된 경우.** `isHoliday + holidayWorkAppl 승인 완료`.

| 상황 | 아이콘 | 타이틀 | 색상 | 설명 |
|------|------|------|------|------|
| 휴일 + 승인 휴일근무 | `briefcase` (가방 파랑테두리) | "휴일근무" | normal / 모바일 gray | `HH:MM ~ HH:MM` (계획 시각) |

### Type 11: `ApprovedOvertimeWork` (사전 연장/야간 승인됨)

**휴일 아닌 일자 + 사전 연장 신청 승인됨.** `!isHoliday + overtimeWorkAppl 승인 완료`.

| 상황 | 아이콘 | 타이틀 | 색상 | 설명 |
|------|------|------|------|------|
| 평일 + 승인 연장근무 | `briefcase` | "연장근무" | normal / 모바일 gray | `HH:MM ~ HH:MM` (계획 시각) |

### Type 12: `HomeWork` (재택근무)

`workForHomeYn === "Y"` 일 때.

| 상황 | 아이콘 | 타이틀 | 색상 | 설명 |
|------|------|------|------|------|
| 데스크톱 | `home` (집 진한 파랑) | "재택" | normal | (빈) |
| 모바일 캘린더 | `home` | (빈) | normal/gray | (빈) |

**우선순위**: 기타근무 Chip이 있으면 재택 Chip은 노출 안 됨 (`KB:product/appl-other-forms.md` § 1).

### Type 13: `Holiday` (휴일)

`isHoliday + workMinutes <= 0` (휴일이면서 근무 없음).

| 상황 | 아이콘 | 타이틀 | 색상 | 설명 |
|------|------|------|------|------|
| 휴일 | (없음) | "휴일" 또는 휴일명 | gray | (빈) |

### Type 14: `DayOff` (휴무일)

`isOff + workMinutes <= 0` (휴무일이면서 근무 없음).

| 상황 | 아이콘 | 타이틀 | 색상 | 설명 |
|------|------|------|------|------|
| 휴무일 | (없음) | "휴무일" | gray | (빈) |

### Type 15: `RestReg` (자리비움 기록)

> 코드에 정의되어 있으나 `makeMyInfo`에서 명시적 분기 없음. 다른 타입과 통합되어 표시 추정. [TBD] 정확한 노출 케이스

---

## 표시 우선순위 / 구성 로직 (`getTotalDayData`)

`pp:src/lib/attendance/personalWork.ts:1866` — 셀의 N개 컨텐츠 결정 로직.

### 데이터 그룹화

```
holiday          := isHoliday ? {type: "Holiday"} : null
dayOff           := isOff ? {type: "DayOff"} : null
workRequest      := workRegAdjstAppl + psnHoliWorkAppl + inAppl + outAppl
                    + holidayWorkAppl + holidayWorkCancelAppl
                    + overtimeWorkAppl + overtimeWorkCancelAppl
                  → 각각 {type: "WorkRequest"}
leaveRequest     := leaveAppl + leaveCancelAppl → {type: "LeaveRequest"}
otherWorkRequest := otherWorkApplDtl + otherWorkCancelAppl → {type: "OtherWorkRequest"}
workPlanRequest  := psnWorkPlanAppl → {type: "WorkPlanRequest"}
compensatoryWorkRequest := compensatoryWorkAppl → {type: "CompensatoryWorkRequest"}
leaveReg         := leaveUseHistory → {type: "LeaveReg"}
otherWork        := otherWork → {type: "OtherWork"}
workAttend       := WorkReg or WorkPlan or ApprovedHolidayWork or ApprovedOvertimeWork (분기는 getWorkAttendData)
homeWork         := workForHomeYn === "Y" && !otherWork.length ? {type: "HomeWork"} : null
```

### 자정 cutoff 동적 계산 (`workDayStartHour`)

```ts
workDayStartHour = workPlan.workStaHm 
  ? (계획출근시각 - 3시간).hours()  // 백엔드 룰과 일치
  : 6                                // 시스템 기본
```

`isPastOrToday = isPast || (isToday && 현재시각 >= workDayStartHour)`

> 이전 deep-dive에서 확인된 동적 cutoff 룰 (`KB:product/user-checkin-widget.md` § "자정 이후 특수 동작")이 캘린더 셀 판정에도 일관 적용됨.

### `isPendingRequest` (요청중 우선 노출)

다음 중 하나라도 참이면 근무 계획을 안 보여줌 (요청 정보만):

1. **!isPastOrToday (미래) + 근무계획 변경 신청중**: 요청중만 노출
2. **대체근무 요청중**: 근무 계획 가림
3. **다른 요청중 문서 있음 + (연장/야간 신청 / 취소 신청은 제외)**: 가림

> 연장/야간 신청·취소는 예외 — 근무 계획과 함께 표시 가능 (계획 시간 외 추가로 보여야 하므로)

### `isWorkEntryNull` (워크 정보 자체 가림)

다음 조건 중 하나면 출퇴근 데이터 자체 가림:
- 종일 휴가 + 미래
- 종일 휴가 요청중 또는 종일 휴가 + `workMinutes <= 0`
- 휴일 + `workMinutes <= 0`
- 휴무일 + `workMinutes <= 0`

### 모바일 vs 데스크톱 표시

**데스크톱**: `dayData.slice(0, visibleCount)` — 화면 크기에 맞춰 N개 다 표시  
**모바일**: `checkMobileTopPriorityDayContent`로 1개만 선택해서 표시

> 모바일은 1셀에 1개 컨텐츠만. 우선순위 룰 [TBD] — `checkMobileTopPriorityDayContent` 함수 본체 미확인

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
- 우측 출퇴근 위젯과 양방향 동기화 (`KB:product/user-checkin-widget.md`)

### 미래 (Future)

- **근무 스케줄 계획 정보** 표시 (`WorkPlan` 타입)
- 스케줄 없음 → "미정" (`undetermined` 색상)
- 근무계획 변경 신청 가능한 그룹이면 → 클릭하여 신청서 오픈

---

## 셀 클릭 동작 (`handleClickDetail`)

`MyWorkCalendarCell.tsx`의 `handleClickDetail` 함수 (정확한 분기 [TBD], 1088줄 파일).

### 일반적인 흐름

1. 클릭된 셀의 type 확인
2. type별로 다른 drawer/modal 오픈:
   - `WorkReg` 과거 → 근무내역 변경 신청서 (`RegEdit.tsx`)
   - `WorkPlan` 미래 + 근무계획 변경 사용 → 근무계획 변경 신청서 (`PlanEdit.tsx`)
   - `OtherWork` → 기타근무 상세 (또는 `AdminDirectOtherWorkDialog` 어드민 등록 시)
   - `LeaveReg` → 휴가 상세 (또는 `AdminDirectLeaveDialog` 어드민 등록 시)
   - `WorkRequest` → 해당 요청서 상세 (출퇴근/근무내역/휴일근무/연장 등)
   - `LeaveRequest` → 휴가 신청서 또는 휴가 취소 신청서
   - `OtherWorkRequest` → 기타근무 신청서 또는 취소 신청서
   - `WorkPlanRequest` → 근무계획 변경 신청서
   - `CompensatoryWorkRequest` → 대체근무 신청서
   - `ApprovedHolidayWork` → 휴일근무 신청서 (승인 완료)
   - `ApprovedOvertimeWork` → 연장근무 신청서 (승인 완료)
3. 문서 상태 변경 시 캘린더 데이터 갱신 (QA L208)

### 모바일에서 `MoreHorizIcon`

여러 컨텐츠가 있는 셀에서 모바일은 1개만 표시 → 추가 컨텐츠는 `MoreHorizIcon`으로 표시되고 클릭 시 SwipeableDrawer로 전체 확인 가능 (추정, [TBD] 확인).

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
| 사용자 재택근무 승인 | `HomeWork` 표시 (단, 기타근무 있으면 가려짐) |
| 사용자 사전 휴일근무 승인 | 휴일 일자에 `ApprovedHolidayWork` 추가 |
| 사용자 사전 연장/야간 승인 | 평일 일자에 `ApprovedOvertimeWork` 추가 |
| 사용자 근무내역 변경 신청 | `WorkRequest` (workRegAdjstAppl) 표시 |
| 사용자 근무계획 변경 신청 | `WorkPlanRequest` 표시 (계획 가림) |
| 사용자 대체근무 신청 | `CompensatoryWorkRequest` 표시 (계획 가림) |
| 어드민 출퇴근내역 직접 수정 | `hasModifiedWorkRecord = true` → 변경 신청 시도 시 차단 |
| 어드민 휴가 수동 등록 | 사용자 화면에 `LeaveReg` + `AdminDirectLeaveDialog` |
| 어드민 기타근무 직접 등록 | 사용자 화면에 `OtherWork` + `AdminDirectOtherWorkDialog` |
| 어드민 근무 마감 | `isClosed = true` → 셀 클릭 시 신청서 진입 차단 |
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

### 누락 조건 (과거 한정, 모두 만족 시)

1. 근무일임
2. 출퇴근 정보 없음
3. 출퇴근/기타근무 쌍이 안 맞음
4. 요청중/확정 기타근무 없음
5. 요청중/확정 휴가 정보가 근무그룹 표준 근로시간 미만

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

- **요청중 신청서 있으면 근무계획 가림** (연장/야간 신청·취소 예외)
- **대체근무 요청 → 근무계획 가림**
- **미래 + 근무계획변경 요청중 → 요청중만 노출**
- **종일 휴가 미래 → workEntry 자체 가림**
- **기타근무 Chip > 재택 Chip** (둘 다 승인 시 기타근무가 표시됨)
- **모바일은 1셀에 1개 컨텐츠만** (`checkMobileTopPriorityDayContent`)

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

### 핵심 로직 미확인

- [ ] `checkMobileTopPriorityDayContent` 우선순위 함수 본체 — 모바일에서 어떤 type이 우선되는지 룰
- [ ] `getWorkAttendData` 본체 — `WorkReg` / `WorkPlan` / `ApprovedHolidayWork` / `ApprovedOvertimeWork` 중 어느 것을 선택할지 분기
- [ ] `getWorkRegInfo` 본체 — `WorkReg` 타입의 정확한 분기 (현재는 추정으로 작성)
- [ ] `RestReg` 타입의 노출 케이스
- [ ] `MyWorkCalendarCell.tsx` 1088줄의 정확한 클릭 분기

### 도메인 모델 미확인

- [ ] `holidayWorkAppl` (applsInProgress) vs `psnHoliWorkAppl` 차이 — 둘 다 휴일근무 관련이지만 분리됨
- [ ] `overtimeWorkAppl` (applsInProgress)이 어떤 시점에 들어가는지 — `ApprovedOvertimeWork` 표시 조건
- [ ] `EmpDailyWorkDto`의 `holiCalen` 구조 (`calendarHoliday` 어떻게 추출)

### UI 미확인

- [ ] 모바일에서 여러 컨텐츠 있을 때 `MoreHorizIcon` 동작
- [ ] 정확한 캘린더 URL
- [ ] 캘린더 우측 위젯 영역 (출퇴근 위젯 + 근무 요약 + 워크플로우 위젯)의 구체적 구성

### 다국어

- [ ] 휴일/휴무일/요청중/취소요청중 i18n 키 정확한 위치 (`sharedFunction.json` 추정)

---

## 두현님께 질문 (선택)

코드 추가 분석으로 답이 나오지 않는 부분:

1. **`holidayWorkAppl` vs `psnHoliWorkAppl` 차이** — 둘 다 휴일근무 진행중 배열인데 왜 분리되어 있나요? (백엔드 별도 컨트롤러? 흐름이 다른가?)
2. **모바일에서 1셀 1컨텐츠 우선순위** — 의도된 룰 (예: 신청중 > 휴가 > 근무 등)? 아니면 단순 첫 번째?
3. **`RestReg` 타입의 실제 노출 케이스** — 코드에 정의는 있지만 makeMyInfo에 분기 없음

---

## 관련 문서

- `KB:product/user-checkin-widget.md` — 오늘 일자 셀의 출퇴근 상태 변화 트리거
- `KB:product/appl-holiday-overtime.md` — `ApprovedHolidayWork` / `ApprovedOvertimeWork` 표시 조건
- `KB:product/appl-other-forms.md` — `OtherWorkRequest` / `CompensatoryWorkRequest` / `WorkPlanRequest` / 변경 신청
- `KB:product/leave-domain.md` — `LeaveReg` / `LeaveRequest` 표시 + 관리자 등록 휴가
- `KB:product/admin-work-data.md` — `hasModifiedWorkRecord` flag (어드민 수정 → 변경 신청 차단)
- `KB:product/admin-work-close.md` — `isClosed` flag (마감 → 셀 클릭 시 신청서 차단)
- `KB:product/admin-work-group.md` — `workGrpVo` 권한 코드 (otPmitCd/holiWorkPmitCd/validWorkCd)
- `KB:product/admin-work-setting.md` — 휴일 / 근무 템플릿이 캘린더에 반영되는 경로
- `KB:domain/glossary.md` — AttendType 15종, WorkStatus 5종, WorkMemo 24개 flag
