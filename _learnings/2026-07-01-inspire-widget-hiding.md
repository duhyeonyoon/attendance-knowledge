# 2026-07-01 — 인스파이어 출퇴근/휴가 위젯 숨김 처리 (Slack 문의)

## 배경
Slack(C0BAEQ5AQ5T, 박예진/안동현) "인스파이어 프론트 커스텀 적용 확인":
출퇴근 위젯 + 휴가현황 위젯 숨김처리가 됐는지, 대시보드 말고 내근무/내휴가도 마찬가지인지.

## 확인된 사실 (코드 검증)

### 1. 통합홈 대시보드 위젯 = 100% 설정 기반 (하드코딩 커스텀 아님)
- `pp:containers/main/index.tsx:437-497` — `renderHomeLeftWidget`/`renderHomeRightWidget`가
  `dashboardInfo`(=`webWidgetMenus`/`mobileWidgetMenus`)를 순회하며 렌더.
- 각 위젯 메뉴 아이템에 `isUsing` 플래그. `activeWebLeftWidget`/`activeWebRightWidget`가
  `item.isUsing` 로 필터 (`index.tsx:613-623`).
- 즉 출퇴근(`work_commute`) / 휴가현황(`team_leave`=구성원휴가, `leave_plan`=예정휴가) 위젯을
  **어드민 대시보드 위젯 설정에서 미사용(isUsing=false)** 하면 통합홈에서 사라짐.
  → 안동현 "어드민에서 위젯 자체를 안쓰게 설정 될거에요" 가 맞음. 인스파이어 전용 코드 분기 아님.

### 2. workTimeVisibleCd === "DENIED" 는 별개 개념 (혼동 주의)
- `timeModuleUser.workGroup.workTimeVisibleCd === "DENIED"` = `isWorkTimeHidden`.
- 이건 **근무시간(WorkSummary) 표시만** 숨김. 출퇴근 위젯 전체를 숨기는 게 아님.
- `index.tsx:309-310`, `personal_work/index.tsx:143-144`.

### 3. 내근무 / 내휴가 는 대시보드 설정과 무관 ⚠️
- 내근무(`pp:components/attendance/personal_work/index.tsx:186`)는 `WorkCommuteWidget` 를
  **무조건 렌더**. `isUsing`/대시보드 위젯 설정 게이트 없음. (`isWorkTimeHidden` 은 WorkSummary만 가림)
- 내휴가(`pp:components/attendance/personal_leave/`)도 대시보드 위젯 설정 게이트 없음. 독립 메뉴 페이지.
- 결론: **대시보드 위젯 설정으로는 내근무/내휴가가 안 숨겨짐.** 박예진 "내근무 내휴가도 마찬가지죠?" → 아니오.
  내근무/내휴가를 숨기려면 메뉴 자체를 시스템/권한(메뉴 노출) 설정에서 막아야 함 (안동현 "시스템쪽에 있었나" 가 이쪽).

## 확인 필요 [TBD]
- 내근무/내휴가 메뉴 노출 제어가 어느 시스템 모듈/설정인지 (attendance 레포 밖, 메뉴/권한 시스템 추정).
  인스파이어가 실제로 내근무/내휴가까지 숨기길 원하면 그 경로 확인 필요.
