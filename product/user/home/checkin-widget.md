---
sidebar:
  order: 1
---

# 출퇴근 위젯

> **메뉴** 통합홈 › 우측 출퇴근 카드 (출근/퇴근 버튼 · 근무 신청 · 근무 현황)  
> **원본** `product/_legacy/user-checkin-widget.md`

## 개요

사용자가 통합홈 / 내 근무 화면에서 **출근 / 퇴근 / 자리비움 / 복귀** 동작을 수행하는 핵심 위젯.
근무지(GPS) 검증, 사전 신청 검증, 야간/휴일/연장 근무 가능 여부 검증 등 다수의 비즈니스 룰이 집약된 화면.

## 진입 위치

- 통합홈 메인 화면
- 근무관리 > 내 근무 페이지
- 위젯 루트 `WorkCommuteWidget` 은 `showAvatar` / `hideTeamWorkStatus` props로 노출 위치 분기 (통합홈 = 아바타·팀원 근무 현황 표시, 기능은 동일) — `pp:src/containers/main/index.tsx` `renderHomeRightWidget("work_commute")`
- 위젯 데이터는 **10분마다 자동 새로고침** (`AUTO_REFRESH_INTERVAL_MS`, `pp:src/components/main/work_commute/WorkCommuteWidget.tsx:59`)

## QA 체크리스트

`ppfront/.claude/qa-checklist/attendance.md` **L69 ~ L154**

5개 서브 섹션:
1. 출퇴근 위젯 (기본 동작) — L69–80
2. 출퇴근 요청 모달 — L81–93
3. 00시 ~ 05시 동작 — L95–110
4. 정산기간 / 연장 근무 텍스트 색상 — L112–126
5. 야간/휴일 근무 분기 — L128–153

## 코드 위치

### 컴포넌트 (`pp:src/components/main/work_commute/`)

> **(2026-11-05 확인)** ppfront `origin/dev` 기준 대규모 리팩터링 반영: `WorkComponent.tsx`(38KB 단일 컨테이너) → `WorkCommuteWidget.tsx` + `hooks/attendance/work_commute/*` 훅 분리. `Status.tsx` → `WorkStatusSummary.tsx`, `BottomDrawer.tsx` → `ClockInOutBottomDrawer.tsx`. IP 검증(`IpInfo.tsx`, `useWorkplaceIpValidation`) 신규.

| 파일 | 역할 |
|------|------|
| `WorkCommuteWidget.tsx` ⭐ | 메인 위젯 컨테이너 (다이얼로그/드로어 전이, GPS 타임아웃 컨펌, 근무지외 라우팅). `GpsValidationProvider`로 감쌈 |
| `GpsValidationContext.tsx` | GPS 위치검증 상태 공유 Context |
| `contents/CommuteButton.tsx` | 출근/퇴근/업무 시작(복귀)/자리비움/재출근/근무 내역 변경 버튼 (workStatus 분기 + 사전 차단) |
| `contents/ClockInOutBottomDrawer.tsx` | 출근/퇴근 클릭 → 위치(GPS/IP) 확인 후 한 번 더 확인하는 바텀시트 ("시간 변경" 진입) |
| `contents/ClockInOutRequestDialog.tsx` | 출퇴근 요청 모달 (근무지 외/시간 변경 시) |
| `contents/RestDialog.tsx` | 자리비움 다이얼로그 |
| `contents/WorkStatusSummary.tsx` | 상태 문구 + 연장근무/소정근로 안내문 (구 `Status.tsx`) |
| `contents/WorkChip.tsx` | "요청중" 칩 표시 |
| `contents/TeamWorkStatus.tsx` | 팀원 근무 현황 |
| `contents/TimeTable.tsx` | 시간 표시 |
| `contents/UnapprovedClockInOutNoticeDialog.tsx` | 미승인 안내 다이얼로그 ("{출근/퇴근} 안내") |
| `contents/MapInfo.tsx` / `AdvancedMarker.tsx` | 지도 정보 / 마커 |
| `contents/IpInfo.tsx` / `WorkPlaceValidationStatusLabel.tsx` | IP 검증 결과 / 위치검증 상태 라벨 |
| `contents/LaborRefusalNotice.tsx` | 근로 거부 안내문 |
| `contents/OtherWorkSummaryInfo.tsx` | 기타근무 요약 |
| `contents/RefreshButton.tsx` | 새로고침 버튼 |
| `contents/WorkRequest.tsx` | 근무 요청 |
| `contents/googleMapsConfig.ts` | Google Maps 설정 |

훅 (`pp:src/hooks/attendance/work_commute/`): `useTodayWork`(오늘 근무정보 + 퇴근정책 조회), `useDayWorkInfo`(파생 판별값), `useClockInOutSubmit`(정책체크→근무지외 라우팅→등록), `useWorkPlaceGpsValidation`, `useWorkPlaceValidationOptions`(검증 모드), `useWorkplaceIpValidation`, `useWorkRequestDrawer`, `useRefreshWorkCommuteWidget`.

순수 함수: `pp:src/lib/attendance/outOfWorkPlaceCommute.ts`(근무지외 판정), `gpsOutOfWorkPlace.ts`, `geo.ts`(반경 계산), `workTimeRecordChangeRequest.ts`(근무내역 변경 신청서 종류 판정).

### Redux 모듈 / API 클라이언트

