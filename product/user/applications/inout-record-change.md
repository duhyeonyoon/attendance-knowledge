---
sidebar:
  order: 11
---

# 출퇴근 내역 변경 신청

> **메뉴** 근무 신청 › 출퇴근 내역 변경 (출퇴근 위젯 [근무신청] / 내 근무 캘린더 과거 날짜 / 출퇴근 위젯 "근무 내역 변경" 버튼)  
> **문서유형** 1072 "출퇴근 내역 변경" (`optimiz-system:workflow/constant/CONST_APPLY.java:56` `CHANGE_INOUT_RECORD`, 취소 불가 유형)  
> **도입** 2026-10-07 — ppfront hcgtheplus/ppfront#11399, optimiz-time hcgtheplus/optimiz-time#1678, talenx-admin hcgtheplus/talenx-admin#4381, optimiz-system hcgtheplus/optimiz-system#1014  
> **작성** 2026-11-05 신규 (ppfront·optimiz-time `origin/dev` 기준). QA 체크리스트 항목 없음

## 개요

- 지난 근무일의 **출퇴근·자리비움 시각만 정정**하는 사용자 신청서. 화면 구성·입력 방식은 [통합 근무내역 변경](./reg-adjust.md)(1071)과 거의 같다
- **핵심 차이**: 승인돼도 정정한 시간의 **연장·야간·휴일근무를 승인된 것으로 보지 않는다.** 근무그룹이 "승인 시에만 …"이면 그 시간은 별도 연장/야간·휴일근무 신청 승인이 있어야 인정된다 (`be:service/appls/InoutRecordChangeApplsService.java:56-60` 클래스 주석)
- 근무그룹 설정 › 근무 신청서 관리에서 그룹별로 **사용 여부를 켜야** 쓸 수 있다 (기본 미사용)
- 어드민 조회 화면: [근무 신청 내역 관리](../../admin/work/appl-management.md) § 3 출퇴근 내역 변경 신청 탭 (조회 전용, 결재는 워크플로우)

## 통합 근무내역 변경(1071)과의 차이 ⭐

