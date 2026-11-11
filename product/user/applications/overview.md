---
sidebar:
  order: 0
---

# 근무 신청서 공통 (워크플로우·룰)

> **원본** `product/_legacy/appl-holiday-overtime.md`, `product/_legacy/appl-other-forms.md`

출퇴근 위젯의 **근무 신청** 버튼 / 워크플로우에서 여는 근무 신청서 드로어들의 공통 명세입니다. 어드민 처리 화면은 [근무 신청 내역 관리](../../admin/work/appl-management.md)입니다.

## 휴일근무·연장/야간 — 개요

### 개요

근무 그룹 설정에 따라 사용자가 **사전에** 신청해야 하는 두 가지 신청서:

- **사전 휴일근무 신청** (U14) — 휴일 날짜에 근무하려면 사전 승인 필요
- **사전 연장/야간 신청** (U15) — 연장근무 또는 야간근무를 하려면 사전 승인 필요

두 신청서는 **출퇴근 위젯의 사전 검증과 직결**됩니다. 출퇴근 위젯이 출근/퇴근 시 호출하는 `isHolidayWorkUnavailableOnWork`, `isNightWorkUnavailableOnWork`, `shouldCheckOvertime` 모두 이 신청서들의 승인 상태(`valid-appl-list` API)를 본 결과로 분기됩니다.

## 휴일근무·연장/야간 — 진입 위치

### 진입 위치

- 통합홈 / 내 근무 페이지의 **출퇴근 위젯**
- 위젯의 [근무신청] 버튼 → **bottom drawer 오픈** → 신청서 종류 선택
- 함께 묶이는 신청서들: ~~사전 휴일근무 / 사전 연장·야간 / 재택 / 기타근무 / 대체근무 / 근무계획 변경~~ → **(2026-11-05)** 휴일근무(사전/사후) / 연장·야간(사전/사후) / 재택 / 기타근무 / 대체근무 / 근무계획 변경 / 근무계획 수립 / 통합 근무내역 변경 / 출퇴근 내역 변경 / 휴가. 메뉴 표시 순서는 재택 → 기타근무 → 휴가 → 출퇴근 내역 변경 → 통합 근무내역 변경 → 근무계획 변경 → 근무계획 수립 → 연장/야간(사전) → 연장/야간(사후) → 휴일(사전) → 휴일(사후) → 대체근무이며, 각 항목은 그룹 허용 설정·신청서 사용 여부에 따라 노출 (`pp:src/components/main/work_commute/contents/WorkRequest.tsx:105-116, 240-342`, `pp:src/lib/attendance/workTimeRecordChangeRequest.ts:55-64`)

## 휴일근무·연장/야간 — QA 체크리스트

### QA 체크리스트

`ppfront/.claude/qa-checklist/attendance.md`

- 사전 휴일근무: **L655 ~ L675** (21줄)
- 사전 연장/야간: **L677 ~ L713** (37줄)

## 공통 워크플로우 패턴

### 공통 워크플로우 패턴

두 신청서 모두 **백엔드의 신청서 표준 패턴**을 따릅니다.

#### 컨트롤러 분리 (신청 ↔ 취소)

신청과 취소가 별도 컨트롤러로 분리됨:

| 신청서 | 신청 컨트롤러 | 취소 컨트롤러 |
|------|------|------|
| 사전 연장/야간 | `be:controller/appls/otwork/OtApplsController` | `be:controller/appls/otwork/OtWorkCancelApplsController` |
| 사전 휴일근무 | `be:controller/appls/holidaywork/HolidayWorkApplsController` | `be:controller/appls/holidaywork/HolidayWorkCancelApplsController` |

> 참고로 같은 패턴이 휴가(`LeaveApplsController` + `LeaveCancelApplsController`), 기타근무, 재택근무에도 동일 적용됨

#### CONST_APPLY_ACTION 표준 액션 8종

모든 신청서 컨트롤러가 공유하는 액션 (각 path 뒤에 붙음):

| 상수 | 실제 path 문자열 | 의미 |
|------|------|------|
| `SEARCH` | `/searchApply` | 조회 |
| `TEMP_SAVED` | `/saveApply` | 임시저장 |
| `APPLY` | `/submitApply` | 신청 |
| `CANCEL` | `/cancelApply` | 회수(결재 전 취소) |
| `REJECTED` | `/reject` | 반려 |
| `APPROVAL_DONE` | `/approvalDone` | 결재완료 |
| `COMPLETE` | `/complete` | 완료 |
| `DELETE` | `/deleteApply` | 삭제 |
| `APPROVE_CANCEL` | `/cancel-approve` | (상수만 존재) |