`pp:src/modules/attendance/work_record.ts` — 모든 API 호출 함수 정의

### 보조 라이브러리

- `pp:src/lib/attendance/personalWork.ts` — `parseDayWorkInfo`, `checkNightWork`, `convertToHm`, `formatDateAndTimeWithStdDdClass`, `formatTimeForPreviousDay`, `checkHasMaxOvertimeLimit`, `handleRequestTitle`
- `pp:src/lib/attendance/clockInOutAlerts.tsx` — `showHolidayWorkUnavailableAlertOnWork`, `showNightWorkUnavailableAlertOnWork`
- `pp:src/lib/handleAttendanceError.ts`
- `pp:src/locales/ko/attendance.json` — `PERSONAL_WORK.commuteButton.*`, `PERSONAL_WORK.status.*`, `PERSONAL_WORK.geolocation.*`

### 백엔드 API 엔드포인트 (베이스: `OPTIMIZ_TIME_API` + `pp:src/config/api.js` `ATTENDANCE.WORK_RECORD.*`)

| Method | Path | 용도 | 호출처 |
|--------|------|------|------|
| POST | `/time/record/go-to-work` ⭐ | 출근 | `goToWork(payLoad)` |
| POST | `/time/record/finish-work` ⭐ | 퇴근 | `finishWork(payLoad)` |
| POST | `/time/record/pause` | 자리비움 | `pauseWork({returnPlanTime, note})` |
| POST | `/time/record/resume` | 업무 시작(복귀) | `resumeWork()` |
| GET | `/time/record/status` | 현재 상태 | `statusWork()` |
| GET | `/time/calendars/day?currentYn=Y` (또는 `?ymd=YYYYMMDD`) | 일일 근무 정보 (`currentYn=Y`면 백엔드가 근무기준일 판정) | `getDayWorkInfo(ymd, currentYn)` |
| GET | `/time/emp/team-work-info` | 팀원 근무 정보 | `getTeamWorkInfo()` |
| GET | `/time/widget/work-record/work-plcs` | 등록된 근무지 목록 | `getWorkPlaces()` |
| GET | `/time/widget/work-record/work-plc-validation-options` | 출퇴근 허용·GPS/IP/WiFi 검증 ON/OFF (플랫폼별로 서버가 해석) | `getWorkPlaceValidationOptions()` |
| GET | `/time/widget/work-record/ip-validation` | 현재 IP 근무지 일치 여부 (`isBlock`) | `getWorkplaceIpValidation()` |
| GET | `/time/appls/in/validate-time` | 출근 시간 밸리데이션 | `getValidateInTime(...)` |
| GET | `/time/appls/out/validate-time` | 퇴근 시간 밸리데이션 | `getValidateOutTime(...)` |
| GET | `/time/policy/go-to-work` | 출근 정책 (`inoutStatus` PASS/NEED_NOTICE/BLOCK, `needNotice`) | `getClockInPolicy()` |
| GET | `/time/policy/finish-work` | 퇴근 정책 (+ `isOvertime`, `isExceededMaxWorkLimit`) | `getClockOutPolicy()` |
| GET | `/time/record/validate-finish-work-info` | 퇴근 시 초과근무 제한 확인 | `getValidateFinishWorkInfo()` |

> ~~[TBD] 정확한 base URL prefix와 path 풀 경로~~ → **(2026-11-05 해소)** `pp:src/config/api.js:713-735`, `pp:src/modules/attendance/work_record.ts`. 정책 API 백엔드 = `be:controller/widget/WorkRecordWidgetController#getGoToWorkPolicy/getFinishWorkPolicy` → `be:service/widget/WorkRecordWidgetService#evaluateInoutPolicy`

### 관련 DB 테이블

- `TM_INOUT_REG` — 출퇴근 기록 (메인)
- `TM_INOUT_REG_ADJST_DTL` — 출퇴근 보정 상세
- `TM_REST_REG` — 휴식 기록 (자리비움)
- `TM_REST_REG_ADJST_DTL` — 휴식 보정 상세
- `TM_IN_APPL` / `TM_OUT_APPL` — 출근/퇴근 신청 (요청 모달 사용 시)
- `TM_PSN_OT_PLAN_APPL` — 사전 연장/야간 신청 (검증 시 참조)
- `TM_PSN_HOLI_WORK_APPL` — 사전 휴일근무 신청 (검증 시 참조)
- `TM_WORK_REG_ADJST_APPL` — 근무 등록 보정 신청 (당일 근무 내역 변경)
- `TM_WORK_PLC`, `TM_WORK_PLC_IP`, `TM_WORK_PLC_WIFI` — 근무지 정보
- `TM_DD_WORK_PLAN`, `TM_EMP_WORK_PLAN` — 근무 계획 (`expectOutHm` 등)
- `TM_DD_ATTEND_AGGR` — 일일 근태 집계 (workMinutes 등)

## 상태 머신: WorkStatus

**타입 정의**: `pp:src/@types/customTypes/attendance/unionType.d.ts:271`

```ts
/**
 * 근무 상태
 * - ON : 출근중
 * - OFF : 출근전
 * - FINISH : 퇴근완료
 * - PAUSE : 자리비움
 * - RESUME : 자리비움 복귀
 */
type WorkStatus = "ON" | "OFF" | "FINISH" | "PAUSE" | "RESUME";
```

