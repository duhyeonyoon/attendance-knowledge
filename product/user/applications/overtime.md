---
sidebar:
  order: 3
---

# 연장/야간근무(사전) 신청

> **메뉴** 근무 신청 › 연장/야간근무(사전)  
> **원본** `product/_legacy/appl-holiday-overtime.md`

*원본 섹션: 신청서 2: 사전 연장/야간 (U15)*

## 조건

**어드민 근무그룹 설정 > 연장근무 > '승인시에만 연장 가능'** (`otPmitCd === "A"`)
**또는**
**어드민 근무그룹 설정 > 야간근무 > '승인시에만 야간 가능'** (`nightPmitCd === "A"`)

> `otPmitCd === "P"` (자유 허용)이면 신청 불필요. `otPmitCd === "N"` (불가)이면 출퇴근 위젯이 사전 차단.

## 코드 위치

**ppfront**:

```
src/components/workflow/shared/template_drawer/contents/
├── Overtime.tsx                       ⭐ 사전 연장/야간 신청서 본체
├── RequestDate.tsx                    (공유)
├── RequestTimeInfo.tsx                (공유)
├── RequestType.tsx                    (공유)
└── RequestButton.tsx                  (공유)

src/components/workflow/shared/approval_drawer/contents/
├── Overtime.tsx                       ← 승인 측
├── OvertimeCancel.tsx                 ← 취소 승인 측
└── cancel_drawer_template/contents/
    └── OvertimeCancelDrawer.tsx       ← 취소 drawer

src/@types/customTypes/workflow/overtime.d.ts ⭐ ← 타입 정의

src/modules/workflow/attendance/validation.ts ← getValidOvertime 등
src/modules/workflow/document.ts              ← getOvertimeValidApplList, getRemainOvertimeMinutes
```

**백엔드**:

```
be:controller/appls/otwork/
├── OtApplsController.java             ← 사전 연장/야간 신청
└── OtWorkCancelApplsController.java   ← 취소 신청

be:vo/
├── PsnOtPlanApplVo.java               ← VO (신청)
└── PsnOtPlanCancelApplVo.java         ← VO (취소)

be:dto/appls/overtime/
├── OtApplSmrDto.java                  ← 요약 DTO
├── OtApplsRequestDto.java
├── OtApplsResponseDto.java
└── OtApplValidTimeDto.java            ← 시간 검증 결과
```

## API 엔드포인트

**OtApplsController (신청 측)**:

| Method | Path | 용도 |
|--------|------|------|
| POST | `/time/appls/ot/search` | 조회 |
| POST | `/time/appls/ot/temp-saved` | 임시저장 |
| POST | `/time/appls/ot/apply` ⭐ | 신청 |
| POST | `/time/appls/ot/cancel` | 신청 자체 취소 |
| POST | `/time/appls/ot/rejected` | 반려 |
| POST | `/time/appls/ot/approval-done` | 결재완료 |
| POST | `/time/appls/ot/complete` | 완료 |
| POST | `/time/appls/ot/delete` | 삭제 |
| GET | `/time/appls/ot/valid-appl-list?ymd` | 해당 일자 유효 신청서 |
| GET | `/time/appls/ot/valid-time` ⭐ | 시간 유효성 검증 (`OtApplValidTimeDto`) |
| GET | `/time/appls/ot/remain-over-work?workYmd` ⭐ | 남아있는 연장 가능 시간 |

**OtWorkCancelApplsController (취소 측)**: HolidayWorkCancel과 동일 패턴. prefix **`/time/appls/ot-cancel`** + 표준 액션, 추가로 GET `/time/appls/ot-cancel/expected-remaining-overtime/{psnOtPlanApplId}` (예상 잔여 연장시간) — **(2026-11-05 해소)** `be:controller/appls/otwork/OtWorkCancelApplsController.java:51-160`

> 위 표의 `/search`, `/apply` 등은 약칭. 실제 액션 문자열은 `CONST_APPLY_ACTION` 기준 `/searchApply`, `/saveApply`, `/submitApply`, `/cancelApply`, `/reject`, `/approvalDone`, `/complete`, `/deleteApply` ([공통](./overview.md) § CONST_APPLY_ACTION)

## 동작 (QA L679–713 정리)

### 캘린더 선택

- 캘린더 오픈 시 **근무 계획이 "휴일"인 날짜는 선택 불가** (← 휴일근무는 별도 신청서)
- 하루만 선택 가능
- **신청일 기준 전일/당일/익일에 신청된 문서가 있을 경우** → 겹치지 않으면 신청 가능 안내
- 선택한 요청일이 **고정출퇴근제**일 경우:
  - 계획 퇴근시간이 시작 시각 기본값으로 자동 입력

### 시간 입력 + 밸리데이션

- 시작/종료 미입력, 역전, 동일 → 동일한 밸리데이션 (휴일근무와 비슷한 패턴)
- 신청 시간이 연장/야간에 해당하면 **연장/야간 정보 표시**
- **연장근무 → 승인시에만 + 당일 과거 시각 신청 허용 → 허용 안함 옵션** (`otPastApplyPolicyCd`):
  - 현재시간보다 당일 과거에 신청 시도 → 밸리데이션 메시지

### 최대 / 최소 초과근무시간 제한 표시

