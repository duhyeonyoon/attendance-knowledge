---
sidebar:
  order: 4
---

# 연장/야간근무(사후) 신청

> **메뉴** 근무 신청 › 연장/야간 근무(사후) — 출퇴근 위젯 [근무신청] 메뉴 "연장/야간근무(사후) 신청"  
> **문서유형** 1042 "연장/야간근무(사후) 신청" / 1043 "연장/야간근무(사후) 취소 신청" (`pp:src/locales/ko/workflow.json` `APPL_TYPE`)  
> **기준** ppfront·optimiz-time·talenx-admin `origin/dev` (2026-11-05). 도입: ppfront#11392, optimiz-time#1680, talenx-admin#4362 (로드맵 709·734·741)

## 개요

- **지난 근무일**(휴일 제외)에 실제로 한 연장/야간근무를 **사후에** 승인받는 신청서. [연장/야간근무(사전) 신청](./overtime.md)과 같은 입력(요청일 1일 + 시작/종료 시각)·같은 시간 계산을 쓰고, 대상 날짜만 "오늘 이전"으로 뒤집힌 형태
- 서비스 주석이 정리한 사전과의 차이 (`be:service/appls/otwork/PostOtApplsService.java:43-52`):
  - 당일 과거 시각 허용 정책 검증을 하지 않음 (사후 설정에는 정책 컬럼이 없음)
  - 지난 근무일에 대해서만 신청 가능 ("사전 신청 작성기간이 끝난 이후 구간")
  - 완료 처리 시 사전 신청의 "현재 근무중" 종료 알림·요청 구간 기반 출퇴근 기록 생성을 하지 않음
