# 출퇴근 위젯 (사용자)

## 개요

사용자가 통합홈 / 내 근무 화면에서 **출근 / 퇴근 / 자리비움 / 복귀** 동작을 수행하는 핵심 위젯.
근무지(GPS) 검증, 사전 신청 검증, 야간/휴일/연장 근무 가능 여부 검증 등 다수의 비즈니스 룰이 집약된 화면.

## 진입 위치

- 통합홈 메인 화면
- 근무관리 > 내 근무 페이지
- 컴포넌트는 `type: "personal" | "index"` props로 노출 위치 분기 (기능은 동일)

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

| 파일 | 역할 |
|------|------|
| `WorkComponent.tsx` ⭐ | 메인 위젯 컨테이너 (38KB, 상태 머신·API 호출 모두 여기) |
| `contents/CommuteButton.tsx` | 출근/퇴근/복귀/자리비움 버튼 (workStatus 분기) |
| `contents/BottomDrawer.tsx` | 출근 클릭 → 한 번 더 확인하는 바텀시트 |
| `contents/ClockInOutRequestDialog.tsx` | 출퇴근 요청 모달 (근무지 외/시간 변경 시) |
| `contents/RestDialog.tsx` | 자리비움 다이얼로그 |
| `contents/Status.tsx` | 상태 텍스트 ("근무중", "근무 OO시간", 안내문 등) |
| `contents/WorkChip.tsx` | "요청중" 칩 표시 |
| `contents/TeamWorkStatus.tsx` | 팀원 근무 현황 |
| `contents/TimeTable.tsx` | 시간 표시 |
| `contents/UnapprovedClockInOutNoticeDialog.tsx` | 미승인 안내 다이얼로그 |
| `contents/MapInfo.tsx` | 지도 정보 |
| `contents/AdvancedMarker.tsx` | 지도 마커 |
| `contents/LaborRefusalNotice.tsx` | 근로 거부 안내문 |
| `contents/OtherWorkSummaryInfo.tsx` | 기타근무 요약 |
| `contents/RefreshButton.tsx` | 새로고침 버튼 |
| `contents/WorkRequest.tsx` | 근무 요청 |
| `contents/googleMapsConfig.ts` | Google Maps 설정 |

### Redux 모듈 / API 클라이언트

`pp:src/modules/attendance/work_record.ts` — 모든 API 호출 함수 정의

### 보조 라이브러리

- `pp:src/lib/attendance/personalWork.ts` — `parseDayWorkInfo`, `checkNightWork`, `convertToHm`, `formatDateAndTimeWithStdDdClass`, `formatTimeForPreviousDay`, `checkHasMaxOvertimeLimit`, `handleRequestTitle`
- `pp:src/lib/handleAttendanceError.ts`
- `pp:src/locales/ko/attendance.json` — `PERSONAL_WORK.commuteButton.*`, `PERSONAL_WORK.status.*`, `PERSONAL_WORK.geolocation.*`

### 백엔드 API 엔드포인트 (베이스: `/optimiz-time/api`, prefix `OPTIMIZ_TIME_API`)

| Method | Path | 용도 | 호출처 |
|--------|------|------|------|
| POST | `/time/.../go-to-work` ⭐ | 출근 | `goToWork(payLoad)` |
| POST | `/time/.../finish-work` ⭐ | 퇴근 | `finishWork(payLoad)` |
| POST | `/time/.../pause` | 자리비움 | `pauseWork({returnPlanTime, note})` |
| POST | `/time/.../resume` | 복귀 | `resumeWork()` |
| GET | `/time/.../status` | 현재 상태 | `statusWork()` |
| GET | `/time/.../day-work-info?currentYn=Y` (또는 `?ymd=YYYYMMDD`) | 일일 근무 정보 | `getDayWorkInfo(ymd, currentYn)` |
| GET | `/time/.../team-work-info` | 팀원 근무 정보 | `getTeamWorkInfo()` |
| GET | `/time/.../work-plcs` | 등록된 근무지 목록 | `getWorkPlaces()` |
| GET | `/time/.../work-plc-validation-options` | GPS/IP/WiFi 검증 ON/OFF | `getWorkPlaceValidationOptions()` |
| GET | `/time/appls/in/validate-time` | 출근 시간 밸리데이션 | `getValidateInTime(...)` |
| GET | `/time/appls/out/validate-time` | 퇴근 시간 밸리데이션 | `getValidateOutTime(...)` |
| GET | `/time/policy/go-to-work` | 출근 정책 | `getClockInPolicy()` |
| GET | `/time/policy/finish-work` | 퇴근 정책 (현재 연장 중인지 등) | `getClockOutPolicy()` |
| GET | `/time/record/validate-finish-work-info` | 퇴근 시 초과근무 제한 확인 | `getValidateFinishWorkInfo()` |