| 조건 | 화면 표시 |
|------|------|
| 최대 초과근무 제한 **설정됨** | 신청서 상단에 **설정 잔여시간 + 요청중 시간** 표시. 초과 시 밸리데이션 |
| 최대 초과근무 제한 **설정 안 됨** | 신청서 상단에 **법적 기준 잔여시간** "잔여 12h" 표시 (주간 예상 근무시간이 40h 초과면 `52h − 주간 예상 근무시간`). ~~초과해도 밸리데이션 미통과~~ → **(2026-11-05 해소) 초과해도 밸리데이션에 걸리지 않고 신청 가능** — 표시 전용 |
| 최소 초과근무 제한 **설정됨** | 신청서 단위로 최소 미달 시 오류 + 신청 불가 |

> **최대 미설정 시 동작 근거**: 프론트 `validateRemainOvertime`은 `checkHasMaxOvertimeLimit(overtimeSetting)`이 false면 `null` 반환 (`pp:src/hooks/attendance/useOvertimeRequestValidation.ts:253-262`). 12h/52h 표시는 `pp:src/components/workflow/shared/template_drawer/contents/RequestTimeInfo.tsx:166-185` — 코드 주석 "현재 법적 기준은 보여주기용이기 때문에 잔여시간이 0이하가 되더라도 밸리데이션 걸리지 않음". 백엔드 신청 저장도 `RemainingOvertime.deductRemainingOvertimeExcludingHolidayOrElseThrow`가 `hasOvertimeLimit=false`면 바로 return (`be:service/overtime/RemainingOvertime.java`, `be:service/appls/otwork/OtApplsService.java:199-215`). → 공통 룰 5번("밸리데이션 안 걸림")이 맞음
>
> **최대 설정 시 표시**: `[근무일|휴무일] 3h`, `[주간] …`, `[월간] …` 칩 형태로 기준별 잔여시간, 요청중 시간은 느낌표 아이콘 툴팁 "`Nh 요청중`"

### 연장/야간 구분

- **(2026-11-05 해소)** 화면에 "연장만/야간만" 선택 UI 없음. 입력 시간으로 자동 판단해 "`연장/야간 근무를 포함합니다.`" / "`연장 근무를 포함합니다.`" / "`야간 근무를 포함합니다.`" 표시 (`OVERTIME.includesTextWork`), 연장·야간 시간과 연장 휴게시간을 따로 보여줌
- 연장·야간 어느 쪽도 포함되지 않은 시간이면 오류 "`연장/야간 근무가 포함되어 있지 않습니다.`"

### 메시지 (화면 원문, `pp:src/locales/ko/workflow.json` `OVERTIME.*`)

| 상황 | 문구 |
|---|---|
| 요청일 미입력 | "요청일을 입력합니다." |
| 시작/종료 미입력 | "시작시각을 입력합니다." / "종료시각을 입력합니다." |
| 종료 < 시작 | "종료 시각이 시작 시각 전입니다." |
| 시작 = 종료 | "시작시각과 종료시각이 동일합니다." |
| 근무 가능 시간대 밖 | "당일 HH:mm ~ 익일 HH:mm 이내로 신청합니다." |
| 당일 과거 시각 (허용 안함 정책) | "당일의 경우, 현재 시각 기준 과거 시각으로 신청이 불가합니다." |
| 야간근무 불가 그룹인데 22~06시 포함 | "야간 근무 불가로 해당 시간(22:00 ~ 06:00)을 제외한 시간으로 신청하시기 바랍니다." |
| 이미 신청한 연장/야간과 시간 겹침 | "선택한 기간에 이미 신청한 연장/야간 근무가 있습니다. 중복요청은 불가합니다." (서버 저장 시: "이미 신청한 시간과 겹칩니다. 다른 시간으로 신청해 주세요.") |
| 최소 기준 미달 | "연장/야간 근무시간이 최소 기준(Nh)보다 적습니다." |
| 최대 잔여 초과 | "`근무일, 주간` 기준 잔여 시간을 초과했습니다." (초과한 기준명을 쉼표로 나열) |
| 전일/당일/익일에 기존 신청 있음 (안내) | "선택한 날짜에 이미 신청한 연장/야간 근무가 있습니다." + "기존 근무 정보와 중복이 아닌 경우에만 근무 신청이 가능합니다." + 기존 신청 목록 |
| 신청서 사용 중지 | 모달 제목 "연장/야간근무(사전) 신청 불가 안내", 본문 "연장/야간근무(사전) 신청서 사용이 중지되었습니다." |
| 첨부/코멘트 필수 (신청서 설정) | "첨부파일을 업로드합니다." / "코멘트를 입력합니다." |

### 겹침 판정

- **(2026-11-05 해소)** 같은 구성원의 **유효한(요청중·승인) 연장/야간(사전) 신청서**만 비교. 신청일 기준 **전일~익일** 신청서를 가져와 시간 구간이 겹치면 불가 (`be:service/appls/otwork/OtApplsService.java:508-570`). 휴일근무 등 다른 신청서는 비교 대상 아님
- 캘린더: 근무일유형이 휴일(`H`)인 날과 **오늘 이전 날짜**, 전월·익월 날짜는 선택 불가 (`pp:…/template_drawer/contents/Overtime.tsx:358-392`). 휴무일은 선택 가능

> 잔여시간 계산: `getRemainOvertimeMinutes(workYmd)` API
> 유효 신청서: `getOvertimeValidApplList(ymd)` API
> 시간 검증: `getValidOvertime` API → `OtApplValidTimeDto` 응답

### 취소

- 워크플로우에서 **승인된 연장/야간근무 신청서를 취소** (= `OtWorkCancelAppls.apply`)
- UI: `OvertimeCancelDrawer.tsx`, `OvertimeCancel.tsx`

### 근무 마감 차단

- 마감된 일자: 요청/승인/취소요청/취소승인 모두 불가 (QA L713)