| 상태 | 의미 | 노출 버튼 |
|------|------|------|
| `OFF` | 출근 전 | **출근** 버튼 |
| `ON` | 출근 중 (근무 중) | **자리비움** + **퇴근** 버튼 |
| `PAUSE` | 자리비움 중 | **업무 시작** 버튼 (복귀, 화면 라벨 "업무 시작") |
| `RESUME` | 자리비움 복귀 (`resumeWork()` 호출 시 목표 상태값으로만 사용. CommuteButton에 RESUME case 없음 → 서버 응답 후 재조회되면 `ON`으로 표시 (추정)) | — |
| `FINISH` | 퇴근 완료 | **재출근** 버튼 |

### 우선순위 분기 (workStatus보다 우선 처리)

`isWorkTimeRecordChangeInProgress || isWorkHistoryChangeRequired || hasModifiedWorkRecord` 시 (`pp:src/components/main/work_commute/contents/CommuteButton.tsx:113-141`):
- 모든 출/퇴근 버튼 대신 **"근무 내역 변경"** 버튼 노출
- `isWorkTimeRecordChangeInProgress` = 진행 중인 **통합 근무내역 변경**(`workRegAdjstAppl`) 또는 **출퇴근 내역 변경**(`inoutRecordChangeAppl`) 신청 존재 → **disabled**. 상태 문구 "근무 내역 변경 요청중 입니다.", TimeTable 숨김
- `isWorkHistoryChangeRequired` = `!inHm && outHm` (퇴근 기록만 있고 출근 기록 없음) → 상태 문구 "근무 내역 변경이 필요합니다"
- `hasModifiedWorkRecord` = **그날 승인 완료(최종)된 근무내역 변경/출퇴근 내역 변경 신청이 있음**. ⚠️ 이름과 달리 "어드민 직접 수정"이 아님 — 백엔드 `be:timeold/service/calendar/CalendarService#hasModifiedWorkRecord` 는 `TimeCommon.work-reg-adjst-appl-all`(= `TM_WORK_REG_ADJST_APPL` ∪ `TM_INOUT_REG_ADJST_APPL`)에서 `APPL_STAT_CD = COMPLETE AND LAST_YN = Y` 존재 여부만 봄 (`be:SQL/timeold/calendar/CalendarMapper.xml:73`)
- 클릭 시 열리는 신청서: 근무 그룹이 사용하는 것 중 **출퇴근 내역 변경 우선**, 없으면 통합 근무내역 변경 (`getDefaultWorkTimeRecordChangeType`, `pp:src/lib/attendance/workTimeRecordChangeRequest.ts:68`, `pp:src/components/main/work_commute/WorkCommuteWidget.tsx:117-123, 328-336` — **(2026-11-05 ppfront origin/dev 재확인)**) → [출퇴근 내역 변경](../applications/inout-record-change.md) / [통합 근무내역 변경](../applications/reg-adjust.md)
- 근무 그룹이 두 신청서를 모두 미사용이면 버튼 **disabled** + 툴팁 "통합 근무내역 변경과 출퇴근 내역 변경 신청서를 모두 사용할 수 없습니다. 어드민에 문의해 주세요." (원문은 두 문장 사이 줄바꿈, `pp:src/locales/ko/attendance.json:156` `PERSONAL_WORK.commuteButton.workTimeRecordChangeUnavailable`. 툴팁은 사용 불가일 때만 hover 표시 — `CommuteButton.tsx` `disableHoverListener={workTimeRecordChangeAvailable}`, 2026-11-05 확인)

**어드민이 직접 수정한 날(`TM_WORK_REG_ADMIN_ADJST`)은 위젯이 별도로 판단하지 않음** (2026-11-05 코드 확인). 이 경우 차단은 신청서 쪽에서 일어남: 신청서가 기준일을 조회할 때 `hasAdminModifiedWork = true` → "해당 일자의 근무내역은 어드민이 수정 및 확정하였습니다." 로 신청 불가 (`be:service/appls/WorkRecordChangeApplsService#getValidDate`, `InoutRecordChangeApplsService#getValidDate`, `pp:src/components/workflow/shared/template_drawer/contents/InoutRecordChange.tsx:442`, 문구 `pp:src/locales/ko/workflow.json:485`). → `my-work.md`의 "어드민 수정 → 변경 신청 시도 시 차단"과 모순 아님.

### 근무지 검증 옵션에 따른 버튼 미노출

`validWorkCd`가 `PLAN`/`EXTERNAL` 이거나, 검증 옵션 `inoutRegAllowed === false`(현재 채널—모바일앱/PC—에서 출퇴근 등록 불가, `NOT_ALLOWED`)이면 CommuteButton 자체 미노출 (`WorkCommuteWidget.tsx:328`).

## 핵심 검증 로직

### 1. 사전 차단 (버튼 클릭 시점, 모달 열기 전)

`CommuteButton.tsx`의 `OFF` / `FINISH` 케이스에서:

```ts
// 휴일근무 불가 그룹 + 휴일이면 출근 차단
isHolidayWorkUnavailableOnWork(holiWorkPmitCd, holidayYn, "ON")
  → 차단 시 showHolidayWorkUnavailableAlertOnWork()

// 야간 불가 그룹 + 22시~06시면 출근 차단
isNightWorkUnavailableOnWork(nightPmitCd, "ON")
  → 차단 시 showNightWorkUnavailableAlertOnWork()
```

