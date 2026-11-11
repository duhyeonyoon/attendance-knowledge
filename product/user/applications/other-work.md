---
sidebar:
  order: 6
---

# 기타근무 신청

> **메뉴** 근무 신청 › 기타근무  
> **원본** `product/_legacy/appl-other-forms.md`

*원본 섹션: 2. 기타근무 신청 (U17)*

**조건**: 어드민에서 **기타근무 항목 관리**에 항목이 등록되어 있어야 함 (근무그룹 상속). 항목별로 코멘트/파일 첨부 필수 여부 설정 가능

**ppfront 컴포넌트**:
- `pp:src/components/workflow/shared/template_drawer/contents/OtherWorkApplications.tsx` ⭐
- 관련 훅: `pp:src/hooks/attendance/useAdminDirectOtherWorkDisplay.tsx` (어드민 직접 등록 시 표시)
- 관련 컴포넌트: `pp:src/components/attendance/shared/admin_direct_dialog/AdminDirectOtherWorkDialog.tsx` (어드민 등록 안내)

**백엔드**:
- 신청: `be:controller/appls/otherwork/OtherWorkApplsController` — `/time/appls/other-work/*`
- 취소: `be:controller/appls/otherwork/OtherWorkCancelApplsController` — `/time/appls/other-work-cancel/*`
- DB: ~~`TM_WORK_FOR_HOME_APPL*` 사용?~~ → **(2026-11-05 해소)** 기타근무 전용 `TM_OTHER_WORK_APPL`, `TM_OTHER_WORK_APPL_DTL`, `TM_OTHER_WORK_CANCEL_APPL` (항목 마스터 `TM_OTHER_WORK`, 그룹 매핑 `TM_WORK_GRP_OTHER_WORK`) — `be:resources/SQL/time/appls/` 매퍼 기준. `TM_WORK_FOR_HOME_*`는 재택 전용

**핵심 동작 (QA L731–779)** — 신청서 중 **가장 복잡**한 영역:

## 기타근무 유형 선택

- 드로어 맨 위 근무 유형 선택(`RequestType`) 칸에서 고름, placeholder "기타 근무 유형 선택" (`pp:…/template_drawer/contents/OtherWorkApplications.tsx:777-790`). 유형별 `fileReqYn`/`comntReqYn`로 첨부/코멘트 필수 결정 (2026-11-05 확인)

## 기간 신청 + 일자별 토글

다른 신청서들과 달리 **기간 신청 지원**:
- 기간 내 휴일/휴무일은 **토글이 비활성화 상태**로 표시 — 토글을 활성화하면 그 일자도 포함 가능
- **전체 종일 적용** 버튼 — 모든 활성화된 일자를 종일로 일괄 체크
- 토글 비활성화 상태일 때는 종일 체크박스도 비활성화
- 휴일/휴무일은 전체 종일 선택 시에도 (토글 비활성이면) 체크 안 됨
- 모두 휴일/휴무일이고 모든 토글 비활성 상태로 요청 시 → "요청일을 선택합니다." 에러 (`attendance` `OTHER_WORK.erros.useRequestDate`)

## 사용 시간 옵션

- **종일** vs **직접 입력** — 일자별로 선택
- 종일 신청 시 캘린더에 시간 출력되지 않음
- 종일 신청한 일자에 또 종일 신청 시도 → 요청 버튼 비활성

## 표시

- 출퇴근 위젯에 기타근무 요약 표시 (2건 이상은 아코디언)
- 팀 근무 현황에 기타근무 아이콘
- **종일 기타근무 승인 시 출퇴근 누락 → 누락 처리 안 함** (단, 근무스케줄 있어야 함, 체크리스트 L740–741)
- 요청중/승인 완료/취소중 문서가 처리할 문서, 내근무 캘린더, 구성원 근무에 표시되며 상태 변경 시 즉시 업데이트

## 유효성 검사 (3단계)

