---
sidebar:
  order: 1
---

# 휴일근무(사전) 신청

> **메뉴** 근무 신청 › 휴일근무(사전)  
> **원본** `product/_legacy/appl-holiday-overtime.md`

*원본 섹션: 신청서 1: 사전 휴일근무 (U14)*

## 조건

**어드민 근무그룹 설정 > 휴일근무 > '승인시에만 근무 가능'** (`workGrpVo.holiWorkPmitCd === "A"`) 일 때만 사용자가 신청 가능

> `holiWorkPmitCd === "N"` (휴일근무 불가)이면 사용자는 신청 자체 불가, 출퇴근 위젯에서 사전 차단됨 (`isHolidayWorkUnavailableOnWork`)

## 코드 위치

**ppfront (사용자 화면)**:

```
src/components/workflow/shared/template_drawer/
├── index.tsx                          ← 신청서 drawer 컨테이너
└── contents/
    ├── DayOff.tsx              ⭐     ← 사전 휴일근무 신청서 본체
    ├── RequestDate.tsx                ← 요청일 선택 (캘린더)
    ├── RequestTimeInfo.tsx            ← 시간 입력 + 정보
    ├── RequestType.tsx                ← 신청서 종류 선택
    ├── RequestButton.tsx              ← 신청/임시저장 버튼
    ├── Attachment.tsx                 ← 첨부
    └── FileUpload.tsx                 ← 파일 업로드

src/components/workflow/shared/approval_drawer/
└── contents/
    ├── DayOff.tsx                     ← 승인 측 (2026-11-05 확인)
    ├── DayOffCancel.tsx               ← 취소 신청 승인 측
    └── cancel_drawer_template/contents/DayOffCancelDrawer.tsx (취소 drawer)

src/hooks/attendance/useHolidayWorkRequestValidation.ts ⭐  ← 휴일근무 신청 밸리데이션 훅

src/modules/workflow/attendance/validation.ts            ← API 클라이언트
```

> ⚠️ 명명 주의: 컴포넌트 파일명은 `DayOff.tsx`지만 실제로는 **사전 휴일근무 신청서**입니다. ("DayOff" = "휴일"의 영문 번역). 코드 검색 시 헷갈리지 않게 주의.

**백엔드**:

```
be:controller/appls/holidaywork/
├── HolidayWorkApplsController.java        ← 사전 휴일근무 신청
└── HolidayWorkCancelApplsController.java  ← 사전 휴일근무 취소 신청

be:vo/PsnHoliWorkApplVo.java                ← VO
```

## API 엔드포인트

**HolidayWorkApplsController (신청 측)**:

| Method | Path | 용도 |
|--------|------|------|
| POST | `/time/appls/holiday-work/search` | 조회 |
| POST | `/time/appls/holiday-work/temp-saved` | 임시저장 |
| POST | `/time/appls/holiday-work/apply` ⭐ | 신청 (submit) |
| POST | `/time/appls/holiday-work/cancel` | 신청 자체 취소 (결재 전) |
| POST | `/time/appls/holiday-work/rejected` | 반려 (승인자) |
| POST | `/time/appls/holiday-work/approval-done` | 결재완료 |
| POST | `/time/appls/holiday-work/complete` | 완료 |
| POST | `/time/appls/holiday-work/delete` | 삭제 |
| GET | `/time/appls/holiday-work/valid-appl-list?ymd=YYYYMMDD` ⭐ | 해당 일자의 유효 신청서 목록 |
| GET | `/time/appls/holiday-work/valid-time?workYmd&inPlanTime&inStdDdClass&outPlanTime&outStdDdClass` ⭐ | 시간 유효성 검증 |
| GET | `/time/appls/holiday-work/calendar?ym=YYYYMM` ⭐ | 캘린더 데이터 (휴일 표시) |

**legacy 경로** (`controller/legecy/LegacyRecordWidgetController`):
- GET `/time/appls/holiday-work/is-necessary` — 신청 필요 여부 판단

**HolidayWorkCancelApplsController (취소 측)** — 결재 완료된 신청을 취소:

| Method | Path | 용도 |
|--------|------|------|
| POST | `/time/appls/holiday-work-cancel/search` | 조회 |
| POST | `/time/appls/holiday-work-cancel/temp-saved` | 임시저장 |
| POST | `/time/appls/holiday-work-cancel/apply` | 취소 신청 |
| POST | `/time/appls/holiday-work-cancel/cancel` | 취소 신청 취소 |
| POST | `/time/appls/holiday-work-cancel/rejected` | 반려 |
| POST | `/time/appls/holiday-work-cancel/approval-done` | 결재완료 |
| POST | `/time/appls/holiday-work-cancel/complete` | 완료 |
| POST | `/time/appls/holiday-work-cancel/delete` | 삭제 |
| GET | `/time/appls/holiday-work-cancel/expected-remaining-overtime/{holidayWorkApplId}` | 예상 잔여 연장시간 |