> ~~정의 위치 [TBD]~~ → **(2026-11-05 해소)** `pp:src/hooks/attendance/work_commute/useDayWorkInfo.ts:25-33`. 휴일 = `holiWorkPmitCd === "N" && holidayYn === "Y"`, 야간 = `nightPmitCd === "N" && checkNightWork()`(호출 시점 22~06시). 안내 다이얼로그 제목 "출근 불가" + "휴일 근무 불가로 출근이 불가합니다." / "야간 근무 불가로 해당 시간에는 출근이 불가합니다." + "신청 가능 시간 : 06:00 ~ 22:00". 서버에서 시점차로 잡히는 경우(`NIGHT_WORK_REJECTED`/`HOLIDAY_WORK_REJECTED`)도 같은 안내 (`useClockInOutSubmit.ts`)

### 2. 근무그룹 권한 코드 체계

| 코드 필드 | 값 | 의미 |
|------|------|------|
| `holiWorkPmitCd` | `P` | 휴일 근무 가능 (자유) |
| | `A` | 휴일 근무 승인 시 가능 |
| | `N` | 휴일 근무 불가 |
| `otPmitCd` | `P` / `A` / `N` | 연장 근무 (동일 의미) |
| `nightPmitCd` | `P` / `A` / `N` | 야간 근무 (동일 의미) |
| `validWorkCd` | `RECD` | 출퇴근 기록 (일반/기본값, 위젯에서 출/퇴근 버튼 노출) |
| | `PLAN` | 근무 계획 시간 사용 (출/퇴근 버튼 미노출, "근무 중" 텍스트만 표시) |
| | `EXTERNAL` | 외부 시스템 연동 — **현재는 세콤 연동만 해당** (향후 추가 가능성 있음). 위젯에서 출/퇴근 버튼 미노출 (`WorkComponent.tsx:865` `!isPlanWorkGroup && !isExternalLinkGroup`). 단 Status / TimeTable / WorkRequest 영역은 일반 그룹과 동일 동작 (외부 시스템이 채워주는 workInfo 기준) |
| `workTimeVisibleCd` | `DENIED` | 근무시간 화면 표시 안 함. **특정 고객사 요청으로 추가된 기능** (사유: 자사 구성원에게 근무시간 노출 원치 않음) |

### 3. 근무지(GPS / IP) 검증

**검증 모드** (`pp:src/hooks/attendance/work_commute/useWorkPlaceValidationOptions.ts`) — 백엔드가 플랫폼(모바일앱/PC)별 설정을 해석해 boolean으로 내려줌:

| 모드 | 조건 | 근무지외 판정 |
|------|------|------|
| `NONE` | 검증 없음 | 항상 근무지내 |
| `GPS_ONLY` | `checkGps` | GPS 반경 이탈 |
| `IP_ONLY` | `checkIp` | IP 불일치(`isBlock`) |
| `GPS_OR_IP` | 둘 다 | GPS 이탈 **AND** IP 불일치일 때만 (하나라도 통과면 근무지내) |
| `NOT_ALLOWED` | `inoutRegAllowed === false` | 출퇴근 버튼 미노출 |

**예외**: 재택근무 확정일(`workForHomeYn === "Y"`), 자리비움 복귀(PAUSE)는 위치검증 대상 아님 (`pp:src/lib/attendance/outOfWorkPlaceCommute.ts`).

`getLocationStatus({position, error})` 결과 `gpsConfCd` (`useWorkPlaceGpsValidation.ts:48`):

| 코드 | 의미 |
|------|------|
| `C` | CONFIRM — 등록 근무지 반경 내 |
| `O` | OUT OF LOCATION — 근무지 외 |
| `U` | UNKNOWN — 위치 정보 확인 불가 (geolocation error code 2 POSITION_UNAVAILABLE 등) |
| `D` | DECLINED — 위치 권한 거부 (geolocation error code 1) |

- 거리 계산: **하버사인(Haversine) 공식**, 지구 반지름 6,371,000m (`pp:src/lib/attendance/geo.ts` `findWorkPlaceInRadius`)
- 등록 근무지의 `gpsPmitScop` (반경, 미터) 내인지 체크
- 검증 옵션은 react-query 캐시 공유 (구 `workPalceValidationOptionsRef` 오타 ref는 리팩터링으로 제거됨)
- React Native WebView 환경(`window.isRNWebview`)에서는 `postMessage({event:"getCurrentPosition"})`로 앱에 위치 요청

