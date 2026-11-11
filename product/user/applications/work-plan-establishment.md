---
sidebar:
  order: 9
---

# 근무계획 수립 신청 (선택적 근로제)

> **메뉴** 근무 신청 › 근무계획 수립 (출퇴근 위젯 [근무신청] → "근무계획 수립 신청")  
> **문서유형** 1031 "근무계획 수립 신청" (`optimiz-system:workflow/constant/CONST_APPLY.java:33` `ESTABLISH_WORK_PLAN`, 취소 불가 유형)  
> **도입** 2026-07-10 — ppfront hcgtheplus/ppfront#11172, optimiz-time hcgtheplus/optimiz-time#1512, talenx-admin hcgtheplus/talenx-admin#3998. 휴일/휴무일 허용 옵션 2026-08-20 (#11290 / #1608 / #4198), 핫픽스 hcgtheplus/ppfront#11576 (2026-10-20)  
> **작성** 2026-11-05 신규 (ppfront·optimiz-time·talenx-admin `origin/dev` 기준). QA 체크리스트 항목 없음

## 개요

- **선택적 근로제** 근무그룹(근무제 유형 SELECTIVE) 소속 구성원이 **정산기간 전체**의 일자별 근무 시작·종료 시각을 직접 정해 승인받는 신청서
- 승인되면 정산기간 전체가 **개인 일자별 확정 스케줄**(`TM_MEMBER_DAILY_WORK_SCHEDULE`)로 저장되어 근무계획·집계의 기준이 됨. 수립 전 근무일은 내 근무 캘린더에 "미수립"으로 표시
- 선택적 근로제 그룹에서는 근무계획 변경 신청을 쓸 수 없고 이 신청서로 수립·변경한다 (어드민 툴팁 원문: "근무제 유형이 선택적 근로제인 근무그룹에서는 사용할 수 없습니다. 선택적 근로제 근무그룹은 근무계획 수립 신청서로 근무계획을 수립 및 변경합니다." `ad:src/locales/ko/attendance.json:303`)
- 어드민 조회: [개인 근무 스케줄 관리](../../admin/work/personal-schedule.md) § 2 **선택적 근로 스케줄 탭**

## 근무계획 변경(1030)과의 차이 ⭐

| 항목 | 근무계획 변경 (1030, `PlanEdit.tsx`) | 근무계획 수립 (1031, `WorkPlanEstablishment.tsx`) |
|---|---|---|
| 대상 근무그룹 | 선택적 근로제 **아닌** 그룹 | 선택적 근로제 그룹**만** |
| 신청 단위 | 사용자가 고른 기간(일자 범위) | **정산기간 전체** (드롭다운에서 정산기간 선택, 부분 신청 불가) |
| 입력 | 근무일 템플릿(근무계획) 하나를 골라 기간에 적용 | 일자별 **시작·종료 시각**(당일/익일)을 직접 입력, 여러 날 일괄 입력 |
| 휴일/휴무일 | 변경 불가 | 어드민 "휴일/휴무일 근무 허용 여부"가 허용이면 근무 시각 입력 가능 |
| 시간 검증 | 변경 전후 동일 불가 등 | 정산기간 합계가 **소정근로시간 이상 · 최대 근무시간 이하**, 일자별 **코어타임 포함** |
| 승인 결과 | 개인스케줄(템플릿 지정) 생성 | 정산기간 전체 일자를 개인 일자별 확정 스케줄(시각 포함)로 **전체 교체** |
| 신청서 설정 항목 | 변경 대상 기간·신청 가능 기간·첨부/코멘트 | 사용 여부·설명·**휴일/휴무일 근무 허용 여부**·첨부/코멘트 (변경 대상/신청 가능 기간 UI 없음) |
| 상호 차단 | 대체근무 요청중이면 불가 | 같은 정산기간 대체근무 요청중이면 불가 (역방향도 차단 — [대체근무](./compensatory-work.md)) |

