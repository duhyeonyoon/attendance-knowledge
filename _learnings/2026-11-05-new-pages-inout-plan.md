# 2026-11-05 신규 페이지 — 출퇴근 내역 변경(1072) · 근무계획 수립(1031)

기준: ppfront `origin/dev`(2073a39c8, 2026-11-05), optimiz-time `origin/dev`(b534d01df, 2026-11-04), talenx-admin·optimiz-system `origin/dev`. QA 체크리스트(ppfront·talenx-admin)에는 두 신청서 항목 없음.

작성: `product/user/applications/inout-record-change.md` ↔ `spec/user/applications/inout-record-change.md` (order 11), `product/user/applications/work-plan-establishment.md` ↔ `spec/user/applications/work-plan-establishment.md` (order 9)

## 출퇴근 내역 변경 (1072)

| # | 발견 | 근거 |
|---|---|---|
| 1 | 통합 근무내역 변경과의 본질적 차이: 승인 시 정정 시간의 연장/야간/휴일을 **승인된 것으로 간주하지 않음**(`inoutOnly`). "승인시간만 포함" 그룹에선 별도 신청 승인분만 인정. NP/P/M 모드 모두 억제 | `be:common/workcalc/WorkTimeCalcService.java:341-344, 2880-2887`, 테스트 `InoutRecordChangeAggregation{Suppress,ByMode}IntegrationTest`, Slack #cx 2026-11-02 고객 응대 |
| 2 | 근무그룹 설정 행이 없으면 출퇴근 내역 변경 **미사용(N)**, 통합 근무내역 변경 **사용(Y)**. 마이그레이션 백필도 같은 값 | `InoutRecordChangeApplsService.java:508-521`, hcgtheplus/optimiz-time#1678 본문 |
| 3 | 두 신청서 모두 사용하는 그룹이면 캘린더·위젯 "근무 내역 변경" 진입 기본값이 **출퇴근 내역 변경** | `pp:src/lib/attendance/workTimeRecordChangeRequest.ts:55-72` |
| 4 | 저장 테이블 분리 `TM_INOUT_REG_ADJST_APPL` / `_TIME_DTL` / `_REST_DTL` (2026-09-18), 조회·집계는 UNION ALL + `inoutOnlyYn='Y'`로 구분. 그룹 설정 `TM_INOUT_REG_CHG_FORM_SETTING` | 마이그레이션 SQL, PR #1678 |
| 5 | 같은 날 두 변경 신청서가 승인되면 **마지막 승인 건이 최종** (양쪽 complete 모두 상대 확정분도 LAST_YN=N) | `InoutRecordChangeApplsService.java:436-458`, `InoutRecordChangeCompleteCrossTypeIntegrationTest` |
| 6 | 서버 저장 검증: 연장 한도(승인 간주 없는 인정시간 기준), 최대 근무시간(실근무 기준), 휴일근무 "근무 불가" 그룹 휴일 거절 "휴일 출퇴근 내역 변경을 할 수 없도록 설정되어 있습니다. 담당자에게 문의바랍니다." | `WorkRecordAdjustCheckHelper.java:60-161`, `Service:528-545` |
| 7 | 연장 한도 초과 서버 문구: "일/주/월/월(휴일) 단위 초과근무 제한시간을 초과합니다" | `be:service/overtime/RemainingOvertime.java:185-221` |
| 8 | 어드민 직접 수정 일자(`hasAdminModifiedWork`) 차단은 **프론트만** — 서버 `saveApply`는 재검증 안 함 (1071도 동일) | `Service:556-580`, `WorkRecordChangeApplsService.java:760` |
| 9 | 서버 중복 메시지는 통합/출퇴근 변경을 한 문구 "이미 신청중인 출퇴근/근무내역 변경 신청이 있습니다."로 묶음 (프론트는 구분 표시) | `Service:485-503` |
| 10 | 결재 완료 후 취소 불가(`isCancellable=false`). 되돌리기는 재신청 → 마지막 승인 건 최종 | `optimiz-system:CONST_APPLY.java:56`, Slack #channeltalk 2026-11-03 |
| 11 | 열린 PR: #1789(form-setting `workYmd` 기준 통일, 첨부/코멘트 필수 백엔드 검증, 설정 없는 그룹 기본값 저장/복제), #1786(결재중 건의 연장 한도·근무시간 계산 통일) — 머지 시 KB 갱신 필요 | gh |

## 근무계획 수립 (1031, 선택적 근로제)

