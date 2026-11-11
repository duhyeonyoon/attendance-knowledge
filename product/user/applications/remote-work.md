---
sidebar:
  order: 5
---

# 재택근무 신청

> **메뉴** 근무 신청 › 재택근무  
> **원본** `product/_legacy/appl-other-forms.md`

*원본 섹션: 1. 재택근무 신청 (U16)*

**조건**: 어드민 근무그룹 설정에서 **재택근무 허용** 체크 (`workGrpVo.workForHomePmitYn === "Y"`)

**ppfront 컴포넌트**:
- `pp:src/components/workflow/shared/template_drawer/contents/HomeWork.tsx` ⭐
- 검증 로직: 응답에 `dupPeriodDtls` (요청 중 재택), `workForHomeDays` (신청 완료 일자), `closedDays` (마감 일자)

**백엔드**:
- 신청: `be:controller/appls/WorkForHomeApplsController` — `/time/appls/work-for-home/*`
- 취소: `be:controller/appls/WorkForHomeCancelApplsController` — `/time/appls/work-for-home-cancel/*`
- VO: `be:vo/WorkForHomeApplVo`, `WorkForHomeApplDtlVo`, `WorkForHomeCancelApplVo`, `WorkForHomeCancelApplDtlVo` (2026-11-05 확인)
- DB: `TM_WORK_FOR_HOME_APPL`, `TM_WORK_FOR_HOME_APPL_DTL`, `TM_WORK_FOR_HOME_CANCEL_APPL`, `TM_WORK_FOR_HOME_CANCEL_APPL_DTL`, `TM_RMT_WORK_LOC` (위치)

> **(2026-11-05 해소)** `TM_RMT_WORK_APPL(_DTL)`은 구 "원격근무 신청"(문서유형 1090) 테이블로 현재 신규 저장 코드 없음(초기 데이터 스크립트만). `TM_RMT_WORK_LOC`는 일자별 재택/원격 위치 레코드로 재택 신청(`WORK_FOR_HOME_APPL_ID`) 또는 구 원격 신청(`RMT_WORK_APPL_ID`)을 참조 (`be:resources/SQL/time/appls/WorkForHomeMapper.xml:140-162`)

**핵심 동작 (QA L719–727)**:

- ~~단일 일자 신청만~~ → **(2026-11-05 정정) 기간 신청 가능**. 요청일은 범위 캘린더(placeholder "기간 선택"), 날짜 하나만 고르고 닫으면 시작=종료 단일 일자로 처리 (`pp:src/components/workflow/shared/template_drawer/contents/HomeWork.tsx:286-300`). 신청 데이터도 `staYmd`~`endYmd` (체크리스트 L720의 "당일 날짜로 신청"은 단일 일자 케이스)
- 입력: 요청일(기간) + 코멘트 + 첨부 + 결재선. 첨부/코멘트 필수 설정 없음
- **(2026-11-05 해소) 중복·마감 차단** — 기간 선택 시 서버가 `dupPeriodDtls`(요청중 재택), `workForHomeDays`(이미 재택인 일자), `closedDays`(마감 일자)를 돌려줌:
  - 마감 일자 포함 → 경고 박스 "선택한 기간의 근무가 마감되어 재택근무를 신청할 수 없습니다." + "마감되지 않은 근무 일자에 한해 재택근무 신청이 가능합니다." + 마감 일자 목록, **[요청] 버튼 비활성**
  - 요청중/이미 재택인 일자 포함 → 경고 박스 "선택한 기간에 이미 신청한 재택근무 계획이 있습니다." + "기존 재택근무 정보와 중복이 아닌 경우에만 재택근무 신청이 가능합니다." + 일자 목록, **[요청] 버튼 비활성** (`HomeWork.tsx:304-375`)
  - 서버 저장 시에도 차단: "선택한 기간의 근무가 마감되어 재택근무를 신청할 수 없습니다." / "신청 기간 내 이미 요청중인 재택근무가 있습니다." / "이미 재택근무 계획이 있습니다. (일자 목록)" / 그룹 미허용 시 "재택근무를 신청할 수 없는 근무그룹에 속해 있습니다." (`be:service/appls/WorkForHomeApplsService.java:236-328`)
  - 요청일 미입력: "재택근무일을 입력합니다."
- **승인 완료 시 표시**:
  - 홈 출퇴근 위젯 **상단에 재택 Chip**
  - 구성원 근무 현황에 재택 Chip
  - **단, 기타근무 신청 Chip이 있으면 재택 Chip은 노출되지 않음** (체크리스트 L722) — 우선순위 룰. **(2026-11-05 확인) 의도된 정책**: 칩 한 자리를 공유하며 근무(기타근무)가 재택보다 중요도가 높고 동시 발생은 드물다는 판단 (Slack #030 사용자 화면 스테이징 체크리스트 2025-02-07). **(2026-11-05 Slack 재검토)** 칩 한 자리 공유는 출퇴근 위젯·근무 현황 칩 기준. 이후 캘린더형 화면 기획(2025-06 전사 근무 계획 캘린더)은 우선순위 휴가 → 기타근무 → 재택 → 기본근무로 정렬하면서 "기타근무와 재택이 겹치면 툴팁 등으로 재택도 표시"로 정함 → 내 근무 캘린더가 둘 다 표시하는 것은 이 방향과 일치 (화면별 표시 방식 차이, #ch-plan 2025-06-18 https://hcgtheplus.slack.com/archives/C02VCP9MBQV/p1750229945190409?thread_ts=1750227993.860649)
- **재택 승인 = 위치 제약 해제** — "재택근무 승인 이후에는 근무지 여부에 상관없이 출/퇴근 할 수 있다" (체크리스트 L727). 출퇴근 위젯 GPS 검증을 우회

**알림**: 신청/승인/반려/코멘트 → talenx 알림. 통합알림 설정에서 "근무 내역/계획 변경 - 재택근무" off 가능

**마감 차단**: 마감된 일자 요청/승인/취소 모두 불가
