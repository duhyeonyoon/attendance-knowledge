---
sidebar:
  order: 2
---

# 휴일근무(사후) 신청

> **메뉴** 근무 신청 › 휴일 근무(사후) — 출퇴근 위젯 [근무신청] 메뉴 "휴일 근무(사후) 신청"  
> **문서유형** 1122 "휴일 근무(사후) 신청" / 1123 "휴일 근무(사후) 취소 신청" (`pp:src/locales/ko/workflow.json` `APPL_TYPE`)  
> **기준** ppfront·optimiz-time·talenx-admin `origin/dev` (2026-11-05). 도입: ppfront#11509, optimiz-time#1711, talenx-admin#4512 (로드맵 739·740·744)

## 개요

- **지난 휴일**에 실제로 근무한 시간을 **사후에** 승인받는 사용자 신청서. 짝이 되는 [휴일근무(사전) 신청](./holiday-work.md)과 같은 입력(요청일 1일 + 시작/종료 시각)·같은 시간 계산을 쓰고, 대상 날짜만 "오늘 이전"으로 뒤집힌 형태
- 승인되면 사전 신청과 **같은 집계 경로**로 반영 — 승인 구간 ∩ 실제 출퇴근 기록만 휴일근무로 인정 (§ 인정 시간 반영)
- 드로어 상단 기본 안내문(신청서 설명 미설정 시): "휴일에 근무한 시간을 사후에 신청합니다.\n실제 근무 기록으로 휴일 근무 시간을 확정해 차이가 발생할 수 있습니다." (`HOLIDAY_WORK.form.postHolidayWorkDescription`, `pp:…/template_drawer/contents/PostDayOff.tsx:519-530`)
- 어드민 조회 화면: [근무 신청 내역 관리](../../admin/work/appl-management.md) § 9 휴일근무(사후) 신청 탭

## QA 체크리스트 출처

- ppfront / talenx-admin `.claude/qa-checklist/attendance.md`에 사후 신청서 항목 **없음** (2026-11-05 `git show origin/dev` grep "사후" 0건). 이 문서는 코드 기준

## 코드 위치

**ppfront**

```
src/components/workflow/shared/template_drawer/contents/PostDayOff.tsx   ⭐ 신청서 본체 (applTypeCd "1122")
src/components/workflow/shared/approval_drawer/contents/PostDayOff.tsx   ← 결재 문서 상세
src/components/workflow/shared/approval_drawer/contents/PostDayOffCancel.tsx  ← 1123 결재 문서 상세
src/components/workflow/shared/approval_drawer/contents/cancel_drawer_template/contents/PostDayOffCancelDrawer.tsx  ← 취소 신청 드로어
src/hooks/attendance/useHolidayWorkRequestValidation.ts   ← 사전과 공용 검증 훅
src/components/main/work_commute/contents/WorkRequest.tsx  ← 근무신청 메뉴 노출 조건 (:183-189, :324-333)
src/@types/customTypes/attendance/dayOffBizData.d.ts        ← applTypeCd "1120" | "1122"
```

- 공용 API 함수: `getHolidayWorkCalendar`, `getHolidayWorkValidApplList`(사전 엔드포인트 재사용), `getPostHolidayWorkValidTime`, `getPostHolidayWorkFormSetting`, `getRemainOvertimeMinutes`(사전 연장 엔드포인트 재사용) — `pp:…/PostDayOff.tsx:48-57`

**백엔드 (optimiz-time)**

