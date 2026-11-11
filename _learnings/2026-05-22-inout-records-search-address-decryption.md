# 2026-05-22 — 출퇴근내역 조회의 근무지 외 주소 복호화 & 위치정보 제공 이력 로깅

## 발견 요약

`POST /time/aggr/inout-records/search` (어드민 출퇴근내역 조회)에서 출근지/퇴근지의 **근무지 외 주소** (`startWorkAddr` / `endWorkAddr`)는 DB에 암호화 저장되어 있고, MyBatis `EncryptionTypeHandler`가 조회 시 자동 복호화한다. 그리고 **현재 브랜치 `feat-off-workspace-address-access-log`**에서 위치정보가 실제로 응답에 포함된 경우 Kafka 이벤트로 "위치정보 제공 이력"을 비동기 기록하는 로직이 추가됐다.

## 복호화 메커니즘

- 마커 어노테이션: `optimiz-framework: com/hcg/optimiz/core/annotation/EncryptionType.java`
  - `@Target(FIELD) @Retention(RUNTIME)` — 본문 비어 있음
- 핸들러: `optimiz-framework: com/hcg/optimiz/framework/config/handler/EncryptionTypeHandler.java`
  - `BaseTypeHandler<String>` 상속
  - `getNullableResult` 3종 → `EncryptionManager.decrypt(result)` 호출 (자동 복호화)
  - `setNonNullParameter` → `EncryptionManager.encrypt(parameter)` (자동 암호화)
- 적용 DTO: `be:dto/workadmin/WorkResultManagementDto.java:354`
  ```java
  public static class InoutApplicationWorkAddr implements VoDto {
    private String inoutApplId;
    @EncryptionType
    private String workAddr;
  }
  ```
- SQL은 평문 SELECT만 함 (`be:resources/SQL/time/workadmin/InoutDataAdminMapper.xml:1348-1376`) — 복호화는 TypeHandler가 담당하므로 XML에 복호화 함수 호출이 안 보임

> 같은 `@EncryptionType` 어노테이션이 `vo/InApplVo.workAddr`, `vo/OutApplVo.workAddr`, `dto/appls/InApplDto.workAddr`, `dto/appls/OutApplDto.workAddr`에도 붙어 있음 → 출퇴근 신청서의 모든 `WORK_ADDR` 컬럼이 동일 메커니즘으로 암호화 저장됨.

## `getInoutRecordSummary` 흐름 (`be:service/workadmin/InoutDataAdminService.java:116`)

1. **유효성 검사** (`validateGetInoutRecordSummaryRequest`): YMD 포맷, 시작 ≤ 종료, 최대 31일
2. **1차 페이징 조회** `inoutDataAdminMapper.getInoutRecordsSummaryWithAuth(...)` — `InoutRecordsSummary` 리스트 + 총건수 별도 조회
3. row별 `startStdDdClass`/`endStdDdClass` 산출 (당일/전일/익일), `startWorkPlcId`/`endWorkPlcId`/`startInApplId`/`endOutApplId` 수집
4. **근무지명** 매핑: `findWorkPlaces` → `TM_WORK_PLC.WORK_PLC_NM` 별도 조회 → `record.setStartWorkplaceName` / `setEndWorkplaceName` (조인 회피 — 성능 이슈)
5. **근무지 외 주소 후조회** (토글 켜진 경우만, `includeLocationInfo=true`):
   - `findInApplWorkAddrMap` → `findInApplWorkAddrs` (TM_IN_APPL, 500건 배치)
   - `findOutApplWorkAddrMap` → `findOutApplWorkAddrs` (TM_OUT_APPL, 500건 배치)
   - 조회 조건: `OUT_OF_WORK_PLC_YN='Y'` AND `currentYmd BETWEEN LOCATION_ACCESSIBLE_STA_YMD AND LOCATION_ACCESSIBLE_END_YMD` AND `LOCATION_INFO_DELETED_YMDHMS IS NULL`
   - → `record.setStartWorkAddr(...)` / `setEndWorkAddr(...)` (복호화된 평문 주소)
6. **위치정보 제공 이력 발행** (브랜치 신규): `publishLocationHistoryLogCreateEvent`
7. `InoutRecordsSummaryResponse.of(new PageImpl<>(...))` 반환

## `publishLocationHistoryLogCreateEvent` (브랜치 신규)

위치 = `be:service/workadmin/InoutDataAdminService.java:264`

룰:
1. **응답에 실제로 주소가 채워진 row만** 이력 후보 (start/end 둘 중 하나라도 비어있지 않은 row)
2. **memberId 기준 dedup** (LinkedHashSet) — 같은 구성원 여러 row여도 1회 조회당 1건만
3. **본인 조회는 제외** — `userManager.getMemberId()` 제거 (제3자 제공 아님)
4. 후보 비면 이벤트 발행 안 함
5. Kafka 토픽: `TimeInternalTopics.TIME_LOCATION_HISTORY_LOG_CREATE`
6. 메시지 (`LocationHistoryLogCreateMessageDto`): `eventId`, `clientId`, `modUserId`, `accessMemberId`, `ownerMemberIds[]`, `gpsAcquisitionPath` (User-Agent 기반 OS), `accessUrl` (요청 URI), `regYmdhms`
7. **주소 원문은 메시지에 포함 X** — 추적용 메타데이터만 비동기 확산

