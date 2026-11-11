# 사전 휴일근무 신청 제출 시 500 에러 ("퇴근가능 시간이 아닙니다")

발견일: 2026-06-24 (Slack C06ULEEM88M, 신승희 문의)

## 증상

사전 휴일근무 신청서(`DayOff.tsx`) 제출 시 500 + 모달 "요청 실패 — 퇴근가능 시간이 아닙니다. 퇴근시간을 확인해주십시오."
프론트 미리보기(변경 결과)는 정상으로 8시간/야간 6시간을 보여줬는데, 요청 클릭 시 에러.

문제 페이로드:
- workYmd=20260627 (토, 휴일), inPlanTime=0000 inStdDdClass=**NXD**, outPlanTime=0900 outStdDdClass=**NXD**
- 세콤 연동 근무그룹, 출근만 필수. 휴일근무=승인시에만 / 근무시간 포함여부=승인시간만 포함

## 근본 원인

1. 사용자가 시작/종료 **둘 다 익일(NXD)** 선택. `DayOff.tsx`의 기본값은 당일(BSD)이며 드롭다운 옵션은 NXD/BSD 2개뿐 (`pp:DayOff.tsx:543-554, 605-616`).
2. 백엔드 `getValidTimeWithStdDdClass`에서 NXD = 근무기준일 +1일 (`timeold/WorkService.java:104-107`). 따라서 in=2026-06-28 00:00, out=2026-06-28 09:00 으로 계산 → **근무 블록 전체가 익일(06-28)로 이동**.
3. 제출(apply) 경로 `checkHolidayWorkApplVo` → `getAbleInoutTF(memberId, workYmd, outPlanYmdhms)` 가 귀속일(06-27)의 출퇴근 가능 범위 `[workStaDate, nextWorkStaDate]` 안에 있는지 검사 (`HolidayWorkApplsService.java:369-374`, `EmpWorkService.java:97-113`). 범위 끝 `nextWorkStaDate`는 ValidWorkDayResolver가 계산하는 다음 귀속일(06-28) 경계. 06-28 09:00 은 이 경계를 넘어가 false → "퇴근가능 시간이 아닙니다" throw.

## 진짜 버그: 미리보기 vs 제출 검증 불일치 ⭐

- 미리보기 API `getHolidayWorkValidTime`(`HolidayWorkApplsService.java:761-831`)는 **getAbleInoutTF(출퇴근 가능 범위) 검사를 하지 않음**. holiWorkPmitCd/과거/중복/cutoff만 본 뒤 시간 계산해서 정상 결과 리턴.
- 제출 path `checkHolidayWorkApplVo`만 getAbleInoutTF를 추가로 호출.
- 결과: 사용자는 정상 미리보기를 보고 요청 → 제출 단계에서만 새 검증에 걸려 500. 인라인 차단 불가.

또한 OptimizException이 HTTP 500으로 노출됨 (메시지는 모달로 전달되긴 함). 비즈니스 검증 메시지인데 500인 점도 부차적 이슈.

## 프론트 비대칭 (확정) ⭐

3종 신청서가 익일 출근가능시각(`nextWorkStaDate`) 경계를 **서로 다르게** 처리. (`availableInoutInfo`는 백엔드 `workDayStartYmdhms`/`workDayEndYmdhms`에서 옴, EmpDailyWorkService:2476-2482)

1. **근무내역 변경(RegEdit) = 허용(소프트 컨펌)**: `pp:RegEdit.tsx:820-828` 범위 초과면 `isAfterAvailableInoutRequest=true` → `:1138-1141` 다이얼로그 → **확인 시 `handleSubmit` 그대로 제출**(`:2552-2569`). "선택한 날짜 근무로 기록", 백엔드 수용(하드 리젝 없음). 실근무 기록 신청서라 익일 허용이 의도된 동작.
2. **연장근무(Overtime) = 하드 차단**: `pp:Overtime.tsx:577-596` 범위 초과면 `setErrors(timeErrRequestWithinTime)` + return, 컨펌 경로 없음. 백엔드 `be:OtApplsService.java:397-403 validateInOutTimeWithinWorkableRange`(getAbleInoutTF) → "근무일 시간 이내로 신청해주세요."
3. **휴일근무(DayOff) = 프론트 검증 0 → 백엔드 500**: `DayOff.tsx`+`useHolidayWorkRequestValidation.ts`에 `availableInout`/`nextWorkStaDate`/`isFirstTimeBefore` 참조 0건. 범위정보 안 받음 → 제출 → `getAbleInoutTF` 하드 리젝.

