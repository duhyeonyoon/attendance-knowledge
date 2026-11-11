# 백엔드 DB 테이블 인벤토리 (TM_*)

`optimiz-time/src/main/resources/db/initialSetting/`의 init SQL에서 추출한 근무/휴가 도메인 테이블 목록입니다.
컬럼 단위 상세는 [TBD] — 필요 시 init SQL 직접 참조 필요.

## 출퇴근 (ATTEND)

| 테이블 | 추정 용도 |
|------|------|
| TM_INOUT_REG | 출퇴근 기록 (입출 등록) |
| TM_INOUT_REG_ADJST_DTL | 출퇴근 보정 상세 |
| TM_REST_REG | 휴식 기록 |
| TM_REST_REG_ADJST_DTL | 휴식 보정 상세 |
| TM_ATTEND_ITEM | 근태 항목 마스터 |
| TM_ATTEND_ITEM_AGGR | 근태 항목 집계 |
| TM_ATTEND_ITEM_AGGR_DTL | 근태 항목 집계 상세 |
| TM_ATTEND_ADD_IN_ITEM | 근태 추가 항목 |
| TM_ATTEND_REG | 근태 등록 |
| TM_DD_ATTEND_AGGR | 일일 근태 집계 |
| TM_DD_ATTEND_AGGR_LOG | 일일 근태 집계 로그 |
| TM_DD_ATTEND_AGGR_RSLT | 일일 근태 집계 결과 |
| TM_MM_ATTEND_AGGR | 월간 근태 집계 |
| TM_MM_ATTEND_AGGR_LOG | 월간 근태 집계 로그 |
| TM_MM_ATTEND_AGGR_RSLT | 월간 근태 집계 결과 |
| TM_PERIOD_ATTEND_AGGR | 기간 근태 집계 |

## 근무 계획 / 스케줄 (WORK / WORK_PLAN)

| 테이블 | 추정 용도 |
|------|------|
| TM_DD_WORK_AGGR | 일일 근무 집계 |
| TM_MM_WORK_AGGR | 월간 근무 집계 |
| TM_PERIOD_WORK_AGGR | 기간 근무 집계 |
| TM_DD_WORK_PLAN | 일일 근무 계획 |
| TM_DD_WORK_PLAN_REST_TIME | 일일 근무 계획 휴식 시간 |
| TM_EMP_WORK_PLAN | 구성원 근무 계획 |
| TM_EMP_EXCE_DD_WORK_PLAN | 구성원 예외 일일 근무 계획 |
| TM_WORK_GRP | 근무그룹 마스터 |
| TM_GRP_HISTORY | 근무·휴가 그룹 이력 공용 (`GRP_CLASS`로 구분. 휴가 측은 근무제 유형 대신 입사일·연차기산일 컬럼). ~~TM_WORK_GRP_HISTORY~~는 없는 이름 |
| TM_COMPANY_TIME_OPTION | 회사별 근무 옵션 (한 주의 시작 — 1회 등록 후 변경·삭제 불가) |
| TM_WORK_GRP_ATTEND_ITEM | 근무그룹 근태 항목 |
| TM_WORK_GRP_DD_WORK_PLAN | 근무그룹 일일 근무 계획 |
| TM_WORK_GRP_WORK_PLAN | 근무그룹 근무 계획 |
| TM_WORK_GRP_WORK_PLC | 근무그룹 근무지 매핑 |
| TM_WORK_GRP_HOLI_CALEN | 근무그룹 휴일 캘린더 |
| TM_WORK_GRP_CHG_APPL | 근무그룹 변경 신청 |
| TM_PSN_WORK_PLAN_APPL | 개인 근무 계획 신청 |
| TM_PSN_WORK_PLAN_CANCEL_APPL | 개인 근무 계획 취소 신청 |
| TM_WORK_REG_ADJST_APPL | 근무 등록 보정 신청 (= 근무내역 변경 신청) |

## 신청서 (APPL)

| 테이블 | 추정 용도 |
|------|------|
| TM_ATTEND_APPL | 근태 신청 (공통?) |
| TM_ATTEND_APPL_ADD_IN_ITEM | 근태 신청 추가 항목 |
| TM_ATTEND_APPL_COMP | 근태 신청 회사 |
| TM_ATTEND_APPL_EDU_SBJ | 근태 신청 교육 과목 |
| TM_ATTEND_APPL_LDG | 근태 신청 숙박 |
| TM_ATTEND_APPL_MEAL_MON | 근태 신청 식대(?) |
| TM_ATTEND_APPL_MOVE_MTH | 근태 신청 이동 방법 |
| TM_ATTEND_APPL_PERIOD_DTL | 근태 신청 기간 상세 |
| TM_IN_APPL | 출근 신청 |
| TM_OUT_APPL | 퇴근 신청 |
| TM_PSN_HOLI_WORK_APPL | 개인 휴일근무 신청 (사전 휴일근무) |
| TM_PSN_OT_PLAN_APPL | 개인 연장근무 계획 신청 (사전 연장/야간) |
| TM_PSN_OT_PLAN_CANCEL_APPL | 개인 연장근무 계획 취소 신청 |
| TM_RMT_WORK_APPL | 재택근무 신청 |
| TM_RMT_WORK_APPL_DTL | 재택근무 신청 상세 |
| TM_WORK_FOR_HOME_APPL | (재택? 기타근무? — 명칭 모호. 확인 필요) |
| TM_WORK_FOR_HOME_APPL_DTL | 위 상세 |
| TM_WORK_FOR_HOME_CANCEL_APPL | 위 취소 |
| TM_WORK_FOR_HOME_CANCEL_APPL_DTL | 위 취소 상세 |