```
be:controller/appls/holidaywork/PostHolidayWorkApplsController.java        ← /time/appls/post-holiday-work
be:controller/appls/holidaywork/PostHolidayWorkCancelApplsController.java  ← /time/appls/post-holiday-work-cancel
be:service/appls/postholidaywork/PostHolidayWorkApplsService.java          ⭐ 신청 검증·저장·완료
be:service/appls/postholidaywork/PostHolidayWorkCancelApplsService.java    ← 취소 신청
be:service/appls/holidaywork/HolidayWorkApplsService.java                  ← 시간 계산·중복 검증 공용 (isPostAppl 분기)
be:service/appls/holidaywork/HolidayWorkApplQueryService.java              ← 사전+사후 통합 조회 (집계·중복)
be:validator/appls/holidaywork/HolidayWorkApplDuplicateValidator.java      ← 겹침 판정 (사전+사후)
be:service/setting/PostHolidayWorkFormSettingService.java                  ← 어드민 신청서 설정
```

- DB: `TM_POST_HOLIDAY_WORK_APPL`, `TM_POST_HOLIDAY_WORK_CANCEL_APPL`, `TM_POST_HOLIDAY_WORK_FORM_SETTING` (마이그레이션 `20260923_01~04`, 기존 근무그룹에 `USE_YN='N'` 백필)
- 문서유형 상수: `be:constant/CONST_TIME_APPLS.java:35-36` (`POST_HOLIDAY_WORK("1122")`, `POST_HOLIDAY_WORK_CANCEL("1123")`)

## API 엔드포인트

| Method | Path | 용도 |
|---|---|---|
| POST | `/time/appls/post-holiday-work/searchApply` | 조회 (`isClosed`, 휴게시간 포함) |
| POST | `/time/appls/post-holiday-work/saveApply` · `/submitApply` | 임시저장 · 신청 (같은 저장 로직) |
| POST | `/time/appls/post-holiday-work/cancelApply` · `/reject` · `/approvalDone` · `/complete` · `/deleteApply` | 회수 · 반려 · 결재완료(무동작) · 완료(+재집계) · 임시저장 삭제 |
| GET | `/time/appls/post-holiday-work/valid-time` | 유효 신청시간 계산 (실제 출퇴근 기록은 필수 아님 — 컨트롤러 설명) |
| GET | `/time/appls/post-holiday-work/form-setting` | 로그인 본인 현재 근무그룹의 사후 신청서 설정 (없으면 `useYn=N`) |
| GET | `/time/appls/holiday-work/valid-appl-list?ymd` | (사전 엔드포인트) 해당 일자 유효 신청 — **사전·사후 함께 반환** |
| POST | `/time/appls/post-holiday-work-cancel/{searchApply,saveApply,submitApply,cancelApply,reject,approvalDone,complete,deleteApply}` | 취소 신청(1123) |

근거: `be:controller/appls/holidaywork/PostHolidayWorkApplsController.java:50-170`, `PostHolidayWorkCancelApplsController.java:43-120`, `HolidayWorkApplsController.java:162-170`

## 기능 상세

### 진입 조건 (메뉴 노출)

- 근무신청 메뉴에 "휴일 근무(사후) 신청"이 보이는 조건 = **근무그룹 휴일근무 허용 `holiWorkPmitCd === "A"`(승인 시에만 근무 가능) AND 사후 신청서 설정 `useYn === "Y"`** (`pp:src/components/main/work_commute/contents/WorkRequest.tsx:212-213, 183-189, 324-333`)
- 사후 신청서 설정은 어드민 근무 그룹 설정 › 근무 신청서 관리의 "휴일근무(사후) 신청" 행 (활성 조건 툴팁: "근무시간 관리 > 휴일근무 관리의 휴일근무 허용을 '승인 시에만 근무 가능'으로 설정하면 사용할 수 있습니다." — `KB:product/admin/work/group-setting.md` § 4-1). **기본값 미사용(opt-in)**: 마이그레이션이 기존 그룹 전부 `USE_YN='N'`으로 시딩
- 설정은 **현재 근무 귀속일의 근무그룹** 기준으로 조회 (`be:…/PostHolidayWorkApplsService.java:195-208`). 저장 시에는 **신청 대상일의 근무그룹** 설정을 다시 확인 (`:240-244`)
- 드로어를 연 상태에서 사용 중지되면 모달 "휴일 근무(사후) 신청 불가 안내" / "휴일 근무(사후) 신청서 사용이 중지되었습니다." [확인] → 드로어 닫힘. [요청] 직전에도 설정을 재조회해 `useYn=N`이면 제출 중단 (`pp:…/PostDayOff.tsx:989-995, 1063-1091`)