| # | 발견 | 근거 |
|---|---|---|
| 1 | 선택적 근로제(WORK_TYPE SELECTIVE) 그룹 + 신청서 사용 ON만. 진입은 출퇴근 위젯 [근무신청] 메뉴뿐 (캘린더 진입 없음) | `WorkPlanEstablishmentApplsService.java:333-401`, `WorkRequest.tsx:136-142, 286-293` |
| 2 | **정산기간 전체 단위** 신청. 옵션 = 오늘 ±1개월 + 현재 정산주기 앞뒤. 그룹 변경 시 정산주기 ∩ 소속기간 | `Service:189-325, 1911-1929` |
| 3 | 차단 우선순위: 요청중 수립 > 요청중 대체근무 > 마감 일자 포함 > 기준 스케줄 없는 일자. 요청 시 휴일/휴무일 허용 설정 변경도 차단 | `pp:src/lib/attendance/workPlanEstablishment/mapper.ts` `resolvePeriodBlockReason` |
| 4 | 검증: 합계 ≥ 소정근로시간, ≤ 최대 근무시간(설정 시), 일자별 코어타임 포함, 최초 신청은 근무일 전체 입력, 시작=종료(0시간) 허용 | `Service:148-164, 1555-1671`, `timeValidation.ts` |
| 5 | 소정근로시간 기준 = 법정 기준이면 법정, 근무계획 기준이면 **근무그룹 스케줄**만 (개인/승인 계획 미반영) — "기획 확인 결과" 주석 | `Service:794-856, 1643-1650` |
| 6 | 승인 = 정산기간 전체 `TM_MEMBER_DAILY_WORK_SCHEDULE` 교체, 실제 바뀐 날 중 승인일 이전·당일만 재집계. 마감 일자 있으면 승인 불가 | `Service:2206-2269, 2329-2406, 2575-2582` |
| 7 | "미수립"(`workPlanNotEstablished`) = 선택적 근로제 근무일 + 승인 스케줄이 최종 스케줄로 선택 안 됨. 수립된 날은 자율 템플릿이어도 수립 시각 표시 (내 근무, 구성원 근무 › 근무 스케줄 탭) | `be:dto/memberworks/MemberDailyWorkPlan.java:186-202`, `pp:src/lib/attendance/personalWork.ts:1046-1070`, `pp:.../member_work/contents/work_schedule_tab/index.tsx:622-646` |
| 8 | 신청서 설정 응답의 변경 대상 기간·신청 가능 기간 필드는 어드민 UI·사용자 화면 모두 미사용. 어드민 설정 고유 항목은 "휴일/휴무일 근무 허용 여부" | `ad:.../work_plan_establishment/WorkPlanEstablishmentLimitSection.tsx` |
| 9 | 재신청 시 승인된 일자만 시각 prefill, 템플릿 시각은 prefill 안 함 | `mapper.ts` `mapDailyPlansToInitialDayPlans` |
| 10 | 결재 완료 후 취소 불가(`isCancellable=false`). 취소 시 확정 스케줄 원복 로직 없음(주석). 과거 일자 입력 제한 없음(마감일만 차단) | `optimiz-system:CONST_APPLY.java:33`, `Service:633-642`, `PeriodCalendar.tsx:317-320` |

## 다른 문서와 어긋나는 점 (정정 제안, 이번에 수정하지 않음)

- `product/user/applications/overview.md` § 신청 상태 화면 라벨: 문서 유형명 목록에 "근무계획 수립 신청"(1031), "출퇴근 내역 변경"(1072) 누락. § 취소 가능 판정/Cancel 컨트롤러 표의 "취소 불가" 목록(대체·계획변경·내역변경)에 1031·1072 추가 필요. § 진입 위치 "함께 묶이는 신청서들"에도 두 신청서 누락
- `product/user/applications/overview.md` 비즈니스 룰 11: 어드민 직접 수정 차단 flag가 `hasModifiedWorkRecord`로 적혀 있음 → 신청서 차단은 `hasAdminModifiedWork`(`/valid-date`). `hasModifiedWorkRecord`는 승인된 변경 신청 존재(위젯 버튼용)
- `product/user/applications/reg-adjust.md`: "출퇴근 내역 변경(1072)이 따로 존재"만 있음 → 차이(연장/야간/휴일 승인 간주) 링크 추가 권장. 휴일근무 "근무 불가" 그룹 휴일 서버 거절 문구 "휴일 근무내역 변경을 할 수 없도록 설정되어 있습니다. 담당자에게 문의바랍니다."(`WorkRecordChangeApplsService.java:691-692`)가 KB에 없음. 진입 기본값(둘 다 사용 시 출퇴근 내역 변경 우선)도 반영 필요
- `product/user/applications/plan-change.md`: 선택적 근로제 그룹에서는 사용 불가(근무계획 수립으로 대체) 언급 없음
- `product/user/home/checkin-widget.md`(확인 필요): "근무 내역 변경" 버튼이 두 신청서 중 기본값을 열고, 둘 다 미사용이면 비활성 + 툴팁 "통합 근무내역 변경과 출퇴근 내역 변경 신청서를 모두 사용할 수 없습니다.\n어드민에 문의해 주세요."
- `product/admin/work/personal-schedule.md` 데이터 흐름의 "4가지 개인스케줄 생성 출처"에 근무계획 수립 승인(별도 테이블 `TM_MEMBER_DAILY_WORK_SCHEDULE`)이 선택적 근로 스케줄 탭 쪽으로만 표시됨 — 문제는 없으나 테이블명 명시 권장