## 코드 위치

- 프론트
  - 신청 드로어: `pp:src/components/workflow/shared/template_drawer/contents/WorkPlanEstablishment.tsx` (문서유형 `:737`)
  - 하위: `pp:.../template_drawer/contents/work_plan_establishment/` — `PeriodCalendar`(달력·일괄 선택), `WeekSchedule`/`WeekDayRow`(주차별 전체 일정), `BulkInputDialog`(일괄 입력), `WorkPlanSummaryBar`(소정/계획/최대), `WorkTimeLimitAlertContent`(미달/초과 알림)
  - 판정 로직: `pp:src/lib/attendance/workPlanEstablishment/{helpers,mapper,timeValidation}.ts`
  - 결재 드로어: `pp:src/components/workflow/shared/approval_drawer/contents/WorkPlanEstablishment.tsx`
  - API: `pp:src/modules/attendance/work_request.ts:24-100`
  - 타입: `pp:src/@types/customTypes/attendance/workPlanEstablishment.d.ts`
  - 메뉴 노출: `pp:src/components/main/work_commute/contents/WorkRequest.tsx:136-142, 286-293`
- 백엔드
  - `be:controller/appls/workplanestablishment/WorkPlanEstablishmentApplsController.java` — `/time/appls/work-plan-establishment` + `GET /settlement-periods`, `GET /form-setting`, `GET /period-plan`, `POST /preview`, 워크플로우 `/searchApply`·`/saveApply`·`/cancelApply`·`/reject`·`/complete`
  - `be:service/appls/workplanestablishment/WorkPlanEstablishmentApplsService.java`, `be:validator/appls/workplanestablishment/WorkPlanEstablishmentApplValidator.java`
  - 어드민 조회: `be:controller/workadmin/WorkPlanEstablishmentAdminController.java` (선택적 근로 스케줄 탭)
- 어드민 설정: `ad:src/components/attendance/work/group_setting/detail/contents/work_setting_tab/contents/work_request_form_setting/contents/work_plan_establishment/` (`WorkPlanEstablishmentLimitSection.tsx` = 휴일/휴무일 허용)
- DB: 신청 `TM_WORK_PLAN_EST_APPL` / `_DTL` / `_DTL_REST_TIME`, 확정 스케줄 `TM_MEMBER_DAILY_WORK_SCHEDULE` / `_REST_TIME`, 그룹 설정 `TM_WORK_PLAN_EST_FORM_SETTING` (`be:resources/SQL/time/appls/workplanestablishment/WorkPlanEstablishmentApplsMapper.xml`)

## 기능 상세

### 1. 진입 / 노출 조건

- 출퇴근 위젯 [근무신청] 메뉴에 "근무계획 수립 신청"(드롭다운 라벨 "근무계획 수립")이 `GET /form-setting`의 `setting.useYn === "Y"`일 때만 노출 (`WorkRequest.tsx:136-142`)
- `form-setting`은 **오늘** 소속 근무그룹 기준. 차단 사유 (`be:...WorkPlanEstablishmentApplsService.java:104-121, 333-401`)
  - 그룹 없음 "그룹 소속정보가 없습니다." / 선택적 근로제 아님 "선택적 근로제 대상자가 아닙니다." / 설정 행 없음 "근무계획 수립 신청서 설정 정보가 없습니다." → 이 경우 `setting`이 없어 메뉴 미노출
  - 사용 중지(`FORM_DISABLED`) → 메뉴 미노출. 열린 상태에서 [요청] 시 모달 "근무계획 수립 신청 불가 안내" / "근무계획 수립 신청서 사용이 중지되었습니다." 후 드로어 닫힘 (`WorkPlanEstablishment.tsx:657-684`)
- 내 근무 캘린더 날짜 클릭으로는 열리지 않음 (드로어 타입 `workPlanEstablishment`를 여는 곳은 위젯 메뉴뿐, `git grep` 기준)