**위치 확인 불가(U) / 권한 거부(D) 처리** ~~(추정: 근무지 외와 동일)~~ → **(2026-11-05 코드 확인)**:
- GPS 검증 사용(`checkGps`) 중이면 U/D 모두 **근무지외로 판정** (`isGpsOutOfWorkPlace`: O/U/D → true; `isOutOfWorkPlaceCommute`: 좌표가 없으면 `checkGps` 값으로 판정) → 직접 등록 대신 **"위치 확인 필요" 컨펌** ("출근 가능 지역이 아닙니다. 현재 위치에서 출근 요청 하시겠습니까?" / 퇴근 동일) → 확인 시 **출/퇴근 요청 모달**
- GPS 검증 OFF면 U/D여도 그대로 출퇴근 (근무지내 취급)
- `GPS_OR_IP` 모드에선 IP가 일치하면 U/D여도 근무지내
- **GPS 타임아웃(웹, 10초)** 은 별도: "위치 정보 가져오기 실패" 컨펌 — "위치 확인 시간이 초과되었습니다. 'GPS 새로고침' 버튼을 눌러주세요." + "문제가 해결되지 않는다면 '출근 요청'을 통해 출근할 수 있습니다."(퇴근 동일). 버튼: [GPS 새로고침] 재시도 / [출근 요청]·[퇴근 요청] 요청 모달로 이동 / 닫기 → U 상태(근무지외)로 확정. 요청 모달이 이미 열린 상태면 컨펌 없이 U로 처리 (`WorkCommuteWidget.tsx:137-210`)
- 서버가 근무지 제한으로 차단한 경우(`OUT_OF_WORK_PLACE_BY_SERVER`)도 같은 "위치 확인 필요" 컨펌 → 요청 모달
- 위치 거부(D)로 생성된 요청은 주소가 없어 위치정보 제공 조회 로그가 남지 않음 (`location-access-logs.md`)

### 4. 시간 변경 밸리데이션 (요청 모달 내)

`getValidateInTime` / `getValidateOutTime` API 호출 + 다음 클라이언트 체크:

| 케이스 | 메시지 |
|------|------|
| 현재 시간 이후로 출근 변경 | "현재 시간 이후로 출근할 수 없습니다. 출근시간을 확인해주십시오." |
| 재출근 시 이전 퇴근 기록 전 출근 | "XX:XX에 퇴근 기록이 있습니다. 재출근 시간을 확인해주십시오." |
| 현재 시간 이후로 퇴근 변경 | "현재 시간 이후로 퇴근할 수 없습니다. 퇴근시간을 확인해주십시오." |
| 출근 시간 이전으로 퇴근 | "XX:XX에 출근 기록이 있습니다. 퇴근시간을 확인해주십시오." |
| 출근 인정 시각 이전 출근 | 별도 밸리데이션 |
| 초과근무 시간 제한 잔여 초과 | 밸리데이션 |
| 연장/야간/휴일 = 승인시에만 + 미승인 시간 출퇴근 | 밸리데이션 |

### 5. 연장근무 안내문 / 색상

**(2026-11-05 코드 확인 — 이전 KB의 "자유 허용 → 안내문 미표시"는 오류, business-rules의 "주황색"이 맞음)** `pp:src/components/main/work_commute/contents/WorkStatusSummary.tsx:109-256`

출근중(`ON`)일 때 퇴근정책 API(`/time/policy/finish-work`) 응답으로 판단:

