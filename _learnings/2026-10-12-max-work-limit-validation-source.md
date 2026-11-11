# 근무내역변경 "최대 근무시간을 N시간 초과했습니다" 출처 (2026-10-12)

계기: NICE인프라 주영신 10/9 근무내역변경 상신 실패 문의 (Slack C06ULEEM88M thread 1791789597.661949)

## 확인된 사실 (코드)
- 판단·계산은 **백엔드**. 프론트는 결과 표시만.
  - 입력 중 문구: `pp:src/components/workflow/shared/template_drawer/contents/RegEdit.tsx:800-809`
    → `PUT {WORK_REG_EDIT}/valid-work-time` 응답의 `validApplTime.isExceededMaxWorkLimit` / `exceededMaxWorkLimitMinutes` 를 i18n `REG_EDIT.validation.exceededMaxWorkLimit` 로 표시
  - 응답 생성: `be:service/appls/WorkRecordChangeApplsService.java:~1936-1951`
  - 상신(저장) 시 차단: 같은 파일 `validateMaxWorkLimitOrElseThrow` (:553) → `OptimizException("최대 근무시간을 N시간 초과했습니다.")` (문구도 백엔드에서 조합)
- 계산 본체: `be:service/maxworklimit/MaxWorkLimitService.calculateRemainingMaxWorkLimitForPunch`
  - 근무그룹 `hasMaxWorkLimit` + `maxWorkLimitUnitCd=WEEK1` 일 때만 동작 (선택근로제는 정산기간 환산)
  - 주 범위 = TimeOption.staWday 기준, 조회 끝 = min(오늘, 주말)
  - 대상일 제외 일자: 일근무집계(base+ot) 합산, **요청중 근무내역변경 문서가 있는 일자는 max(확정값, 요청중 반영 예상값)** 사용 (보수적)
  - 대상일: 이번 요청 계산값(timeWorkMin)

## 추정 (미검증)
- 같은 주에 다른 날(10/10) 요청중 문서가 있으면 그 예상치가 누적에 들어가 초과 판정 가능. 승인 후 재현 시 문구가 안 뜬 것과 정황상 맞음. 다만 24+11+11=46h 로 52h 미만이라, 2h 초과가 되려면 요청중 문서 반영 예상치(determineWorkTimeCalcDto)가 크게 잡혔거나 주 시작요일/설정값이 예상과 다를 가능성 → 데이터 확인 필요.

## 중복 요청 방지 (확인)
- 근무내역변경: 프론트 RegEdit 진입 시 `GET /time/self/check-inprogress-appls` → 같은 날 출근/퇴근/근무내역변경 요청중이면 요청 버튼 disabled (`pp:RegEdit.tsx:669-693, 2447-2452`). 백엔드 저장 시 `checkApply`(APPR_PROGRESS·APPROVAL_DONE) 로 3종 모두 차단 (`be:WorkRecordChangeApplsService.java:375, 886`).
- 출근/퇴근 요청: 같은 유형 요청중만 차단 (`be:InApplsService.java:235`, `OutApplsService.java:229`). 같은 날 근무내역변경 요청중 여부는 안 봄(다만 출퇴근 요청은 당일 근무일만 가능).
- 최대근무 누적의 요청중 판정은 날짜 Set(UNION) 기준 → 문서가 여러 건이어도 날짜당 1회 계산. 중복 문서로 이중 합산되는 구조 아님.