## 휴일 / 근무지

| 테이블 | 추정 용도 |
|------|------|
| TM_HOLI_CALEN | 휴일 캘린더 |
| TM_WORK_PLC | 근무지 마스터 |
| TM_WORK_PLC_IP | 근무지 IP |
| TM_WORK_PLC_WIFI | 근무지 WiFi |
| TM_RMT_WORK_LOC | 재택 근무 위치 |

## 휴가 (LEAVE)

| 테이블 | 추정 용도 |
|------|------|
| TM_LEAVE_SYSTEM | 휴가 제도 마스터 |
| TM_LEAVE_GRP | 휴가그룹 마스터 |
| TM_LEAVE_GRP_LEAVE_SYSTEM | 휴가그룹-제도 매핑 |
| TM_LEAVE_APPL | 휴가 신청 |
| TM_LEAVE_APPL_DTL | 휴가 신청 상세 |
| TM_LEAVE_CANCEL_APPL | 휴가 취소 신청 |
| TM_LEAVE_CRT | 휴가 생성 (Create — 연차 생성?) |
| TM_LEAVE_PAY_HISTORY | 휴가 지급 이력 |
| TM_LEAVE_PAY_HISTORY_ACCESS_TIME | 휴가 지급 이력 접근 시간 |
| TM_LEAVE_USE | 휴가 사용 |
| TM_LEAVE_USE_HISTORY | 휴가 사용 이력 |

## 연차 정산 룰

| 테이블 | 추정 용도 |
|------|------|
| TM_ANL_CRT_RULE | 연차 생성 룰 |
| TM_ANL_CRT_D_CNT_STD | 연차 생성 일수 기준 (Days Count Standard) |
| TM_ANL_CM_RULE | 연차 정산 룰(?) — 명칭 모호 |

## 시스템 / 옵션

| 테이블 | 추정 용도 |
|------|------|
| TM_TIME_OPTION | 시간 옵션 (회계연도 시작일, 한 주 시작 요일 등 추정) |
| TM_TIME_PUSH_TRG | 푸시 트리거 |
| TM_COND_FAV | 조건 즐겨찾기(?) |

## 근무 마감 (Close Work Data)

| 테이블 (추정 이름) | 용도 |
|------|------|
| TM_CLOSE_WORK_DATA_HISTORY | 마감 이력 (실행 1건당 1 row, 기간/메모/실행자) + `CLOSE_TYPE_CODE`, `SOURCE_HISTORY_ID` |
| TM_CLOSE_WORK_DATA_HISTORY_MEMBER | 마감 적용 구성원 (다대다) |
| TM_CLOSE_WORK_DATA_HISTORY_WORK_GROUP | 마감 적용 근무그룹 (다대다) |
| TM_INOUT_REG_ADJST_APPL | 출퇴근 내역 변경 신청 (2026-11-05 추가) |
| TM_PSN_OT_POST_APPL | 연장/야간근무(사후) 신청 |
| TM_POST_HOLIDAY_WORK_APPL | 휴일근무(사후) 신청 |
| TM_HOLIDAY_WORK_CANCEL_APPL | 휴일근무 취소 신청 |
| TM_OTHER_WORK_APPL_DTL | 기타근무 신청 상세 (삭제는 상태 930으로 논리 삭제) |
| TM_DD_WORK_PLAN_CHG_APPL | 근무계획 변경 신청 |

> [TBD] 정확한 테이블 이름은 `be:mapper/closeworkdata/*.xml` 또는 `init/` SQL 확인 필요. 또한 `closeYn` 컬럼이 `TM_DD_ATTEND_AGGR`, `TM_DD_WORK_AGGR` 등 일별 집계 테이블에 컬럼으로 존재.

---

**출처**: `optimiz-time/src/main/resources/db/initialSetting/2024050*_init_TM_*.sql` (50+ 파일에서 추출)

**[TBD]**
- 각 테이블의 컬럼 / PK / FK / 인덱스 — init SQL 직접 확인 필요
- ENTITY 클래스(JPA?)와 매핑 정보 — `src/main/java/com/hcg/optimiz/time/` 하위 entity 패키지 확인 필요
- TM_WORK_FOR_HOME과 TM_RMT_WORK 의 차이 (둘 다 재택? 의미 분리 필요)
