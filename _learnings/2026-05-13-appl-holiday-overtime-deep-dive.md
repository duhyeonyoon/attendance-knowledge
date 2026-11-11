# 2026-05-13 — 신청서 묶음 (사전 휴일근무 + 사전 연장/야간) deep-dive 학습 노트

product/user/applications/overview.md 작성 후 정리.

## 본문 통합 완료 ✅

- 두 신청서의 공통 워크플로우 패턴 (8개 표준 액션 + 신청/취소 컨트롤러 분리)
- 백엔드 ~22 엔드포인트 매핑 (HolidayWorkAppls + HolidayWorkCancelAppls + OtAppls)
- ppfront `DayOff.tsx` / `Overtime.tsx` 컴포넌트 + 공유 컴포넌트 (RequestDate/RequestTimeInfo 등)
- `useHolidayWorkRequestValidation` 4개 검증 함수
- **Cross-domain 표** — 출퇴근 위젯과 직결 (사전 검증 → 신청서 승인 상태 조회)
- 비즈니스 룰 9개 정리
- glossary에 7개 용어 추가

## 큰 발견

### 1. 신청서 표준 패턴 = 백엔드 표준 ⭐
모든 신청서 컨트롤러가 공유하는 8개 액션 (`CONST_APPLY_ACTION`):
search / temp-saved / apply / cancel / rejected / approval-done / complete / delete

이 패턴은 휴일근무, 연장근무뿐 아니라 휴가/기타근무/재택/대체근무 등 **모든 신청서**에 동일 적용됨. 다음 신청서 deep-dive 시 매번 같은 작업 반복할 필요 없이 이 패턴 참조로 빨리 진행 가능.

### 2. 신청 ↔ 취소 신청 컨트롤러 완전 분리
- `HolidayWorkApplsController` (신청)
- `HolidayWorkCancelApplsController` (결재 완료 후 취소 신청)

비슷한 패턴이 6개 도메인에서 발견됨: OtWork, HolidayWork, OtherWork, WorkForHome, Leave, etc.
"결재 완료된 신청을 취소하는 것"이 별도의 워크플로우라는 의미.

### 3. `DayOff.tsx` 이름 함정
ppfront의 `DayOff.tsx`는 실제로 **사전 휴일근무 신청서**. 영문 번역 컨벤션 문제로 헷갈리기 쉬움. 코드 검색 시 주의 필요.

### 4. 출퇴근 위젯과 강한 결합
이미 알고 있던 `applsInProgress` 12종 배열이 여기 두 신청서를 포함:
- `psnHoliWorkAppl` (사전 휴일근무 진행중)
- `overtimeWorkAppl` (사전 연장/야간 진행중)

이 진행 상태가 출퇴근 위젯의 "요청중 칩" 표시 / 사전 차단 분기 / 안내문 분기에 영향. → cross-domain 표로 정리됨

### 5. 잔여 연장시간 vs 법적 12시간
QA L702–704: 최대 초과근무 제한 **설정됨** = 잔여시간 표시 + 검증 / **설정 안 됨** = 법적 12시간 표시 but 검증 안 함. 이 분기는 신청서 상단 UI에 영향.

### 6. 휴일근무 캘린더 vs 연장근무 캘린더
- 사전 휴일근무: **휴일만** 선택 가능
- 사전 연장/야간: **휴일 외만** 선택 가능
→ 정확히 반대. 동일 캘린더 컴포넌트(`RequestDate.tsx`)가 신청서 종류에 따라 다른 룰 적용

## 작업 패턴

- ✅ 표준 패턴 발견 시 한 번 정리 → 다른 신청서들에 재활용 (CONST_APPLY_ACTION)
- ✅ ppfront 컴포넌트명이 직관적이지 않으면 코드 grep으로 실제 용도 확인 (DayOff.tsx)
- ✅ 이미 정리된 영역과 cross-link (출퇴근 위젯, 근무그룹 설정, 근무 마감)
- ✅ 묶음 deep-dive 효율 — 두 신청서가 공통 부모(template_drawer) 사용하므로 같이 보는 게 효율적

## 후속 [TBD]

- `CONST_APPLY_ACTION` 상수 본체 (정확한 path 문자열)
- VO 풀 필드 (PsnHoliWorkApplVo, PsnOtPlanApplVo)
- `OtApplValidTimeDto` 응답 구조
- `OtWorkCancelApplsController` 정확한 path
- approval_drawer HolidayWork 컴포넌트 위치 (Overtime 측만 확인됨)
- `valid-time` API 의 정확한 룰 (휴게시간 자동 적용 등)
- "겹치지 않으면 신청 가능" 겹침 판정 로직
- legacy `is-necessary` 엔드포인트 용도

## 두현님 답변 받으면 좋을 것

1. `DayOff.tsx`가 사실은 "사전 휴일근무 신청"인 이유 — 코드 정리 대기인지, 영문 번역 컨벤션인지
2. 연장/야간 신청은 동일 신청서(`OtAppls`)에서 처리되는데, UI에서 "연장만" / "야간만" / "둘 다" 구분 방식 (시간대 자동 판단?)

## 다음 신청서 deep-dive 시 적용

위 학습으로 다음 신청서들은 빠르게 정리 가능:
- 재택근무 (U16) → `HomeWork.tsx` 또는 `Remote.tsx` + `WorkForHomeAppls`/`WorkForHomeCancelAppls`
- 기타근무 (U17) → `OtherWorkApplications.tsx` + `OtherWorkAppls`/`OtherWorkCancelAppls`
- 대체근무 (U18) → `CompensatoryWork.tsx` + `CompensatoryWorkAppls`
- 근무계획 변경 (U19) → `PlanEdit.tsx` + `DdWorkPlanChangeAppls`
- 근무내역 변경 (U4 + U7) → `RegEdit.tsx` + `WorkRecordChangeAppls`
- 휴가 (U8) → `Leave.tsx` + `LeaveAppls`/`LeaveCancelAppls`

각 신청서마다 표준 8 액션 + 캘린더 + 시간 검증 + 취소 흐름 동일하고, **차이점만 별도 정리**하면 효율적.