### 요청일 (캘린더)

- 휴일근무 캘린더 API(`getHolidayWorkCalendar`, 사전과 공용) 결과에서 **`holidayYn === "Y"`(근무일유형 휴일)이고 오늘보다 이전인 날만 선택 가능** — 코드 주석 "사후 신청은 오늘 이전 휴일만 선택 가능" (`pp:…/PostDayOff.tsx:254-278`). 휴무일·근무일·오늘·미래는 비활성. 하루만 선택
- 월 이동 시 캘린더 데이터를 누적 병합해 다른 달에 선택된 날의 마감 여부를 유지 (`:256-260`)
- **서버 판정 기준은 "현재 근무 귀속일"**: `workYmd < 현재 귀속일`이어야 함, 아니면 "사후 휴일근무는 지난 휴일에 대해서만 신청할 수 있습니다." (`be:…/PostHolidayWorkApplsService.java:215-222`). 근무일유형 `HOLIDAY`가 아니면 "휴일에만 사후 휴일근무를 신청할 수 있습니다." (`:232-234`)
  - 프론트는 달력 날짜(오늘) 기준, 서버는 귀속일 기준 → 자정 이후 귀속일이 아직 전날인 시간대에는 프론트에서 고를 수 있는 "어제"가 서버에서 막힐 수 있음 (추정, 미검증)
- 날짜를 바꾸면 시작/종료 시각 초기화 (`:541-549`)

### 신청 가능 기간

- 하한(얼마나 과거까지)에 대한 별도 제한 **없음** — 마감되지 않은 지난 휴일이면 신청 가능. 마감된 일자는 차단 (§ 마감 차단)

### 시간 입력·검증

- 시작/종료 각각 [당일/익일] 선택 + 시:분 입력 (사전과 동일, 전일 옵션 없음)
- **사용자가 직접 시각을 입력**하는 방식. 실제 출퇴근 기록을 자동으로 채우지 않음
- 프론트 1차 검증 (사전 훅 재사용 `useHolidayWorkRequestValidation`): 요청일·시작·종료 필수, 역전/동일, 야간불가 그룹의 22~06시 포함, 근무 가능 시간대(당일 시작~익일 시작) 밖 (`pp:…/PostDayOff.tsx:328-372`)
- 1차 통과 시 `getPostHolidayWorkValidTime` 호출(직전 요청 abort) → 결과로 최대 잔여 초과, 최소 기준 미달(`cutoff`), 중복(`used`) 검증 (`:374-456`)
- **사전과의 차이**: `validateTodayPast`(당일 과거 시각 정책) **호출 안 함**. 서버도 `isPostAppl=true`면 과거일(PAST)·당일 과거(TODAY_PAST) 판정을 건너뜀 (`be:…/HolidayWorkApplsService.java:1010-1012, 1028-1033`)

### 결과 표시 ("변경 결과")

- 사전과 동일 레이아웃: 출퇴근 / 휴게시간(자동 휴게 "(자동 차감)") / 상세 시간 / 근무시간, 연장·야간 포함 시 "연장/야간 근무를 포함합니다" 등 (`pp:…/PostDayOff.tsx:793-970`)
- 상단 잔여시간 칩 툴팁: "사전 승인 휴일 근무 시간을 포함합니다.<br/>실제 근무 시간에 따라 차이가 발생합니다." — **사전과 같은 i18n 키**(`HOLIDAY_WORK.form.includesPreApprovedHolidayWork`)를 그대로 써서 문구에 "사전"이 남음 (`:502-516`)