### 2. 근무그룹 설정 연동 (근무 신청서 관리)

- 어드민 › 근무 그룹 설정 › 근무 신청서 관리 › "근무계획 수립 신청" — 활성화 조건 "근무제 유형이 선택적 근로제인 근무그룹에서만 사용할 수 있습니다." ([근무 그룹 설정](../../admin/work/group-setting.md) § 4-1)
- 설정 항목: 신청서명 / 설명("근무계획 수립 신청서에 대한 설명을 작성합니다. 해당 내용은 수립 신청 시 구성원에게 공유됩니다.") / 사용 여부 / **신청설정 › "휴일/휴무일 근무 허용 여부"**("허용 안함"/"허용") / 파일 첨부·코멘트 입력 필수 (`ad:.../work_plan_establishment/index.tsx:108-175`, `WorkPlanEstablishmentLimitSection.tsx:28-56`)
- 응답에 변경 대상 기간·신청 가능 기간 필드(`targetPeriod*`, `applPeriod*`)가 있으나 어드민 설정 UI와 사용자 화면 모두 사용하지 않음 (코드 기준)

### 3. 정산기간 선택

- "정산 기간"(필수) 드롭다운, 미선택 시 "정산 기간을 선택하세요" (`WorkPlanEstablishment.tsx:813-854`)
- 옵션(`GET /settlement-periods`): 오늘 기준 **전후 1개월과 현재 정산주기의 직전·다음 주기**를 덮는 정산주기들. 정산 단위는 월/주만 지원. 정산기간 중 선택적 근로제 그룹이 바뀌면 **정산주기 ∩ 그룹 소속기간**만 한 옵션으로 제공 (`Service:189-325`)
- 입력 중 다른 정산기간을 고르면 확인 "정산 기간 변경" / "정산 기간을 변경하면 입력한 근무시간이 모두 초기화됩니다.<br />계속 진행하시겠습니까?" (`:363-383`)
- 서버는 요청 기간이 정확히 그 정산기간(그룹 소속기간 교집합) 전체가 아니면 거절 "근무계획 수립 신청은 정산기간 전체 단위로만 신청할 수 있습니다." (`Service:1911-1929`)

### 4. 정산기간 단위 차단 (본문 대신 정산기간 아래에 사유만 표시)

`pp:src/lib/attendance/workPlanEstablishment/mapper.ts` `resolvePeriodBlockReason`, 우선순위 위→아래

| 사유 | 문구 |
|---|---|
| 같은 정산기간(겹치는 기간 포함)에 요청중 수립 신청 | "해당 정산 기간은 근무 계획 수립 승인 대기 중으로 신청이 불가합니다." (서버: "선택한 정산기간에 요청중인 근무계획 수립 신청이 있습니다.") |
| 같은 정산기간에 요청중 대체근무 신청 | 서버 문구 그대로 "선택한 정산기간에 요청중인 대체근무 신청이 있습니다." |
| 정산기간 안에 마감된 일자가 하나라도 있음 | "해당 정산기간에 마감된 근무 일자가 포함되어 신청이 불가합니다." |
| 기준 스케줄(개인/그룹 스케줄)이 없는 일자가 있음 | "해당 정산기간에 확정된 근무 스케줄이 없는 일자가 포함되어 신청이 불가합니다." |
| (요청 시점) 휴일/휴무일 허용 설정이 바뀜 | 모달 "근무계획 수립 신청 불가 안내" / "휴일·휴무일 근무 설정이 변경되어 신청이 불가합니다." + 정산기간 초기화 (`WorkPlanEstablishment.tsx:350-361, 686-707`) |

- 요청중 = `CONST_TIME_APPLS.applStatsInProgress`. 반려·취소·완료 건은 재신청을 막지 않음 (`Service:1806-1832`)

### 5. 화면 구성 (정산기간 선택 후)

