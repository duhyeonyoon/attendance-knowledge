# 신청서 묶음: 사전 휴일근무 + 사전 연장/야간 (사용자)

## 개요

근무 그룹 설정에 따라 사용자가 **사전에** 신청해야 하는 두 가지 신청서:

- **사전 휴일근무 신청** (U14) — 휴일 날짜에 근무하려면 사전 승인 필요
- **사전 연장/야간 신청** (U15) — 연장근무 또는 야간근무를 하려면 사전 승인 필요

두 신청서는 **출퇴근 위젯의 사전 검증과 직결**됩니다. 출퇴근 위젯이 출근/퇴근 시 호출하는 `isHolidayWorkUnavailableOnWork`, `isNightWorkUnavailableOnWork`, `shouldCheckOvertime` 모두 이 신청서들의 승인 상태(`valid-appl-list` API)를 본 결과로 분기됩니다.

## 진입 위치

- 통합홈 / 내 근무 페이지의 **출퇴근 위젯**
- 위젯의 [근무신청] 버튼 → **bottom drawer 오픈** → 신청서 종류 선택
- 함께 묶이는 신청서들: 사전 휴일근무 / 사전 연장·야간 / 재택 / 기타근무 / 대체근무 / 근무계획 변경

## QA 체크리스트

`ppfront/.claude/qa-checklist/attendance.md`

- 사전 휴일근무: **L655 ~ L675** (21줄)
- 사전 연장/야간: **L677 ~ L713** (37줄)

## 공통 워크플로우 패턴

두 신청서 모두 **백엔드의 신청서 표준 패턴**을 따릅니다.

### 컨트롤러 분리 (신청 ↔ 취소)

신청과 취소가 별도 컨트롤러로 분리됨:

| 신청서 | 신청 컨트롤러 | 취소 컨트롤러 |
|------|------|------|
| 사전 연장/야간 | `be:controller/appls/otwork/OtApplsController` | `be:controller/appls/otwork/OtWorkCancelApplsController` |
| 사전 휴일근무 | `be:controller/appls/holidaywork/HolidayWorkApplsController` | `be:controller/appls/holidaywork/HolidayWorkCancelApplsController` |

> 참고로 같은 패턴이 휴가(`LeaveApplsController` + `LeaveCancelApplsController`), 기타근무, 재택근무에도 동일 적용됨

### CONST_APPLY_ACTION 표준 액션 8종

모든 신청서 컨트롤러가 공유하는 액션 (각 path 뒤에 붙음):

| 액션 | 의미 |
|------|------|
| `/search` | 조회 |
| `/temp-saved` (`TEMP_SAVED`) | 임시저장 |
| `/apply` | 신청 |
| `/cancel` | 취소 |
| `/rejected` | 반려 |
| `/approval-done` | 결재완료 |
| `/complete` | 완료 |
| `/delete` | 삭제 |

> 정확한 path 문자열은 `be:.../constant/CONST_APPLY_ACTION` 상수 확인 필요 (현재 파일 직접 미확인) [TBD]

## 신청서 1: 사전 휴일근무 (U14)

### 조건

**어드민 근무그룹 설정 > 휴일근무 > '승인시에만 근무 가능'** (`workGrpVo.holiWorkPmitCd === "A"`) 일 때만 사용자가 신청 가능

> `holiWorkPmitCd === "N"` (휴일근무 불가)이면 사용자는 신청 자체 불가, 출퇴근 위젯에서 사전 차단됨 (`isHolidayWorkUnavailableOnWork`)

### 코드 위치

**ppfront (사용자 화면)**:

```
src/components/workflow/shared/template_drawer/
├── index.tsx                          ← 신청서 drawer 컨테이너
└── contents/
    ├── DayOff.tsx              ⭐     ← 사전 휴일근무 신청서 본체
    ├── RequestDate.tsx                ← 요청일 선택 (캘린더)
    ├── RequestTimeInfo.tsx            ← 시간 입력 + 정보
    ├── RequestType.tsx                ← 신청서 종류 선택
    ├── RequestButton.tsx              ← 신청/임시저장 버튼
    ├── Attachment.tsx                 ← 첨부
    └── FileUpload.tsx                 ← 파일 업로드

src/components/workflow/shared/approval_drawer/
└── contents/
    ├── (HolidayWork 승인 측 — 별도 컴포넌트 존재 추정) [TBD]
    └── cancel_drawer_template/contents/ (취소 drawer)

src/hooks/attendance/useHolidayWorkRequestValidation.ts ⭐  ← 휴일근무 신청 밸리데이션 훅

src/modules/workflow/attendance/validation.ts            ← API 클라이언트
```