이는 사용자 측 화면 **U12 위치정보 제공 조회** (`pp:src/pages/attendance/location_access_logs/`)에서 표시되는 로그의 어드민-출퇴근내역 진입점 데이터 소스로 보임 (U12 KB의 `[TBD] 백엔드 API endpoint` 항목 해소 가능).

## 적용 범위 확장 가능성

`includeLocationInfo` 토글은 어드민 화면에 최근 추가된 속성으로 보임 (이전 커밋: `payload에 위치정보 포함여부 속성 추가`). 토글 OFF가 기본값이며, 켜야만 주소 노출 + 이력 발행. 이전 deep-dive 시점(`product/admin/work/check-work-data.md`)에는 이 토글 / 로깅이 없었음 → KB 업데이트 필요.

## KB 업데이트 항목

- [ ] `product/admin/work/check-work-data.md` § 출퇴근내역 탭에 "주소 조회 토글 + 위치정보 제공 이력 로깅" 섹션 추가
- [ ] `product/user/attendance/location-access-logs.md` § U12에 "어드민 출퇴근내역 조회가 로그 트리거 케이스"임을 명시 + 기존 [TBD]의 백엔드 API/토픽 (`TIME_LOCATION_HISTORY_LOG_CREATE`) 일부 해소
- [ ] `domain/glossary.md`에 `@EncryptionType` + `EncryptionTypeHandler` 메커니즘 항목 추가 (optimiz-framework 공통)
- [ ] `code/backend-tables.md`에 `TM_IN_APPL.WORK_ADDR` / `TM_OUT_APPL.WORK_ADDR`이 암호화 저장 컬럼임을 명시 (+ `LOCATION_ACCESSIBLE_STA_YMD` / `LOCATION_ACCESSIBLE_END_YMD` / `LOCATION_INFO_DELETED_YMDHMS` 컬럼 의미)
- [ ] `domain/glossary.md`에 `TM_INOUT_REG.INPUT_CLASS` 값 체계 + 화면 분류 룰 추가 (아래 § 부록 참조)

## 부록: 출퇴근내역 화면의 "등록 방식" 컬럼 분류 룰

`be:CONST_TIME_CODE.INOUT_REG_INPUT_CLASS` 정의된 값:
- `TALENX` — TALENX 내부 입력 (enum 정의는 있으나 **실제 setInputClass에서 사용처 없음**. 사용자가 위젯에서 출퇴근 시 INPUT_CLASS는 NULL로 저장됨)
- `SECOM` — 세콤 외부 입력 (`ExternalInoutSaveService:131`, `ExternalToInternalInoutRegService:158`, `StandardExternalInoutService:159`)
- `EXTERNAL_API` — 외부 시스템 API 연동 (`TimeOpenApiInoutEventProcessor:276` 등)

`InoutDataAdminMapper.xml`의 `ALL_PAIRED_RECORDS` UNION ALL 분류 룰:
- `INPUT_CLASS IS NULL` → **`WORK_RECORD`** ("출퇴근 기록") — 일반 사용자 위젯 입력 + **재택근무 승인일 위젯 입력도 여기 잡힘** (재택은 위치 검증만 우회, 입력 경로 동일)
- `INPUT_CLASS = 'SECOM'` → **`EXTERNAL_RECORD`** ("외부시스템")
- ⚠️ **`INPUT_CLASS = 'EXTERNAL_API'`는 SQL에서 분기 없음** — IS NULL도 아니고 'SECOM'도 아니므로 두 UNION 모두에서 빠짐. 출퇴근내역 화면에서 안 보일 가능성 있음 [TBD 검증 필요]

이는 사용자 질문 "재택근무 승인일 출근 시 등록 방식이 '출퇴근 기록'으로 뜨는가?"의 답을 확정짓는 근거: **예, 출퇴근 기록으로 뜸.**

## 출처

- `be:controller/workadmin/WorkResultManagementController.java:247-265`
- `be:service/workadmin/InoutDataAdminService.java:116-306, 333-361`
- `be:resources/SQL/time/workadmin/InoutDataAdminMapper.xml:1348-1376`
- `be:dto/workadmin/WorkResultManagementDto.java:347-357`
- `optimiz-framework: com/hcg/optimiz/core/annotation/EncryptionType.java`
- `optimiz-framework: com/hcg/optimiz/framework/config/handler/EncryptionTypeHandler.java`
- 브랜치: `feat-off-workspace-address-access-log` @ 5565292
