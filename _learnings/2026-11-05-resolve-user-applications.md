# 2026-11-05 미결 해소 — user/applications (근무 신청서 8개 페이지)

기준: ppfront `origin/dev`, optimiz-time `origin/dev`, talenx-admin `origin/dev`, optimiz-core·optimiz-system 로컬 체크아웃.

## 해소 목록 (근거)

| # | 항목 | 결론 | 근거 |
|---|---|---|---|
| 1 | 최대 초과근무 미설정 시 연장 신청 (overtime.md ↔ overview.md 모순) | **밸리데이션 안 걸림 = 통과**. "잔여 12h"(주 40h 초과 시 52h−주간 예상)는 표시 전용. overtime.md "밸리데이션 미통과" 표현이 틀렸음 | `pp:src/hooks/attendance/useOvertimeRequestValidation.ts:253-262`, `pp:…/template_drawer/contents/RequestTimeInfo.tsx:166-185`(주석 "보여주기용"), `be:service/overtime/RemainingOvertime.java`, `be:service/appls/otwork/OtApplsService.java:199-215` |
| 2 | 휴일근무·연장 오류 메시지 원문 | 표로 반영 (holiday-work.md / overtime.md) | `pp:src/locales/ko/attendance.json` `HOLIDAY_WORK.*`, `pp:src/locales/ko/workflow.json` `OVERTIME.*` |
| 3 | 잘린 메시지 원문 | 근무계획 변경 5종, 기타근무 겹침("예제 문구"), 근무내역 변경 익일 모달 원문 반영 | `workflow.json` `PLAN_EDIT.validation.*`, `OTHER_WORK.validation.duplicateWorkRequest`, `REG_EDIT.includesNextDayWork`/`recordedAndConfirmChange` |
| 4 | 신청 상태 화면 라벨 | 문서 목록 칩: 요청중/승인필요/승인완료/반려/취소/본인승인/완료. 상태코드: 임시저장/승인 대기중/반려/취소/담당자 처리중/승인완료/승인 후 취소. 근무 화면: 요청중/취소중 | `workflow.json` `CODE_INDEX`, `attendance.json` `COMMON.pending/canceling` |
| 5 | 재택 중복·마감 차단 | 둘 다 차단 (경고 박스 + [요청] 비활성 + 서버 예외). **재택은 기간 신청 가능** (KB "단일 일자만"은 틀림) | `pp:…/template_drawer/contents/HomeWork.tsx:286-375`, `be:service/appls/WorkForHomeApplsService.java:236-328` |
| 6 | 근무내역 변경 출퇴근 시각 필수 | 출퇴근 행이 있으면 출근·퇴근 모두 필수(쌍 불일치 시 "출퇴근, 자리비움 데이터 검증을 통과하지 못했습니다."), 최소 1건 입력, 행 개수 제한 없음 | `pp:…/template_drawer/contents/RegEdit.tsx:992-1031` |
| 7 | CONST_APPLY_ACTION 실제 문자열 | `/searchApply`, `/saveApply`, `/submitApply`, `/cancelApply`, `/reject`, `/approvalDone`, `/complete`, `/deleteApply` (KB의 `/search` 등은 틀림) | `optimiz-core:…/system/constant/CONST_APPLY_ACTION.java:23-62` |
| 8 | 대체·계획변경·내역변경 결재 완료 후 취소 | **불가**. 문서유형 `isCancellable=false`. 승인자 미승인 상태에서 회수만 가능 | `optimiz-system:workflow/service/application/ApplicationsService.java:190-260`, `optimiz-system:workflow/constant/CONST_APPLY.java`, `pp:…/approval_drawer/index.tsx:202-230,1190-1220` |
| 9 | 겹침 판정 범위 | 같은 종류끼리만, 요청중·승인 상태, 신청일 전일~익일 | `be:service/appls/otwork/OtApplsService.java:508-570`, `be:validator/appls/holidaywork/HolidayWorkApplDuplicateValidator.java` |
| 10 | 휴일근무 캘린더 "휴일" 판정 | 근무일유형 `H`만 (휴무일 제외), 오늘 이전 비활성 | `be:common/legacy/empdailywork/EmpDailyWorkService.java:1570-1606`, `pp:…/DayOff.tsx:254-268` |
| 11 | 연장/야간 구분 UI | 없음, 시간으로 자동 판단 | `pp:…/Overtime.tsx:1016-1120`, `OVERTIME.includesTextWork` |
| 12 | 재택 칩 < 기타근무 칩 의도 여부 | 의도된 정책 | Slack #030 사용자 화면 스테이징 체크리스트 2025-02-07, #ch-ux 2024-10-23 |
| 13 | 대체근무 불가 조건별 문구 | 서버 enum 원문 반영, 신규 조건 2개(근무계획 수립 요청중, 신청 후 근무그룹 변경) | `be:dto/appls/compensatorywork/CompensatoryWorkApplValidationDto.java:106-136` |
| 14 | 어드민 수정 일자 차단 문구 | "해당 일자의 근무내역은 어드민이 수정 및 확정하였습니다." (KB의 "관리자에 의해 수정된 내역이…"는 코드에 없음) | `workflow.json` `REG_EDIT.validation.adminModifiedWorkRecord` |
| 15 | OtWorkCancel path, 휴일근무 승인 drawer | `/time/appls/ot-cancel`, `approval_drawer/contents/DayOff.tsx`·`DayOffCancel.tsx` | 코드 |
| 16 | TM_RMT_WORK vs TM_WORK_FOR_HOME | RMT_WORK_APPL = 구 원격근무(1090), 신규 저장 없음. RMT_WORK_LOC는 위치 레코드 | `be:resources/SQL/time/appls/WorkForHomeMapper.xml:140-162` |
| 17 | 기타근무·대체근무 DB/VO | `TM_OTHER_WORK_APPL*`, `TM_COMPENSATORY_WORK_APPL`, `CompensatoryWorkApplVo` | 매퍼/VO |
| 18 | Remote.tsx / WorkGroup.tsx | dev에 없음 (삭제) | `git ls-tree origin/dev` |
| 19 | "근무 신청서 관리" 범위 | 근무계획 변경뿐이 아님 — 9종으로 확장 | `ad:src/locales/ko/attendance.json:228-240` |