> ⚠️ 명명 주의: 컴포넌트 파일명은 `DayOff.tsx`지만 실제로는 **사전 휴일근무 신청서**입니다. ("DayOff" = "휴일"의 영문 번역). 코드 검색 시 헷갈리지 않게 주의.

**백엔드**:

```
be:controller/appls/holidaywork/
├── HolidayWorkApplsController.java        ← 사전 휴일근무 신청
└── HolidayWorkCancelApplsController.java  ← 사전 휴일근무 취소 신청

be:vo/PsnHoliWorkApplVo.java                ← VO
```

### API 엔드포인트

**HolidayWorkApplsController (신청 측)**:

| Method | Path | 용도 |
|--------|------|------|
| POST | `/time/appls/holiday-work/search` | 조회 |
| POST | `/time/appls/holiday-work/temp-saved` | 임시저장 |
| POST | `/time/appls/holiday-work/apply` ⭐ | 신청 (submit) |
| POST | `/time/appls/holiday-work/cancel` | 신청 자체 취소 (결재 전) |
| POST | `/time/appls/holiday-work/rejected` | 반려 (승인자) |
| POST | `/time/appls/holiday-work/approval-done` | 결재완료 |
| POST | `/time/appls/holiday-work/complete` | 완료 |
| POST | `/time/appls/holiday-work/delete` | 삭제 |
| GET | `/time/appls/holiday-work/valid-appl-list?ymd=YYYYMMDD` ⭐ | 해당 일자의 유효 신청서 목록 |
| GET | `/time/appls/holiday-work/valid-time?workYmd&inPlanTime&inStdDdClass&outPlanTime&outStdDdClass` ⭐ | 시간 유효성 검증 |
| GET | `/time/appls/holiday-work/calendar?ym=YYYYMM` ⭐ | 캘린더 데이터 (휴일 표시) |

**legacy 경로** (`controller/legecy/LegacyRecordWidgetController`):
- GET `/time/appls/holiday-work/is-necessary` — 신청 필요 여부 판단

**HolidayWorkCancelApplsController (취소 측)** — 결재 완료된 신청을 취소:

| Method | Path | 용도 |
|--------|------|------|
| POST | `/time/appls/holiday-work-cancel/search` | 조회 |
| POST | `/time/appls/holiday-work-cancel/temp-saved` | 임시저장 |
| POST | `/time/appls/holiday-work-cancel/apply` | 취소 신청 |
| POST | `/time/appls/holiday-work-cancel/cancel` | 취소 신청 취소 |
| POST | `/time/appls/holiday-work-cancel/rejected` | 반려 |
| POST | `/time/appls/holiday-work-cancel/approval-done` | 결재완료 |
| POST | `/time/appls/holiday-work-cancel/complete` | 완료 |
| POST | `/time/appls/holiday-work-cancel/delete` | 삭제 |
| GET | `/time/appls/holiday-work-cancel/expected-remaining-overtime/{holidayWorkApplId}` | 예상 잔여 연장시간 |

### 동작 (QA L657–675 정리)

#### 캘린더 선택

- 캘린더 오픈 시 **근무 계획이 "휴일"인 날짜만 선택 가능** (백엔드: `getHolidayWorkCalendar`)
- 하루만 선택 가능
- 이미 신청된 문서가 있을 경우 → "겹치지 않으면 신청 가능하다" 안내 문구 (백엔드: `getHolidayWorkValidApplList`)

#### 시간 입력 + 밸리데이션 (`useHolidayWorkRequestValidation`)

검증 함수 4종 (`pp:src/hooks/attendance/useHolidayWorkRequestValidation.ts`):

| 함수 | 검증 내용 | 에러 메시지 키 |
|------|------|------|
| `validateWorkYmd` | 요청일 유효성 | `HOLIDAY_WORK.errors.requestDate` |
| `validateInPlanTime` | 시작 시각 미입력/잘못된 형식 | `HOLIDAY_WORK.errors.emptyStartTime` |
| `validateOutPlanTime` | 종료 시각 미입력/잘못된 형식 | `HOLIDAY_WORK.errors.emptyEndTime` |
| `validateImpossiblePlanTime` | 시작 ≥ 종료 (역전/동일) | `HOLIDAY_WORK.errors.endTimeBeforeStartTime` / `endTimeSameStartTime` |