### 기존 신청 안내 · 중복 판정

- 선택일의 유효 신청 목록을 사전 엔드포인트 `/holiday-work/valid-appl-list`로 받음 → **사전·사후 휴일근무가 함께** 나옴 (`be:…/HolidayWorkApplsController.java:162-167` 설명 "사전·사후 휴일근무 신청을 함께 반환함"). 목록이 있으면 "선택한 날짜에 이미 신청한 휴일 근무가 있습니다." + "기존 근무 정보와 중복이 아닌 경우에만 근무 신청이 가능합니다." + 일자·시간 목록 (`pp:…/PostDayOff.tsx:578-625`)
- 겹침 판정: `HolidayWorkApplDuplicateValidator.hasConflict` — 같은 구성원, 요청중·결재완료·완료(200/700/900) 상태, `CANCEL_YN='N'`, 신청일 전일~익일의 **사전+사후 휴일근무 신청**과 시간 구간이 겹치면 `used` → "선택한 기간에 이미 신청한 휴일 근무가 있습니다. 중복요청은 불가합니다." (`be:validator/appls/holidaywork/HolidayWorkApplDuplicateValidator.java`, `be:…/HolidayWorkApplQueryService.java` `getByWorkYmdPeriod`)
  - 즉 사전 승인 18:00~20:00이 있으면 사후로 19:00~21:00은 불가, 20:00~21:00은 가능

### 최대·최소 초과근무시간

- 화면: 최대 초과근무 제한이 있으면 신청 근무시간(`workMinutes`)이 휴일/주간/월간휴일/월간 잔여를 넘을 때 "`<기준>` 기준 잔여 시간을 초과했습니다." (사전과 동일 훅, `pp:…/PostDayOff.tsx:431-434`)
- 서버 저장: `validateOvertimeLimit` — **근무그룹 휴일근무 "근무시간 포함여부"가 "포함"(`holiWorkAggrCd` P 또는 빈값)이면 차감분 0**(실제 휴일근무가 이미 집계에 있으므로), "승인시간만 포함"(A)이면 신청 근무시간만큼 차감 후 초과 시 예외 (`be:…/PostHolidayWorkApplsService.java:268-287`, `be:service/overtime/OvertimeService.java:764-767`)
  - 화면은 집계 정책과 무관하게 항상 비교 → "포함" 그룹에서 화면은 막고 서버는 통과시킬 수 있는 불일치 가능 [TBD]
- 최소 초과근무시간: 신청서 1건 단위, 미달 시 "휴일 근무시간이 최소 기준(Nh)보다 적습니다." (서버 `cutoff`)

### 첨부·코멘트

- 사후 신청서 설정의 `requireFileYn`/`requireCommentYn`을 따름 → "첨부파일을 업로드합니다." / "코멘트를 입력합니다." (`pp:…/PostDayOff.tsx:187-188, 1042-1043`)
- 버튼은 [요청]만 (임시저장 버튼 없음, `:985-1061`). 서버에는 `saveApply`/`deleteApply`(임시저장 상태만 삭제 가능)가 있음

### 서버 저장·완료 검증 (`validatePostHolidayWorkApplication`, `be:…/PostHolidayWorkApplsService.java:210-246`)

순서대로:
1. 근무일 형식 → "근무일 정보가 유효하지 않습니다."
2. 현재 귀속일 조회 실패 → "현재 근무 귀속일 정보를 조회할 수 없습니다."
3. `workYmd >= 현재 귀속일` → "사후 휴일근무는 지난 휴일에 대해서만 신청할 수 있습니다."
4. 마감 → "선택한 일자의 근무가 마감되어 사후 휴일근무를 신청할 수 없습니다."
5. 근무일유형 ≠ 휴일 → "휴일에만 사후 휴일근무를 신청할 수 있습니다."
6. 휴일근무 허용 = 근무 불가(N) → "휴일 근무 신청을 할 수 없도록 설정되어 있습니다. 담당자에게 문의바랍니다."
7. 사후 신청서 설정 없음/미사용 → "사후 휴일근무 신청을 사용할 수 없도록 설정되어 있습니다."

