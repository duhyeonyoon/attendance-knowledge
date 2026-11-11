# 당일 과거 시각 허용 정책 (otPastApplyPolicyCd) — FE↔BE 검증 불일치

날짜: 2026-06-11 / 작성 배경: 근무그룹 확정 저장 시 백엔드 오류 "당일 과거 시각 허용 정책을 선택하세요." 원인 분석

## 핵심 발견

**백엔드와 프론트의 필수 조건이 다르다.**

- BE: `be:com/hcg/optimiz/time/validator/setting/rule/WorkGrpSettingValidator.java:259-262`
  - `requiresOtPastApplyPolicy(otPmitCd, nightPmitCd)` = **연장(otPmitCd) == "A" OR 야간(nightPmitCd) == "A"**
  - 호출처: `WorkGrpSettingService.validateConfirmSave()` (L795-798) — **확정 저장 시에만** 발동 (임시저장 아님)
  - 오류 문구: "당일 과거 시각 허용 정책을 선택하세요." (`WorkGrpSettingService.java:797`)
- FE(talenx-admin):
  - 검증 룰: `ad:src/helpers/attendance/work/group_setting/detail/workSettingValidationRules.ts:128-135` — **otPmitCd === "A"만** 체크 (야간 미체크)
  - UI 노출 조건: `ad:...OvertimeManagementFormSection.tsx:232` — `otPmitCd === "A"`일 때만 라디오 렌더
  - 저장 시 매핑: `ad:src/helpers/attendance/work/group_setting/detail/index.ts:169` — 빈 값이면 `null` 전송

## 결과 시나리오

1. **야간만 승인제(nightPmitCd="A") + 연장 자유/불가** → FE는 입력 UI도 검증도 없음 → null 전송 → BE 확정 시 오류. (FE 룰 갭)
2. 연장 승인제인데 입력 UI가 가려진 환경 → 값 영영 null → BE 확정 시 오류.
3. 기존 그룹: 마이그레이션 `20251112_01_add_col_TM_WORK_GRP_ot_past_apply_policy_cd.sql`이 컬럼을 NULL로 추가, **backfill 없음** → 옵션 도입 전 그룹은 전부 null.

## UI "가림" 메커니즘 (추정, 확인 필요)

현 admin 코드(feat-leave-grp-copy)에는 라디오 렌더 코드가 살아 있음. 입력이 안 보인다면 시스템코드 `OT_PAST_APPLY_POLICY_CD`가 환경에 미등록 → `makeSelectOptions`가 빈 배열 → 라디오가 옵션 없이 렌더되어 사실상 안 보이는 것일 가능성. `(추정)` — 환경별 시스템코드 등록 여부 확인 필요.

## 코드 연혁

- BE 검증 도입: PR #1148 "사전 연장/야간 신청서 당일 비활성화 관련 작업" (커밋일 2025-11-13)
- AD 옵션 UI 도입: PR #2768 (2025-11-13)
- 코드값: `OT_PAST_APPLY_POLICY_CD` = `ALLOW_ANYTIME` / `DENY_TODAY_PAST`. `OT_PMIT_CD_1.APPLY` = "A", `NIGHT_PMIT_CD_1.APPLY` = "A"

## 두현님 확인 필요

- [ ] 입력을 "가려둔" 방식이 정확히 무엇인지 (시스템코드 미등록? 별도 브랜치/배포 설정?)
- [ ] 해결 방향: FE 룰에 야간 조건 추가+UI 노출 vs BE 필수 완화/기본값(ALLOW_ANYTIME) vs 마이그레이션 backfill
