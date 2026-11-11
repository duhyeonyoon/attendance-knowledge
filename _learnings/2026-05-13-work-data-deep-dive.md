# 2026-05-13 — 근무 데이터 관리 deep-dive 학습 노트

product/admin/work/check-work-data.md 작성 후 정리.

## 본문 통합 완료 ✅

- 2탭 구조 (전사 근무현황 + 출퇴근내역) 컴포넌트 트리
- 백엔드 13개+ 엔드포인트 매핑 (`WorkResultManagementController` + `ManualAggregationController`)
- **3-레포 데이터 흐름 다이어그램** (사용자 위젯 → 백엔드 집계 → 어드민 → 다시 사용자 영향)
- Cross-domain 영향 표 (어드민 수정 → 사용자 화면 5가지 케이스)
- 시간 정의 3종 (확정/합산/인정) + 산정 우선순위 (휴가 > 기타근무 > 출퇴근) glossary 추가
- 어드민 직접 출퇴근 기록 3시나리오 (생성/충돌/초과근무 검증)
- 어드민 직접 삭제 룰 (무효화 + 첫 기록 삭제 불가)

## 큰 발견

### 1. 데이터 흐름의 한가운데 위치
이 영역은 출퇴근 위젯(데이터 생성) ↔ 어드민(조회/수정) ↔ 사용자 화면(영향)의 교차로. 이미 출퇴근 위젯 deep-dive에서 봤던 `hasModifiedWorkRecord` flag, `registeredByAdmin` 메시지가 모두 이 화면의 동작 결과였음.

### 2. "삭제 = 무효화"
실제 raw 데이터 삭제가 아니라 보정 기록 추가 + 사용자 화면 "누락" 표시. 데이터 감사 추적 가능하도록 설계됨. `TM_INOUT_REG_ADJST_DTL` 테이블 용도가 명확해짐.

### 3. 시간 종류 3개의 명확한 정의
"확정 vs 합산 vs 인정" 용어가 모호했는데 QA에 정확한 정의가 있었음. 같은 시간대 중복 시 우선순위 = **휴가 > 기타근무 > 출퇴근**.

### 4. validateInoutDate API의 역할
어드민 편집 시도 시 사전 충돌 체크. (a) 결재중 신청서 (b) 마감된 날짜 두 가지를 막음. 이 API 응답 구조는 [TBD].

### 5. 엑셀 다운로드 사유 = 감사 로그
`TALENX-LOG-REASON` 키로 백엔드에 전달. 모든 데이터 다운로드는 사유 필수 = 컴플라이언스 요건.

## 작업 패턴 적용

지난 패턴들 잘 작동:
- ✅ 3-레포 모두 확인 (이번에 특히 효과적 — 데이터 흐름 자체가 3-레포 횡단)
- ✅ Swagger annotation 활용 (`@Operation(summary=...)` 으로 엔드포인트 의미 빠르게 파악)
- ✅ 이미 만든 다른 문서와 cross-link (출퇴근 위젯, 근무그룹)
- ✅ 사용처 grep으로 데이터 영향 추적 (`hasModifiedWorkRecord` 등)

## 후속 [TBD]

- `TimeDailyAggrResultDto` / `TimeMonthlyAggrResultDto` 응답 컬럼 구성
- `InoutRecordsAdjustmentPayload` 페이로드 구조
- `validateInoutDate` 응답 차단 사유 분류
- `등록 방식` 컬럼 코드 체계 전체
- `근무 구분` (`workYmdTypeList`) 옵션 종류
- 두 엑셀 다운로드 엔드포인트(`excel-download/search` vs `/all/search`) 사용 분기
- `DailyAggregationService`의 우선순위 적용 로직 정확한 라인
- AdminDirectOtherWorkDialog 흐름 (기타근무 어드민 등록) — 별도 deep-dive 후보

## 신규 발견 영역 (별도 deep-dive 후보)

- **AdminDirectOtherWorkDialog / AdminDirectLeaveDialog** — `pp:src/components/attendance/shared/admin_direct_dialog/`
  - 어드민이 직접 등록한 기타근무 / 휴가에 대해 사용자 측이 별도 다이얼로그를 띄움
  - QA에 명시되어 있지 않음 (또는 다른 섹션 어딘가)
  - 별도 영역으로 정리 권장