이후 유효시간 재계산(`invalidCode` 있으면 "유효하지 않은 사후 휴일근무 신청 시간입니다."), 근무 가능 시간대 검증, 한도 검증. **완료(`complete`) 시에도 1~7과 시간·시간대 검증을 다시 수행**하므로 신청 후 결재 전에 마감되면 승인 단계에서 실패 (`:149-167`)

- 수정(재저장) 제약: 이미 취소된 건 "이미 취소된 사후 휴일근무 신청서는 수정할 수 없습니다.", 종결 건 "종결된 사후 휴일근무 신청서는 수정할 수 없습니다.", 타인 건 "본인이 작성한 사후 휴일근무 신청서만 수정할 수 있습니다." (`:65-81, 248-257`)

### 인정 시간 반영 (승인 후)

- 완료(`complete`) 시 해당 근무일 일·월 재집계 이벤트 발행 (`PostHolidayWorkApplsController` `publishDailyAggregation`)
- 집계는 사전·사후 휴일근무를 **같은 목록**으로 읽음 (`be:service/aggregate/DailyAggregationService.java:1494-1499, 2239-2244` → `HolidayWorkApplQueryService.getBySchWorkIdAndWorkYmdPeriod` = 사전+사후, 완료 상태·미취소)
- 근무그룹 휴일근무 근무시간 포함여부가 **"승인시간만 포함"**일 때: 승인 구간을 **실제 출근~퇴근 기록과 겹치는 부분만** 휴일근무로 인정 — "실제 출근시간 이전은 인정 안함", "실제 퇴근시간 이후는 인정 안함" (`be:common/workcalc/WorkTimeCalcService.java:2407-2440`). 출퇴근 기록이 없으면 인정 시간 없음 (추정 — `dto.getInLocalDateTime()` null이면 스킵)
- "포함"이면 승인과 무관하게 실제 휴일근무가 이미 집계됨 → 사후 신청은 기록·결재 용도 (추정)

### 취소 / 회수

| 시점 | 방법 |
|---|---|
| 결재자 승인 전 (본인 작성, 200) | 결재 문서 상세 "요청 취소" → `cancelApply` 즉시 회수 (`KB:product/user/applications/overview.md` § 취소 가능 판정) |
| 승인 완료 후 | "요청 취소" → **취소 신청서(1123) 드로어** `PostDayOffCancelDrawer` → 별도 결재 (`pp:…/approval_drawer/index.tsx:227-229`) |

- 대상 날짜가 항상 과거이므로 사전 신청서의 "미래/당일 출퇴근 전 즉시 취소" 경로는 해당 없음
- 취소 드로어 표시: "근무 일자", "근무 시간", 원 문서 링크 "휴일 근무(사후) 요청". **사전 취소 드로어와 달리 예상 잔여 초과근무시간은 표시하지 않음** (`pp:…/cancel_drawer_template/contents/PostDayOffCancelDrawer.tsx:170-220`)
- 취소 신청 서버 검증 (`be:…/PostHolidayWorkCancelApplsService.java:121-163`): 신청자 본인만("취소 대상 사후 휴일근무 신청서의 신청자만 취소 신청할 수 있습니다."), 원 신청 완료(900)만("승인 완료된 사후 휴일근무 신청서만 취소할 수 있습니다."), 이미 취소("이미 취소된 사후 휴일근무 신청서입니다."), 진행 중 취소 신청 중복("진행 중인 사후 휴일근무 취소 신청서가 있습니다."), 마감("선택한 일자의 근무가 마감되어 사후 휴일근무를 취소할 수 없습니다.")
- 취소 완료 시 원 신청 `CANCEL_YN='Y'` 갱신 + 재집계 (`:101-119`, `PostHolidayWorkCancelApplsController.java:110-140`). 어드민 탭에선 원 행이 "승인완료 후 취소"로 표시