| 항목 | 통합 근무내역 변경 (1071, `RegEdit.tsx`) | 출퇴근 내역 변경 (1072, `InoutRecordChange.tsx`) |
|---|---|---|
| 승인 시 연장·야간·휴일 인정 | 정정 시간의 연장/야간/휴일을 **승인된 것으로 간주**(승인 우회) | **간주하지 않음** — "승인시간만 포함" 그룹에선 별도 신청 승인분만 인정 (`be:common/workcalc/WorkTimeCalcService.java:341-344, 2880-2887` `isAppliedWorkRecord`) |
| 그룹 설정 행이 없을 때 기본값 | 사용(Y) — 기존 동작 유지 | **미사용(N)** (`InoutRecordChangeApplsService.java:508-521`, 마이그레이션 백필 `USE_YN='N'`, PR #1678 본문) |
| 신청서 화면 "변경 결과" | 근무시간·인정근무·연장/야간/휴일 구분·잔여 초과근무·최소 연장 미인정 등 표시 | 출퇴근 구간·인정 시각·자리비움 합계만 + 안내 2줄 (`pp:src/components/workflow/shared/template_drawer/contents/InoutRecordChange.tsx:1441-1553`) |
| 연장 한도(잔여 초과근무) 검증 | 프론트 표시 + 백엔드 | 프론트 표시 없음. 백엔드 저장 시 **승인 간주 없이 계산한 인정시간**으로 검증 (`be:service/appls/WorkRecordAdjustCheckHelper.java:60-78`) |
| 최대 근무시간 검증 | 프론트 표시 + 백엔드 | 백엔드 저장 시 **실근무 기준**으로 검증 ("최대 근무시간을 N시간 M분 초과했습니다.") (`WorkRecordAdjustCheckHelper.java:131-161`) |
| 휴일근무 "근무 불가" 그룹의 휴일 | 저장 거절 "휴일 근무내역 변경을 할 수 없도록 설정되어 있습니다. 담당자에게 문의바랍니다." (`be:service/appls/WorkRecordChangeApplsService.java:691-692`) | 같은 규칙, 문구만 "휴일 출퇴근 내역 변경을 할 수 없도록 설정되어 있습니다. 담당자에게 문의바랍니다." (`InoutRecordChangeApplsService.java:528-545`) |
| 저장 테이블 | `TM_WORK_REG_ADJST_APPL` (+ `INOUT_ONLY_YN='N'`) | `TM_INOUT_REG_ADJST_APPL` + `TM_INOUT_REG_ADJST_TIME_DTL` / `TM_INOUT_REG_ADJST_REST_DTL` (2026-09-18 신설, 조회·집계는 두 소스 UNION ALL, 응답에서 `inoutOnlyYn='Y'`로 구분) |
| 같은 날 둘 다 승인되면 | 마지막에 승인된 신청이 최종 (양쪽 complete 모두 같은 날 이전 확정분을 최종여부 N 처리) | 동일 (`InoutRecordChangeApplsService.java:436-458`, 테스트 `InoutRecordChangeCompleteCrossTypeIntegrationTest`) |

> 고객 응대 근거 (Slack #cx 2026-11-02): "승인 시에만 연장 가능 / 승인시간만 포함" 그룹에서 출퇴근 내역 변경으로 퇴근을 늦춰도 연장근무 신청이 없으면 연장이 집계되지 않는 것은 **정상**.

## 코드 위치

- 프론트
  - 신청 드로어: `pp:src/components/workflow/shared/template_drawer/contents/InoutRecordChange.tsx` (문서유형 상수 `:86`)
  - 결재 드로어(변경 전/후/결과 표시): `pp:src/components/workflow/shared/approval_drawer/contents/InoutRecordChange.tsx`
  - 공용 판정: `pp:src/lib/attendance/workTimeRecordChangeRequest.ts:35-89` (`canUseInoutRecordChange`, `getDefaultWorkTimeRecordChangeType`, `hasWorkTimeRecordChangeInProgress`)
  - API: `pp:src/modules/workflow/attendance/validation.ts:26`(valid-work-time) `:216`(진행중 신청) `:311`(valid-date), `pp:src/modules/workflow/document.ts:380`(form-setting)
  - 타입: `pp:src/@types/customTypes/workflow/inoutRecordChange.d.ts`
- 백엔드
  - `be:controller/appls/InoutRecordChangeApplsController.java` — `/time/appls/inout-record-change` + `/searchApply`·`/saveApply`·`/deleteApply`·`/submitApply`·`/cancelApply`·`/reject`·`/approvalDone`·`/complete`, `PUT /valid-work-time`, `GET /valid-date`, `GET /form-setting`
  - `be:service/appls/InoutRecordChangeApplsService.java` (검증·유효시간·요약·상세는 통합 근무내역 변경과 공유 Helper `WorkRecordAdjust*Helper`)
- 어드민 설정: `ad:src/components/attendance/work/group_setting/detail/contents/work_setting_tab/contents/work_request_form_setting/contents/inout_record_change/index.tsx`
- DB: `TM_INOUT_REG_ADJST_APPL`, `TM_INOUT_REG_ADJST_TIME_DTL`, `TM_INOUT_REG_ADJST_REST_DTL`, 그룹 설정 `TM_INOUT_REG_CHG_FORM_SETTING`

## 기능 상세

### 1. 진입 / 노출 조건

| 진입 | 조건 | 근거 |
|---|---|---|
| 출퇴근 위젯 [근무신청] → "출퇴근 내역 변경 신청" | 오늘 근무그룹 `inoutRecordChangeUseYn === "Y"` | `pp:src/components/main/work_commute/contents/WorkRequest.tsx:105-115` |
| 내 근무 캘린더 과거 날짜 클릭 | 그날 근무그룹이 두 변경 신청서 중 하나라도 사용. **둘 다 사용이면 출퇴근 내역 변경이 기본으로 열림** | `pp:.../my_work_calendar_cell/MyWorkCalendarCell.tsx:571-595, 620-625` |
| 출퇴근 위젯 "근무 내역 변경" 버튼 (출근 요청 취소/반려로 퇴근만 남은 경우 등) | 위와 같은 기본 신청서 규칙. 둘 다 미사용이면 버튼 비활성 + 툴팁 "통합 근무내역 변경과 출퇴근 내역 변경 신청서를 모두 사용할 수 없습니다.\n어드민에 문의해 주세요." | `pp:src/components/main/work_commute/WorkCommuteWidget.tsx:117-123, 328-336`, `pp:.../contents/CommuteButton.tsx:113-140` |
| 신청서 상단 유형 드롭다운 | 그날 사용 가능한 변경 신청서(출퇴근 내역 변경 → 통합 근무내역 변경 순) + 근무계획 변경(사용 시) 사이 전환 | `MyWorkCalendarCell.tsx:500-535` |

- 유형 라벨: 드롭다운 "출퇴근 내역 변경", 메뉴 "출퇴근 내역 변경 신청" (`pp:src/locales/ko/attendance.json:132, 145`)

### 2. 근무그룹 설정 연동 (근무 신청서 관리)

- 어드민 › 근무 그룹 설정 › 근무 신청서 관리 › "출퇴근 내역 변경 신청" — 활성화 조건 없음(항상 설정 가능). 항목: 신청서명 / 설명("출퇴근 내역 변경 신청서에 대한 설명을 작성합니다. 해당 내용은 변경 신청 시 구성원에게 공유됩니다.") / 사용 여부 / 파일 첨부·코멘트 입력 필수 여부 (`ad:src/locales/ko/attendance.json:256-262`)
- 사용자 화면은 `GET /form-setting`(로그인 사용자의 **현재** 근무그룹)으로 설명·첨부/코멘트 필수 여부를 가져오고 (`InoutRecordChange.tsx:163-196`), 신청 가능 여부는 **선택한 날짜**의 `workGrpVo.inoutRecordChangeUseYn`으로 판정 (`:247-249`)
- 설명이 있으면 유형 선택 아래에 접이식 설명 표시
- 미사용 날짜 → 경고 "해당 날짜에 소속된 근무그룹에서는 출퇴근 내역 변경 신청서를 사용할 수 없습니다." + [요청] 비활성. 서버도 저장 시 "출퇴근 내역 변경 신청서를 사용할 수 없습니다." / 그룹 없음 "근무그룹이 설정되어있지 않습니다." (`InoutRecordChangeApplsService.java:508-521`)

### 3. 요청일

- 단일 날짜. 요청일을 고를 수 있는 진입([근무신청])은 **어제까지**, 날짜가 고정된 진입(캘린더·위젯 버튼)은 오늘까지 선택 가능 (`InoutRecordChange.tsx:1182-1191`, 같은 규칙의 사유 주석 `RegEdit.tsx:1173-1185`)
- 미래 날짜 → "요청일은 현재 날짜 이전으로만 선택할 수 있습니다." / 미선택 → "요청일을 입력합니다." (`:788-791`)
- 날짜 선택 시 4개 조회를 동시에: 그날 근무정보, 근무 가능 시간 범위, 진행중 신청, 어드민 수정 여부 (`:416-426`)

### 4. 입력 항목

| 항목 | 필수 | 형식/기본값 | 비고 |
|---|---|---|---|
| 출퇴근 시간 (출근 n / 퇴근 n) | 행이 있으면 출근·퇴근 둘 다 | 당일/익일 + 시:분. 기존 기록이 채워진 채로 열림, 기록 없으면 빈 행 1개 | [+]로 행 추가, [×]로 삭제. 개수 제한 없음. 각 칸 왼쪽에 현재 값(없으면 빨간 "없음") |
| 자리비움 (시작 n / 종료 n / 코멘트) | 행이 있으면 시작·종료 둘 다 | 당일/익일 + 시:분, 행별 코멘트 | 기존 자리비움 기록이 채워진 채로 열림 |
| 코멘트 | 신청서 설정 | 텍스트 | "코멘트를 입력합니다." |
| 첨부 | 신청서 설정 | 파일 | "첨부파일을 업로드합니다." |
| 결재선 | Y | | |

- 오늘 출근 후 퇴근 기록이 없는데 위젯에서 진입하면 마지막 퇴근 칸에 강제 퇴근 시각, 자동 채움 퇴근(`outHmAutoFilledYn`)이 있으면 그 시각을 기본값으로 채움 (`:317-342`)
- 출퇴근·자리비움 중 최소 1건 → 없으면 "출퇴근 내역 변경 데이터를 입력합니다." (`:792-796`)
- 행 개수와 입력 쌍이 안 맞거나(한쪽 미입력) 시간 오류가 남아 있으면 "출퇴근, 자리비움 데이터 검증을 통과하지 못했습니다." (`:772-786`)

### 5. 시간 밸리데이션 (프론트, 입력 즉시)

`InoutRecordChange.tsx:537-683`, 문구 `pp:src/locales/ko/workflow.json` `INOUT_RECORD_CHANGE.validation.*`

| 케이스 | 메시지 |
|---|---|
| 퇴근 < 출근 | "퇴근시간이 출근시간 전입니다." |
| 출근 = 퇴근 | "출근시간과 퇴근시간이 동일합니다." |
| n번째 출근 < 이전 퇴근 | "출근시간이 이전 퇴근시간 전입니다." |
| 자리비움이 어느 출퇴근 구간에도 안 들어감 | "자리비움 시간은 출퇴근 시간 이내로 작성해야합니다." |
| 자리비움이 근무 가능 시간 범위 밖 | "자리비움 시작 종료시간을 확인해주십시오." |
| 자리비움 종료 < 시작 | "종료시간이 시작시간 전입니다." |
| 자리비움 시작 = 종료 | "자리비움 시작시간과 종료시간이 동일합니다." |
| n번째 자리비움 시작 < 이전 종료 | "시작 시간을 확인해주십시오." |

- 출퇴근 쌍이 하나라도 완성되면 `PUT /valid-work-time`으로 유효시간 계산 (연장/야간/휴일 승인 간주 없음, `be:controller/appls/InoutRecordChangeApplsController.java:173-189`). 화면에는 자리비움 합계(`restRegMinutes`)만 사용
- 마지막 출근/퇴근이 **근무 가능 시간 범위**(다음 근무일 시작 시각)를 넘으면 [요청] 시 확인 모달: 제목 "출퇴근 내역 변경", "입력하신 출퇴근 시각은 익일 근무를 포함하고 있습니다." / "해당 시간은 선택한 날짜의 근무로 기록됩니다. 이대로 변경하시겠습니까?" + "근무 가능 시간 : 당일 HH:mm ~ 익일 HH:mm" [취소]/[확인] (`:855-858, 1605-1685`)

### 6. 변경 결과 표시

- "출퇴근 n" 행별 `당일/익일 HH:mm ~ 당일/익일 HH:mm`. 기존 값과 다르면 파란색
- 출근인정시각 사용(`validInTimeUseYn=Y`) + 출근이 인정시각보다 이르면 "(인정 시각 HH:mm)" 병기 (`:1463-1519`)
- "자리비움" 합계 시간
- 하단 안내 (원문): "지난 근무 기록의 출퇴근 내역을 수정합니다." / "연장·야간·휴일근무 시간은 관련 설정 및 신청서의 승인 여부에 따라 확정됩니다."
- 통합 근무내역 변경에 있는 잔여 초과근무 안내, 최소 연장 "(미인정)", 근무시간/인정근무 블록은 **없음**

### 7. 차단 조건 ([요청] 비활성 + 날짜 아래 경고)

`InoutRecordChange.tsx:1195-1231, 1594-1601`

| 조건 | 화면 문구 | 서버 재검증 |
|---|---|---|
| 마감된 일자 | "선택한 일자의 근무가 마감되어 근무내역을 변경할 수 없습니다." | 저장·승인 모두 "선택한 일자의 근무가 마감되어 출퇴근 내역을 변경할 수 없습니다." (`Service:209-212, 413-416`) |
| 그룹 미사용 | § 2 | § 2 |
| 어드민이 직접 수정한 일자 (`hasAdminModifiedWork`, `GET /valid-date`) | "해당 일자의 근무내역은 어드민이 수정 및 확정하였습니다." — 입력칸·추가/삭제 버튼까지 비활성. [요청] 시에도 재조회해 막음 (`:819-849`) | 없음 — 서버는 `GET /valid-date` 조회만 제공, 저장(`saveApply`)에서는 재검증하지 않음 (`Service:556-580`. 통합 근무내역 변경도 동일 `WorkRecordChangeApplsService.java:760`) |
| 어드민이 근무내역을 삭제한 일자 (어드민 수정 + 출퇴근 누락) | 출퇴근 영역에 "해당 날짜의 근무내역 존재하지 않습니다." / "어드민이 근무 내역을 삭제한 상태입니다." | — |
| 같은 날 요청중 신청 | "선택한 날짜에 이미 신청한 출근 요청이 있습니다." / "… 퇴근 요청이 있습니다." / "… 통합 근무내역 변경 요청이 있습니다." / "… 출퇴근 내역 변경 요청이 있습니다." (해당하는 것 모두 표시) | "이미 신청중인 출근 요청이 있습니다." / "이미 신청중인 퇴근 요청이 있습니다." / "이미 신청중인 출퇴근/근무내역 변경 신청이 있습니다." — 대상 상태 승인 대기(200)·담당자 처리중(700) (`Service:485-503`) |

- 출퇴근 누락 상태면 "출퇴근 시간" 제목 옆 ! 아이콘 + 누락 사유 툴팁 (`:1252-1261`)

### 8. 서버 저장 검증 (신청 시)

`InoutRecordChangeApplsService.saveApply:162-317`

1. 입력 없음 → "변경 처리할 정보가 입력되지 않았습니다"
2. 마감 → § 7
3. 같은 날 진행중 신청 → § 7
4. 그룹 사용 여부 → § 2
5. **연장 한도** — 정정을 연장 승인으로 보지 않고 계산한 인정 근무시간으로 잔여 초과근무 검증 → "일 단위 초과근무 제한시간을 초과합니다" / "주 단위 …" / "월 단위 …" / "월(휴일) 단위 초과근무 제한시간을 초과합니다" (`be:service/overtime/RemainingOvertime.java:185-221`) (`WorkRecordAdjustCheckHelper.java:60-78, 108-123`). 승인된 사전/사후 휴일근무 시간만 반영 (hcgtheplus/optimiz-time#1738)
6. **휴일 + 휴일근무 "근무 불가"** → "휴일 출퇴근 내역 변경을 할 수 없도록 설정되어 있습니다. 담당자에게 문의바랍니다."
7. **최대 근무시간**(1주 기준, 실근무) → "최대 근무시간을 N시간 초과했습니다." / "…N분 초과했습니다." / "…N시간 M분 초과했습니다."
8. 출퇴근 IN-OUT 순서·자리비움 순서·자리비움이 출퇴근 안인지 → "출퇴근 내역 변경 신청이 불가합니다. n번째 출퇴근 시간을 다시 확인하고 요청해주십시오." 등 (`WorkRecordAdjustCheckHelper.java:171-520`, 신청서명 인자 "출퇴근 내역 변경")
9. 저장 후 다음날 누락 알림 비활성화

### 9. 결재 · 승인 후 반영

- 결재 드로어: "변경 전"(원래 실제 기록 — 재신청이어도 직전 신청이 아닌 원 기록) / "변경 후"(삭제된 행은 "삭제") / "변경 결과" + 안내 2줄 (`pp:.../approval_drawer/contents/InoutRecordChange.tsx`, `Service:118-122`)
- 최종 승인(`/complete`): 마감 재확인 → 이 신청을 최종(`LAST_YN=Y`)으로, 같은 날 이전에 확정된 출퇴근 내역 변경·통합 근무내역 변경을 모두 최종 아님으로 → 컨트롤러가 해당 일자 일·월 집계 이벤트 발행 (`Service:386-479`, `Controller:145-170`)
- 집계는 완료 + 최종 건만 반영. 연장/야간/휴일은 승인 우회 대상에서 제외(`inoutOnly`) — 근무그룹 "승인시간만 포함"이면 별도 신청 승인분만 인정 (테스트 `InoutRecordChangeAggregationSuppressIntegrationTest`, `…ByModeIntegrationTest` — NP/P/M 모드 모두 억제)

### 10. 취소 / 회수

- 결재 전(승인한 결재자 없음) 본인 "요청 취소" = 회수(`/cancelApply`)만 가능
- 문서유형 1072는 `isCancellable=false` → **결재 완료 후 사용자 취소 불가**, 취소 신청서 없음 (`optimiz-system:CONST_APPLY.java:56`, [공통](./overview.md) § 취소 가능 판정)
- 되돌리려면 같은 날짜로 출퇴근 내역 변경(또는 통합 근무내역 변경)을 다시 신청 → 나중에 승인된 건이 최종 (Slack #channeltalk 2026-11-03 CS 안내와 일치)
- 완료 건이 취소 상태로 바뀌면(어드민 경로 등) 재집계 시 원 타각으로 원복됨 (테스트 `InoutRecordChangeAggregationCancelRevertIntegrationTest`) — 사용자 화면에 그 경로는 없음

## 비즈니스 룰

1. 출퇴근 시각 정정 전용 — 정정 시간의 연장·야간·휴일은 이 신청만으로 승인 처리되지 않음
2. 근무그룹별 사용 여부(기본 미사용). 통합 근무내역 변경과 **독립**적으로 켜고 끔. 둘 다 켜져 있으면 캘린더·위젯 진입 기본값은 출퇴근 내역 변경
3. 같은 날 출근·퇴근 요청, 통합 근무내역 변경, 출퇴근 내역 변경 중 요청중인 게 있으면 신청 불가 (두 변경 신청서는 서로도 막음)
4. 어드민 직접 수정 일자, 마감 일자는 신청 불가 (마감은 승인도 불가)
5. 같은 날 여러 변경 신청이 승인되면 마지막 승인 건이 최종
6. 결재 완료 후 취소 불가

## 알려진 제약 / 진행 중 변경

- 신청서 설정 조회는 **오늘 근무그룹 기준**, 사용 여부·저장 검증은 **신청일 근무그룹 기준** → 근무그룹이 바뀐 구성원은 첨부/코멘트 필수 표시가 저장 기준과 다를 수 있음. 열린 PR hcgtheplus/optimiz-time#1789(2026-11-02 갱신, 2026-11-05 기준 OPEN)에서 `form-setting?workYmd=` 지원 예정. **(2026-11-05 Slack 확인)** 이는 "모든 신청서 설정을 오늘이 아니라 신청 대상 기간 기준으로 다시 조회"하는 고도화의 일부로 2026-07부터 필요성이 제기됐으나 전 신청서 일괄 계획·일정은 없음 (#sq-time 2026-07-08 https://hcgtheplus.slack.com/archives/C04QC2RJJBU/p1783472986958919?thread_ts=1781661208.969699, #channeltalk 2026-10-20 https://hcgtheplus.slack.com/archives/C06ULEEM88M/p1792462533503469?thread_ts=1792461291.617899)
- 첨부/코멘트 필수는 현재 **프론트에서만** 검증. #1789 머지 시 백엔드도 거절 예정
- 결재중(승인 전) 출퇴근 내역 변경이 있는 날의 연장 한도·근무시간 표시가 결재 완료 후 기준과 다르게 계산되던 문제 → 열린 PR hcgtheplus/optimiz-time#1786에서 수정 중
- 어드민 근무 신청 내역 관리 탭은 반려·취소 건을 조회하지 않음 ([근무 신청 내역 관리](../../admin/work/appl-management.md) § 2/§ 3) (2026-11-05 Slack 검색: 의도 여부 논의 없음. 출근/퇴근 요청서는 어느 탭에도 안 보인다는 CS 확인만 있음 — #channeltalk 2026-11-03)

## 관련 신청서 / 다른 기능과의 연계

- [통합 근무내역 변경](./reg-adjust.md) — 같은 화면 구조, 연장/야간/휴일 승인 간주 여부가 다름. 상호 중복 차단, 마지막 승인 건 최종
- [연장/야간근무(사전)](./overtime.md) · 사후 · [휴일근무](./holiday-work.md) — "승인 시에만" 그룹에서 정정한 연장/휴일 시간을 인정받으려면 이 신청서들의 승인이 별도로 필요
- [근무계획 변경](./plan-change.md) — 캘린더 진입 시 유형 드롭다운으로 전환
- [출퇴근 위젯](../home/checkin-widget.md) / [내 근무](../attendance/my-work.md) — 진입점, 요청중이면 위젯 시간표 숨김(`hasWorkTimeRecordChangeInProgress`)
- [근무 그룹 설정](../../admin/work/group-setting.md) § 4-1 — 사용 여부·설명·첨부/코멘트
- [근무 데이터 관리](../../admin/work/check-work-data.md) — 어드민 직접 수정 시 신청 차단
- [근무 신청 내역 관리](../../admin/work/appl-management.md) § 3 — 어드민 조회
- [근무 대시보드](../../admin/work/dashboard.md) — 요청중 건 있으면 알림 발송 제외 ("통합 근무내역 변경 또는 출퇴근 내역 변경 요청건이 존재하여 알림을 발송할 수 없습니다.")
- [근무 마감](../../admin/work/close-work-data.md)

## [TBD]

- [ ] 어드민 직접 수정 일자를 서버 저장에서 막지 않는 것이 의도인지 (프론트 우회 시 신청 가능 — 통합 근무내역 변경도 동일)
  - (2026-11-05 Slack) 기획 결정은 "어드민에서 근무내역변경하면 출퇴근내역변경신청서에서도 막힘" — Slack #bizops-center 2026-10-01 스프린트 #69 결정사항 (https://hcgtheplus.slack.com/archives/C0AC4BH6QLB/p1790745475348859). 차단 의도는 확정, 서버 재검증 누락은 논의 없음 → 구현 누락 가능성
  - (2026-11-05 Slack 재검색) 2025-09 최초 설계 때 "요청일이 있으면 확인 + **최종 요청 시에도** 확인"으로 정했고(#sq-time 2025-09-23 https://hcgtheplus.slack.com/archives/C04QC2RJJBU/p1758611152640509?thread_ts=1758516799.937869), 이는 화면에서 요청 직전 재조회로 구현됨. 서버 저장 단계 재검증 여부는 여전히 논의 없음
- [x] ~~출퇴근 내역 변경 결재 문서를 워크플로우 문서함에서 새로 작성할 수 있는지~~ → **(2026-11-05 Slack 확인) 불가** — 워크플로우 [문서 작성]에는 커스텀 신청서만 노출하고 기본(근무·휴가) 신청서는 제외하는 것이 정책 ("문서작성에 노출되는 문서는 커스텀 신청서만" #sq-core 2026-06-29 https://hcgtheplus.slack.com/archives/C096R4XKQ1Z/p1782696518907239?thread_ts=1782289539.791739, #notice-talenx 2026-01-06). 코드도 `ListDrawer`가 `applicationFormType === "CUSTOM"`만 목록에 표시 (`pp:src/components/workflow/shared/drawer_content/contents/ListDrawer.tsx:96-99`). 워크플로우에서는 받은/보낸 문서 열람·결재만 가능
