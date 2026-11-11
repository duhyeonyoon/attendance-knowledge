# 휴가 지급 및 관리 — 로컬 테스트 데이터 생성 레시피 (2026-07-07)

로컬 DB에 #14 화면용 테스트 데이터를 백엔드 API로 생성한 기록. 직접 SQL INSERT 대신 API를 쓰면 TM_LEAVE_CRT / TM_LEAVE_PAY_HISTORY / TM_LEAVE_USE(_HISTORY) 정합성과 집계 이벤트가 자동 보장됨.

## 로컬 환경

- 어드민 프론트: `localhost:8001`, TIME 백엔드: `localhost:8097`
- 인증: 쿠키 (`withCredentials`) + 모든 요청에 `clientId` 쿼리 파라미터 (axiauth가 자동 부착)
- 테스트 클라이언트: 퍼플앤컴퍼니 (clientId `75D5C2F805E311EFB11C0A31B96280A2`), 구성원 18명 (PERPL*)
- memberId는 2^53 초과 Long — JS에서 반드시 **문자열로** 주고받을 것 (Jackson이 String→Long 파싱 OK)

## 생성 순서 (의존성 있음)

1. **연차 자동생성**: `PUT /time/leave-management/anl-leaves/init` `{year:'2026', targetMemberIds:[...]}`
   - 연차 사용 수동등록의 선행 조건 (잔여 없으면 등록 실패 또는 초과사용 처리 필요)
2. **연차 외 지급**: `POST /time/leave-management/non-anl-leave-payments` (제도별 반복) → 연차 외 보유현황
3. **연차 사용 수동등록**: `POST /time/leave-management/annual-leave-usage/manual` `{leaveClass:'ANL', memberIds, startYmd, endYmd, reason, detailItems, allowPartial, allowExceededAnnualLeave}` → 연차 사용 현황
4. **연차 외 사용 수동등록**: `POST /time/leave-management/non-annual-leave-usage/manual` `{leaveSystemId, ...동일}` → 연차 외 사용 현황

detailItems 포맷: `{useYmd:'YYYYMMDD', startHm:'HHmm', startStdDdClass:'BSD', endHm, endStdDdClass:'BSD', useMinutes(30분 단위)}`

## 새로 확인된 사실

- **`non-anl-leave-payments`는 `crtYy` 필수** — 백엔드가 `isYy()` 검증 후 아니면 IllegalArgumentException(500). 그런데 `ad:src/config/api/attendance/leaveManagement.ts#editNonAnlPayments`의 파라미터 타입에는 crtYy가 없음 → 프론트-백엔드 타입 불일치 의심 (실제 다이얼로그에서 별도로 넣는지 확인 필요 [TBD])
- **`anl-leaves/init`는 all-or-nothing**: 대상자 중 1명이라도 휴가그룹 미소속(연차 정산 기준 없음)이면 400 `"연차 정산 기준을 찾을 수 없습니다. memberIds=[...]"` 로 전체 실패 → 미소속자 제외 후 재요청
- 수동등록 계열은 `allowPartial:true`면 실패 건(휴일, 중복 등) 자동 스킵되고 200 반환 — 배치 건수와 실제 등록 건수가 다를 수 있음 (53건 요청 → 49건 등록 사례)
- leaveUseStd별 지급 가능 여부: AP(신청부여)/P(주기)/C(수동부여) 8개 제도 전부 수동 지급 API 허용됨 (P형 보건휴가 포함)

## 생성 결과 (퍼플앤컴퍼니, 귀속연도 2026)

- 연차 보유현황: 15명 연차 생성 (3명은 휴가그룹 미소속이라 제외: 강슬기/김예림 외 1)
- 연차 외 휴가 보유현황: 135건 (8개 제도 × 15명, 보상휴가는 2회 지급)
- 연차 사용 현황: 49건, 연차 외 휴가 사용 현황: 44건