## 새 발견 (KB 페이지 없음)

- 휴일 근무(사후) 1122/1123, 연장/야간근무(사후) 1042/1043, 출퇴근 내역 변경 1072, 근무계획 수립 1031 신청서가 사용자 드로어에 존재 — 페이지 미작성
- 근무내역 변경(1071)의 현재 이름은 "통합 근무내역 변경"
- 휴일근무·연장 신청서에도 신청서 설정(사용 여부·설명·첨부/코멘트 필수, 당일 과거 시각 정책)이 적용됨

## 남은 항목

- `PsnHoliWorkApplVo` / `PsnOtPlanApplVo` 전체 필드, `OtApplValidTimeDto` / `OtherWorkApplValidationDto` 구조 (코드용, 기획 영향 적음)
- 휴게시간 자동 적용 규칙 상세
- `LegacyRecordWidgetController` `/is-necessary` 용도
- 기타근무 항목 마스터 정의 어드민 화면 위치 (어드민 영역)
- `DayOff.tsx` 명명 이유
- 개인스케줄 잔존 버그 처리 여부
- 결재 완료된 대체·계획변경·내역변경을 되돌리는 어드민 경로

## 2026-11-05 Slack 재검토
검색 도구: Slack 공개·비공개·DM 검색(읽기만) + 필요 시 `origin/dev` 코드·gh 보조. 항목마다 키워드 2~4개 조합 검색.