> [TBD] 정확한 base URL prefix와 path 풀 경로는 `config/api.js`의 `ATTENDANCE.WORK_RECORD.*` 상수 확인 필요

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
| `PAUSE` | 자리비움 중 | **복귀** 버튼 |
| `RESUME` | 자리비움 복귀 (`resumeWork()` 액션 후 전환 상태) | — |
| `FINISH` | 퇴근 완료 | **재출근** 버튼 |

### 우선순위 분기 (workStatus보다 우선 처리)

`workHistoryChangeRequired || hasModifiedWorkRecord || workRegAdjstAppl 존재` 시:
- 모든 출/퇴근 버튼 대신 **"근무 내역 변경"** 버튼 노출
- `workRegAdjstAppl` 진행 중이면 disabled
- `workHistoryChangeRequired` = `!inHm && outHm` (퇴근 기록만 있고 출근 기록 없음)

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

> 이 함수들의 정의는 `WorkComponent.tsx`에 export됨 (CommuteButton에서 import). [TBD] 정확한 정의 위치 라인 확인

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

### 3. GPS 검증

`getLocationStatus({position, error})`에서 다음 결과 반환 (`gpsConfCd`):

| 코드 | 의미 |
|------|------|
| `C` | CONFIRM — 등록 근무지 반경 내 |
| `O` | OUT OF LOCATION — 근무지 외 |
| `U` | UNKNOWN — 위치 정보 확인 불가 |
| `D` | DECLINED — 위치 권한 거부 (geolocation error code 1) |

- 거리 계산: **하버사인(Haversine) 공식**, 지구 반지름 6,371,000m
- 등록 근무지의 `gpsPmitScop` (반경, 미터) 내인지 체크
- 캐시: `workPalceValidationOptionsRef` 에 한 번 저장 후 재사용 (오타 주의: "Palce")
- React Native WebView 환경에서는 별도 처리 (`window.isRNWebview`)

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

### 5. 연장근무 텍스트 색상

`shouldCheckOvertime = otPmitCd === "N" || "A"` 인 경우 + 예상 퇴근시간 초과:
- `otPmitCd === "P"` (자유 허용) → 안내문 미표시
- `otPmitCd === "A"` (승인시 허용) → **빨간색** ("승인 받지 않으면 비근무")
- `otPmitCd === "N"` (불가) → 별도 처리

> [TBD] 주황색 vs 빨간색 정확한 분기 코드 위치 — `Status.tsx`의 `showOvertimeWarningNotice` / `showOvertimeLimitNotice` props 참조

### 6. 정산기간 vs 일별 연장근무 분기

QA 체크리스트 L112–115:
- "정산기간의 근무시간 합계가 기본 근무시간을 넘어가면 연장근무로 기록" 설정 그룹:
  - 예상 퇴근시간 초과해도 안내문 **미노출**
  - 정산기간 내 소정근로시간 초과 시 "소정근로시간을 초과했습니다" 안내문
- 관련 state: `dayWorkInfo.settleCurrentRemainBaseWorkMinutes`

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

`pp:src/lib/attendance/personalWork.ts:2113` — `checkNextDayAndBeforeAggrTime(workYmd, workGrpVo)`:

```ts
const isNextDayAndBeforeAggrTime =
    workGrpVo?.ddAggrTimeClass === "NTDAY" &&
    !!workGrpVo.ddAggrTime &&
    moment(workYmd, "YYYYMMDD").add(1, "days").format("YYYYMMDD") === today &&
    moment().hours() < parseInt(workGrpVo.ddAggrTime, 10);
```

- `ddAggrTimeClass === "NTDAY"` (Next day 집계) + `ddAggrTime` 시간 이전이면 어제 근무로 판정
- ⚠️ **프론트는 `workGrpVo.ddAggrTime` (정적 값)을 사용**하는데 백엔드는 `ValidWorkDayResolver`로 **동적 계산**. 둘이 일치하는지 [TBD] — 백엔드가 `ddAggrTime`을 동적으로 계산해서 응답에 담아주거나, 프론트 로직이 outdated일 가능성

### UI 표시 (QA 체크리스트 L95–110)

