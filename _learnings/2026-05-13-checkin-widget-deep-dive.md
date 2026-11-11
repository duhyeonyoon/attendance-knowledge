# 2026-05-13 — 출퇴근 위젯 deep-dive 학습 노트

product/user/home/checkin-widget.md 작성 + 두현님 1차 검수 반영 후 정리.

## 본문 통합 완료 ✅

- `WorkStatus` 5가지 상태 머신 (`OFF`/`ON`/`PAUSE`/`FINISH`/`RESUME`) — 타입 정의 위치 `pp:src/@types/customTypes/attendance/unionType.d.ts:271` 참조 추가
- 백엔드 권한 코드 체계 (`P`/`A`/`N`)
- `gpsConfCd` 4가지 (`C`/`O`/`U`/`D`)
- `validWorkCd === "PLAN"` 시 출/퇴근 버튼 미노출 (근무 계획 시간 그룹)
- 하버사인 공식으로 근무지 거리 계산
- `workPalceValidationOptionsRef` 캐시 (오타 주의)
- API 엔드포인트 14개 매핑

## 두현님 답변으로 해소된 [TBD] ✅

- `validWorkCd === "EXTERNAL"` — **세콤 연동** (현재는). 향후 다른 외부 시스템 추가 가능성 있음
- `workTimeVisibleCd === "DENIED"` — 특정 고객사 요청. 자사 구성원에게 근무시간 비공개 원함. 이유는 미상
- `WorkStatus` 타입 정의 위치 — `pp:src/@types/customTypes/attendance/unionType.d.ts:271`에 주석 포함하여 정의됨
- `applsInProgress` 12종 상호작용 질문 → 너무 광범위. 구체적 케이스 만나면 그때 deep-dive

## 큰 정정 사항 ⚠️

### 자정 cutoff 로직 변경

**이전**: 하드코딩 5시 (QA 체크리스트 L102)
**현재**: 동적 계산
- 고정 출근시간 있음: 계획 출근시각 - 3시간
- 자율/휴일/계획 없음: 시스템 기본 06:00
- 백엔드: `be:com/hcg/optimiz/time/common/util/validworkday/ValidWorkDayResolver`
  - `STANDARD_HOUR_BY_VALID_WORK_DATE = 6`
  - `DIFF_TIME_AVAILABLE_TO_WORK = 3`

**잠재 이슈**:
- 프론트 `checkNextDayAndBeforeAggrTime` (`pp:src/lib/attendance/personalWork.ts:2113`)는 `workGrpVo.ddAggrTime` (정적 값) 사용
- 백엔드는 `ValidWorkDayResolver`로 동적 계산
- → 백엔드가 `ddAggrTime`을 동적 계산해서 응답에 담아주는지 vs 프론트가 outdated인지 확인 필요
- QA 체크리스트 자체도 outdated (L95–110의 "05시" 표현)

## 작업 패턴 개선 사항 (Phase 2c 워크플로우에 추가)

다음 영역 deep-dive 시 잊지 말 것:
1. **타입 정의 추적**: 처음 보는 type/interface는 반드시 정의 위치를 grep으로 추적 (한 번만 하면 됨)
2. **프론트 ↔ 백엔드 일치성 검증**: 동일 비즈니스 룰이 양쪽에서 다르게 구현된 경우가 있음
3. **QA 체크리스트의 "확인 필요" 표시는 outdated 가능성**: 백엔드 코드와 대조해서 갱신 권고

## 후속 [TBD]

- `isHolidayWorkUnavailableOnWork` / `isNightWorkUnavailableOnWork` 정확한 정의 위치 추적
- `parseDayWorkInfo` 변환 로직 정리
- `getClockInPolicy` / `getClockOutPolicy` 응답 구조 (`IClockInOutPolicyPayload` 타입)
- 자정 cutoff 프론트/백엔드 일치 여부