> **(2026-11-05 해소)** 상수 정의 `optimiz-core:src/main/java/com/hcg/optimiz/system/constant/CONST_APPLY_ACTION.java:23-62` (로컬 체크아웃 기준). 각 컨트롤러는 `"/time/appls/<name>" + CONST_APPLY_ACTION.X` 로 매핑. 신청서마다 일부 액션은 매핑되지 않음 (예: 근무계획 변경은 APPLY·APPROVAL_DONE·DELETE 미매핑, 대체근무는 DELETE 미매핑 — `be:controller/appls/ddworkplanchange/DdWorkPlanChangeApplsController.java:52-86`, `be:controller/appls/CompensatoryWorkApplsController.java:53-115`)

## 휴일근무·연장/야간 — Cross-domain 효과

### Cross-domain 효과 ⭐

이 두 신청서의 승인 상태는 **출퇴근 위젯의 사전 검증 로직**에 직접 영향:

#### 출퇴근 위젯 → 신청서 연결

| 위젯 동작 | 참조하는 신청서 | 효과 |
|------|------|------|
| 휴일 출근 시도 (`holiWorkPmitCd === "A"`) | `psnHoliWorkAppl` (in `dayWorkInfo.applsInProgress`) | 승인 없으면 출/퇴근 안내문 확인 필요. 승인 있으면 정상 처리 |
| 연장근무 출근 시도 (`otPmitCd === "A"`) | `overtimeWorkAppl` / 잔여 OT minutes | 승인 시간 외 → 안내문 / 잔여 초과 → 차단 |
| 야간 출근 시도 (`nightPmitCd === "A"`) | `overtimeWorkAppl` (야간도 OT로 통합) | 동일 |
| 예상 퇴근시간 초과 텍스트 색상 | 그룹 설정 (`otPmitCd`) | `A` → 빨간색 ("승인 안 받으면 비근무") / `P` → 주황색 |

#### 신청서 발행 → 위젯 표시

신청서가 `요청중` 상태일 때:
- `dayWorkInfo.applsInProgress.psnHoliWorkAppl` / `.overtimeWorkAppl` 에 포함됨
- 출퇴근 위젯에서 **요청중 칩** 표시 (`WorkChip.tsx`)
- 승인 완료 시 → 칩 사라지고 정상 처리

#### 사용자 캘린더 / 내 근무 → 신청서 진입

- 내 근무 페이지에서 신청된 휴일근무 / 연장근무 클릭 → 신청서 상세 → 취소 가능
- 미래/당일출퇴근전 = 즉시 취소
- 과거/당일출퇴근후 = 취소 신청서 발행

## 신청 상태 화면 라벨

**(2026-11-05 해소)** 화면에 보이는 상태 라벨 원문 (`pp:src/locales/ko/workflow.json` `CODE_INDEX`, `pp:src/locales/ko/attendance.json` `COMMON`):

| 위치 | 라벨 |
|---|---|
| 워크플로우 문서 목록 칩 (`DOCUMENT_STATUS`) | "요청중", "승인필요", "승인완료", "반려", "취소", "본인승인", "완료" |
| 문서 상태 코드 (`APPL_STAT_1`) | 100 "임시저장" · 200 "승인 대기중" · 300 "반려" · 310 "취소" · 700 "담당자 처리중" · 900 "승인완료" · 930 "승인 후 취소" |
| 근무 화면(출퇴근 위젯·내 근무·구성원 근무 칩) | "요청중", "취소중"(취소 신청서 결재 대기) |
| 결재 문서 상세 버튼 | "승인", "반려", "요청 취소" |

