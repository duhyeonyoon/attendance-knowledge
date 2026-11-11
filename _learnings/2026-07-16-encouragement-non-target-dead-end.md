# 연차촉진 NON_TARGET(비대상)은 종착 상태 — 촉진기간 업로드로 대상 전환 안 됨

날짜: 2026-07-16
계기: 촉진기간 엑셀 업로드(1차 기간에 오늘 포함) 성공 후에도 상태가 '비대상' 유지되는 이유 질문

## 결론

1. **대상/비대상 판정은 대상자 생성 시점 1회만** 수행되고, 판정 입력은 촉진기간이 아니라 **연차 지급 데이터(TM_LEAVE_CRT)**다.
   - `be:pojo/encouragementbase/EncouragementLeaveSummary.java:51-57` — `isEncouragementTarget()` = 사용기간(start/end) 존재 **AND** 촉진분(의무사용분 − 사용분) > 0
   - `be:service/encouragementadmin/EncouragementTargetCreationService.java:154` — false면 `NON_TARGET` 저장
2. **촉진기간 엑셀 업로드(`updateTargetPeriods`)는 기간 컬럼만 UPDATE, 상태는 절대 안 건드림.**
   - `be:service/encouragementadmin/AdminEncouragementManagementService.java:598-606`
   - status 매트릭스(`firstStartLockReason:832-837`)에서 NON_TARGET은 1차 시작/종료 자유 변경 허용 → 업로드는 성공함 (그래서 어드민 입장에선 "반영됐는데 왜 안 바뀌지"가 됨)
3. **상태 전이는 1분 주기 배치**(`be:service/batch/TimeEncouragementBatchJob.refreshEncouragementStatus`)가 수행하지만, 1차 촉진 시작 액션 `SCHEDULED_START_FIRST_PHASE`의 allowedFromStatuses = **WAITING, ENCOURAGEMENT_MISSED 뿐**.
   - `be:common/util/encouragement/StatusTransitionActionType.java:33-43`
   - **NON_TARGET에서 빠져나오는 전이 규칙은 어떤 액션에도 없음** → 종착(dead-end) 상태
4. **알려진 미구현 갭**: `StatusTransitionActionType.java:19` TODO —
   `SCHEDULED_REFRESH_NON_TARGET : 비대상 상태인 대상자들이 연차촉진 대상이 되었는지 갱신하기`

## 고객/운영 대응 포인트

- 비대상 원인은 기간이 아니라 지급 데이터 → 촉진기간을 아무리 고쳐도 대상 전환 안 됨 (기간은 판정 입력 자체가 아님)
- 지급이 나중에 이뤄진 경우에도 자동 재판정 없음 (TODO 미구현)
- 우회: 연차촉진 작업에 **대상자 재추가**(`createTargetsForMembers`)를 하면 생성 시점 재판정을 타지만, 기존 NON_TARGET 행과의 중복 처리 여부는 미확인 `[TBD]`. 작업 삭제 기능도 없음(2025-07-09 기준)

## 후속: "스테이징에서는 된다" 검증 (2026-07-16)