`inStdDdClass`/`outStdDdClass` 가 `NXD`(익일)인 경우 `+1 day`로 datetime 계산 → 야간 근무대 처리 가능.

#### 시간 결과 표시

- 변경 결과 표시 (입력 시간 → 추정 근무 시간)
- 휴게 시간 + 상세 시간 자동 표시
- 신청 시간이 **연장/야간에 해당하면 추가 정보** 표시 (`isOverlappingNightTime` 체크 — 22~06시)
- 최대 초과근무 시간 제한 설정 시:
  - 신청서 상단에 **잔여시간 + 요청중 시간** 표시
  - 잔여시간 초과 시 밸리데이션 메시지
- 최소 초과근무 시간 제한 설정 시:
  - 신청서 단위 최소 미달 시 경고 + 신청 불가

#### 신청서 취소 (3가지 케이스)

| 시점 | 취소 방법 |
|------|------|
| 미래 일자 | 내 근무 페이지 → 신청된 휴일근무 클릭 → 취소 |
| 당일 (출퇴근 전) | 내 근무 페이지 → 신청된 휴일근무 클릭 → 취소 |
| 과거 / 당일 출퇴근 후 | 워크플로우에서 **승인된 휴일근무 신청서 취소** (= `HolidayWorkCancelAppls` 신청서 발행) |

> "신청 자체 취소"(`/cancel`) vs "결재 완료된 신청을 취소 신청"(`HolidayWorkCancelAppls.apply`) 두 개념이 다름

#### 근무 마감 차단

- 마감된 일자: 요청/승인/취소요청/취소승인 모두 불가 (QA L675, `KB:product/admin-work-close.md` cross-domain 참조)

## 신청서 2: 사전 연장/야간 (U15)

### 조건

**어드민 근무그룹 설정 > 연장근무 > '승인시에만 연장 가능'** (`otPmitCd === "A"`)
**또는**
**어드민 근무그룹 설정 > 야간근무 > '승인시에만 야간 가능'** (`nightPmitCd === "A"`)

> `otPmitCd === "P"` (자유 허용)이면 신청 불필요. `otPmitCd === "N"` (불가)이면 출퇴근 위젯이 사전 차단.

### 코드 위치

**ppfront**:

```
src/components/workflow/shared/template_drawer/contents/
├── Overtime.tsx                       ⭐ 사전 연장/야간 신청서 본체
├── RequestDate.tsx                    (공유)
├── RequestTimeInfo.tsx                (공유)
├── RequestType.tsx                    (공유)
└── RequestButton.tsx                  (공유)

src/components/workflow/shared/approval_drawer/contents/
├── Overtime.tsx                       ← 승인 측
├── OvertimeCancel.tsx                 ← 취소 승인 측
└── cancel_drawer_template/contents/
    └── OvertimeCancelDrawer.tsx       ← 취소 drawer

src/@types/customTypes/workflow/overtime.d.ts ⭐ ← 타입 정의

src/modules/workflow/attendance/validation.ts ← getValidOvertime 등
src/modules/workflow/document.ts              ← getOvertimeValidApplList, getRemainOvertimeMinutes
```

**백엔드**:

```
be:controller/appls/otwork/
├── OtApplsController.java             ← 사전 연장/야간 신청
└── OtWorkCancelApplsController.java   ← 취소 신청

be:vo/
├── PsnOtPlanApplVo.java               ← VO (신청)
└── PsnOtPlanCancelApplVo.java         ← VO (취소)

be:dto/appls/overtime/
├── OtApplSmrDto.java                  ← 요약 DTO
├── OtApplsRequestDto.java
├── OtApplsResponseDto.java
└── OtApplValidTimeDto.java            ← 시간 검증 결과
```

### API 엔드포인트

**OtApplsController (신청 측)**:

| Method | Path | 용도 |
|--------|------|------|
| POST | `/time/appls/ot/search` | 조회 |
| POST | `/time/appls/ot/temp-saved` | 임시저장 |
| POST | `/time/appls/ot/apply` ⭐ | 신청 |
| POST | `/time/appls/ot/cancel` | 신청 자체 취소 |
| POST | `/time/appls/ot/rejected` | 반려 |
| POST | `/time/appls/ot/approval-done` | 결재완료 |
| POST | `/time/appls/ot/complete` | 완료 |
| POST | `/time/appls/ot/delete` | 삭제 |
| GET | `/time/appls/ot/valid-appl-list?ymd` | 해당 일자 유효 신청서 |
| GET | `/time/appls/ot/valid-time` ⭐ | 시간 유효성 검증 (`OtApplValidTimeDto`) |
| GET | `/time/appls/ot/remain-over-work?workYmd` ⭐ | 남아있는 연장 가능 시간 |