**기간 유효성**:
- 이미 신청한 기타근무가 있으면 리스트 표시 — "선택한 기간에 이미 신청한 근무가 있습니다."
- 사용시간 총 합 표시
- 종일 신청 내역 있는 날짜 → disabled ("이미 신청한 근무 요청이 있어 종일 선택이 불가합니다.")
- 종일 아닌 신청 내역 있는 날짜 → [직접입력] 기본 설정
- 마감된 일자 포함 → 요청 불가 — "선택한 기간의 근무가 마감되어 근무를 신청할 수 없습니다." + "마감되지 않은 근무 일자에 한해 근무 신청이 가능합니다." (마감일 종일 선택 시 "근무가 마감되어 종일 선택이 불가합니다.")

**일자별 유효성**:
(2026-11-05 화면 원문으로 교체, `pp:src/locales/ko/workflow.json` `OTHER_WORK.validation.*`)
- 시작 = 종료 → "시작 종료시각이 같습니다."
- 시작 > 종료 → "종료 시각이 시작 시각 전입니다."
- 근무귀속일 벗어남 → "당일 HH:mm ~ 익일 HH:mm 이내로 신청합니다." (`sharedFunction` `attendance.timeRangeErrorMessage`)
- 기존 신청 시간 겹침 → ~~예제 문구~~ "선택한 시간에 이미 신청한 근무가 있습니다. 중복요청은 불가합니다." (서버 시간 검증 `invalidCode === "used"`, `pp:…/template_drawer/contents/OtherWorkApplications.tsx:897-905`) — 입력했던 시작/종료 시각은 비워짐

**요청 유효성**:
- 종일 신청한 날에 또 신청 → 요청 버튼 비활성
- 날짜 미선택 → 요청 버튼 비활성
- 직접입력 시 시작/종료 미입력 → "시작 종료 시각을 입력합니다." / "시작 시각을 입력합니다." / "종료 시각을 입력합니다." 
- 기타근무 유형 코멘트 필수 → "코멘트를 입력합니다."
- 기타근무 유형 첨부 필수 → "첨부파일을 업로드합니다."

## 어드민 직접 등록 (별도 흐름)

어드민이 사용자의 기타근무를 직접 등록할 수 있음. 이 경우 사용자 화면에 **별도 다이얼로그**가 뜸 (`AdminDirectOtherWorkDialog.tsx`).
- **(2026-11-05 Slack·코드 확인) 등록 경로**: 어드민 근무 데이터 관리 › 기타근무 현황 › 근무 수동등록(엑셀 업로드, 2026-03 배포). 수동 등록 건은 어드민이 삭제 가능(마감 건·신청서로 승인된 건 제외). 이를 위해 기타근무 항목은 같은 이름으로 만들 수 없게 제한 — Slack #cx 2026-03-09 (https://hcgtheplus.slack.com/archives/C01AVJ2CJBW/p1773044800731839?thread_ts=1772778504.575099)
- **다이얼로그 노출 지점**: 사용자 화면에서 어드민 등록 기타근무를 클릭했을 때 — 내 근무 캘린더 셀(`pp:src/components/attendance/personal_work/contents/my_work_calendar_cell/MyWorkCalendarCell.tsx`), 구성원 근무 › 근무 현황 탭(`member_work/contents/work_status_tab/contents/MemberWork.tsx`), 근무 정보(`work_info/contents/Content.tsx`) (ppfront#10769)
- **항목 마스터**: 어드민 근무관리 › 근무 설정 › 기타근무 항목 설정 탭에서 생성/수정/삭제, 근무 그룹 설정 › 기타근무 항목 관리에서 그룹별 사용 여부 (신규 항목은 전 그룹 '사용 안 함'으로 추가) — [공통](./overview.md) § 검증 / [TBD]
- 메시지: `ADMIN_DIRECT_OTHER_WORK.registeredByAdmin` = "해당 근무는 별도의 신청/승인 과정 없이 관리자에 의해 등록되었습니다."
- → 일반 신청 워크플로우 우회