- 승인되면 사전과 **같은 재집계 경로**로 반영 — 승인 구간 ∩ 실제 출퇴근 기록만 인정 (컨트롤러 주석 "승인구간 ∩ 실제 타각 인정은 사전 신청과 동일한 재집계 경로가 처리한다", `be:controller/appls/otwork/PostOtApplsController.java:107-134`)
- 이전에는 사전 신청 테이블의 `AFT_APPL_YN` 플래그로 구분하던 것을 전용 테이블로 분리 (optimiz-time#1680에서 `TM_PSN_OT_PLAN_APPL.AFT_APPL_YN` 삭제)
- 어드민 조회 화면: [근무 신청 내역 관리](../../admin/work/appl-management.md) § 7 연장/야간 근무(사후) 신청 탭

## QA 체크리스트 출처

- ppfront / talenx-admin `.claude/qa-checklist/attendance.md`에 사후 신청서 항목 **없음** (2026-11-05 grep "사후" 0건). 이 문서는 코드 기준

## 코드 위치

**ppfront**

```
src/components/workflow/shared/template_drawer/contents/PostOvertime.tsx   ⭐ 신청서 본체 (applTypeCd "1042")
src/hooks/attendance/usePostOvertimeRequestValidation.ts                   ⭐ 사후 전용 검증 훅
src/components/workflow/shared/approval_drawer/contents/PostOvertime.tsx   ← 결재 문서 상세
src/components/workflow/shared/approval_drawer/contents/PostOvertimeCancel.tsx  ← 1043 결재 문서 상세
src/components/workflow/shared/approval_drawer/contents/cancel_drawer_template/contents/PostOvertimeCancelDrawer.tsx ← 취소 신청 드로어
src/@types/customTypes/workflow/postOvertime.d.ts                          ← 설정·취소 후 잔여 응답 타입
src/components/main/work_commute/contents/WorkRequest.tsx                  ← 메뉴 노출 조건 (:173-181, :304-313)
```

- API 함수: `getPostValidOvertime`, `getPostOvertimeFormSetting`, `getPostOvertimeValidApplList`, `getPostRemainOvertimeMinutes`, `loadCalendarData`(내 근무 캘린더 공용) — `pp:…/PostOvertime.tsx:48-55`

**백엔드 (optimiz-time)**

```
be:controller/appls/otwork/PostOtApplsController.java          ← /time/appls/post-ot, /time/appls/post-overtime/form-setting
be:controller/appls/otwork/PostOtWorkCancelApplsController.java ← /time/appls/post-ot-cancel
be:service/appls/otwork/PostOtApplsService.java                ⭐ 사후 신청 검증·저장
be:service/appls/otwork/PostOtCancelApplsService.java          ← 취소 신청
be:service/appls/otwork/OtApplsService.java                    ← 사전 검증·계산 재사용 (isPostAppl 분기, 중복 풀)
be:service/overtime/OvertimeApplicationQueryService.java       ← 사전+사후 통합 읽기 모델 (집계·한도·중복)
be:vo/PsnOtPostApplVo.java, PsnOtPostCancelApplVo.java, PostOvertimeAndNightWorkFormSettingVo.java
```

- DB: `TM_PSN_OT_POST_APPL`(`APPL_OT_MINUTES`, 신청 시점 잔여 스냅샷 컬럼), `TM_PSN_OT_POST_CANCEL_APPL`, `TM_POST_OVERTIME_AND_NIGHT_WORK_FORM_SETTING` (기존 그룹 `USE_YN='N'` 백필, "사후 신청서는 관리자가 상세 설정 화면에서 직접 켜는 opt-in")

## API 엔드포인트

| Method | Path | 용도 |
|---|---|---|
| POST | `/time/appls/post-ot/searchApply` | 조회 (신청 시점 잔여 스냅샷 포함, **`isClosed` 없음**) |
| POST | `/time/appls/post-ot/saveApply` | 저장(검증·한도 차감·insert) |
| POST | `/time/appls/post-ot/cancelApply` · `/reject` · `/approvalDone` · `/complete` | 회수 · 반려 · 결재완료(무동작) · 완료(+재집계) |
| GET | `/time/appls/post-ot/valid-appl-list?ymd` | 전일~익일 유효 신청 (**사전+사후**) |
| GET | `/time/appls/post-ot/remain-over-work?workYmd` | 잔여 초과근무 (사전과 같은 계산) |
| GET | `/time/appls/post-ot/valid-time` | 유효 신청시간 (PAST·당일과거 분기 스킵) |
| GET | `/time/appls/post-overtime/form-setting` | 사후 신청서 설정 (없으면 기본값 미사용) |
| POST | `/time/appls/post-ot-cancel/{searchApply,saveApply,cancelApply,reject,approvalDone,complete}` | 취소 신청(1043) |
| GET | `/time/appls/post-ot-cancel/expected-remaining-overtime/{psnOtPostApplId}` | 취소 후 예상 잔여 |

- `submitApply`·`deleteApply` 매핑 **없음** (`be:controller/appls/otwork/PostOtApplsController.java:53-190`). PR 본문 API 표도 6개 액션만 명시

## 기능 상세

### 진입 조건 (메뉴 노출)

- 근무신청 메뉴 노출 = **사후 신청서 설정 `useYn === "Y"` 단독** — 코드 주석 "사전 신청서와 별개로 관리자가 켜고 끌 수 있다" (`pp:src/components/main/work_commute/contents/WorkRequest.tsx:173-181, 304-313`). 프론트는 근무그룹 `otPmitCd`/`nightPmitCd`를 직접 보지 않음 (사전 연장 신청서도 같은 방식)
- 어드민 근무 신청서 관리에서 "연장/야간근무(사후) 신청" 행은 연장 허용 '승인 시에만 연장 가능' 또는 야간 허용 '승인 시에만 야간 가능'일 때만 활성 (`KB:product/admin/work/group-setting.md` § 4-1)
- 설정은 현재 귀속일 근무그룹 기준 조회, 저장 시 대상일 근무그룹 설정 재확인 → 미사용이면 "연장/야간근무(사후) 신청을 사용할 수 없도록 설정되어 있습니다." (`be:…/PostOtApplsService.java:232-242, 335-351`)
- 드로어 열린 상태에서 사용 중지: 모달 "연장/야간근무(사후) 신청 불가 안내" / "연장/야간근무(사후) 신청서 사용이 중지되었습니다." [요청] 직전 재조회 (`pp:…/PostOvertime.tsx:640-645, 1161-1185`)
- 신청서 설명이 없으면 상단 안내 박스 자체가 없음 (사후 휴일근무처럼 기본 문구 없음, `:726-733`)

### 요청일 (캘린더)

- 내 근무 캘린더 데이터에서 **근무일유형 휴일(`H`) 또는 오늘 이후 날짜 비활성** → 오늘 이전의 근무일·휴무일만 선택 가능. 전월·익월 날짜도 비활성 (`pp:…/PostOvertime.tsx:379-414`). 하루만 선택
- 서버: "휴일에는 연장 근무를 신청할 수 없습니다.", `workYmd >= 현재 귀속일`이면 "지난 근무일에 대해서만 신청할 수 있습니다.", 귀속일 조회 실패 "현재 근무일을 확인할 수 없어 사후 신청을 할 수 없습니다." (`be:…/PostOtApplsService.java:208-230`)
- 날짜를 바꾸면 시각 초기화, 잔여시간·유효 신청 목록·근무 가능 시간대를 동시에 조회하는 동안 입력 잠금 (`pp:…/PostOvertime.tsx:417-491`)
- **사전과의 차이**: 고정출퇴근제 계획 퇴근시간을 시작 시각 기본값으로 채우는 동작 **없음** (사후는 실제로 한 시간을 입력)

### 시간 입력·검증

- 시작/종료 [당일/익일] + 시:분 (`POST_OVERTIME.today`/`nextDay`)
- 프론트 1차 (`usePostOvertimeRequestValidation`): 역전/동일, 야간불가 그룹 22~06시, 근무 가능 시간대 밖 → 통과 시 200ms 디바운스로 `valid-time` 호출 (`pp:…/PostOvertime.tsx:494-550, 271-350`)
- 서버 응답 기반: 잔여 한도 초과 → 최소 기준(`cutoff`) → 연장/야간 미포함 → 마감(`closedWorkYmd`) → 중복(`used`) 순으로 첫 오류만 표시 (`:302-317`)
  - `closedWorkYmd` 코드는 OT `valid-time`이 **반환하지 않음**(`OT_INAVLID_TYPE`에 없음, `be:dto/appls/overtime/OtApplValidTimeDto.java:20-31`) → 마감 안내는 실제로 캘린더 `isClosed`로만 동작
  - `banned`(연장 불가 설정) 코드는 사후 훅에서 처리하지 않음
- 서버 `getOtValidTime(isPostAppl=true)`: 최소 컷오프 → (당일과거 스킵) → 겹침 → 연장 불가 → (PAST 스킵) (`be:…/OtApplsService.java:910-998`)

### 결과 표시

- "연장/야간 근무를 포함합니다." / "연장 근무를 포함합니다." / "야간 근무를 포함합니다." (`POST_OVERTIME.includesTextWork`) + 연장·야간 시간, "연장 휴게시간" 회색 줄, 툴팁 "연장 휴게시간 N을 제외한 근무시간입니다." (`pp:…/PostOvertime.tsx:994-1130`)
- 미리보기는 `invalidCode`가 없거나 `cutoff`이고, 잔여초과/최소미달/연장미포함 외 시간 오류가 없을 때만 노출
- 상단 잔여시간 칩 툴팁: "이미 신청했거나 승인된 연장/야간 시간을 포함합니다.<br/>실제 근무 시간에 따라 차이가 발생합니다." (`:708-723`)

### 기존 신청 안내 · 중복 판정

- `/post-ot/valid-appl-list`는 `OtApplsService.getValidOtApplByWorkYmdWithMinutes` 재사용 → 전일~익일의 **사전+사후** 유효 신청 (`be:…/PostOtApplsService.java:192-197`). 화면은 선택일 이전 건 + (시작/종료를 익일로 고르면) 익일 건만 걸러 시작시각 순으로 "선택한 날짜에 이미 신청한 연장/야간 근무가 있습니다." + "기존 근무 정보와 중복이 아닌 경우에만 근무 신청이 가능합니다."와 함께 표시 (`pp:…/PostOvertime.tsx:737-763, 814-820`)
- 겹침 판정 풀: `OtApplsService.getValidOtApplListByPeriod` = 사전 신청(요청중·결재완료·완료) + 사후 신청(`findValidPostForMember`, `CANCEL_YN='N'`) — 주석 "사후 신청이 전용 테이블로 분리되기 전에는 같은 풀에 있었다. 분리 이후에도 같은 시간대를 점유하므로 되돌려 합친다." (`be:…/OtApplsService.java:588-613`). 화면 "선택한 기간에 이미 신청한 연장/야간 근무가 있습니다. 중복요청은 불가합니다.", 서버 저장 "이미 신청한 시간과 겹칩니다. 다른 시간으로 신청해 주세요."

### 최대·최소 초과근무시간

- 화면: 최대 제한이 있으면 `otMinutes`가 근무일/휴무일·주간·월간 잔여를 넘을 때 "`<기준>` 기준 잔여 시간을 초과했습니다." (`pp:src/hooks/attendance/usePostOvertimeRequestValidation.ts:248-297`). 제한 없으면 검증 안 함 (사전과 동일)
- 서버 저장 (`be:…/PostOtApplsService.java:124-136, 244-271`):
  - 최소 컷오프(근무일/휴무일 기준) 미달 → "연장/야간 근무시간이 최소 기준보다 적습니다."
  - 한도 차감분 = 근무그룹 연장근무 **근무시간 포함여부가 "포함"(`otWorkAggrCd` P)**이면 `max(집계된 실제 연장, 기존 사후+신규) − max(집계된 실제 연장, 기존 사후)` — 이미 실제 연장이 집계돼 있으면 그만큼은 새로 차감하지 않음. 그 외(승인시간만 포함)면 신청 연장시간 전체 차감. 잔여가 이미 음수면 0 차감이어도 차단
  - 신청 시점 잔여(일/주/월)·주간 예상 근무시간을 신청서에 스냅샷 저장 → 결재 문서에 표시
- 화면은 이 집계 정책을 모르고 신청 시간 전체를 잔여와 비교 → "포함" 그룹에서 화면 과차단 가능 [TBD]

### 서버 저장 검증 (`saveApply`, `be:…/PostOtApplsService.java:72-150`)

1. 본인 확인 — "본인의 연장근무만 신청할 수 있습니다."
2. `validateApplicableWorkDay` — 마감 "선택한 일자의 근무가 마감되어 연장/야간 근무를 신청할 수 없습니다." → 휴일 → 지난 근무일
3. 근무일정 조회 실패 "선택한 일자의 근무 일정을 확인할 수 없습니다.", 사후 설정 미사용
4. 사전 검증 재사용 `checkPsnOtPlanApplVo(…, isSaveApplyingProcess=false)` — 마감·휴일·근무그룹·연장 불가("연장 근무 신청을 할 수 없도록 설정되어 있습니다. 담당자에게 문의바랍니다.")·겹침·야간 불가("야간근무를 할 수 없도록 설정되어 있습니다. 담당자에게 문의바랍니다.")·근무 가능 시간대("근무일 시간 이내로 신청해주세요.") (`be:…/OtApplsService.java:313-395`)
5. 최소 컷오프 → 한도 차감 → insert

- **완료(`complete`)** 시 `checkPsnOtPlanApplVo`를 다시 실행 (마감·휴일·겹침 등) — 지난 근무일 판정은 생략 (`:153-161`)

### 인정 시간 반영 (승인 후)

- 완료 시 해당 근무일 일·월 재집계 이벤트 (`PostOtApplsController.java:107-134`)
- 집계는 `OvertimeApplicationQueryService.findCompletedForAggregation` = 사전+사후 **완료·미취소** 신청 (`be:service/overtime/OvertimeApplicationQueryService.java`, `DailyAggregationService.java:1492-1493, 2236-2238`)
- 근무 계산: 승인 구간을 실제 출근~퇴근과 겹치는 부분만 "승인된 연장/야간 구간"으로 인정 (`be:common/workcalc/WorkTimeCalcService.java:2963-3010` `createApprovedOvertimeUnits`). 출퇴근 기록이 없으면 인정 구간 없음
- 출퇴근 위젯의 예상 퇴근시간 계산용 확정 목록에는 사후 신청을 넣지 않음, 진행중 사후 신청은 `applsInProgress.postOvertimeWorkAppl`로 별도 노출 (`be:common/legacy/EmpDailyWorkMapper.java:288-320`)

### 취소 / 회수

| 시점 | 방법 |
|---|---|
| 결재자 승인 전 (본인 작성, 200) | 결재 문서 상세 "요청 취소" → `cancelApply` 회수 |
| 승인 완료 후 | "요청 취소" → **취소 신청서(1043)** `PostOvertimeCancelDrawer` → 별도 결재 (`pp:…/approval_drawer/index.tsx:219-221`) |

- 취소 드로어: "근무 일자", "사용 시간", 원 문서 "연장/야간근무(사후) 요청", **"잔여 시간"**(취소 후 예상 잔여 근무일/휴무일·주간·월간) + 툴팁 "잔여시간은 연장/야간근무 취소 후 근무시간을 기준으로 산정된 초과근무 가능 시간입니다." (`pp:…/PostOvertimeCancelDrawer.tsx:170-290`)
- 취소 서버 검증 (`be:service/appls/otwork/PostOtCancelApplsService.java:60-231`): 마감 "선택한 일자의 근무가 마감되어 연장/야간 근무를 취소할 수 없습니다.", 본인만 "본인이 신청한 연장근무 신청서만 취소할 수 있습니다.", "이미 취소된 연장근무 신청서입니다.", "승인 완료된 연장근무 신청서만 취소할 수 있습니다.", "이미 취소 신청이 진행 중인 연장근무 신청서입니다."
- 취소 완료 → 원 신청 취소 처리 + 재집계 (`PostOtWorkCancelApplsController.java:107-134`). 어드민 탭 원 행 "승인완료 후 취소"

### 마감 차단

- 화면: 캘린더 `isClosed`로 날짜 선택 즉시 "선택한 날짜는 근무가 마감되어 신청이 불가합니다." + [요청] 비활성 (`pp:…/PostOvertime.tsx:226-227, 800-806, 567-572, 1156-1157`)
- 서버: 저장·완료·취소신청·취소완료 모두 마감 검사
- **결재 문서 상세**: `searchApply` 응답에 `isClosed`가 없어 마감일 승인/취소 버튼 사전 비활성(`isWorkClosedDay`)이 동작하지 않음 → 버튼을 누르면 서버 예외로 막힘 (`be:dto/appls/overtime/PostOtApplsResponseDto.java:20-72`, `pp:…/approval_drawer/index.tsx:545-551`)

### 출퇴근 위젯·내 근무 표시

- `postOvertimeWorkAppl`/`postOvertimeWorkCancelAppl`이 근무 요청 목록에 합쳐져 "요청중"/"취소중" 표시. 연장/야간(사전·사후) 신청 중이어도 근무계획·기록 표시는 유지 (`pp:src/lib/attendance/personalWork.ts:1989-2079`)

## 비즈니스 룰

1. 대상: 지난(현재 귀속일 이전) **휴일이 아닌** 날(근무일·휴무일)
2. 메뉴 노출은 사후 신청서 사용 여부만. 서버는 연장 불가·야간 불가 설정을 사전과 같이 검사
3. 당일 과거 시각 정책 미적용, 고정출퇴근제 시작 시각 기본값 없음
4. 중복 판정은 사전·사후 연장/야간을 하나의 풀로 봄 (전일~익일, 요청중·승인)
5. 최대 한도: 연장 근무시간 포함여부 "포함"이면 이미 집계된 실제 연장만큼은 추가 차감하지 않음
6. 승인 = 사전 승인과 동일 집계, 승인 구간 ∩ 실제 출퇴근만 인정
7. 마감된 일자는 신청·승인·취소신청·취소승인 모두 불가
8. 승인 후 취소는 취소 신청서(1043)로만

## 알려진 제약 / 임시 동작

- `submitApply`·`deleteApply` 미매핑 (휴일근무(사후)는 매핑됨). 임시저장 버튼도 없음 — `submitApply`는 전자결재가 호출하지 않아 영향 없음, `deleteApply`는 문서 삭제 시 호출됨 (§ [TBD])
- 결재 문서 상세 마감 사전 비활성 미동작 (`isClosed` 미반환)
- 프론트 `closedWorkYmd` 분기는 사실상 죽은 코드
- 프론트 한도 검증 과차단 가능성
- 프론트 오늘 기준 vs 서버 귀속일 기준 판정 차이 가능

## 관련 신청서 / 다른 기능과의 연계

- [연장/야간근무(사전) 신청](./overtime.md) — 같은 계산·중복 풀. 미래/오늘은 사전 대상
- [휴일근무(사후) 신청](./holiday-work-post.md) — 휴일의 사후 근무
- [근무내역 변경 신청](./reg-adjust.md) — 출퇴근 기록 자체 수정 (사전 OT 서버 오류 문구가 과거일에 이 신청서를 안내)
- [출퇴근 위젯](../home/checkin-widget.md) — "연장 가능 시간을 초과해 퇴근이 불가합니다. 사후에 근무내역을 변경하시기 바랍니다." 안내와 연결 (이 문구는 사후 신청서가 아니라 근무내역 변경을 가리킴)
- [근무 신청 내역 관리](../../admin/work/appl-management.md) § 7
- [근무 그룹 설정](../../admin/work/group-setting.md) § 4-1, 연장시간 관리(근무시간 포함여부)
- [근무 마감](../../admin/work/close-work-data.md)

## [TBD]

- [ ] 프론트 최대 한도 검증 vs 서버 집계 반영 차감 불일치가 실제 과차단을 일으키는지 스테이징 확인
  - **기획 기준 (2026-11-05 Slack 확인)**: 사후 신청서도 한도 초과 시 신청 단계에서 차단, 요청중 사후 시간은 사전 한도 계산에도 포함 — Slack #bizops-center 2026-10-01 스프린트 #69 결정사항 (https://hcgtheplus.slack.com/archives/C0AC4BH6QLB/p1790833400682779). → 화면 동작이 기획대로, 서버의 "포함 시 기집계분 제외 차감"이 기획과 어긋날 수 있음
- [ ] 자정 직후(귀속일이 아직 전날)에 전날을 고르면 서버에서 거절되는지 (프론트 오늘 기준 vs 서버 귀속일 기준) (2026-11-05 Slack 검색: "사후 귀속일"·"사후 자정"·"사후 지난 근무일 오늘" — 관련 논의 없음. 근무그룹 시간대 기준 판정 통일 작업(ppfront#11651·optimiz-time#1794)과 함께 재확인 필요)
- [x] ~~`submitApply` 미매핑 — 전자결재가 신청 시 어떤 액션을 호출하는지~~ → **(2026-11-05 코드 확인, Slack 논의 없음)** 영향 없음: 전자결재(`optimiz-system` `ApplicationsService`)는 신청·임시저장 모두 업무 모듈 `/saveApply`(TEMP_SAVED URL)만 호출하고 `/submitApply`(`ACTION_URL.APPLY`)를 호출하는 경로가 없음 (`ApplicationsService.java:1539-1560`, 호출처는 SEARCH·TEMP_SAVED·DELETE·COMPLETE·APPROVAL_DONE·REJECTED·CANCEL·APPROVE_CANCEL뿐)
  - ⚠️ 대신 **`deleteApply` 미매핑은 영향 가능**: 문서 삭제 시 전자결재가 업무 모듈 `/deleteApply`를 호출함(`ApplicationsService.java:512, 1594-1615`) → 연장/야간(사후) 문서 삭제 요청은 업무단 호출이 실패할 수 있음 (추정 — 사후 연장은 임시저장 버튼이 없어 삭제 대상 문서가 생기는 경로가 제한적. 스테이징 확인 필요)
- [ ] 결재 문서 상세에서 마감일 버튼 사전 비활성 누락이 의도인지 (2026-11-05 Slack 검색: "isClosed"·"사후 마감 승인 버튼" — 관련 논의 없음. 서버가 막으므로 데이터 영향은 없음)
- [x] ~~연장·야간 허용이 '승인 시에만'에서 바뀐 그룹의 사후 설정 `useYn` 처리~~ → **(2026-11-05 Slack 확인)** 화면상으로는 생기지 않는 상황: 구성원이 소속된 근무그룹은 설정(허용 옵션 포함)을 수정할 수 없고 그룹을 복제해 새 그룹으로 옮기는 방식으로만 바꿀 수 있음(#cx 2026-10-15 https://hcgtheplus.slack.com/archives/C01AVJ2CJBW/p1792036044368419?thread_ts=1791948496.453579). 새 그룹은 최초 확정 저장 시 허용 옵션으로 사전 휴일근무·대체근무 사용 여부가 자동으로 맞춰지고, 확정 후 허용 옵션은 화면에서 바꿀 수 없음(#sq-time 2026-10-15 https://hcgtheplus.slack.com/archives/C04QC2RJJBU/p1792028972588959?thread_ts=1791953371.211939). 허용 조건을 만족하지 않으면 어드민 근무 신청서 관리에서 해당 행이 비활성(툴팁으로 활성화 조건 안내). 사후 신청서는 기본 '사용 안 함'이라 관리자가 켜야 함. 남는 공백은 API로 직접 바꾸는 경우뿐. 어드민 비활성 행 툴팁(연장/야간 사전·사후): "근무시간 관리 > 연장시간 관리의 연장근무 허용을 '승인 시에만 연장 가능'으로 설정하거나, 야간근로시간 관리의 야간근무 허용을 '승인 시에만 야간 가능'으로 설정하면 사용할 수 있습니다."
- [x] ~~출퇴근 기록 없는 날 승인 시 인정 0 — 기획 의도 확인~~ → **(2026-11-05 해소) 의도된 동작** — Slack #sq-time 2026-10-07 (https://hcgtheplus.slack.com/archives/C04QC2RJJBU/p1791345109388029)