| `otPmitCd` | 조건 | 안내문 "예상 퇴근 시간이 지났습니다." | 상태 문구 강조색 |
|------|------|------|------|
| `P` 자유 허용 | `isOvertime` (현재 연장시간대) | **주황색** (#FF8A00, `showOvertimeWarningNotice`) | 기본(파랑) |
| `A` 승인시 허용 | `needNotice` (연장시간대 + 미승인 등) | **빨간색** (#EF3F55, `showOvertimeLimitNotice`) | **빨간색** |
| `N` 불가 | — | **미표시** (위젯 안내문 없음). 퇴근 클릭 시 정책 API가 NEED_NOTICE → 미승인 안내 다이얼로그 | 기본 |

- 공통 제외: `workOverAggrCd === "NP"`(근무계획시간 외 모든 시간 = 연장) 그룹은 **계획 출근시각 이전**에는 미표시 (`canCountAsOvertime`)
- 공통 제외: `workOverAggrCd === "S"`(정산기간 합계 기준) 그룹 또는 최대 근무시간 초과(`isExceededMaxWorkLimit`) 시에는 위 안내 대신 6번 문구
- `validWorkCd === "PLAN"` 그룹은 퇴근정책 미조회 → 안내 없음

### 6. 정산기간 vs 일별 연장근무 분기

QA 체크리스트 L112–115:
- "정산기간의 근무시간 합계가 기본 근무시간을 넘어가면 연장근무로 기록"(`workOverAggrCd === "S"`) 설정 그룹:
  - 예상 퇴근시간 초과해도 안내문 **미노출**
  - 잔여 소정근로시간 0(`settleCurrentRemainBaseWorkMinutes === 0`)이면 주황색 "소정근무시간을 초과했습니다." (화면 실제 문구, `PERSONAL_WORK.status.baseWorkTimeFullyMet`)
- 최대 근무시간 초과(`isExceededMaxWorkLimit`, 퇴근정책 응답)도 같은 주황색 문구 (그룹 설정 무관)

### 7. 미승인 안내 다이얼로그 (`UnapprovedClockInOutNoticeDialog`)

출근/퇴근 확정 직전(바텀시트에서 제출 시) 정책 API(`/time/policy/go-to-work` / `finish-work`)의 `needNotice === true`면 등록 대신 이 다이얼로그를 띄움 (`useClockInOutSubmit.ts`).

`needNotice` 조건 (`be:WorkRecordWidgetService#evaluateInoutPolicy`, 우선순위 BLOCK > NEED_NOTICE > PASS):
- 휴일 + 휴일근무 **승인시** + 승인된 휴일근무 신청 없음
- 연장시간대 + 연장근무 **승인시** + 연장 승인 없음
- 야간시간대(22~06) + 야간근무 **승인시** + 승인 없음
- 초과근무 시간 한도 초과
- 최대 근무시간 제한 초과 (퇴근 시 `isExceededMaxWorkLimit`도 true)
- **퇴근** 시 휴일/연장/야간 **불가** 정책 위반 (출근 시엔 BLOCK — 퇴근은 기록 보존을 위해 안내로 완화)

화면 문구 (`pp:src/locales/ko/attendance.json` `MAIN.unapprovedClockInOutNotice`, {action} = 출근/퇴근):
- 제목: "{action} 안내"
- "허용 시간을 벗어난 {action}입니다."
- "지금 기록하는 {action}은 **회사 정책 또는 관련 문서의 신청 및 승인여부**(빨간색)에 따라 일부가 근무시간으로 인정되지 않을 수 있습니다."
- "관련 문서가 미승인 상태인 경우 최종 승인 시점에 근무시간이 인정되며, 필요 시 통합 근무내역 변경 신청을 통해 근무시간을 조정할 수 있습니다."
- 버튼: [출근]/[퇴근] → 정책 체크 없이 강제 등록(`isForcedClockInOut`). 닫기(X) → 취소
- 강제 등록 후에도 근무지외 판정이면 요청 모달 흐름으로 넘어감

## 자정 이후 특수 동작 (전날 근무 잔존)

QA 체크리스트 L95–110은 **"00시 ~ 05시"로 적혀있으나 이는 OUTDATED**.
현재 cutoff는 **근무계획 시작시각 기준으로 동적**으로 결정됩니다.

### 현행 cutoff 규칙 (백엔드 기준)

**출처**: `be:com/hcg/optimiz/time/common/util/validworkday/ValidWorkDayResolver`

```java
public static final int STANDARD_HOUR_BY_VALID_WORK_DATE = 6;  // 시스템 기본 6시
public static final int DIFF_TIME_AVAILABLE_TO_WORK = 3;       // 계획출근시각 -3시간
```

| 케이스 | cutoff 시각 |
|------|------|
| 고정 출근시간이 있는 근무일 (`isFixedStartWorkDay`) | **계획 출근시각 - 3시간** (예: 9시 출근이면 06:00부터 그날로 인정) |
| 자율 근무 / 휴일 / 계획 없음 | **시스템 기본 06:00** |
| 전날이 고정근무일 + 당일이 휴일 | 전날 출근가능시간으로부터 24시간 동안 출근 가능 (예외) |

야간 근무조 익일 퇴근 판단 시: 전/당/익일 근무계획을 모두 봐야 정확. 예: 21시-6시 고정근무 그룹의 익일 퇴근 시점 유효계획은 **전날**.

### 프론트엔드 측 매칭

~~프론트 `checkNextDayAndBeforeAggrTime`가 `workGrpVo.ddAggrTime`(정적 값)을 사용 → 백엔드 동적 계산과 불일치 가능 [TBD]~~ → **(2026-11-05 해소)** 프론트의 정적 판정 로직은 **제거됨** (ppfront `origin/dev`에 `checkNextDayAndBeforeAggrTime`·`ddAggrTime` 참조 0건. 마지막 변경 `hcgtheplus/ppfront#11005`, 2026-05-18).

현재 위젯은 `GET /time/calendars/day?currentYn=Y`로 조회하며, 백엔드가 `EmpDailyWorkService#getValidWorkYmd` → `ValidWorkDayResolver`로 근무기준일을 **동적 판정**해 그날의 `empDailyWork`(`ymd` 포함)를 내려줌 (`be:timeold/service/calendar/CalendarService` `currentYn=Y` 분기, `pp:src/hooks/attendance/work_commute/useTodayWork.ts:92`). 출퇴근 정책 API(`checkInoutPolicy`)도 같은 `getValidWorkYmd` 사용. → **프론트/백엔드 cutoff 판정 단일화**.

화면 쪽은 응답 `ymd`가 오늘보다 이전이고 상태가 ON/FINISH면 "출근일: {M월D일(요일)}" info 문구 표시 (`WorkStatusSummary.tsx:161-266`), OFF면 날짜 표기를 `ymd` 기준으로.

### UI 표시 (QA 체크리스트 L95–110)

| 전날 상태 | cutoff 이전 | cutoff 경과 후 |
|------|------|------|
| 출근O 퇴근X | "{현재날짜} OO시간 OO분째 근무 중 (출근일: {어제날짜})" + 퇴근 버튼 | 전날 = 퇴근 누락 / 현재 = 최초 출근 상태로 전환 |
| 출근O 퇴근O | "{현재날짜} OO시간 OO분 근무했습니다 (출근일: {어제날짜})" + 재출근 버튼 | (해당 없음 — 정상 종료된 상태) |
| 출근X 퇴근X | "{어제날짜} 출근전 입니다" + 출근 버튼 | — |

팀원 근무 현황도 동일 기준 (어제 출근 후 미퇴근 팀원은 "근무중" 표시).

> **검수 포인트**: QA 체크리스트 L102의 "05시가 지났을 때" 표현은 현재 로직과 불일치. 체크리스트 갱신이 필요할 수 있음.

## 자리비움 다이얼로그 (`RestDialog`)

(2026-11-05 코드 확인, `pp:src/components/main/work_commute/contents/RestDialog.tsx`)

| 항목 | 필수 | 형식/기본값 | 검증 문구 |
|------|------|------|------|
| 업무 복귀 예정시간 | 필수 | 시각(TimePicker), 기본 = 현재+1시간 | 현재 이후여야 함: "종료시간이 시작시간 전입니다." / 미입력: "업무 복귀 예정시간을 입력합니다." |
| 코멘트 | **필수** | 텍스트 (최대 3줄 표시), placeholder "코멘트 입력" | 미입력: "코멘트를 입력합니다." |

- 상단에 현재 날짜·시각(초 단위) 실시간 표시
- [자리비움 시작] → 컨펌 "{시각}까지 자리를 비우시겠습니까?" → 성공 스낵바 "{시각}까지 자리를 비웁니다." / 실패 "자리비움 요청 실패"
- 코멘트 미입력 또는 시각 오류면 [자리비움 시작] 비활성
- 복귀 버튼 라벨은 "업무 시작"

## 알림 연계

다음 이벤트는 **talenx 알림** 발송:
- 출근 요청 / 퇴근 요청 → 승인자에게
- 승인 / 반려 → 작성자에게
- 신청문서 코멘트 → 작성자 + 승인자 (코멘트 작성자 제외)
- 자리비움 종료시간 도달 → 본인 ("자리비움 복귀 필요")

알림 OFF 위치: **프로필 - 계정설정 - 알림설정**
- "출퇴근 안내 - 자리비움 복귀 필요"
- "근무 내역/계획 변경 - 출근 승인 요청, 퇴근 승인 요청"

## 외부 의존성

- **Google Maps**: `@react-google-maps/api` — `MapInfo.tsx`, `googleMapsConfig.ts`
- **Geolocation API**: 브라우저 표준 (`navigator.geolocation.getCurrentPosition`)
- **React Native WebView**: 모바일 앱 내장 시 `window.ReactNativeWebView.postMessage`로 위치 요청

## 알려진 제약 / 임시 동작

- ~~ref 변수명 오타 `workPalceValidationOptionsRef`~~ → 리팩터링으로 제거 (2026-11-05 확인)
- 자정~05시 동작은 QA에 "확인 필요" 표시되어 있음 (L95: "관련 스레드"). 현행 cutoff는 백엔드 단일 판정 (위 § 자정 이후)
- 출근 정책 API가 `BLOCK`(출근 시 휴일/연장/야간 **불가** 정책 위반)을 반환해도 프론트는 `needNotice`만 확인함 → 휴일·야간 불가는 프론트 사전 차단 + 서버 등록 거절로 막히고, **연장근무 불가(`otPmitCd=N`) + 연장시간대 출근**에 대한 프론트 안내는 없음 (서버 등록 응답에 의존) (`useClockInOutSubmit.ts` `checkClockInOutPolicy`). **(2026-11-05 Slack 확인)** 서버 차단은 설계 의도, 프론트 안내 미구현은 알려진 TODO — 아래 § 검증 참고
- `validWorkCd === "PLAN"` (근무 계획 시간 사용) 그룹은 출/퇴근 버튼 자체가 미노출 → 이때 "측정된 시간" 대신 "근무 중" 텍스트 표시 (QA L76)

## 관련 기능 / 화면

- **근무내역 변경 신청** (이 위젯 [근무 내역 변경]에서 진입) → `KB:product/user/applications/reg-adjust.md`
- **(2026-11-05)** **출퇴근 내역 변경 신청** (두 신청서 모두 사용 시 [근무 내역 변경]의 기본값) → `KB:product/user/applications/inout-record-change.md`
- **사전 연장/야간 신청서** (검증 시 참조) → `KB:product/user/applications/overtime.md`
- **사전 휴일근무 신청서** (검증 시 참조) → `KB:product/user/applications/holiday-work.md`
- **근무 요약 정보 위젯** (통합홈 우측 하단 "근무 현황 상세") → `KB:product/user/home/work-summary.md`
- **워크플로우 시스템** (요청서 승인 흐름)

## 검증 / [TBD]

이 문서는 코드 + QA 체크리스트 + 두현님 확인 기준으로 작성. 다음 항목은 추가 확인 필요:

- [ ] `parseDayWorkInfo`의 변환 로직 (백엔드 응답 → 프론트 state) — `pp:src/lib/attendance/personalWork.ts` (기획 영향 없음, 2026-11-05 Slack 검색 생략)
- [x] ~~QA 체크리스트 `ppfront/.../attendance.md` L102의 "05시" 표현이 현재 로직과 불일치~~ → **(2026-11-05 Slack 확인)** 현행 판정 규칙은 "고정 출근 근무일은 계획 출근시각 −3시간부터 그날, 근무일 종료 = 다음날 계획 시작시각 −3시간"(기본 06시) — Slack #cx 2026-10-08 "판정 규칙" (https://hcgtheplus.slack.com/archives/C01AVJ2CJBW/p1791433888967679?thread_ts=1789952197.507599&cid=C01AVJ2CJBW), #sq-time 2026-10-15 재인용. "05시"는 2023-12 체크리스트(#sq-time 2023-12-06 "00시~05시 확인 필요") 잔재 → **체크리스트 문구 갱신만 남음** (기획 결정 사항 아님)
- [x] ~~연장근무 **불가** 그룹이 연장시간대에 출근할 때(정책 API = BLOCK) 실제 화면 처리~~ → **(2026-11-05 Slack 확인) 설계 의도 = 서버 차단, 프론트 안내는 구현 누락.** ① 정책 설계상 `BLOCK`은 "실제 출퇴근 이벤트 때 차단", `NOTI`만 사전 검증 API로 반환 — Slack #sq-time 2026-02-12 (https://hcgtheplus.slack.com/archives/C04QC2RJJBU/p1770871842345429?thread_ts=1770256043.928359&cid=C04QC2RJJBU), 2026-02-25 같은 스레드 "BLOCK은 노티스가 뜨면 안 되고 출퇴근 API 에러 처리로 보여져야". ② 서버 `goToWork`는 `OVERTIME_NOT_ALLOWED`로 FAIL 반환하지만 프론트 `classifyClockInOutResponse`는 이 사유를 분기하지 않아 `OTHER_FAIL` → **안내 없이 드로어만 닫히고 상태 그대로**(성공 스낵바도 없음). Slack #sq-time 2026-01-26 "OVERTIME_NOT_ALLOWED → 프론트는 연장 불가 아직 제어 전이라 다음에 출근 불가하게 작업 필요" (https://hcgtheplus.slack.com/archives/C04QC2RJJBU/p1769404725280029?thread_ts=1769045807.733759&cid=C04QC2RJJBU), `pp:@types/customTypes/attendance/unionType.d.ts:388` "TODO 연장 불가 개발시". ③ 영향 범위: 어드민 '연장 불가' 옵션은 현재 모든 근무그룹에서 **선택 비활성**(개발 전) — Slack #channeltalk 2026-10-08 (https://hcgtheplus.slack.com/archives/C06ULEEM88M/p1791437987351259?thread_ts=1791433855.695899&cid=C06ULEEM88M). 과거에 '불가'로 저장된 기존 그룹만 해당. 2026-03-10 핫픽스로 "연장 불가 그룹의 고정 출근시간 전 출근 불가" 이슈는 수정됨 (#notice-talenx 2026-03-10)
  - ⚠️ 부수 발견(코드): 서버 휴일 불가 사유는 `HOLIDAY_NOT_ALLOWED`인데 프론트 분기는 `HOLIDAY_WORK_NOT_ALLOWED`를 비교 → 서버에서 잡힌 휴일 불가도 `OTHER_FAIL`로 떨어짐(프론트 사전 차단이 대부분 막으므로 시점차 케이스에서만 발생) — `pp:src/lib/attendance/clockInOutResult.ts:30`, `be:dto/widget/WorkRecordWidgetResponseDto.java GoToWorkFailReason`

## 확인 완료 (해소된 [TBD])

- ✅ **(2026-11-05)** `isHolidayWorkUnavailableOnWork` / `isNightWorkUnavailableOnWork` 위치 — `useDayWorkInfo.ts:25-33`
- ✅ **(2026-11-05)** 정책 API 응답 구조 — `InoutPolicyResultDto { inoutStatus: PASS|NEED_NOTICE|BLOCK, isBlock, needNotice, isOvertime, isExceededMaxWorkLimit }`
- ✅ **(2026-11-05)** 자정 cutoff 프론트/백엔드 일치 — 프론트 정적 로직 제거, 백엔드 `currentYn=Y` 단일 판정
- ✅ **(2026-11-05)** 연장근무 자유 허용 시 안내 — 주황색 "예상 퇴근 시간이 지났습니다." (KB 이전 서술 "미표시"는 오류)
- ✅ **(2026-11-05)** 위치 확인 불가/권한 거부 — GPS 검증 ON이면 근무지외로 판정 → 요청 모달
- ✅ **(2026-11-05)** "근무 내역 변경" 버튼의 `hasModifiedWorkRecord` = 승인 완료된 근무내역/출퇴근 내역 변경 신청 존재 (어드민 수정 아님)
- ✅ **(2026-11-05)** 자리비움 입력 항목 · 미승인 안내 다이얼로그 문구

- ✅ `WorkStatus` 타입 — `pp:src/@types/customTypes/attendance/unionType.d.ts:271` 에 정의됨 (주석 포함)
- ✅ `validWorkCd === "EXTERNAL"` — 현재는 **세콤 연동**만 해당 (향후 추가될 가능성 있음). 위젯에서는 `isExternalLinkGroup`로 분기, **`CommuteButton` 미노출이 유일한 차이**. 그 외(Status/TimeTable/WorkRequest)는 일반 그룹과 동일. `WorkComponent.tsx:239-240` `WorkComponent.tsx:865`
- ✅ `validWorkCd` 전체 enum — `"RECD" | "PLAN" | "EXTERNAL"` (`pp:src/@types/customTypes/attendance/unionType.d.ts:99-105`). RECD = 출퇴근 기록(기본), PLAN = 근무 계획, EXTERNAL = 외부 시스템 연동
- ✅ `workTimeVisibleCd === "DENIED"` — 특정 고객사 요청으로 추가된 기능 (사유: 자사 구성원에게 근무시간 비공개 요청)
- ✅ `applsInProgress`의 12종 신청서 상호작용 — 케이스가 광범위하므로 구체적 케이스 발생 시 그때 분석
