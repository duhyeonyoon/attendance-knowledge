# 연차촉진 대상자 기간/상태 컬럼 좌표계 및 로컬 테스트용 일괄 변경

- 날짜: 2026-07-20
- 맥락: 로컬에서 연차촉진 1차/2차 기간을 오늘 포함으로 당겨서 테스트하는 SQL 작성 중 확인

## 검증된 사실

1. **기간 컬럼 매핑** (`TM_ANNUAL_LEAVE_ENCOURAGEMENT_TARGET`, be:db/migrationSql/20250616_04):
   - 1차 촉진 기간 = `UNUSED_NOTIFICATION_START_DATE` ~ `UNUSED_NOTIFICATION_END_DATE`
   - 계획서 작성 기간 = `USAGE_PLAN_START_DATE` ~ `USAGE_PLAN_END_DATE` (1차 촉진 수행 시 세팅, 촉진일 +10일)
   - 2차 촉진(통보) 기간 = `ASSIGNED_DATE_START_DATE` ~ `ASSIGNED_DATE_END_DATE`

2. **좌표계는 UTC.** 어드민이 KST YMD 입력 → `toStartOfDayUtc`/`toEndOfDayUtc` (AdminEncouragementManagementService:695-704)로 변환:
   - 시작일 D → `(D-1) 15:00:00` UTC
   - 종료일 D → `D 14:59:59` UTC
   - 배치도 `CURRENT_TIMESTAMP BETWEEN ...`으로 UTC 비교 (TimeEncouragementBatchMapper.xml:91,99,107) → DB 세션 TZ는 UTC 전제

3. **상태 전이** (StatusTransitionActionType):
   - WAITING(대기) → `SCHEDULED_START_FIRST_PHASE` → `ENCOURAGEMENT_NEEDED`(촉진 필요). 조건: 현재시각이 1차 기간 내 (EncouragementStatusTransitionValidator).
   - ENCOURAGEMENT_MISSED도 1차 기간 재조정 시 스케줄러가 ENCOURAGEMENT_NEEDED로 복귀시킴.
   - 2차 시작(`SCHEDULED_START_SECOND_PHASE`)은 (a) 현재시각이 2차 기간 내 (b) USAGE_PLAN_END_DATE 경과 (c) UNUSED_NOTIFICATION_NOTICE_DATE not null(=1차 촉진 수행됨) 필요.

4. **기간 검증 룰**: 1차 종료 < 2차 시작 이어야 함 (findPeriodInputShapeViolation, INVALID_PERIOD).

5. `updateTargetPeriods` (AdminEncouragementTargetMapper.xml:640)는 optimistic lock처럼 `ENCOURAGEMENT_STATUS = #{expectedStatus}` 조건을 걸고 UPDATE함.