### 마감 차단

- 화면: 캘린더 데이터의 `isClosed`로 날짜 선택 즉시 경고 "선택한 날짜는 근무가 마감되어 신청이 불가합니다." + [요청] 비활성 (`pp:…/PostDayOff.tsx:159-161, 553-565, 1044-1046, 1058-1059`)
- 서버: 신청·완료·취소신청·취소완료 모두 마감 검사. 결재 문서 상세는 `searchApply`의 `isClosed`로 승인/취소 버튼 비활성 (`be:…/PostHolidayWorkApplsService.java:121-132`)

### 출퇴근 위젯·내 근무 표시

- 일자별 `applsInProgress.postHolidayWorkAppl` / `postHolidayWorkCancelAppl`이 근무 요청 목록에 합쳐져 내 근무 캘린더에 "요청중"/"취소중" 표시 (`pp:src/lib/attendance/personalWork.ts:1989-2014`). 요청중 동안 해당 일자의 근무계획·기록 표시는 숨김(연장/야간 신청과 달리 예외 아님, `:2069-2079`)

## 비즈니스 룰

1. 대상: 지난(현재 귀속일 이전) **휴일**(근무일유형 H)만. 휴무일 근무는 대상 아님
2. 메뉴 노출: 휴일근무 허용 "승인 시에만 근무 가능" + 사후 신청서 사용. 서버는 "근무 불가"만 차단(허용 "근무 가능"이어도 설정이 사용이면 저장은 통과 — 추정)
3. 당일 과거 시각 정책은 적용하지 않음
4. 중복 판정은 사전·사후 휴일근무를 하나의 풀로 봄 (전일~익일, 요청중·승인)
5. 최대 초과근무 한도: 휴일 근무시간 포함여부 "포함"이면 서버 차감 0, "승인시간만 포함"이면 신청 시간 차감
6. 승인 = 사전 승인과 동일하게 집계. "승인시간만 포함"이면 승인 구간 ∩ 실제 출퇴근만 인정
7. 마감된 일자는 신청·승인·취소신청·취소승인 모두 불가
8. 승인 후 취소는 취소 신청서(1123)로만

## 알려진 제약 / 임시 동작

- 상단 툴팁 문구가 사전용 키를 재사용해 "사전 승인 휴일 근무 시간을 포함합니다."로 노출
- 프론트(오늘 기준)와 서버(귀속일 기준)의 "지난 날" 판정 차이 가능
- 프론트 한도 검증은 집계 정책을 모름 → "포함" 그룹에서 과차단 가능
- `HOLIDAY_WORK.errors.notHoliday`("요청일이 휴일이 아닙니다.") 키는 정의돼 있으나 사후 화면에서 사용하지 않음

## 관련 신청서 / 다른 기능과의 연계

- [휴일근무(사전) 신청](./holiday-work.md) — 같은 계산·중복 풀. 미래/오늘은 사전 대상
- [연장/야간근무(사후) 신청](./overtime-post.md) — 휴일이 아닌 날의 사후 초과근무
- [근무내역 변경 신청](./reg-adjust.md) — 출퇴근 기록 자체를 고치는 경로 (사후 휴일근무는 기록 수정이 아님)
- [근무 신청 내역 관리](../../admin/work/appl-management.md) § 9 — 어드민 조회
- [근무 그룹 설정](../../admin/work/group-setting.md) § 4-1 — 신청서 사용·설명·첨부/코멘트 필수, 휴일근무 허용/근무시간 포함여부
- [근무 마감](../../admin/work/close-work-data.md)

## [TBD]