| # | 항목 | 분류 | 결론 | 근거(채널·날짜·링크) |
|---|---|---|---|---|
| 1 | 결재 완료된 대체근무·근무계획 변경·근무내역 변경(1071/1072)·수립(1031) 되돌리는 어드민 경로 | 해소-결정 | 어드민도 승인 취소·삭제 기능 없음(근무 신청 내역 관리 조회 전용). "기록을 업데이트하는 신청서는 취소 신청서 없음 → 올바른 값으로 재신청, 나중 승인 최종". 대체근무는 날짜 맞바꿔 재신청 권장, 차선으로 어드민 개인 근무 스케줄 관리에서 **미래 일자** 개인 스케줄 삭제(신청서 잔존). 지난·마감 일자는 개발자 문의. 대체근무 취소 신청서는 고도화 예정이나 후순위 | #channeltalk 2026-11-03 https://hcgtheplus.slack.com/archives/C06ULEEM88M/p1793671272279939?thread_ts=1793668757.494899 |
| 2 | 근무그룹 변경 시 이전 그룹 개인스케줄 잔존 | 버그·구현누락 확인 | 2026-11 현재 미해결·고도화 미착수. 계산은 잔존 개인스케줄 우선, 개인별 스케줄 작성/수정·구성원 근무 일정 조회는 현재 그룹 기준 필터라 안 보임/그룹스케줄로 보임. 운영은 고객 확인 후 데이터 삭제+재집계 | #cx 2026-06-26 https://hcgtheplus.slack.com/archives/C01AVJ2CJBW/p1782445471287259?thread_ts=1782371583.278219 · #cx 2026-09-29 https://hcgtheplus.slack.com/archives/C01AVJ2CJBW/p1790643052150589?thread_ts=1790037711.712179 · #channeltalk 2026-01-08, 2025-07-01 |
| 3 | 휴게시간 자동 부여 규칙 | 해소-결정 | 일자 근무 템플릿의 휴게 설정(자동 법정/주기별은 시작시각 기준 구간 계산, 고정은 신청 구간과 겹치는 부분). 휴무일 근무=연장 휴게, 휴일=소정 8시간까지 기본 휴게 후 연장 휴게(휴일 템플릿 휴게 설정 추가). 안내 문구 \"회사에서 지정한 휴게 기준에 따라 휴게시간이 자동으로 부여됩니다.\"로 교체(로드맵 726) | #sq-time 2026-09-14 https://hcgtheplus.slack.com/archives/C04QC2RJJBU/p1787721270470399 · #sq-time 2026-09-30 https://hcgtheplus.slack.com/archives/C04QC2RJJBU/p1790746704976579?thread_ts=1790127203.895429 |
| 4 | 기타근무 항목 마스터 어드민 위치 | 해소-의도 | 근무관리 › 근무 설정 › 기타근무 항목 설정 탭(CRUD, 동명 불가) + 근무 그룹 설정 › 기타근무 항목 관리(그룹별 사용). 신규 항목은 전 그룹 '사용 안 함'(2026-08) | #cx 2026-09-28 · #sq-time 2024-11-08, 2026-08-10 https://hcgtheplus.slack.com/archives/C04QC2RJJBU/p1786354921250659?thread_ts=1786332583.337449 |
| 5 | 어드민 직접 등록 기타근무 다이얼로그 진입 지점 | 해소-의도 | 등록 = 근무 데이터 관리 › 기타근무 현황 › 근무 수동등록(엑셀, 2026-03). 다이얼로그 = 내 근무 캘린더 셀·구성원 근무 현황 탭·근무 정보에서 해당 건 클릭 시(코드 확인) | #cx 2026-03-09 https://hcgtheplus.slack.com/archives/C01AVJ2CJBW/p1773044800731839?thread_ts=1772778504.575099 · #sq-time 2026-03-05(ppfront#10769) |
| 6 | 재택이 기타근무에 가려지는 정책 vs 내 근무 캘린더 둘 다 표시 | ~~해소-의도~~ → **부분** (메인 세션 교차 검증: 2025-06-18 스레드는 "전사 근무 계획 캘린더" 대상이며 재택은 툴팁 표시. 내 근무 캘린더 결정은 없음 — user-attendance 결론이 맞음) | 칩 한 자리 공유는 위젯·근무 현황 칩 정책(2025-02). 캘린더형 화면 기획(2025-06)은 휴가→기타근무→재택→기본근무 정렬 + \"기타근무와 재택 겹치면 툴팁 등으로 재택도 표시\" → 내 근무 캘린더의 동시 표시는 화면별 차이로 정상. my-work.md \"기획≠구현\" 표기 정정 제안 | #030 체크리스트 2025-02-07 · #ch-plan 2025-06-18 https://hcgtheplus.slack.com/archives/C02VCP9MBQV/p1750229945190409?thread_ts=1750227993.860649 |
| 7 | `legacy/LegacyRecordWidgetController.is-necessary` 용도 | 부분 | 레거시 컨트롤러 논의 없음. 유사 `holiday-work/is-necessary`·`ot/is-necessary`는 위젯 [시간 변경] 비활성 판단용. 기획 영향 적음 | #sq-time 2026-02-20, 2025-08-26 |
| 8 | VO/DTO 필드(`PsnHoliWorkApplVo`·`PsnOtPlanApplVo`·`OtApplValidTimeDto`·`OtherWorkApplValidationDto`), `DayOff.tsx` 명명 | 기획 영향 없음 | Slack 검색 생략 | — |

공유 파일 제안: `product/user/attendance/my-work.md` L640·L685의 \"기타근무 칩 vs 재택 동시 노출 = 기획≠구현\"은 #6 근거로 \"화면별 정책 차이(캘린더는 겹침 시 함께 표시 방향)\"로 정정 권장. `product/admin/work/personal-schedule.md`에 선택적 근로제 인원의 근무 스케줄 탭 표시 규칙(#sq-time 2026-08-25) 반영 권장.