> 위 표의 `/search`, `/apply` 등 액션은 약칭. 실제 문자열은 `CONST_APPLY_ACTION` 기준 `/searchApply`, `/saveApply`, `/submitApply`, `/cancelApply`, `/reject`, `/approvalDone`, `/complete`, `/deleteApply` ([공통](./overview.md))

## 동작 (QA L657–675 정리)

### 캘린더 선택

- 캘린더 오픈 시 **근무 계획이 "휴일"인 날짜만 선택 가능** (백엔드: `getHolidayWorkCalendar`)
  - **(2026-11-05 해소) "휴일" 판정** = 일자별 근무일유형(`workYmdType`)이 휴일(`H`)인지(`holidayYn === "Y"`). 미래·당일은 근무계획의 근무일유형, 과거는 집계 데이터 우선 (`be:common/legacy/empdailywork/EmpDailyWorkService.java:1570-1606`). **휴무일(`O`)은 선택 불가** → 휴무일 근무는 연장/야간(사전) 신청서 대상
  - 오늘 이전 날짜도 비활성 (`pp:…/template_drawer/contents/DayOff.tsx:254-268`). 서버도 "과거에 대해서는 휴일 근무 신청을 할 수 없습니다. 근무내역 변경 신청서를 이용바랍니다." 로 차단
- 하루만 선택 가능
- 이미 신청된 문서가 있을 경우 → "겹치지 않으면 신청 가능하다" 안내 문구 (백엔드: `getHolidayWorkValidApplList`)
- **(2026-11-05 해소) 겹침 판정**: 같은 구성원의 요청중·승인완료 상태인 **휴일근무(사전) 신청서**만 비교, 신청일 전일~익일 범위에서 시간 구간이 겹치면 불가 (`be:validator/appls/holidaywork/HolidayWorkApplDuplicateValidator.java`). 서버 오류 문구 "이미 신청중인 신청서에서 해당 시간까지 요청되어있습니다."

### 시간 입력 + 밸리데이션 (`useHolidayWorkRequestValidation`)

검증 함수 4종 (`pp:src/hooks/attendance/useHolidayWorkRequestValidation.ts`):

| 함수 | 검증 내용 | 에러 메시지 키 |
|------|------|------|
| `validateWorkYmd` | 요청일 유효성 | `HOLIDAY_WORK.errors.requestDate` |
| `validateInPlanTime` | 시작 시각 미입력/잘못된 형식 | `HOLIDAY_WORK.errors.emptyStartTime` |
| `validateOutPlanTime` | 종료 시각 미입력/잘못된 형식 | `HOLIDAY_WORK.errors.emptyEndTime` |
| `validateImpossiblePlanTime` | 시작 ≥ 종료 (역전/동일) | `HOLIDAY_WORK.errors.endTimeBeforeStartTime` / `endTimeSameStartTime` |

`inStdDdClass`/`outStdDdClass` 가 `NXD`(익일)인 경우 `+1 day`로 datetime 계산 → 야간 근무대 처리 가능.

그 외 훅 검증: `validateImpossibleNightWork`(야간 불가 그룹), `validateRequestWithinTime`(근무 가능 시간대), `validatePlanTimeForLimitedOvertime`(최대 잔여), `validateMinOvertimeCutoffMinutes`, `validateDuplicateHolidayWork`(서버 `invalidCode === "used"`), `validateTodayPast`(`holiPastApplyPolicyCd === "DENY_TODAY_PAST"`), `validateRequiredFile`/`validateRequiredComment`(신청서 설정).

**화면 메시지 원문 (2026-11-05 해소, `pp:src/locales/ko/attendance.json` `HOLIDAY_WORK.*`)**:

