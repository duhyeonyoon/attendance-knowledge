# 사전 연장/야간 신청 valid-time: 계획시간을 빼지 않는다

- `be:service/appls/otwork/OtApplsService.calcOtValidTime` (L1113~) — otMinutes = (신청 시작~종료) - 연장휴게. 근무계획(workStaHm~workEndHm) 겹침 차감 없음.
- `getOtValidTime`에도 "계획시간과 겹침" 검증 없음 (컷오프/TODAY_PAST/중복신청/BAN/PAST만).
- 근무그룹 `workOverAggrCd`(NP/P/M/S, 연장시간 관리 방식)는 OtApplsService에서 미참조 → 실적 집계(DailyAggregationService, WorkTimeCalcService 등) 쪽 설정.
- 프론트(pp:template_drawer/contents/Overtime.tsx:405-423)는 일자 선택 시 시작시각 기본값 = 계획 퇴근시각. 사용자가 시작을 계획 출근으로 바꾸면 계획시간 전체가 연장으로 표시/한도 차감됨.
- 예: 계획 09-18, 신청 09-19 → 연장 9시간(10h-휴게1h), "근무일 기준 잔여 시간 초과" 에러.
- 확인 필요: 의도(신청 구간=연장 구간 전제)인지, 계획 겹침 차단/차감이 필요한지 기획 판단.
