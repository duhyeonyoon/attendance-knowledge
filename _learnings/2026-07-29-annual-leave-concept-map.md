# 연차 개념 지도 — 생성·사용·초과사용·정산·촉진 연결

작성: 2026-07-29 / 계기: 두현님 "연차 개념이 머릿속에 안 이어진다" → 전면 조사

산출물: HTML 학습 가이드 (Cowork 아티팩트 `talenx-annual-leave-guide`)

## 이번 조사에서 새로 확정된 사실 (KB 본문 [TBD] 해소분)

### 1. 정산 규칙이 2세대 공존 — `TM_ANL_CM_RULE`은 죽은 코드
`product/admin/leave/overview.md` § 검증의 `[TBD] TM_ANL_CRT_RULE vs TM_ANL_CM_RULE 책임 분리` **해소**:
- `TM_ANL_CM_RULE`(연차보상기준, 2024) → `AnlCmRuleSettingService`의 validation에서만 참조.
  정산 엔진(`AnnualLeaveSettlementService`, `*SettlementProcessor`)은 **전혀 읽지 않음**.
  `TM_LEAVE_GRP.ANL_CM_RULE_ID`도 조회 SQL JOIN만 됨.
- 현행 정산 = `TM_ANNUAL_LEAVE_OPERATION_RULE` (2025-11 도입, migrationSql `20251110_01_init_...`)
  + `TM_LEAVE_GRP.ANNUAL_LEAVE_OPERATION_RULE_ID` (`20251111_01_...`)
→ **KB의 "연차 정산 기준" = v2 테이블**. CM_RULE 추적은 막다른 길.

### 2. 연차 vs 월차의 `CRT_YY` 의미가 다름
- 정상연차(`_ANL`): `CRT_YY` = 작업 기준 연도 (`jobDto.getCrtYy()`)
- 1년미만연차(`_A1Y`): `CRT_YY` = **연차기산일의 회계연도** (`fiscalYearFromAnnualLeaveBase`)
  단, `evmCrtMth=BF`(선부여)일 때만 `jobDto.getCrtYy()` 사용
→ 나이스신용평가 "월차가 2025 귀속연도로 조회하면 안 나옴" 문의의 근본 원인.

### 3. 차감 우선순위 = `useEndYmd` 오름차순 (귀속연도 아님)
`CalcLeaveService.java:101-103` — `// 종료일이 빠른순으로 차감하게 되므로 종료일로 정렬`
만료 임박 우선. 4곳(정상연차/연차외 구·신/월차) 모두 동일 정렬.

### 4. `TM_LEAVE_CRT.USE_M_CNT`에 신청중(미승인) 분은 없음
`CalcLeaveService.java:1107-1136` — 계산 중엔 신청중도 "쓴 것"으로 잔여를 막지만,
저장 직전 `useMCnt = crtVoUsedMinutes - crtVoApplyMinutes`로 확정분만 남김.

### 5. 초과사용은 정상연차 전용
`isNormalAnnualLeave` 조건이 붙어 있고, `CalcLeaveService.java:911`에
`// TODO) 1년미만연차, 연차외휴가 초과사용여부 확인`.
→ 월차 선사용은 **연차 조정 > 사용 시작일 앞당기기**로 우회 (Slack #cx 고한결 확정).

### 6. 초과사용의 결말 = 정산의 `overuseSettlementType`
`ALL_CARRYOVER` → 다음 해 연차에 **음수로 이월**(빚 승계, `outgoingCarryOverMinutes` 음수 적재)
`ALL_EXPIRE` → 탕감(`expiredMinutes` 음수 적재)
구 옵션 `overMinuteDpsMth`(ANL_OVER_MINUTE_DPS_MTH_1)는 **호출부 0건 = 죽은 설정**.

### 7. 재계산 경로는 초과사용 제한을 우회
`calcLeaveDto.ignoreOverUsePmit()` → `overUsePmit=true, isOverUseUnlimited=true`
호출처: `LeaveCreationService:630,697`, `UseLeaveService:1009,1054,1113`
→ 신규 신청은 막히지만, 규칙 변경/조정으로 이미 초과된 상태는 재계산에서 보존됨.

### 8. 근무율(80%/만근) 미반영
`LeaveCreationService.java:82-97` TODO 블록. 현재는 근무율 무관하게 부여.

## 미구현/죽은 옵션 목록 (코드 추적 시간 낭비 방지)
- `TM_ANL_CM_RULE` 전체
- `ANL_EVM_CRT_MTH_1.TABLE("T")` — `LeaveCreationService:1181-1183` TODO
- `AnlCrtRuleVo.roundUnit`/`roundMth` — `// 미사용`
- `overMinuteDpsMth` — 호출부 0건
- `firstCrtStd` — VO 주석처리 (DB 컬럼만 잔존)
- `HOLI_USE_UNIT_1.HF1/HF2` (오전/오후반차) — `isUsed=false`
- `LEAVE_USE_STD_1.X`/`A` — `isUsed=false`
- `LeaveSystemVo.overUsePmitYn` — 연차 차감은 `AnlCrtRuleVo` 쪽만 참조
- `LEAVE_USAGE_OPTION.ALL_DAY` — 8시간 하드코딩 (`// FIXME: 동적으로 계산되어야 하는 부분`)

## Slack에서 건진 실무 룰
- **연차 생성 실패 1순위 원인**: 생성 기준일에 휴가그룹 소속 없음 → all-or-nothing 400.
  정석 순서 = 연차기산일 입력 → 근무그룹 배정 → 휴가그룹 배정 → 자동생성
- **잔여 마이너스 합산 표시는 사양**: 2025 −2일 + 2026 15일 → 13일. 연도별 조회로 구분.
- **어드민 수동 등록 4분류**: lackLeave(월차부족·불가) / noAnnualLeave(미생성) /
  duplicateLeave(중복·무조건 불가) / exceededAnnualLeave(초과·강제등록 가능)
- **정산 후 재생성 보존 기준은 `IS_CLOSED`** (isCompensated 아님) — 2026-07 박예진↔최영우 결론
- **임원 전환 정산 패턴**: '전체 소멸' 정책 임시 그룹을 만들어 옮겨서 정산
- **연차촉진은 수동 조정값 미반영** — NICE홀딩스 전적자 케이스(13일 vs 촉진 16일 기준)
- **반복 문의**: "사용기간 조회 = 생성 건 단위 요약 / 기간별 이력은 연차 사용현황 탭" (2회 이상)
- 고객사별 정산 정책 표 → Slack #ch-plan 고한결 정리 (전체소멸/부분보상/전체보상 그룹핑)

## 후속 [TBD]
- `TM_LEAVE_SYSTEM`의 연차/연차외 type 구분 컬럼명 (여전히 미확인)
- 연차외휴가 정산 전/후 구분 불가 문제 (`EXPIRED/COMPENSATED/CARRY_OVER_MINUTES` DEFAULT 0) — 노진철 제기, 미해결
- `product/admin/leave/overview.md` 본문에 위 1·2·3·4·5 반영 필요 (아직 이 파일에만 있음)