**OtWorkCancelApplsController (취소 측)**: HolidayWorkCancel과 동일 패턴 (`/time/appls/ot-cancel/*` 추정 — path 정확히 [TBD])

### 동작 (QA L679–713 정리)

#### 캘린더 선택

- 캘린더 오픈 시 **근무 계획이 "휴일"인 날짜는 선택 불가** (← 휴일근무는 별도 신청서)
- 하루만 선택 가능
- **신청일 기준 전일/당일/익일에 신청된 문서가 있을 경우** → 겹치지 않으면 신청 가능 안내
- 선택한 요청일이 **고정출퇴근제**일 경우:
  - 계획 퇴근시간이 시작 시각 기본값으로 자동 입력

#### 시간 입력 + 밸리데이션

- 시작/종료 미입력, 역전, 동일 → 동일한 밸리데이션 (휴일근무와 비슷한 패턴)
- 신청 시간이 연장/야간에 해당하면 **연장/야간 정보 표시**
- **연장근무 → 승인시에만 + 당일 과거 시각 신청 허용 → 허용 안함 옵션** (`otPastApplyPolicyCd`):
  - 현재시간보다 당일 과거에 신청 시도 → 밸리데이션 메시지

#### 최대 / 최소 초과근무시간 제한 표시

| 조건 | 화면 표시 |
|------|------|
| 최대 초과근무 제한 **설정됨** | 신청서 상단에 **설정 잔여시간 + 요청중 시간** 표시. 초과 시 밸리데이션 |
| 최대 초과근무 제한 **설정 안 됨** | 신청서 상단에 **법적 기준 연장 가능 시간 (최대 12시간)** 표시. 초과해도 밸리데이션 미통과 |
| 최소 초과근무 제한 **설정됨** | 신청서 단위로 최소 미달 시 경고 + 신청 불가 |

> 잔여시간 계산: `getRemainOvertimeMinutes(workYmd)` API
> 유효 신청서: `getOvertimeValidApplList(ymd)` API
> 시간 검증: `getValidOvertime` API → `OtApplValidTimeDto` 응답

#### 취소

- 워크플로우에서 **승인된 연장/야간근무 신청서를 취소** (= `OtWorkCancelAppls.apply`)
- UI: `OvertimeCancelDrawer.tsx`, `OvertimeCancel.tsx`

#### 근무 마감 차단

- 마감된 일자: 요청/승인/취소요청/취소승인 모두 불가 (QA L713)

## Cross-domain 효과 ⭐

이 두 신청서의 승인 상태는 **출퇴근 위젯의 사전 검증 로직**에 직접 영향:

### 출퇴근 위젯 → 신청서 연결

| 위젯 동작 | 참조하는 신청서 | 효과 |
|------|------|------|
| 휴일 출근 시도 (`holiWorkPmitCd === "A"`) | `psnHoliWorkAppl` (in `dayWorkInfo.applsInProgress`) | 승인 없으면 출/퇴근 안내문 확인 필요. 승인 있으면 정상 처리 |
| 연장근무 출근 시도 (`otPmitCd === "A"`) | `overtimeWorkAppl` / 잔여 OT minutes | 승인 시간 외 → 안내문 / 잔여 초과 → 차단 |
| 야간 출근 시도 (`nightPmitCd === "A"`) | `overtimeWorkAppl` (야간도 OT로 통합) | 동일 |
| 예상 퇴근시간 초과 텍스트 색상 | 그룹 설정 (`otPmitCd`) | `A` → 빨간색 ("승인 안 받으면 비근무") / `P` → 주황색 |

### 신청서 발행 → 위젯 표시

신청서가 `요청중` 상태일 때:
- `dayWorkInfo.applsInProgress.psnHoliWorkAppl` / `.overtimeWorkAppl` 에 포함됨
- 출퇴근 위젯에서 **요청중 칩** 표시 (`WorkChip.tsx`)
- 승인 완료 시 → 칩 사라지고 정상 처리

### 사용자 캘린더 / 내 근무 → 신청서 진입