1. **요약 바**: "소정근로시간" / "계획한 시간"(미달 시 "(N 미달)", 초과 시 "(N 초과)") / "최대 근무시간 N" / "총 근무일 N일" (`WorkPlanSummaryBar.tsx`). 계획한 시간은 화면에서 유효 입력일만 합산
2. **달력** (`PeriodCalendar.tsx`): 정산기간 월 이동, 일자 클릭으로 다중 선택, "전체 선택"/"선택 해제", "N개 일괄 입력". 셀 상태 범례 "미입력" / "입력됨" / "확인 필요" / "선택됨". 휴일·휴무일은 허용 설정일 때만 선택 가능 — 허용 여부는 **선택한 정산기간 응답의 값**(`periodPlanResponse.summary.isNonWorkdayPlanAllowed`, `WorkPlanEstablishment.tsx:224-225`)을 씀. 오늘 그룹 설정으로 과거 정산기간에 휴일 입력이 열리던 문제를 2026-10-20 핫픽스로 바꾼 것 (Slack #channeltalk 2026-10-20 https://hcgtheplus.slack.com/archives/C06ULEEM88M/p1792472894914639?thread_ts=1792461291.617899). 원래 휴일/휴무일인데 입력된 날은 점 표시 + 툴팁 "점 표시가 있는 '입력됨' 라벨은 기존에 휴일/휴무일이었던 일자를 의미합니다."
3. **일괄 입력** 다이얼로그 "일괄 입력": "시작 시각"/"종료 시각"(당일/익일) + "선택한 날짜" 목록 → [취소]/[적용]. 허용 설정이 아니면 근무일에만 적용 (`helpers.ts:171-202`)
4. **전체 일정**: 주차별 아코디언 "M월 N주차", "전체 열기"/"전체 닫기", 일자별 시작·종료 시각 입력, 주차 합계

- 최초 신청은 시각이 비어 있음. **이미 승인된 확정 스케줄이 있는 일자만** 그 시각으로 채워짐(재신청). 개인/그룹 템플릿에 시각이 있어도 미리 채우지 않음 (`mapper.ts` `mapDailyPlansToInitialDayPlans`)
- 시각이 바뀌면 `POST /preview`로 일자별 계획근로시간·휴게시간·합계를 다시 계산 (진행 중 요청 취소 후 재호출, `WorkPlanEstablishment.tsx:452-554`)

### 6. 입력 · 밸리데이션

| 단계 | 규칙 | 문구 |
|---|---|---|
| 일자 행 (프론트) | 시작만/종료만 입력 | "시작 시각을 입력합니다." / "종료 시각을 입력합니다." |
| | 종료 < 시작 (당일/익일 반영). 시작 = 종료(0시간)는 허용 | "종료 시각이 시작 시각 전입니다" |
| | 코어타임 미포함 (근무일만, 코어 종료<시작이면 익일 종료로 봄) | "코어타임(HH:mm~HH:mm)을 포함해야 합니다." |
| [요청] 시 (프론트) | 근무일 미입력/오류 일자 → 해당 주차 펼치고 스크롤. 원래 휴일/휴무일은 미입력 허용 | (행별 문구) |
| | 계획 합계 < 소정근로시간 | 알림 "근무시간 미달 안내" — "계획한 시간이 소정근로시간보다 부족합니다.<br />일부 날짜의 근무시간을 조정 후 신청하시기 바랍니다." + 소정근로시간/계획한 시간/부족한 시간 |
| | 계획 합계 > 최대 근무시간 | 알림 "근무시간 초과 안내" — "계획한 시간이 최대 근무시간을 초과했습니다.<br />일부 날짜의 근무시간 조정 후 신청하시기 바랍니다." + 최대 근무시간/계획한 시간/초과한 시간 |
| | 코멘트/첨부 필수 | "코멘트를 입력합니다." / "첨부파일을 업로드합니다." |
| 저장 (서버, 첫 위반 1건만 반환) | 기준 스케줄 없는 일자 입력 | "기준 스케줄이 없는 일자는 근무계획을 입력할 수 없습니다." |
| | 최초 신청인데 근무일 미입력 | "최초 신청은 근무일 전체의 근무계획을 입력해야 합니다." |
| | 코어타임 미포함 | "코어타임(%s~%s)을 포함해야 합니다." |
| | 허용 안함인데 휴일/휴무일 입력 | "휴일/휴무일에는 근무계획을 입력할 수 없습니다." |
| | 근무일 시각 비움 | "근무일은 근무 시작/종료 시각을 입력해야 합니다." |
| | 합계 미달 / 초과 | "계획근로시간 합계가 소정근로시간보다 작습니다." / "계획근로시간 합계가 최대근로시간을 초과했습니다." |

(`Service:148-164, 1555-1671`, 프론트 `timeValidation.ts`, `helpers.ts:151-170, 305-338`, `WorkPlanEstablishment.tsx:385-450`)

- **소정근로시간**: 근무그룹 소정근로시간 기준이 법정이면 정산기간 법정 소정근로시간, 근무계획 기준이면 **근무그룹 스케줄**의 근무일 소정근로시간 합 (개인/승인 계획에 흔들리지 않음, `Service:794-856`)
- **최대 근무시간**: 근무그룹 최대 근무시간 제한을 정산기간으로 환산. 제한 없는 그룹은 검증 안 함 (`Service:857-873`, 일집계도 정산기간 기준 — hcgtheplus/optimiz-time#1773)
- 휴일/휴무일 허용 안함 설정에서 이전에 근무일로 승인됐던 휴일/휴무일을 다시 입력하지 않으면 원래 휴일/휴무일로 되돌려 저장 (`Service:618-621`)
- 과거 일자 입력 제한은 코드에 없음 — 정산기간 안에 마감일이 있으면 기간 전체가 차단될 뿐 (`PeriodCalendar.tsx:317-320`)

### 7. 결재 · 승인 후 반영

- 결재 드로어: 정산기간 "YYYY.MM.DD ~ YYYY.MM.DD(근무일 N일)", 소정근로시간, 최대 근무시간, 총 계획시간, 전체 일정(주차별). 원래 휴일/휴무일이었던 근무 일자는 파란 점 (`approval_drawer/contents/WorkPlanEstablishment.tsx:124-223`)
- 저장 시 정산기간 **전체 일자** 스냅샷 저장 (사용자 입력일 `modified=true`, 나머지는 기준 스케줄 상속)
- 최종 승인(`/complete`): **정산기간 안에 마감 일자가 있으면 승인 불가** "근무 마감된 일자가 있어 근무계획 수립 신청을 승인할 수 없습니다." → 기간 내 기존 확정 스케줄을 삭제하고 스냅샷 전체를 새 확정 스케줄로 저장(근태 설정 지각·조퇴·출근인정 사용 여부는 일근무계획 템플릿에서 복사) → **실제 값이 바뀐 일자 중 승인일 이전·당일만** 재집계 이벤트 (`Service:665-681, 2206-2269, 2329-2406, 2575-2582, 2628-2673`)
- 중복 complete 콜백은 멱등 처리, 이미 취소/반려된 건의 늦은 complete는 무시 (`Service:2208-2222`)

### 8. 화면 반영 ("미수립")

- 백엔드 `workPlanNotEstablished`: 선택적 근로제 **근무일**인데 승인된 확정 스케줄이 최종 스케줄로 선택되지 않으면 `true`, 수립됐으면 `false`, 그 외(비선택근로제·휴일·휴무일) `null`. 근무그룹 변경 등으로 이전 그룹 스냅샷이 거절돼도 미수립 (`be:dto/memberworks/MemberDailyWorkPlan.java:120-122, 186-202`)
- 내 근무 캘린더: 근무계획(템플릿)이 있어도 미수립이면 주황 ! "미수립" ([내 근무](../attendance/my-work.md), `pp:src/lib/attendance/personalWork.ts:1046-1060, 1650-1663`, 문구 `sharedFunction.json` `attendance.workPlanNotEstablished`)
- 수립된 날은 템플릿이 자율 출퇴근이어도 **수립된 시작~종료 시각**으로 표시 (내 근무 `personalWork.ts:1062-1070`, 구성원 근무 › 근무 스케줄 탭 `pp:src/components/attendance/member_work/contents/work_schedule_tab/index.tsx:622-646`)
- 어드민 [개인 근무 스케줄 관리](../../admin/work/personal-schedule.md) › 선택적 근로 스케줄 탭: 구성원 × 근무일로 [그룹 스케줄] 근무 구분 vs [개인 스케줄] 시작/종료 기준·시각 조회 (조회 전용). 선택적 근로제 소속자는 근무 스케줄 탭 엑셀 등록 불가

### 9. 취소 / 회수

- 결재 전 본인 "요청 취소" = 회수(`/cancelApply`, 상태만 취소로) (`Service:633-642`)
- 문서유형 1031 `isCancellable=false` → **결재 완료 후 사용자 취소 불가**, 취소 신청서 없음. 서비스 주석도 "이미 반영된 최종 스케줄을 되돌리는 처리는 아직 연결하지 않는다"
- 승인 후 바꾸려면 같은 정산기간으로 **재신청**(승인된 시각이 미리 채워진 상태로 열림) → 승인 시 정산기간 전체 교체

## 비즈니스 룰

1. 선택적 근로제 근무그룹 + 신청서 사용 여부 ON일 때만 사용
2. 정산기간 전체 단위 신청. 정산기간 중 그룹이 바뀌면 그룹 소속기간과의 교집합 단위
3. 정산기간 합계: 소정근로시간 이상, 최대 근무시간(설정 시) 이하. 일자별 코어타임 포함
4. 최초 신청은 근무일 전체 입력 필수. 휴일/휴무일은 설정이 허용일 때만 입력 가능
5. 같은 정산기간에 요청중 수립 신청 또는 대체근무 신청이 있으면 불가. 마감 일자·기준 스케줄 없는 일자가 포함되면 불가
6. 승인 시 정산기간 전체 확정 스케줄 교체, 바뀐 날만 재집계(미래일 제외). 마감 일자 포함 시 승인 불가
7. 결재 완료 후 사용자 취소 불가 — 재신청으로 변경

## 알려진 제약 / 임시 동작

- 정산 단위가 월/주가 아닌 그룹은 옵션 생성 불가 ("근무그룹 정산기간 설정이 올바르지 않습니다.")
- 신청서 설정 응답의 변경 대상 기간·신청 가능 기간 필드는 미사용
- 승인 완료 후 취소(상태 변경)가 생겨도 확정 스케줄을 되돌리는 로직 없음 (코드 주석)
- 동시 요청 차단은 조회 기반 — "동시 요청까지 강하게 막아야 하면 DB lock 보강" 주석 (`Service:1806-1810`)

## 관련 신청서 / 다른 기능과의 연계

- [근무계획 변경](./plan-change.md) — 비선택근로제용. 선택적 근로제 그룹에서는 사용 불가
- [대체근무](./compensatory-work.md) — 같은 정산기간 요청중이면 서로 차단 ("근무계획 수립 요청중" 조건)
- [내 근무](../attendance/my-work.md) — "미수립" 표시, 수립 시각 표시
- [구성원 근무](../attendance/member-work.md) — 근무 스케줄 탭 수립 시각 표시
- [근무 그룹 설정](../../admin/work/group-setting.md) — 근무제 유형(선택적 근로제), 정산기간, 코어타임, 최대 근무시간, 근무 신청서 관리
- [개인 근무 스케줄 관리](../../admin/work/personal-schedule.md) § 2 — 선택적 근로 스케줄 탭(조회)
- [근무 마감](../../admin/work/close-work-data.md) — 마감 일자 포함 정산기간은 신청·승인 불가

## [TBD]

- [x] ~~워크플로우 문서함에서 근무계획 수립 신청서를 직접 작성할 수 있는지~~ → **(2026-11-05 Slack 확인) 불가** — 워크플로우 [문서 작성]에는 커스텀 신청서만 노출하고 기본(근무·휴가) 신청서는 제외하는 것이 정책 ("문서작성에 노출되는 문서는 커스텀 신청서만" #sq-core 2026-06-29 https://hcgtheplus.slack.com/archives/C096R4XKQ1Z/p1782696518907239?thread_ts=1782289539.791739, #notice-talenx 2026-01-06). 코드도 `ListDrawer`가 `applicationFormType === "CUSTOM"`만 목록에 표시 (`pp:src/components/workflow/shared/drawer_content/contents/ListDrawer.tsx:96-99`). 워크플로우에서는 받은/보낸 문서 열람·결재만 가능
- [ ] 어드민 [근무 신청 내역 관리](../../admin/work/appl-management.md)에 근무계획 수립 탭이 없는 것이 의도인지 (현재 10탭에 없음, 조회는 개인 근무 스케줄 관리 탭)
  - (2026-11-05 Slack) 어드민 조회는 처음부터 "선택적근로제 - admin - 개인별 근무계획수립 현황 조회" 과제로 개인 근무 스케줄 관리에 별도 설계됨 (Group DM 2026-07-27, #sq-time 2026-08-25 "선택적 근로 스케줄 탭: 선택적 근로 스케줄을 사용하는 인원에 한하여 조회"). 신청 내역 관리 탭 추가 논의는 찾지 못함 → 결재 문서 단위 조회 필요 여부는 여전히 미정
  - (2026-11-05 Slack 재검색) 개인 근무 스케줄 관리 쪽을 먼저 만든 이유는 "계획 미수립 일자 확인에 일 단위 조회가 필요"했기 때문이고, "수립도 신청서로 이루어지므로 **최종적으로는 신청서 내역 조회 쪽에도 화면이 추가**되겠지만 우선순위상 이번엔 스케줄 쪽을 먼저"라고 정리됨 (#sq-time 2026-08-13 https://hcgtheplus.slack.com/archives/C04QC2RJJBU/p1786581330379959?thread_ts=1786519440.193459). 탭 추가 시점은 미정
- [x] ~~이미 지난 일자(마감 전)를 수립/재수립할 수 있게 둔 것이 의도인지~~ → **(2026-11-05 해소) 의도된 사용법**: 계획보다 더 근무한 시간을 기본근무로 인정받으려면 "근무계획 수립 신청으로 해당 일자의 근무계획을 실제 근무시간에 맞게 다시 수립"하도록 고객 안내 중 (Slack #ch-sc 2026-10-20 고객 FAQ, #channeltalk 2026-10-12). 재수립 = "재승인"으로 부름 (#cx 2026-10-26)
- [x] ~~개인 근무 스케줄 관리 근무 스케줄 탭에 선택적 근로제 소속자가 조회되는지~~ → **(2026-11-05 Slack 확인)** 조회됨. 근무 스케줄 탭은 모든 인원 대상이지만 선택적 근로제 인원의 개인 스케줄 칸은 기본 공란이고 **수립 내역은 표시되지 않음**(선택적 근로 스케줄 탭에서만 확인). 대체근무 등 신청서로 바뀐 날만 '변경 구분'과 함께 표시. 선택적 근로제 인원은 어드민 스케줄 등록·직책자 스케줄 변경·근무계획 변경 신청서 모두 불가 — Slack #sq-time 2026-08-25 (https://hcgtheplus.slack.com/archives/C04QC2RJJBU/p1787635908267959)