## 2026-11-05 Slack 재검토
| # | 항목 | 분류 | 결론 | 근거(채널·날짜·링크) |
|---|---|---|---|---|
| 1 | 1072·1031 워크플로우 문서함 직접 작성 | 해소-결정 | 불가 — 워크플로우 [문서 작성]은 커스텀 신청서만 노출(기본 신청서 제외 정책). 코드 `ListDrawer.tsx:96-99` `applicationFormType === "CUSTOM"` 필터 | #sq-core 2026-06-29 https://hcgtheplus.slack.com/archives/C096R4XKQ1Z/p1782696518907239?thread_ts=1782289539.791739 · #notice-talenx 2026-01-06 |
| 2 | 신청서 설정 고도화(신청일 기준 설정) 계획 | 부분 | \"모든 신청서 설정을 오늘이 아니라 신청 대상 기간 기준으로 재조회\" 고도화 필요성은 2026-07부터 합의, 전 신청서 일괄 일정 없음. 출퇴근/통합 변경은 optimiz-time#1789(OPEN)로 `form-setting?workYmd=` 진행. 근무계획 수립은 정산기간별 휴일/휴무일 허용값을 쓰도록 2026-10-20 핫픽스 | #sq-time 2026-07-08 https://hcgtheplus.slack.com/archives/C04QC2RJJBU/p1783472986958919?thread_ts=1781661208.969699 · #channeltalk 2026-10-20 https://hcgtheplus.slack.com/archives/C06ULEEM88M/p1792462533503469?thread_ts=1792461291.617899, https://hcgtheplus.slack.com/archives/C06ULEEM88M/p1792472894914639?thread_ts=1792461291.617899 |
| 3 | 결재중 출퇴근 내역 변경의 한도·근무시간 계산 (#1786) | 부분 | PR OPEN(2026-11-05), Slack 추가 논의 없음 | gh |
| 4 | 어드민 수정 일자 서버 재검증 | 부분 | 2025-09 설계 때 \"요청일 있으면 확인 + 최종 요청 시에도 확인\"(화면 요청 직전 재조회로 구현). 서버 저장 재검증은 논의 없음 | #sq-time 2025-09-23 https://hcgtheplus.slack.com/archives/C04QC2RJJBU/p1758611152640509?thread_ts=1758516799.937869 · #bizops-center 2026-10-01 |
| 5 | 근무 신청 내역 관리에 수립 탭 없음 | 부분 | \"최종적으로 신청서 내역 조회 쪽에도 화면 추가되겠지만 우선순위상 스케줄 쪽 먼저\" — 방향은 추가, 시점 미정 | #sq-time 2026-08-13 https://hcgtheplus.slack.com/archives/C04QC2RJJBU/p1786581330379959?thread_ts=1786519440.193459 |
| 6 | 개인 근무 스케줄 관리 근무 스케줄 탭에 선택적 근로제 인원 조회 | 해소-의도 | 조회됨, 개인 스케줄 칸 공란(수립 내역은 선택적 근로 스케줄 탭에서만), 신청서 변경분만 표시. 선근제 인원은 어드민 스케줄 등록·직책자 변경·근무계획 변경 신청 불가 | #sq-time 2026-08-25 https://hcgtheplus.slack.com/archives/C04QC2RJJBU/p1787635908267959 |
| 7 | 어드민 근무 신청 내역 관리 반려·취소 건 미조회 | Slack에 없음 | 의도 여부 논의 없음(출근/퇴근 요청서는 어느 탭에도 없다는 CS 확인만) | #channeltalk 2026-11-03 |
| 8 | 결재 완료된 1072·1031 되돌리기 | 해소-결정 | 재신청(나중 승인 최종), 어드민 취소 기능 없음 — resolve-user-applications 재검토 #1 | #channeltalk 2026-11-03 |