- `origin/Release/stag`(로컬 ref 7/13, `2191fe5b3`)는 dev 전부 머지 상태, `StatusTransitionActionType.java`에 NON_TARGET 전이 없음 + TODO 그대로 → **코드 차이 아님**
- 유력 설명: 스테이징 대상자는 생성 시점 지급 데이터가 있어 **WAITING으로 생성** → 기간 업로드(오늘 포함) → 배치가 `WAITING → 촉진 필요` 전이. '비대상 → 대상' 전환이 아니라 '대기 → 촉진 필요'였을 것 `(추정)`
- 검증 방법: 업로드 이력 테이블(`TM_ANNUAL_LEAVE_ENCOURAGEMENT_TARGET_PERIOD_UPLOAD_HISTORY` — #1480에서 추가)과 대상자 상태 대조 + 해당 구성원 `TM_LEAVE_CRT` 의무사용분/사용기간 확인
- 미확인: 7/13 이후 스테이징 추가 배포 여부 (GitHub MCP가 hcgtheplus/optimiz-time에 404 — 토큰 권한 없음. git fetch 후 재확인 필요)

## 후속 2: 스테이징 실데이터 검증 (2026-07-16, Chrome로 직접 확인)

작업 `865443900939753609` (퍼플앤컴퍼니222) / 대상자 소희a, `targets/search` API 실응답:

- `encouragementStatus: NON_TARGET`, `totalLeaveMinutes: 7464`(발생 15.55일), `usedLeaveMinutes: 360`
- **`requiredUsageMinutes: 0` (의무사용분 0), `encouragementMinutes: 0` (촉진분 0 → 화면 '촉진 일수 -')**
- **`leaveUseStartYmd/EndYmd: null`, `annualLeaveBaseYmd: null`**
- 1차 기간 20260715–20260717 업로드는 정상 반영

→ **연차 발생량이 있어도 의무사용분/사용기간이 없으면 지금 재판정해도 비대상이 맞음.** `isEncouragementTarget()` = 사용기간 존재 AND 촉진분(의무−사용)>0.

의무사용분 세팅 경로: `be:pojo/annualleavesettlement/MandatoryUsageAllocator` — **연차 운영 규칙(AnnualLeaveOperationRuleVo, mandatoryUsageType)** 기반으로 정산/생성 시 할당. 규칙 없으면(rule==null) 할당 스킵 → 0 유지. 수동 지급(연차 지급 조정)은 의무사용분/사용기간을 채우지 않음 `(추정 — 수동지급 경로 코드 직접 확인은 안 함)`.

즉 "비대상 유지"는 두 겹: ① 이 구성원은 지급 데이터상 촉진분 0이라 판정 기준 자체로 비대상 ② 설사 데이터를 채워도 저장된 NON_TARGET을 재판정하는 로직 없음 (TODO 미구현) → 대상자 재추가로만 재판정 가능.

## 후속 3: 소희a가 비대상인 근본 원인 — 조정(수동) 지급분은 의무사용 기준에서 제외 (확정)

소희a TM_LEAVE_CRT 실데이터 (`anl-leaves/search`): `crtYy 2026, ANL, grantedMinutes 7464 = adjustmentMinutes 7464, generatedMinutes 0, mandatoryUsageMinutes 0, nonMandatoryUsageMinutes 7104, useStaYmd 20260101~20261231`

**핵심 룰**: `be:constant/CONST_TIME_CODE.java:294-297` `getMandatoryBaseMinutes()` — **의무사용 기준 = 전체 부여 − 조정분(adjustment)**. 조정(수동 지급)으로만 부여된 연차는 의무사용 기준이 0 → 의무사용분 0 → 촉진분 0 → 비대상. 운영 규칙이 ALL_REQUIRED/PARTIAL_REQUIRED여도 마찬가지.

인과 사슬: ① '연차 지급(조정)'으로 부여 (generatedMinutes 0) → ② 의무사용 기준 0 → ③ 촉진분 0 → 판정상 비대상 → ④ 저장된 NON_TARGET은 재판정 로직도 없음 (이중 잠금)

부가 발견: 대상자 검색 API의 `leaveUseStartYmd/EndYmd`는 **대상자 생성 시점에 스냅샷 저장된 값** (TM_ANNUAL_LEAVE_ENCOURAGEMENT_TARGET 컬럼) — CRT의 useStaYmd와 다를 수 있음. 소희a는 생성 시점에 CRT가 없어서 null.

**스테이징에서 대상 만들려면**: 연차가 '생성' 경로(연차 생성 룰, generatedMinutes > 0)로 부여돼야 함 (예: 연차 수동 초기화 `anl-leaves/init`) → 이후 촉진 작업에 대상자 재추가로 재판정.

## 후속 4: 로컬에서 1분 배치가 안 도는 이유 — `time.batch.active` 프로파일 플래그

- `be:service/batch/TimeEncouragementBatchJob` — `@Value("${time.batch.active:false}")`, **기본값 false**. 스케줄 메서드는 1분마다 깨어나긴 하지만 `isActive()` false면 즉시 return (로그에 "inactive" 찍힘)
- `time.batch.active: true`는 **`application-backend.yml`(backend 프로파일)에만** 있음 → 스테이징은 배치 전용 backend 인스턴스가 따로 떠서 전이가 돌고, 로컬에서 backend 프로파일 없이 띄우면 WAITING이어도 영원히 안 바뀜
- 로컬에서 전이 테스트하려면: backend 프로파일로 실행하거나 `time.batch.active=true` 오버라이드

## 참고: NON_TARGET/WAITING enum 주석

`be:constant/CONST_TIME_ENCOURAGEMENT.java:149-151` — "촉진 대기상태일때, 지급일수가 없거나 촉진일수가 없다면 비대상" ("실시간으로 판단하는 상태"라는 주석이 있으나 실제로는 생성 시점 저장 후 갱신 없음 — 주석이 오해 소지 있음)
