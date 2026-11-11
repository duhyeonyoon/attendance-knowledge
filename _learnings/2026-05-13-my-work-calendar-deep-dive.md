# 2026-05-13 — 내 근무 캘린더 (U6) deep-dive 학습 노트

가장 복잡한 영역. 케이스별로 빠짐없이 정리.

## 본문 통합 완료 ✅

- **15가지 AttendType** 케이스별 상세 정리 (각 타입의 icon/title/color/description/click 동작)
- **16가지 아이콘** 카탈로그 (visual + color HEX)
- **6가지 색상 체계** (gray/complete/normal/missing/undetermined/leave)
- **24개 WorkMemoType flag**
- **12종 applsInProgress** (요청중 신청서 배열)
- **`getTotalDayData` 조립 로직** — 셀에 보여줄 컨텐츠 결정
- **시점별 분기** (Past/Today/Future + 자정~새벽 cutoff)
- **누락 조건 4가지**
- **Cross-domain 22개 케이스** — 거의 모든 다른 영역이 캘린더에 영향
- **비즈니스 룰 7개**
- 클릭 가능 조건 / 모바일 우선순위

## 큰 발견

### 1. 캘린더 = attendance 도메인의 결과물 집합소
이 화면은 거의 모든 다른 영역(출퇴근/휴가/신청서/마감/근무그룹/근무설정)의 결과물이 시각화되는 곳. **15 × 16 × 6 × 24의 조합**으로 거의 모든 상태를 표현. cross-domain 표가 22개 케이스로 큼.

### 2. 시점에 따른 의미 변화
같은 셀이라도:
- **과거**: 집계 데이터 (확정)
- **오늘**: 출퇴근 위젯과 양방향 동기화 (실시간)
- **미래**: 근무 계획

→ 같은 `WorkReg` 타입이 9가지 케이스로 분기 (workStatus + 신청 + 누락 등)

### 3. 자정 cutoff 동적 계산이 일관 적용
이전 deep-dive (`KB:product/user/home/checkin-widget.md`)에서 발견한 `workStaHm - 3시간 / 6시 기본` 룰이 캘린더에서도 동일하게 적용 (`workDayStartHour`). **백엔드 `ValidWorkDayResolver` 룰이 클라이언트 곳곳에 일관 반영**.

### 4. `isPendingRequest` 룰의 미묘함
요청중 신청서 있으면 근무계획 가림 BUT 연장/야간 신청·취소는 예외. 이유는 연장/야간은 **계획 + 추가** 정보이기 때문 (계획을 가리면 안 됨).

### 5. `isWorkEntryNull` 조건
종일 휴가 + 미래 / 휴일/휴무일 + 근무 없음 → 워크 정보 자체 가림. 누락으로 보이지 않게 처리.

### 6. 우선순위 룰의 일관성
- 데스크톱: 모든 컨텐츠 표시
- 모바일: `checkMobileTopPriorityDayContent`로 1개만
- 기타근무 Chip > 재택 Chip (이전 deep-dive와 일치)

### 7. 색상 6종의 의미론
- gray = 비활성/dim
- normal = 일반
- complete = 완료/요청중 (파랑)
- missing = 누락/에러 (빨강)
- undetermined = 미정 (주황)
- leave = 휴가 (녹색)

각 색상이 attendance 도메인의 정상/이상 상태를 시각적으로 분류.

### 8. 시간 표시 보정 룰
`workTimeVisibleCd === "DENIED"` + 출근인정시각 이전 출근 시 → 첫 출근시간이 출근인정시각으로 자동 보정 표시. **고객사 특수 룰이 캘린더 표시에까지 일관 적용**.

## 작업 패턴

이번 deep-dive에서 가장 중요했던 것:
- ✅ **타입 정의 우선 확인** (`AttendType` 15종, `WorkMemoType` 24 flag)
- ✅ **아이콘/색상 카탈로그 별도 정리** (재사용 가능한 reference)
- ✅ **각 타입의 makeMyInfo 분기를 표로 정리** (한눈에 보기)
- ✅ **이전 deep-dive 룰의 재확인** (자정 cutoff, Chip 우선순위, hasModifiedWorkRecord 등)
- ✅ **Cross-domain 22개 케이스** — 다른 영역과의 연결 모두 catalog

큰 영역이라 1500+ 라인 가까이 됐지만, 표 형식으로 정리해서 가독성 유지.

## 후속 [TBD]

- `checkMobileTopPriorityDayContent` 함수 본체 (모바일 우선순위 룰)
- `getWorkAttendData` 본체 (WorkReg/WorkPlan/Approved* 선택 로직)
- `getWorkRegInfo` 본체 (WorkReg 정확한 분기)
- `RestReg` 노출 케이스
- `MyWorkCalendarCell.tsx` 1088줄의 클릭 분기
- `holidayWorkAppl` vs `psnHoliWorkAppl` 차이
- 정확한 캘린더 URL
- 모바일 MoreHorizIcon 동작

## 두현님 답변 받으면 좋을 것

1. `holidayWorkAppl` vs `psnHoliWorkAppl` 차이 (둘 다 휴일근무 진행중)
2. 모바일 1셀 1컨텐츠 우선순위 룰 (의도된 룰인가)
3. `RestReg` 타입의 실제 노출 케이스

## 인사이트: 캘린더의 설계 철학

캘린더는 attendance 도메인의 "프로젝션 레이어". 다양한 데이터 소스를 하나의 시각적 표현으로 종합:

```
[출퇴근 raw 데이터]
[근무 계획]              ┐
[휴가 사용/신청]          │
[기타근무 사용/신청]       │ →  [getTotalDayData 조립]  →  [N개 AttendType]
[근무 신청서 8종]         │     (우선순위 + 가림 룰 적용)    [makeMyInfo 렌더링]
[승인된 휴일/연장근무]     │                                  [16 icon × 6 color]
[휴일/휴무일 정보]        ┘
[어드민 수정/마감 flag]
```

**좋은 설계 패턴**:
- 데이터 모델 (15 type)과 시각 모델 (16 icon × 6 color)이 분리
- workMemo (24 flag)가 메타 상태로 추상화
- type별 makeMyInfo 분기가 한 곳에서 일관 처리

## 다음 deep-dive 후보

이제 사용자 메인 화면 정리됐으니:
- **U1, U2 통합홈** — 캘린더 진입 전 화면
- **U9, U10 구성원 근무/휴가** — 매니저 관점
- **U11 근무스케줄** — 미래 스케줄 화면
- **어드민 #8 근무 신청 내역 관리** — 사용자 신청서들의 어드민 처리
- **어드민 #2 모듈 설정** — 인사 연동 진입