문서 유형명(`APPL_TYPE`): "휴일 근무(사전) 신청" / "연장/야간근무(사전) 신청" / "재택근무 요청" / "기타근무 신청" / "대체근무 신청" / "근무계획 변경" / "통합 근무내역 변경" 및 각 "… 취소 신청"/"… 취소 요청". **(2026-11-05 추가)** "근무계획 수립 신청"(1031, `optimiz-system:workflow/constant/CONST_APPLY.java:33` — [근무계획 수립](./work-plan-establishment.md)), "출퇴근 내역 변경"(1072 — [출퇴근 내역 변경](./inout-record-change.md)), "휴일 근무(사후) 신청"/"휴일 근무(사후) 취소 신청"(1122/1123), "연장/야간근무(사후) 신청"/"연장/야간근무(사후) 취소 신청"(1042/1043).

## 휴일근무·연장/야간 — 비즈니스 룰

### 비즈니스 룰

1. **사전 신청은 그룹 설정이 `A`(승인시에만)일 때만 의미 있음**: `P`이면 자동 허용, `N`이면 신청 자체 불가
2. **신청서 종류 분리**: 신청(`Appls`)과 취소(`CancelAppls`)가 별도 컨트롤러 + 별도 워크플로우. 결재 완료 후 취소는 새 신청서를 만드는 행위
3. **시간 검증은 백엔드가 최종 결정**: 프론트 `useHolidayWorkRequestValidation` 등은 1차 체크. 백엔드 `valid-time` API가 최종
4. **신청서 단위로 최소 초과근무 검증**: 합산이 아니라 신청서 1건 단위 (체크리스트 L671, L705)
5. **최대 초과근무 미설정 시**: 법적 기준 12시간 표시되지만 밸리데이션은 안 걸림 (체크리스트 L703–704). **(2026-11-05 코드 확인)** 프론트·백엔드 모두 제한 미설정이면 잔여시간 검증을 건너뜀 — [연장](./overtime.md) § 최대/최소 초과근무시간 근거
6. **요청 일자 캘린더 분기**: 휴일근무 = 휴일만 / 연장근무 = 휴일 외 (정확히 반대)
7. **고정출퇴근제 → 시작시각 기본값**: 연장근무 신청 시 계획 퇴근시간 자동 채움 (편의)
8. **취소 시점에 따라 다른 흐름**: 미래/당일출퇴근전 = `/cancel` (즉시), 과거/당일출퇴근후 = `CancelAppls.apply` (워크플로우)
9. **근무 마감 차단**: 두 신청서 모두 마감일은 어떤 액션도 불가

## 휴일근무·연장/야간 — 알려진 제약

### 알려진 제약 / 임시 동작

- ppfront `DayOff.tsx`는 명명상 휴일근무 신청을 의미하지만 직관적이지 않음 (역사적 이유 추정). 코드 검색 시 주의

## 휴일근무·연장/야간 — 검증 / TBD

### 검증 / [TBD]

