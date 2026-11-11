# 2026-05-13 — 근무 마감 deep-dive 학습 노트

product/admin/work/close-work-data.md 작성 후 정리.

## 본문 통합 완료 ✅

- 2탭 구조 (개인별 마감 상태 + 마감 내역) + 적용 구성원 상세 페이지
- 백엔드 6개 엔드포인트 매핑 (`CloseWorkDataController`)
- **Cross-domain 영향 표** (closeYn이 체크되는 어드민/사용자/정산 13곳)
- 일괄 마감 모달 흐름 (필수 필드 + 밸리데이션 + 컨펌 + mutation)
- `CheckWorkDataIsClosedDailyDto` 구조 (closeYn → isClosed 변환)
- `code/backend-tables.md`에 마감 관련 테이블 섹션 추가
- glossary에 마감 관련 8개 용어 추가

## 큰 발견

### 1. 마감은 단방향 (해제 API 없음)
모든 `CloseWorkDataController` 엔드포인트 확인했으나 마감 해제 API 발견 안 됨. 실무에서 마감 실수 시 어떻게 복구하는지 확인 필요 — DB 직접 수정? 운영 정책?

### 2. `closeYn`은 도메인 횡단 신호
이 영역의 본질은 **flag 하나가 13곳에서 일관되게 차단을 거는 것**:
- 어드민 4곳 (전사 근무현황 컬럼, 출퇴근내역 컬럼, 편집 다이얼로그, `valid-date` API)
- 사용자 6곳 (출퇴근 위젯, 변경 신청, 대체근무, 휴가 신청, 캘린더, 그룹스케줄)
- 정산 도메인 3곳 (attendance 범위 밖이지만 영향 받음)

### 3. 마감 단위와 실행 단위가 다름
- **마감 단위**: 구성원 × 일자 (`closeYn`)
- **실행 단위**: 근무그룹 × 기간 (일괄 마감 모달)

→ 어드민은 "이 그룹의 이 기간을 마감" 명령을 내리지만, 실제 데이터는 "이 구성원의 이 날짜는 마감됨"으로 저장됨.

### 4. 모든 마감 작업에 메모 필수
일괄 마감 모달도 메모(`note`) 입력 필요. 엑셀 다운로드도 사유(`TALENX-LOG-REASON`) 필수. **감사/컴플라이언스 일관성**.

### 5. URL 파라미터로 탭 상태 유지
`?tab=IndividualCloseWorkStatus|CloseWorkHistory` 로 새로고침/뒤로가기 후에도 탭 유지. 패턴 인지.

## 작업 패턴

이번 deep-dive에 잘 작동:
- ✅ "이 영역의 부산물이 어디서 소비되는가" grep — `isClosed` / `closeYn` 사용처 전체 추적
- ✅ DTO Schema 의미 확인 (CheckWorkDataIsClosedDto)
- ✅ 다른 영역(출퇴근 위젯, 근무 데이터 관리, 근무그룹)과 cross-link

## 후속 [TBD]

- 마감 해제 메커니즘 (운영 정책 / DB 직접 수정?)
- `CloseWorkDataHistoryVo` 풀 필드
- 정확한 테이블 이름 (mapper XML 또는 init SQL)
- `IndividualCloseWorkStatusPayload` / `CloseWorkBulkPayload` 정확한 구조
- 일괄 마감 도중 결재중 신청서 있는 일자 처리 룰 (자동 반려? 보류? 차단?)
- 개별 일자 / 사용자별 차등 마감 가능 여부

## 두현님 답변 받으면 좋을 것

1. 마감 실수 시 운영 절차 — 마감 해제 API 없는 게 의도된 건지
2. 일괄 마감 도중 결재중 신청서가 있는 일자는 어떻게 처리되는지 (자동 반려? 보류 후 마감 보류? 마감 강행?)

이 둘은 운영 정책 영역이라 코드로만 추적하기 어려움.
