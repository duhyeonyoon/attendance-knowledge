# 일 집계 Kafka 흐름 (2026-07-15)

질문: "이벤트 기반 집계 실행 시 무조건 Kafka 발행?"

## 결론

- **이벤트 기반 일 집계는 100% Kafka 경유.** 우회 분기 없음.
- 수동 집계 / 배치는 Kafka 안 거치고 `DailyAggregationService` 직접 호출.

## 구조

```
[프로듀서 12곳+] --pushEvent--> Kafka topic "time-daily-aggregation"
                                     ↓
                     AggregationListener (@KafkaListener, groupId=TIME_GROUP_ID)
                                     ↓
        DailyAggregationService.aggregateDailyWithMonthly() / aggregateDaily()
```

- 토픽 상수: `be:constant/CONST_TIME_KAFKA_TOPICS.java:51` — `TimeInternalTopics.TIME_DAILY_AGGREGATION = "time-daily-aggregation"`
- 대량용: `TIME_DAILY_AGGREGATION_BULK = "time-daily-aggregation-bulk"` (리스너에서 기간 루프 돌며 일집계)
- 메시지 DTO: `DailyAggregationTopicDto` (clientId / modUserId / ymd / includeMonthlyAggregation / aggregateAllMembers / targetFilter.memberId·companyId)
- 파티션 키: `TimeServiceUtil.createMonthlySerializedKey(memberId, ymd)` — 구성원×월 단위 직렬화 (같은 구성원·월 이벤트 순서 보장 목적으로 추정)

## 프로듀서 목록 (`eventManager.pushEvent(TIME_DAILY_AGGREGATION, ...)`)

| 위치 | 트리거 |
|------|------|
| `controller/widget/WorkRecordWidgetController:315` | 퇴근 후 집계 (`publishDailyAggregationEvent`) |
| `controller/workadmin/WorkResultManagementController:241` | 어드민 출퇴근 직접 수정 |
| `controller/appls/*` 10종 (In/Out/Leave/LeaveCancel/Ot/OtCancel/HolidayWork/HolidayWorkCancel/OtherWork/OtherWorkCancel/CompensatoryWork/DdWorkPlanChange/WorkPlanEstablishment/WorkRecordChange) | 신청서 승인/취소 시 |
| `service/aggregate/DailyAggregationEventService` | 휴가 사용이력(L47) / 기타근무 신청상세(L116) 기반 재집계 |

## Kafka 안 거치는 경로

- **수동 집계**: `controller/aggregation/ManualAggregationController:70,75,113` — `aggregateDaily`(동기) / `aggregateDailyAsync` 직접 호출
- **배치**: `service/batch/TimeAggrBatchJob:107,113` — `executeDailyAggr(DailyAggregationJob)` 직접 호출. 당일 + 전일 2회 집계, 월집계는 `MonthlyAggregationService.executeAggregation` 별도 실행. Nice Business Platform 전용 배치도 별도 존재 (L148~)

## 비고 / 미확인

- `eventManager`는 `com.hcg.optimiz.framework.kernel.event.EventManager` — Kafka producer 래퍼 (소비측이 @KafkaListener이므로 Kafka 확정)
- `DailyAggregationEventService`는 프로듀서 중 하나일 뿐 (휴가/기타근무 케이스 전담). KB 기존 서술 "이벤트 기반 = DailyAggregationEventService"는 부정확 → glossary 수정함
- [TBD] `aggregateDailyAsync`의 스레드 처리 방식 (@Async?)