| 전날 상태 | cutoff 이전 | cutoff 경과 후 |
|------|------|------|
| 출근O 퇴근X | "{현재날짜} OO시간 OO분째 근무 중 (출근일: {어제날짜})" + 퇴근 버튼 | 전날 = 퇴근 누락 / 현재 = 최초 출근 상태로 전환 |
| 출근O 퇴근O | "{현재날짜} OO시간 OO분 근무했습니다 (출근일: {어제날짜})" + 재출근 버튼 | (해당 없음 — 정상 종료된 상태) |
| 출근X 퇴근X | "{어제날짜} 출근전 입니다" + 출근 버튼 | — |

팀원 근무 현황도 동일 기준 (어제 출근 후 미퇴근 팀원은 "근무중" 표시).

> **검수 포인트**: QA 체크리스트 L102의 "05시가 지났을 때" 표현은 현재 로직과 불일치. 체크리스트 갱신이 필요할 수 있음.

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

- ref 변수명 오타: `workPalceValidationOptionsRef` ("Palce" — Place 오타)
- 자정~05시 동작은 QA에 "확인 필요" 표시되어 있음 (L95: "관련 스레드")
- `validWorkCd === "PLAN"` (근무 계획 시간 사용) 그룹은 출/퇴근 버튼 자체가 미노출 → 이때 "측정된 시간" 대신 "근무 중" 텍스트 표시 (QA L76)

## 관련 기능 / 화면

- **당일 근무 내역 변경 신청** (이 위젯에서 진입) → `product/user-record-change.md` [TBD]
- **사전 연장/야간 신청서** (검증 시 참조) → `product/appl-overtime.md` [TBD]
- **사전 휴일근무 신청서** (검증 시 참조) → `product/appl-holiday-work.md` [TBD]
- **근무 요약 정보 위젯** (위젯 상단/하단에 통합 노출) → `product/user-home.md` [TBD]
- **워크플로우 시스템** (요청서 승인 흐름)

## 검증 / [TBD]

이 문서는 코드 + QA 체크리스트 + 두현님 확인 기준으로 작성. 다음 항목은 추가 확인 필요:

- [ ] `isHolidayWorkUnavailableOnWork` / `isNightWorkUnavailableOnWork` 함수 본체 위치 + 정확한 분기 (`WorkComponent.tsx`에서 export됨)
- [ ] `parseDayWorkInfo`의 변환 로직 (백엔드 응답 → 프론트 state) — `pp:src/lib/attendance/personalWork.ts`
- [ ] 백엔드 정책 API 응답 구조 (`getClockInPolicy`, `getClockOutPolicy`) — `IClockInOutPolicyPayload` 타입
- [ ] **자정 cutoff 프론트/백엔드 일치 여부**: 프론트 `checkNextDayAndBeforeAggrTime`는 `workGrpVo.ddAggrTime` 사용, 백엔드 `ValidWorkDayResolver`는 동적 계산. 백엔드가 `ddAggrTime`을 동적으로 계산해서 응답에 담아주는지 확인 필요
- [ ] QA 체크리스트 `ppfront/.../attendance.md` L102의 "05시" 표현이 현재 로직과 불일치 — 체크리스트 갱신 권고

## 확인 완료 (해소된 [TBD])

- ✅ `WorkStatus` 타입 — `pp:src/@types/customTypes/attendance/unionType.d.ts:271` 에 정의됨 (주석 포함)
- ✅ `validWorkCd === "EXTERNAL"` — 현재는 **세콤 연동**만 해당 (향후 추가될 가능성 있음). 위젯에서는 `isExternalLinkGroup`로 분기, **`CommuteButton` 미노출이 유일한 차이**. 그 외(Status/TimeTable/WorkRequest)는 일반 그룹과 동일. `WorkComponent.tsx:239-240` `WorkComponent.tsx:865`
- ✅ `validWorkCd` 전체 enum — `"RECD" | "PLAN" | "EXTERNAL"` (`pp:src/@types/customTypes/attendance/unionType.d.ts:99-105`). RECD = 출퇴근 기록(기본), PLAN = 근무 계획, EXTERNAL = 외부 시스템 연동
- ✅ `workTimeVisibleCd === "DENIED"` — 특정 고객사 요청으로 추가된 기능 (사유: 자사 구성원에게 근무시간 비공개 요청)
- ✅ `applsInProgress`의 12종 신청서 상호작용 — 케이스가 광범위하므로 구체적 케이스 발생 시 그때 분석