- 내 근무 페이지에서 신청된 휴일근무 / 연장근무 클릭 → 신청서 상세 → 취소 가능
- 미래/당일출퇴근전 = 즉시 취소
- 과거/당일출퇴근후 = 취소 신청서 발행

## 비즈니스 룰

1. **사전 신청은 그룹 설정이 `A`(승인시에만)일 때만 의미 있음**: `P`이면 자동 허용, `N`이면 신청 자체 불가
2. **신청서 종류 분리**: 신청(`Appls`)과 취소(`CancelAppls`)가 별도 컨트롤러 + 별도 워크플로우. 결재 완료 후 취소는 새 신청서를 만드는 행위
3. **시간 검증은 백엔드가 최종 결정**: 프론트 `useHolidayWorkRequestValidation` 등은 1차 체크. 백엔드 `valid-time` API가 최종
4. **신청서 단위로 최소 초과근무 검증**: 합산이 아니라 신청서 1건 단위 (체크리스트 L671, L705)
5. **최대 초과근무 미설정 시**: 법적 기준 12시간 표시되지만 밸리데이션은 안 걸림 (체크리스트 L703–704)
6. **요청 일자 캘린더 분기**: 휴일근무 = 휴일만 / 연장근무 = 휴일 외 (정확히 반대)
7. **고정출퇴근제 → 시작시각 기본값**: 연장근무 신청 시 계획 퇴근시간 자동 채움 (편의)
8. **취소 시점에 따라 다른 흐름**: 미래/당일출퇴근전 = `/cancel` (즉시), 과거/당일출퇴근후 = `CancelAppls.apply` (워크플로우)
9. **근무 마감 차단**: 두 신청서 모두 마감일은 어떤 액션도 불가

## 알려진 제약 / 임시 동작

- ppfront `DayOff.tsx`는 명명상 휴일근무 신청을 의미하지만 직관적이지 않음 (역사적 이유 추정). 코드 검색 시 주의
- 신청서 표준 액션 8종은 모든 신청서 컨트롤러에서 동일하지만, 정확한 path 문자열(`CONST_APPLY_ACTION`)은 미확인 [TBD]

## 검증 / [TBD]

- [ ] `CONST_APPLY_ACTION` 상수 정확한 정의 (path 문자열) — `be:.../constant/CONST_APPLY_ACTION.java` 직접 확인 필요
- [ ] `PsnHoliWorkApplVo` / `PsnOtPlanApplVo` 풀 필드
- [ ] `OtApplValidTimeDto` 응답 구조 (어떤 검증 결과를 반환하는지)
- [ ] `OtWorkCancelApplsController`의 정확한 path prefix (`/time/appls/ot-cancel/`인지 다른 형태인지)
- [ ] approval_drawer의 HolidayWork 측 컴포넌트 위치 (현재는 OvertimeCancel만 확인됨)
- [ ] `getHolidayWorkValidTime` / `getValidOvertime` 시간 검증 룰 상세 (예: 휴게시간 자동 적용 룰)
- [ ] "겹치지 않으면 신청 가능" 안내 → 겹침 판정 로직 (정확히 어떤 신청서들과 비교?)
- [ ] 휴일근무는 캘린더에 `근무 계획이 휴일`인 날짜만 선택 가능 — "휴일" 판정 = `dayWorkInfo.holidayYn === "Y"` ? 또는 다른 룰?
- [ ] `legacy/LegacyRecordWidgetController.is-necessary` 의 정확한 용도

## 두현님 답변 받으면 좋을 것

1. `DayOff.tsx`가 사실은 "사전 휴일근무 신청"인 이유 — 코드 정리 대기 중인지, 영문 번역 컨벤션인지?
2. 연장/야간 신청은 동일 신청서(`OtAppls`)에서 처리되는데, **UI에서 "연장만" / "야간만" / "둘 다 포함" 구분이 있는지** — 아니면 시간대로 자동 판단?

## 관련 문서

- `KB:product/user-checkin-widget.md` — 출퇴근 위젯 사전 검증 로직, `applsInProgress` 12종 신청서
- `KB:product/admin-work-group.md` — 근무그룹 `holiWorkPmitCd` / `otPmitCd` / `nightPmitCd` 권한 코드 체계
- `KB:product/admin-work-close.md` — 근무 마감 차단 (이 영역 § "근무 마감 차단" 적용)
- `KB:domain/business-rules.md` § 2 야간근무 / § 3 연장근무 / § 4 휴일근무