→ 휴일·연장은 둘 다 백엔드가 getAbleInoutTF로 **하드 리젝하는 사전신청서**라 동작이 같아야 함. DayOff 수정 방향 = **Overtime식 인라인 하드 에러 가드 추가**(RegEdit식 컨펌-허용 아님 — 그건 백엔드 getAbleInoutTF까지 풀어야 해 범위 큼).

## 영향도: 휴일/연장을 RegEdit처럼 "익일 허용"으로 바꾸면? → 비권장

1. **실 출퇴근 신청도 같은 경계 제한**: `be:InApplsService.java:250`, `be:OutApplsService.java:264`가 `getAbleInoutTF`로 동일 범위검사. 즉 직원이 실제로 익일 경계 너머에 출퇴근 기록 못 남김(다음날 귀속). → 승인 윈도우를 늘려도 실적으로 못 채우는 死구간. 세콤/출근만 필수 그룹도 동일.
2. **다음날 귀속일과 중복**: nextWorkStaDate 너머 = 다음 귀속일 근무시간대. 06-27 휴일신청에 06-28 시각 넣으면 06-27·06-28 양쪽 귀속 → 집계 중복. 충돌검사(checkAppliedHolidayWorkApplList)는 휴일신청서끼리만 비교, 다음날 일반근무와 비교 안 함.
3. **RegEdit이 안전한 이유**: 실기록(TM_INOUT_REG_ADJST) 직접 수정 + stdDdClass(전/당/익일, 익일 +24h) 강제 귀속하는 "사후 기록" 모델이라 getAbleInoutTF 안 탐(순서검증만, WorkRecordChangeApplsService:935~). 휴일/연장은 "사전 승인"이라 실기록과 별개 → 실기록 경계와 정합 필요.
4. 결론: 프론트 컨펌-허용 + 백엔드 getAbleInoutTF 제거만 하면 승인↔실근무↔집계 불일치 버그 클래스 생성. 진짜 필요하면 getAbleInoutTF/In·Out 신청/집계 귀속 동시 재설계 과제. (참고: `당일22:00~익일06:00` 정상 자정넘김은 이미 허용됨 — 막는 건 다음날 귀속분뿐)

## 권고

- 1차: 신청자에게 의도 확인 — 06-27 휴일을 00:00~09:00 근무하려던 거면 **당일(BSD)/당일(BSD)** 선택이 정답 (이러면 통과). 익일/익일은 사실상 06-28 근무를 06-27 휴일에 귀속시키는 비정상 조합.
- 근본 수정안 A(권장): 미리보기 valid-time API에도 출퇴근 가능 범위(getAbleInoutTF) 검사를 추가해 invalidCode로 내려주고, UI가 인라인 에러 + 요청 버튼 비활성화. (비즈니스룰 "시간 검증은 백엔드가 최종" 과도 일치)
- 수정안 B: 프론트에서 시작=익일(NXD) 같은 비정상 조합 자체를 막거나, 계산된 in/out이 귀속일 범위를 벗어나면 차단.
- 부차: OptimizException → 핸들된 400 응답으로 정리 검토.

## 하루 근무가능 시작/종료 시각 산정 (ValidWorkDayResolver) — 확정

`be:common/util/validworkday/ValidWorkDayResolver.java`
- 시작(`determineStartTime`): 고정출근 근무일 = 계획출근시각 − 3h(`DIFF_TIME_AVAILABLE_TO_WORK`) / 자율·휴일 = 시스템 기본 06:00(`STANDARD_HOUR_BY_VALID_WORK_DATE`).
- 종료(`determineEndTime`) = 다음날 시작 시각 → 하루 범위 = `[그날 시작, 다음날 시작)`.
- 예외(:199-208): 전날 고정근무 + 당일 휴일 → 당일 시작 = 전날 고정출근시각 + 24h − 3h.
- 본 케이스: 06-27 휴일 범위 ≈ `[06-27 06:00, 06-28 06:00)`. 퇴근 06-28 09:00 > 06-28 06:00 → 범위 이탈. (KB index의 "cutoff 동적계산" 메모 코드로 확정)

## 관련 코드
- `pp:src/components/workflow/shared/template_drawer/contents/DayOff.tsx` (기본값 BSD, 드롭다운 NXD/BSD)
- `be:service/appls/holidaywork/HolidayWorkApplsService.java:301-377`(checkHolidayWorkApplVo), `:761-831`(getHolidayWorkValidTime)
- `be:common/legacy/EmpWorkService.java:97-113`(getAbleInoutTF)
- `be:common/legacy/empdailywork/EmpDailyWorkService.java:3554-3596`(getAvailableInoutTime → ValidWorkDayResolver)
- `be:timeold/service/work/WorkService.java:89-110`(getValidTimeWithStdDdClass, NXD=+1일)