- [x] ~~`CONST_APPLY_ACTION` 상수 정확한 정의~~ → **(2026-11-05 해소)** § CONST_APPLY_ACTION 표
- [ ] `PsnHoliWorkApplVo` / `PsnOtPlanApplVo` 풀 필드 (코드 전용, 기획 영향 없음 — Slack 검색 생략)
- [ ] `OtApplValidTimeDto` 응답 구조 (어떤 검증 결과를 반환하는지) (코드 전용 — Slack 검색 생략)
- [x] ~~`OtWorkCancelApplsController` path prefix~~ → **(2026-11-05 해소)** `/time/appls/ot-cancel` (`be:controller/appls/otwork/OtWorkCancelApplsController.java:51`)
- [x] ~~approval_drawer의 HolidayWork 측 컴포넌트~~ → **(2026-11-05 해소)** `pp:src/components/workflow/shared/approval_drawer/contents/DayOff.tsx` / `DayOffCancel.tsx` / `cancel_drawer_template/contents/DayOffCancelDrawer.tsx`
- [x] ~~`getHolidayWorkValidTime` / `getValidOvertime` 시간 검증 룰 상세 (예: 휴게시간 자동 적용 룰)~~ → **(2026-11-05 Slack 확인)** 휴게는 해당 날짜 근무 템플릿의 휴게 설정을 따름 — 자동(법정 4시간당 30분 / 주기별 N시간마다 M분)은 출근(신청 시작) 시각 기준으로 구간 계산, 고정 휴게는 신청 구간과 겹치는 부분만 반영. 휴무일 근무는 전체가 연장이라 **연장 휴게** 설정, 휴일 근무는 소정 8시간까지 기본 휴게·이후 연장 휴게. 화면 안내 문구는 법정 고정 문구에서 "회사에서 지정한 휴게 기준에 따라 휴게시간이 자동으로 부여됩니다."로 교체 (로드맵 726) — Slack #sq-time 2026-09-14~30 (https://hcgtheplus.slack.com/archives/C04QC2RJJBU/p1787721270470399, https://hcgtheplus.slack.com/archives/C04QC2RJJBU/p1790746704976579?thread_ts=1790127203.895429)
- [x] ~~겹침 판정 로직~~ → **(2026-11-05 해소)** 같은 종류 신청서끼리만 비교 (휴일근무↔휴일근무, 연장↔연장 — **사전·사후 신청을 합쳐서** 비교, `be:validator/appls/holidaywork/HolidayWorkApplDuplicateValidator.java`, `be:service/appls/otwork/OtApplsService.java:588-613`). 요청중·승인 상태, 신청일 전일~익일 범위의 시간 구간 겹침 — [휴일근무](./holiday-work.md) / [연장](./overtime.md) § 겹침 판정
- [x] ~~휴일근무 캘린더 "휴일" 판정~~ → **(2026-11-05 해소)** 근무일유형 `H`(휴일)만. 휴무일(`O`)은 제외, 오늘 이전 날짜도 비활성 — [휴일근무](./holiday-work.md) § 캘린더 선택
- [ ] `legacy/LegacyRecordWidgetController.is-necessary` 의 정확한 용도 (2026-11-05 Slack 검색: 레거시 컨트롤러 자체 논의 없음. 유사 엔드포인트 `/time/appls/holiday-work/is-necessary`·`/time/appls/ot/is-necessary`는 출퇴근 위젯에서 승인 시간 밖 출퇴근 여부를 판단해 [시간 변경] 버튼 비활성에 쓰임 — #sq-time 2026-02-20. 기획 영향 적음)

## 휴일근무·연장/야간 — 두현님 답변 필요

### 두현님 답변 받으면 좋을 것

1. `DayOff.tsx`가 사실은 "사전 휴일근무 신청"인 이유 — 코드 정리 대기 중인지, 영문 번역 컨벤션인지?
2. ~~연장/야간 구분 UI 여부~~ → **(2026-11-05 해소)** 구분 UI 없음, 입력 시간으로 자동 판단해 "연장/야간 근무를 포함합니다." 등 표시 ([연장](./overtime.md) § 연장/야간 구분)

## 재택·기타·대체·계획·내역 — 개요

### 개요

표준 신청서 패턴(`CONST_APPLY_ACTION` 8개 액션 + `Appls`/`CancelAppls` 분리)을 따르는 5개 신청서를 묶은 문서. 공통 패턴은 `KB:product/user/applications/overview.md`에 정리됨 — 본 문서는 **각 신청서의 차이점**에 집중합니다.

| 사용자 영역 | 신청서 | ppfront 컴포넌트 | 백엔드 path |
|------|------|------|------|
| U16 | 재택근무 | `HomeWork.tsx` | `/time/appls/work-for-home` |
| U17 | 기타근무 | `OtherWorkApplications.tsx` | `/time/appls/other-work` |
| U18 | 대체근무 | `CompensatoryWork.tsx` | `/time/appls/compensatory-work` |
| U19 | 근무계획 변경 | `PlanEdit.tsx` | `/time/appls/work-plan-change` |
| U4 + U7 | 근무내역 변경 | `RegEdit.tsx` | `/time/appls/work-record-change` |

## 재택·기타·대체·계획·내역 — QA 체크리스트

### QA 체크리스트

`ppfront/.claude/qa-checklist/attendance.md`:

- 재택근무 (U16): L715–728 (14줄)
- 기타근무 (U17): L729–780 (52줄)
- 대체근무 (U18): L781–805 (25줄)
- 근무계획 변경 (U19): L806–883 (~78줄)
- 당일 근무내역 변경 (U4): L155–166 (12줄)
- 근무내역 변경 본체 (U7): L210–258 (49줄)

## 재택·기타·대체·계획·내역 — Cross-domain 효과

### Cross-domain 효과 (5개 신청서 통합)

| 신청서 | 출퇴근 위젯 영향 | 다른 영역 영향 |
|------|------|------|
| 재택 | 승인 시 GPS 검증 우회 + 재택 Chip 표시 | 구성원 근무 현황 Chip |
| 기타근무 | 출퇴근 위젯에 요약 표시 (2건+ 아코디언) / 재택 Chip 가림 | 종일 승인 시 누락 미처리 / 캘린더 표시 |
| 대체근무 | 직접 영향 없음 | 근무계획 변경 신청을 막음 (역도 마찬가지) |
| 근무계획 변경 | 직접 영향 없음 | 대체근무 신청을 막음 / 그룹 스케줄 우회 (개인스케줄 우선) |
| 근무내역 변경 | "근무 내역 변경" 버튼으로 진입 | 어드민 직접 수정 시 차단 |

## 재택·기타·대체·계획·내역 — 비즈니스 룰

### 비즈니스 룰 (5개 신청서 공통/특이)

1. **모든 신청서 마감 차단** — 동일하게 적용 (`KB:product/admin/work/close-work-data.md` § "Cross-domain")
2. ~~재택 단일 일자~~ → **(2026-11-05 정정)** 재택도 기간(시작~종료) 선택 가능 (하루만 고르면 단일 일자). 기타·계획변경 = 기간, 내역변경 = 단일 일자, 대체 = 두 일자 짝 ([재택](./remote-work.md))
3. **재택 Chip < 기타근무 Chip** — 우선순위 룰 (둘 다 있을 때 기타근무가 표시됨)
4. **재택 승인 = GPS 우회** (체크리스트 L727)
5. **기타근무 종일 + 근무스케줄 있음 → 누락 처리 안 함** (체크리스트 L740)
6. **대체근무는 짝(swap)**: 근무일 → 휴일/휴무일 + 휴일/휴무일 → 근무일
7. **근무계획 변경의 변경 결과는 근무일 템플릿만 변경 가능** (휴일/휴무일은 변경 불가)
8. **개인스케줄 > 그룹스케줄 우선순위**
9. **근무계획 변경 ↔ 대체근무는 상호 배타** (한쪽이 요청중이면 다른 쪽 불가)
10. **근무내역 변경 시 출근인정시각 자동 보정** (근무시간 표시 안함 + 인정시각 이전 출근)
11. **어드민 직접 수정한 일자 → 변경 신청 차단** (~~`hasModifiedWorkRecord` flag~~ → **(2026-11-05 정정)** 신청서 차단 flag는 `hasAdminModifiedWork` — `/time/appls/work-record-change/valid-date`·`/time/appls/inout-record-change/valid-date` 응답 (`pp:src/modules/workflow/attendance/validation.ts:302, 318`). `hasModifiedWorkRecord`는 승인된 변경 신청 존재 여부로 출퇴근 위젯 버튼 분기용). 서버 저장 시 재검증은 없음 — [출퇴근 내역 변경](./inout-record-change.md) § [TBD]
12. **간주근로자 휴가 사용 시 특수 계산** (체크리스트 L249–257):
    - 근무시간 = (소정근로시간) − min(소정근로시간, 기타근무시간)
    - 인정 근무시간 = 근무시간 + 기타근무시간 + 휴가사용시간
    - 최대 소정근로시간 초과한 기타근무는 가산됨

## 표준 워크플로우 패턴 (재참조)

### 표준 워크플로우 패턴 (재참조)

8개 표준 액션 (`CONST_APPLY_ACTION`):

```
/searchApply   조회
/saveApply     임시저장
/submitApply   신청
/cancelApply   결재 전 신청 회수
/reject        반려
/approvalDone  결재완료
/complete      완료
/deleteApply   삭제
```

각 신청서마다 path prefix만 다름 (`/time/appls/{name}/*`).

**Cancel 컨트롤러 분리 패턴**:

| 신청서 | Cancel 컨트롤러 존재? |
|------|------|
| 사전 휴일근무 / 사전 연장·야간 / 재택 / 기타근무 / 휴가 (+ **(2026-11-05)** 사후 휴일근무·사후 연장/야간 — [휴일근무(사후)](./holiday-work-post.md), [연장/야간(사후)](./overtime-post.md)) | ✅ 별도 존재 (`*CancelApplsController`) |
| 대체근무 / 근무계획 변경 / 근무내역 변경 (+ **(2026-11-05)** 출퇴근 내역 변경 1072 / 근무계획 수립 1031) | ❌ 메인 컨트롤러의 `/cancel` 액션만 사용 |

→ 워크플로우 흐름이 다름. **Cancel 컨트롤러가 있는 것들은 "결재 완료 후 취소"가 별도 워크플로우** (취소 신청서를 발행). **없는 것들은 결재 완료 후 취소 자체가 불가**.

**(2026-11-05 해소) 취소 가능 판정** (`optimiz-system:workflow/service/application/ApplicationsService.java:190-260`, `optimiz-system:workflow/constant/CONST_APPLY.java` `APPL_TYPE`):

| 플래그 | 조건 | 사용자 화면 동작 |
|---|---|---|
| `cancellableYn` (회수) | 본인이 작성 + 문서 상태 "승인 대기중"(200) + 아직 승인한 결재자가 없음 | 결재 문서 상세의 "요청 취소" 버튼 → `/cancelApply` 즉시 회수 |
| `cancelApplYn` (취소 신청) | 본인이 작성 + 문서 완료 + 문서유형 `isCancellable=true` + 진행중/완료된 취소 신청서 없음 | "요청 취소" 버튼 → 취소 신청서 드로어(별도 결재) |

- `isCancellable=true`: 휴가(1010), 연장/야간 사전(1040)·사후(1042), 휴일근무 사전(1120)·사후(1122), 재택(1130), 기타근무(1150)
- `isCancellable=false`: **근무계획 변경(1030), 대체근무(1035), 통합 근무내역 변경(1071)**, 출퇴근 내역 변경(1072), 근무계획 수립(1031) → **결재가 끝나면 사용자 화면에서 취소할 방법이 없음** (승인자가 아직 승인하지 않은 동안 회수만 가능)
- 프론트 취소 드로어 매핑도 휴가·재택·기타·연장(사전/사후)·휴일(사전/사후)만 존재 (`pp:src/components/workflow/shared/approval_drawer/index.tsx:202-230`)
- 마감일이면 취소 신청 버튼 비활성: "근무가 마감되어 요청을 취소할 수 없습니다." 

## 재택·기타·대체·계획·내역 — 알려진 제약

### 알려진 제약 / 임시 동작

- **개인스케줄 잔존 버그**: 근무그룹 변경 시 이전 그룹의 개인스케줄 삭제 안 됨 (QA L814 🚨, 처리 예정). **(2026-11-05 Slack 확인) 아직 미해결·고도화 미착수**: 그룹을 옮겨도 기존 개인스케줄은 자동 삭제·이관되지 않고, 근무시간 계산·휴가 차감은 `구성원+근무일` 기준으로 남은 개인스케줄을 우선 적용함. 반면 개인별 근무스케줄 작성/수정 화면·구성원 근무 일정 조회는 현재 근무그룹 기준으로 필터해 남은 스케줄이 안 보이거나 그룹스케줄로 보임 → "화면과 계산이 다른" 문의로 반복 유입. 운영 대응은 개발자 데이터 삭제 후 재집계(고객 확인 후), 과거 날짜로 소속 변경해도 개인스케줄은 덮어써지지 않는다고 안내 — Slack #cx 2026-06-26 (https://hcgtheplus.slack.com/archives/C01AVJ2CJBW/p1782445471287259?thread_ts=1782371583.278219), #cx 2026-09-29 (https://hcgtheplus.slack.com/archives/C01AVJ2CJBW/p1790643052150589?thread_ts=1790037711.712179), #channeltalk 2026-01-08
- **DB 테이블 이름과 컴포넌트 이름 불일치**: 재택 컴포넌트는 `HomeWork.tsx`인데 DB 테이블은 `TM_WORK_FOR_HOME_*`. `TM_RMT_WORK_APPL(_DTL)`은 구 "원격근무 신청"(1090) 테이블로 현재 서비스 코드에서 신규 저장 없음(초기 데이터 스크립트만), `TM_RMT_WORK_LOC`는 일자별 재택/원격 위치 레코드로 `WORK_FOR_HOME_APPL_ID` 또는 구 `RMT_WORK_APPL_ID`를 참조 (`be:resources/SQL/time/appls/WorkForHomeMapper.xml:140-162`) — (2026-11-05 해소)
- **기타근무 ↔ 재택 Chip 우선순위**: 가시화 룰 (둘 다 승인 시 기타근무가 표시됨). **(2026-11-05 Slack 확인)** 칩 한 자리 공유 정책은 출퇴근 위젯·근무 현황 칩 기준(2025-02). **전사 근무 계획 캘린더**(기획 2025-06, 스레드 제목 "전사 근무 계획 캘린더")는 우선순위 휴가 → 기타근무 → 재택 → 기본근무로 정렬하되 "기타근무와 재택이 겹치면 툴팁 등으로 재택도 표시"하는 방향 — 화면별로 표시 방식이 다름. **내 근무 캘린더에 대한 결정은 Slack에 없음** (현재 코드는 둘 다 표시, `KB:product/user/attendance/my-work.md` [TBD]) (#ch-plan 2025-06-18 https://hcgtheplus.slack.com/archives/C02VCP9MBQV/p1750229945190409?thread_ts=1750227993.860649)
- **Compensatory / DdWorkPlanChange / WorkRecordChange** (+ **(2026-11-05)** InoutRecordChange 1072 / WorkPlanEstablishment 1031): Cancel 컨트롤러 별도 없음. 결재 완료 후 사용자 취소 불가 (위 § 취소 가능 판정)

## 재택·기타·대체·계획·내역 — 검증 / TBD

### 검증 / [TBD]

- [x] ~~`TM_RMT_WORK_*` vs `TM_WORK_FOR_HOME_*` 관계~~ → **(2026-11-05 해소)** § 알려진 제약 참조
- [x] ~~결재 완료 후 취소 처리~~ → **(2026-11-05 해소)** 문서유형이 취소 불가(`isCancellable=false`)라 결재 완료 후 취소 불가, 결재 전 회수만 가능 (§ 취소 가능 판정)
- [x] ~~`Remote.tsx` / `WorkGroup.tsx` 용도~~ → **(2026-11-05 해소)** `origin/dev`의 template_drawer에 두 파일 없음 (삭제됨). 재택 신청서는 `HomeWork.tsx`
- [x] ~~`MultiLeavePeriodDialog.tsx` 용도~~ → **(2026-11-05 확인)** 휴가 신청서(`Leave.tsx`) 전용 다이얼로그, 근무 신청서와 무관 (휴가 영역)
- [x] ~~기타근무 항목 마스터가 어드민에서 어떻게 정의되는지~~ → **(2026-11-05 Slack 확인)** 어드민 근무관리 › 근무 설정 › **기타근무 항목 설정** 탭에서 생성/수정/삭제(같은 이름 중복 생성 불가), 근무 그룹 설정 › 기타근무 항목 관리에서 그룹별 사용 여부를 켬. 신규 항목은 모든 근무그룹에 '사용 안 함'으로 추가되고(2026-08), 그룹 복제 시는 원본 상태 유지. 어드민 직접 등록은 근무 데이터 관리 › 기타근무 현황 › 근무 수동등록(엑셀 업로드) — Slack #cx 2026-09-28, #sq-time 2026-08-10 (https://hcgtheplus.slack.com/archives/C04QC2RJJBU/p1786354921250659?thread_ts=1786332583.337449), #cx 2026-03-09 (https://hcgtheplus.slack.com/archives/C01AVJ2CJBW/p1773044800731839?thread_ts=1772778504.575099)
- [ ] `OtherWorkApplValidationDto` 의 구조 (코드 전용 — Slack 검색 생략)

## 재택·기타·대체·계획·내역 — 두현님 답변 필요

### 두현님 답변 받으면 좋을 것

1. ~~Cancel 컨트롤러가 없는 신청서의 결재 완료 후 취소~~ → **(2026-11-05 해소)** 사용자 취소 불가. **(2026-11-05 Slack 확인) 어드민 경로도 없음**: 어드민 근무 신청 내역 관리는 조회 전용이라 승인 문서 삭제·승인 취소 불가. 정정 원칙은 "기존 기록을 업데이트하는 신청서 → 취소 신청서 없음, 올바른 값으로 **다시 신청**(나중 승인 건이 최종)", "기록 자체를 지우는 신청서(휴가 등) → 취소 신청서". 대체근무는 날짜를 맞바꿔 재신청이 권장 안내이고, 차선책으로 어드민 개인 근무 스케줄 관리에서 **미래 일자** 개인 스케줄만 삭제 가능(신청서는 그대로, 삭제 이력은 내부 데이터로만). 지난 날짜·마감 기간은 화면으로 방법 없음(개발자 문의). 대체근무 취소 신청서는 고도화 예정이나 우선순위 밀림 — Slack #channeltalk 2026-11-03 (https://hcgtheplus.slack.com/archives/C06ULEEM88M/p1793671272279939?thread_ts=1793668757.494899)
2. ~~컴포넌트 용도~~ → **(2026-11-05 해소)** 위 체크리스트 참조
3. ~~재택/기타근무 Chip 우선순위~~ → **(2026-11-05 해소) 의도된 정책**. 기타근무와 재택이 칩 한 자리를 공유하고 기타근무가 우선 — "재택보다 근무가 중요도가 높고, 기타근무(대부분 외근)와 재택이 동시에 나오는 경우는 실사용에서 드물 것" (Slack #030 사용자 화면 스테이징 체크리스트 2025-02-07). 칩 노출 우선순위 근무 → 휴가 → 재택 원칙 (Slack #ch-ux 2024-10-23)

## ~~이 영역 문서에 없는 신청서~~ → 2026-11-05 추가 문서화된 신청서

~~`origin/dev` 기준 사용자 신청서 드로어에 아래 신청서가 더 있음 — 별도 페이지 미작성~~ → **(2026-11-05)** 아래 4개 신청서 모두 별도 페이지 작성 완료:

| 문서유형 | 화면명 | 문서 |
|---|---|---|
| 1122 / 1123 | 휴일 근무(사후) 신청 / 취소 | [휴일근무(사후) 신청](./holiday-work-post.md) |
| 1042 / 1043 | 연장/야간근무(사후) 신청 / 취소 | [연장/야간근무(사후) 신청](./overtime-post.md) |
| 1072 | 출퇴근 내역 변경 | [출퇴근 내역 변경 신청](./inout-record-change.md) |
| 1031 | 근무계획 수립 신청 | [근무계획 수립 신청](./work-plan-establishment.md) |

어드민 "근무 신청서 관리"의 신청서 목록도 근무계획 변경 / 근무계획 수립 / 통합 근무내역 변경 / 연장/야간근무(사전)·(사후) / 휴일근무(사전)·(사후) / 대체근무로 확장됨 (`ad:src/locales/ko/attendance.json:228-240`). 각 신청서 설정(사용 여부·설명·첨부/코멘트 필수 등)을 사용자 드로어가 읽어 "신청서 사용이 중지되었습니다." 모달, 첨부/코멘트 필수 검증에 사용.

## 관련 문서 — 휴일근무·연장/야간

### 관련 문서

- `KB:product/user/home/checkin-widget.md` — 출퇴근 위젯 사전 검증 로직, `applsInProgress` 12종 신청서
- `KB:product/admin/work/group-setting.md` — 근무그룹 `holiWorkPmitCd` / `otPmitCd` / `nightPmitCd` 권한 코드 체계
- `KB:product/admin/work/close-work-data.md` — 근무 마감 차단 (이 영역 § "근무 마감 차단" 적용)
- `KB:domain/business-rules.md` § 2 야간근무 / § 3 연장근무 / § 4 휴일근무
- **(2026-11-05)** `KB:product/user/applications/holiday-work-post.md` / `KB:product/user/applications/overtime-post.md` — 사후 신청서

## 관련 문서 — 재택·기타·대체·계획·내역

### 관련 문서

- `KB:product/user/applications/overview.md` — 신청서 표준 패턴 (이 문서의 베이스)
- `KB:product/user/home/checkin-widget.md` — 근무내역 변경 트리거 / 재택 Chip 표시 / 기타근무 요약
- `KB:product/admin/work/group-setting.md` — 그룹 설정 (workForHomePmitYn, compensatoryWorkPermitCode 등)
- `KB:product/admin/work/check-work-data.md` — 어드민 직접 수정 후 사용자 변경 신청 차단
- `KB:product/admin/work/close-work-data.md` — 마감 차단
- `KB:domain/business-rules.md` — § 1 근무시간 인정 / § 9 근무 마감
- **(2026-11-05)** `KB:product/user/applications/inout-record-change.md` — 출퇴근 내역 변경(1072) / `KB:product/user/applications/work-plan-establishment.md` — 근무계획 수립(1031, 선택적 근로제)