| 상황 | 문구 |
|---|---|
| 요청일 미입력 | "요청일을 입력합니다." |
| 시작/종료 미입력 | "시작 시각을 입력합니다." / "종료 시각을 입력합니다." |
| 종료 < 시작 | "종료 시각이 시작 시각 전입니다." |
| 시작 = 종료 | "종료 시각이 시작 시각과 같습니다." |
| 근무 가능 시간대 밖 | "당일 HH:mm ~ 익일 HH:mm 이내로 신청합니다." |
| 야간 불가 그룹인데 22~06시 포함 | "야간 근무 불가로 해당 시간(22:00 ~ 06:00)을 제외한 시간으로 신청하시기 바랍니다." |
| 당일 과거 시각 (허용 안함 정책) | "당일의 경우, 현재 시각 기준 과거 시각으로 신청이 불가합니다." |
| 이미 신청한 휴일근무와 겹침 | "선택한 기간에 이미 신청한 휴일 근무가 있습니다. 중복요청은 불가합니다." |
| 최소 기준 미달 | "휴일 근무시간이 최소 기준(Nh)보다 적습니다." |
| 최대 잔여 초과 | "`휴일, 주간, 월간휴일, 월간` 중 초과한 기준 + 기준 잔여 시간을 초과했습니다." |
| 같은 날 기존 신청 있음 (안내) | "선택한 날짜에 이미 신청한 휴일 근무가 있습니다." + "기존 근무 정보와 중복이 아닌 경우에만 근무 신청이 가능합니다."  기존 신청 목록에는 **사후 신청 건도 함께 표시** (목록 조회가 사전·사후를 함께 반환, `be:HolidayWorkApplsController.java:162-167`, 2026-11-05) |
| 신청서 사용 중지 | "휴일 근무(사전) 신청 불가 안내" / "휴일 근무(사전) 신청서 사용이 중지되었습니다." |
| 마감일 (서버) | "선택한 일자의 근무가 마감되어 사전 휴일 근무를 신청할 수 없습니다." |
| 첨부/코멘트 필수 | "첨부파일을 업로드합니다." / "코멘트를 입력합니다." |

**첨부·코멘트 필수 여부 (2026-11-05 해소)**: 어드민 "근무 신청서 관리"의 휴일근무(사전) 신청서 설정(`requireFileYn`/`requireCommentYn`)을 따름 (`pp:…/template_drawer/contents/DayOff.tsx:184-185`). 같은 설정에 신청서 설명(드로어 상단 접이식 안내)과 사용 여부도 있음

### 시간 결과 표시

- "변경 결과" 영역: 출퇴근 / 휴게시간 / 상세 시간 / 근무시간 표시
- 휴게시간 안내 "회사에서 지정한 휴게 기준에 따라 휴게시간이 자동으로 부여됩니다.", 자동 휴게는 "(자동 차감)" 표기. **(2026-11-05 Slack 확인) 휴게 산정 규칙**: 해당 일자 근무 템플릿의 휴게 설정을 따름 — 자동(법정 4시간당 30분 / 주기별 N시간마다 M분)은 신청 시작 시각 기준으로 구간 계산, 고정 휴게는 신청 구간과 겹치는 부분만. 휴일은 소정 8시간까지 기본 휴게, 그 이후는 연장으로 보고 연장 휴게 설정 적용(휴무일 근무는 전체가 연장이라 연장 휴게). 안내 문구는 법정 30분 고정 문구에서 위 공통 문구로 교체(로드맵 726, 2026-09) — Slack #sq-time (https://hcgtheplus.slack.com/archives/C04QC2RJJBU/p1787721270470399) 연장 휴게시간 포함 시 "연장 휴게시간을 포함한 연장근무를 한 경우 해당 휴게시간도 포함하여 시간을 노출합니다."
- 신청 시간이 **연장/야간에 해당하면 추가 정보** 표시 (`isOverlappingNightTime` 체크 — 22~06시)
- 최대 초과근무 시간 제한 설정 시:
  - 신청서 상단에 **잔여시간 + 요청중 시간** 표시
  - 잔여시간 초과 시 밸리데이션 메시지
- 최소 초과근무 시간 제한 설정 시:
  - 신청서 단위 최소 미달 시 경고 + 신청 불가

### 신청서 취소 (3가지 케이스)

| 시점 | 취소 방법 |
|------|------|
| 미래 일자 | 내 근무 페이지 → 신청된 휴일근무 클릭 → 취소 |
| 당일 (출퇴근 전) | 내 근무 페이지 → 신청된 휴일근무 클릭 → 취소 |
| 과거 / 당일 출퇴근 후 | 워크플로우에서 **승인된 휴일근무 신청서 취소** (= `HolidayWorkCancelAppls` 신청서 발행) |

> 취소 신청 드로어(`DayOffCancelDrawer.tsx`)는 취소 후 예상 잔여 초과근무시간(일/주/월/월간휴일)을 보여줌 — `expected-remaining-overtime` API (2026-11-05 확인)

> "신청 자체 취소"(`/cancel`) vs "결재 완료된 신청을 취소 신청"(`HolidayWorkCancelAppls.apply`) 두 개념이 다름

### 근무 마감 차단

- 마감된 일자: 요청/승인/취소요청/취소승인 모두 불가 (QA L675, `KB:product/admin/work/close-work-data.md` cross-domain 참조)