- [ ] 프론트 최대 한도 검증 vs 서버(근무시간 포함여부 "포함"이면 차감 0) 불일치가 실제로 과차단을 일으키는지 스테이징 확인
  - **기획 기준 (2026-11-05 Slack 확인)**: "사후 신청서도 한도 초과 시 신청을 막습니다. 승인은 근무를 인정한다는 의미가 될 수 있으므로, 집계에서 제외되더라도 신청 단계에서 막아야" — Slack #bizops-center 2026-10-01 스프린트 #69 결정사항 (https://hcgtheplus.slack.com/archives/C0AC4BH6QLB/p1790833400682779). → **화면(항상 비교)이 기획대로**, 서버의 "포함 시 차감 0"이 기획과 어긋남. 스테이징 실측은 여전히 필요
- [ ] 자정~귀속일 전환 사이에 전날 휴일 선택 시 서버 거절 여부 (프론트 오늘 기준 vs 서버 귀속일 기준) (2026-11-05 Slack 검색: "사후 귀속일"·"사후 자정"·"사후 지난 근무일 오늘" — 관련 논의 없음. 근무그룹 시간대 기준 판정 통일 작업(ppfront#11651·optimiz-time#1794, 2026-11 진행 중)과 함께 재확인 필요)
- [x] ~~휴일근무 허용이 "승인 시에만"에서 다른 값으로 바뀐 그룹의 사후 신청서 `useYn` 처리~~ → **(2026-11-05 Slack 확인)** 화면상으로는 생기지 않는 상황: 구성원이 소속된 근무그룹은 설정(허용 옵션 포함)을 수정할 수 없고 그룹을 복제해 새 그룹으로 옮기는 방식으로만 바꿀 수 있음(#cx 2026-10-15 https://hcgtheplus.slack.com/archives/C01AVJ2CJBW/p1792036044368419?thread_ts=1791948496.453579). 새 그룹은 최초 확정 저장 시 허용 옵션으로 사전 휴일근무·대체근무 사용 여부가 자동으로 맞춰지고, 확정 후 허용 옵션은 화면에서 바꿀 수 없음(#sq-time 2026-10-15 https://hcgtheplus.slack.com/archives/C04QC2RJJBU/p1792028972588959?thread_ts=1791953371.211939). 허용 조건을 만족하지 않으면 어드민 근무 신청서 관리에서 해당 행이 비활성(툴팁으로 활성화 조건 안내). 사후 신청서는 기본 '사용 안 함'이라 관리자가 켜야 함. 남는 공백은 API로 직접 바꾸는 경우뿐. 참고: 스프린트 #69에서 "사후 신청서는 이전 그룹이 사용했으면 이동 후에도 목록 노출 / 고도화로 '신청 가능 기간' 옵션" 안이 나왔다가 **취소선 처리(철회)** — 현재는 오늘 소속 그룹 설정 기준 (#bizops-center 2026-10-06 https://hcgtheplus.slack.com/archives/C0AC4BH6QLB/p1791276814350419?thread_ts=1790745475.348859)
- [x] ~~출퇴근 기록이 전혀 없는 휴일에 사후 신청이 승인되면 인정 0 — 기획 의도 확인~~ → **(2026-11-05 해소) 의도된 동작**: "사전/사후 신청서 모두 승인을 받더라도 실제로 그 시간에 근무를 해야 근무시간으로 인정되는 구조" — Slack #sq-time 2026-10-07 (https://hcgtheplus.slack.com/archives/C04QC2RJJBU/p1791345109388029)
- [ ] 상단 툴팁의 "사전" 문구가 의도인지 (2026-11-05 Slack 재검색: "사후 휴일 툴팁"·"사전 승인 휴일 근무 시간을 포함합니다" — 관련 논의 없음. 비슷한 사례로 사전 연장 "당일 과거 시각 신청 허용" 툴팁이 사후 신청서 도입 후 갱신 안 된 건이 #cx 2026-10-08에 수정 필요로 지적됨)
