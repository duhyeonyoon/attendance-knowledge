---
sidebar:
  order: 0
---

# 휴가 도메인 공통 (데이터 모델·코드 맵·룰)

> **원본** `product/_legacy/leave-domain.md`

어드민 휴가 화면들과 사용자 [내 휴가](../../user/attendance/my-leave.md)에 공통으로 걸리는 데이터 모델, 코드 위치, 비즈니스 룰을 모은 페이지입니다.

## 개요

휴가는 attendance 안에서도 **별도의 큰 서브 도메인**. 4개 영역이 위계적으로 연결됨:

```
[어드민 #12 휴가설정]                          ← 마스터 데이터 정의
   ├─ 연차 제도 (Annual Leave Rule)
   ├─ 연차 정산 기준 (Annual Leave Operation Rule)
   └─ 연차 외 휴가 제도 (Non-Annual Leave Rule)
        ↓ (휴가그룹이 상속)
[어드민 #13 휴가그룹 설정]                     ← 정책 단위 (구성원 묶음)
   └─ 휴가그룹 + 휴가제도 매핑 + 구성원 매핑
        ↓ (구성원에게 적용)
[어드민 #14 연차 관리 / 연차 외 휴가 관리 / 연차 촉진]  ← 운영 (2026-08 메뉴 분리)
   ├─ 연차 관리: 연차 자동생성 / 조정 / 정산 / 수동 등록
   ├─ 연차 외 휴가 관리: 수동 지급 / 정산 / 삭제 / 수동 등록
   └─ 연차 촉진: 미사용 연차 통지 → 사용시기 지정·통보 → 노무수령거부
        ↓ (사용자가 사용)
[사용자 U8 내 휴가]                            ← 신청·사용
   ├─ 잔여/예정/사용 기록 조회
   └─ 휴가 신청 (workflow → 승인)
```

## QA 체크리스트

`talenx-admin/.claude/qa-checklist/attendance.md`:
- **휴가설정** (#12): L798–872 (74줄)
- **휴가그룹 설정** (#13): L874–958 (84줄)
- **휴가지급 및 관리** (#14): L960–1245 (285줄) — 가장 큼, 연차촉진 포함. 체크리스트는 통합 화면 시절 기준이며 현재 화면은 연차 관리(L962–1030, L1092–1153) / 연차 외 휴가 관리(L1031–1091, L1154–1198) / 연차 촉진(L1199–1245)으로 나뉨
  - 단, **연차촉진은 사용자 영역(U13)에서 별도 deep-dive 필요** — 이 문서는 어드민 측 연차촉진 운영만 다룸

`ppfront/.claude/qa-checklist/attendance.md`:
- **내 휴가** (U8): L259–389 (130줄)

## 휴가 도메인 데이터 모델

### 3 종류의 마스터 엔티티 (어드민 #12에서 정의)

| 엔티티 | 어드민 메뉴 | 백엔드 테이블 | 역할 |
|------|------|------|------|
| **연차 제도** | 휴가설정 > 연차 제도 | `TM_LEAVE_SYSTEM` (annual type), `TM_ANL_CRT_RULE` | 연차 부여 룰 (회계연도/입사일 기준, 연차 사용 시간대 등) |
| **연차 정산 기준** | 휴가설정 > 연차 정산 기준 | `TM_ANL_CM_RULE` 또는 별도 | 의무 사용, 이월, 보상 룰 |
| **연차 외 휴가 제도** | 휴가설정 > 연차 외 휴가 제도 | `TM_LEAVE_SYSTEM` (non-annual type) | 경조사/병가/기타 휴가 룰 |

### 휴가그룹 (어드민 #13)

| 엔티티 | 백엔드 테이블 | 역할 |
|------|------|------|
| **휴가그룹** | `TM_LEAVE_GRP` | 휴가 정책 단위 (구성원 묶음) |
| **휴가그룹-제도 매핑** | `TM_LEAVE_GRP_LEAVE_SYSTEM` | 그룹에 어떤 제도/정산기준을 적용할지 |

> 휴가그룹은 근무그룹과 별개. 같은 구성원이 다른 휴가그룹 + 다른 근무그룹에 속할 수 있음

### 운영 데이터 (어드민 #14)

| 엔티티 | 백엔드 테이블 | 역할 |
|------|------|------|
| **휴가 생성** | `TM_LEAVE_CRT` | 연차 자동/수동 생성 결과 |
| **휴가 지급 이력** | `TM_LEAVE_PAY_HISTORY`, `TM_LEAVE_PAY_HISTORY_ACCESS_TIME` | 지급 이력 |
| **휴가 사용** | `TM_LEAVE_USE`, `TM_LEAVE_USE_HISTORY` | 사용 기록 |

### 신청 데이터

| 엔티티 | 백엔드 테이블 | 역할 |
|------|------|------|
| **휴가 신청** | `TM_LEAVE_APPL`, `TM_LEAVE_APPL_DTL` | 사용자 신청서 |
| **휴가 취소 신청** | `TM_LEAVE_CANCEL_APPL` | 결재 완료 후 취소 신청 |

## 코드 위치 — 3개 레포 매핑

### Admin 프론트 (`ad:src/`)

```
pages/attendance/leave/
├── base_setting/                                   ← 휴가설정 (#12)
│   ├── annual_leave_rule/                          ← 연차 제도
│   ├── annual_leave_operation_rule/                ← 연차 정산 기준
│   └── non_annual_leave_rule/                      ← 연차 외 휴가 제도
├── group_setting/                                  ← 휴가그룹 (#13)
├── management/index.tsx                           ← (구) 휴가 지급 및 관리 → annual_management 로 리다이렉트
├── annual_management/                              ← 연차 관리 (?tab=summary|usage)
│   └── summary_record_tab/
│       ├── edit/                                   ← 연차 조정 페이지
│       └── history/                                ← 부여 내역
├── non_annual_management/                          ← 연차 외 휴가 관리 (?tab=summary|usage)
│   └── summary_record_tab/history/                 ← 연차 외 휴가 지급 내역
├── group_setting_history_management/               ← 휴가그룹 이력 관리
└── encouragement/                                  ← 연차촉진
    └── [annualLeaveEncouragementId]/

components/attendance/leave/
├── base_setting/contents/                          ← 4탭 설정
│   ├── annual_leave_rule_tab/                      ← 연차 제도
│   │   └── detail/
│   ├── annual_leave_settlement_rule_tab/           ← 연차 정산 기준
│   │   └── detail/
│   └── non_annual_leave_rule_tab/                  ← 연차 외 휴가 제도
│       └── detail/
├── annual_management/contents/                     ← 연차 관리 (2026-08 분리, #4185)
│   ├── summary_record_tab/                         ← 연차 보유현황 ⭐
│   │   ├── contents/ManualAnlCreationDialog.tsx    (연차 자동 생성)
│   │   ├── contents/AnnualLeaveSettlementDialog.tsx (연차 정산)
│   │   └── edit/                                   (연차 조정)
│   └── usage_record_tab/                           ← 연차 사용 현황 ⭐
│       └── contents/leave_registration_dialog/     (연차 수동등록)
├── non_annual_management/contents/                 ← 연차 외 휴가 관리
│   ├── summary_record_tab/                         ← 보유현황 (수동 휴가 지급·정산·삭제)
│   └── usage_record_tab/
│       └── contents/leave_registration_dialog/     (휴가 수동등록)
└── encouragement/                                  ← 연차촉진
    └── detail/contents/
        ├── employee_overview_step/
        ├── unused_leave_notification_step/
        ├── usage_period_assignment_step/
        └── work_refusal_overview_step/

hooks/attendance/leave/
├── base_setting/
├── group_setting/
├── management/
└── encouragement/

config/api/attendance/
├── leaveManagement.ts                              ← 휴가 지급/관리 API 클라이언트
├── leaveEncouragement.ts                           ← 연차촉진 API
├── settingByLeaveGroup.ts                          ← 휴가그룹 API
└── oldLeaveDataManagement.ts                       ← 과거 휴가 데이터 (#16)
```

### Backend (`be:com/hcg/optimiz/time/`)

```
controller/setting/
├── ClientLeaveSettingController.java               ← 클라이언트 휴가 설정 (#12 마스터)
├── LeaveGroupSettingController.java                ← 휴가그룹 설정 (#13)
└── TimeLeaveAdminController.java                   ← 휴가 어드민 보조 (휴가제도 조회 등)

controller/leaveadmin/
└── LeaveManagementController.java     ⭐ 휴가 지급 및 관리 (#14) 메인

controller/leavecreation/
└── LeaveCreationController.java                    ← 휴가 생성

controller/encouragement/
└── UserAnnualLeaveEncouragementController.java    ← 사용자 연차촉진 (U13)

controller/appls/
├── LeaveApplsController.java                       ← 휴가 신청 (사용자)
├── LeaveCancelApplsController.java                 ← 휴가 취소 신청
└── dto/LeaveApplsControllerDto.java

controller/widget/
└── MemberLeaveCalendarWidgetController.java        ← 구성원 휴가 캘린더 위젯

controller/olddata/
└── OldLeaveDataController.java                     ← 과거 휴가 데이터 (#16)
```

### ppfront (`pp:src/`)

```
components/attendance/personal_leave/contents/
├── Header.tsx                                      ← 상단 헤더 (연차 전체/사용/잔여)
├── ResidualAnnualLeave.tsx                         ← 잔여 연차 표시
├── CalendarBody.tsx                                ← 캘린더
├── DayContents.tsx                                 ← 일자 콘텐츠
├── LeaveApplItem.tsx                               ← 신청서 항목
├── LeaveApplList.tsx                               ← 신청서 리스트
├── MemberLeaveCalendar.tsx                         ← 구성원 휴가 캘린더 (즐겨찾기)
└── PersonalLeaveDrawer.tsx                         ← 신청 drawer

components/workflow/shared/template_drawer/contents/
└── Leave.tsx                                       ← 휴가 신청서 본체 (template_drawer)

@types/customTypes/attendance/personalLeave.d.ts    ← 타입 정의

modules/attendance/personal_leave.ts                ← Redux 모듈 (큰 파일, 5KB)
modules/attendance/annual_leave_encouragement.ts    ← 연차촉진 모듈
modules/attendance/avaliableLeaveUI.ts              ← 사용 가능 휴가 UI (오타: avaliable)

lib/attendance/__tests__/leaveValidation.test.ts    ← 휴가 밸리데이션 단위 테스트
```

## 연차·연차 외 휴가 관리 공통 패턴

### 공통 패턴 (연차 관리 2탭 + 연차 외 휴가 관리 2탭)

두 메뉴는 필터 상태를 `SharedLeaveManagementFilterProvider`로 공유 (`ad:src/components/attendance/shared/leave_management/`).

**조회 필터** (탭별 약간 다름):
- 연도별 조회 / 기간 조회 라디오
- 구성원 (비활성 구성원도 포함, "이름(비활성)" 포맷)
- 회사 / 조직 / 휴가그룹 / 휴가유형 / 활성여부
- 사용 현황 탭은 추가로 "등록방식" 필터

**필수 옵션 디폴트**:
- 연도별 = 당해년도
- 기간 = 당해년도 1월 1일 ~ 조회 당일

**공통 액션**:
- [필터 재설정]
- 엑셀 다운로드 (사유 필수)
- 그리드 헤더 정렬 (지정 필드 한정)
  - 보유: 사번/이름/조직/직급/휴가그룹/입사일/연차유형/귀속연도/일반/적립/사용시작일/사용종료일
  - 사용: + 등록방식/상태

## 휴가 관리 API (LeaveManagementController)

### LeaveManagementController API 엔드포인트 (#14 백엔드)

| Method | Path | 용도 |
|--------|------|------|
| GET | `/time/leave-management/init` | 화면 기본정보 (필터 옵션 등) |
| POST | `/time/leave-management/anl-leaves/search` ⭐ | 연차 보유현황 조회 |
| POST | `/time/leave-management/anl-leaves/excel-download/search` | 연차 보유현황 엑셀 |
| POST | `/time/leave-management/non-anl-leaves/search` ⭐ | 연차 외 보유현황 조회 |
| POST | `/time/leave-management/non-anl-leaves/excel-download/search` | 연차 외 보유현황 엑셀 |
| POST | `/time/leave-management/anl-leaves/settlements/close` | 연차 정산 확정 |
| POST | `/time/leave-management/anl-leaves/settlements/cancel` | 연차 정산 취소 |
| POST | `/time/leave-management/anl-leave-payments` | 연차 지급(조정) |
| POST | `/time/leave-management/non-anl-leave-payments` | 연차 외 지급 적용 (수동 휴가 지급) |
| POST | `/time/leave-management/non-anl-leave-payments/excel-upload` | 엑셀 업로드 수동 지급 |
| PUT | `/time/leave-management/non-anl-leaves/cancel` | 연차 외 지급 취소(삭제) |
| GET | `/time/leave-management/leave-payment-histories` | 휴가 지급 내역 조회 |
| GET | `/time/leave-management/leave-payment-histories/updated` | 지급 내역 업데이트 여부 |
| GET | `/time/leave-management/leave-usable-emps/{leaveSystemId}` | 휴가 사용가능 대상자 조회 |
| PUT | `/time/leave-management/anl-leaves/init` | 특정 사원 연차 수동 초기화 |
| POST | `/time/leave-management/anl-leaves/init/current-status/search` | 초기화 대상 현황 조회 |
| POST | `/time/leave-management/annual-leave-usage/search` | 연차 사용 현황 조회 |
| POST | `/time/leave-management/annual-leave-usage/manual` ⭐ | 연차 수동 등록 |
| POST | `/time/leave-management/annual-leave-usage/excel-upload` | 엑셀 업로드 수동 등록 |
| PUT | `/time/leave-management/annual-leave-usage/cancel` | 수동등록 취소(삭제) |

## Cross-domain 효과

| 휴가 영역 동작 | 다른 영역 영향 |
|------|------|
| 어드민 휴가 제도 변경 | 휴가그룹 매핑 변경 가능성 / 사용자 잔여 표시 / 신청 시 옵션 |
| 어드민 휴가그룹 구성원 변경 | 구성원이 해당 그룹의 휴가제도/정산기준을 즉시 상속 |
| 어드민 연차 자동생성 | 사용자 잔여 휴가 표시 / 사용자 캘린더에 표시 가능 |
| 어드민 수동 휴가 지급/등록 | 사용자 화면에 "관리자 등록 휴가" 별도 모달 표시 |
| 어드민 연차 정산 | 사용자 신청 시 정산된 휴가는 차단 ("정산된 경우 요청 불가") |
| 사용자 휴가 신청 → 승인 | 잔여 차감 / 어드민 사용 현황 탭에 노출 |
| 근무 마감 | 마감일 휴가 요청/승인/취소 모두 불가 (`KB:product/admin/work/close-work-data.md`) |
| 어드민 직접 등록 휴가 → 사용자 | 신청서가 아닌 **별도 확인 모달** (`AdminDirectLeaveDialog`) |
| 연차촉진 → 사용자 | 사용자 화면 연차촉진 화면 + 통지/계획서 전자문서 + 노무수령거부 팝업 |

## 비즈니스 룰 (휴가 도메인)

1. **휴가 제도/정산기준은 어드민 마스터 정의 → 휴가그룹 상속 → 구성원 적용** 3단계
2. **이미 휴가그룹에 매핑된 제도/정산기준은 사용여부 변경/삭제 불가** — 정합성 보호
3. **연차 정산은 귀속연도 단위**, 1년 미만 연차는 합산 처리. 1년 미만 연차의 부족분(총사용 − 총부여)은 정산 기준의 "1년 미만 연차(월차) 정책"대로 청산 (2026-09, `hcgtheplus/optimiz-time#1642`)
4. **다음 귀속연도 정산 시 이전 정산 취소 불가**
5. **마감일 휴가 요청/승인/취소 모두 불가**
6. **정산된 휴가 요청/승인/취소 불가**
7. **연차 외 휴가는 사용자용/어드민용 이름 분리 가능**
8. **휴가 사용 시간 고정 설정 시 30분 단위 검증 비적용 + 근무계획 무관 사용 가능**
9. **휴가 일수 계산 = 분 / (일소정근로시간 × 60)**, 소수점 둘째자리 반올림
   - "일소정근로시간" = 일계획 `workTimeCd` > 근무그룹 `cenDdWorkTime` > 480분 (UseLeaveService.java:1117–1120, CenDdWorkTimeUtil#resolveWorkMinutes)
10. **사용자 출근 가능시간**: 시스템 기본 6시, 익일 고정출근 있으면 (익일출근 - 2시간)까지
11. **1년 미만 연차 부여방식**:
    - **선부여 (1건)**: 같은 사용기간으로 일괄 부여
    - **다건 분할**: 별도 사용기간/개수, 상세 모달로 확인
12. **연차촉진 = 시스템 전자문서 + 노무수령거부 알림** 통합 워크플로우
13. **휴가그룹 = 근무그룹과 독립** — 같은 구성원이 서로 다른 휴가/근무그룹 가능
14. **수동 휴가 지급 단위 = 시간만** (의도된 설계): 일 단위 = 모호함 (회사/사람마다 소정근로시간 달라 "1일"이 8시간일지 7시간일지 명확하지 않음)
15. **어드민 직접 등록 휴가**: `AdminDirectLeaveDialog` 별도 다이얼로그, 신청서 워크플로우 우회
16. **차감 순서 = 사용 종료일이 빠른 생성분부터** (만료 임박 우선, 귀속연도 순 아님) — `be:service/leaveuse/CalcLeaveService.java:107` (2026-11-05 dev 재확인)
17. **초과 사용**:
    - 정상연차: 연차 제도 "연차 초과 사용" 허용 시 (제한 없음 / 최대 N시간). 결말은 정산 기준 "연차 초과 사용분 정산 정책" (전체 이월 = 다음 해 연차에 음수 이월, 전체 소멸 = 탕감, 전체 보상)
    - 1년 미만 연차: **2026-09-17부터** 연차 제도 "1년미만연차 초과 사용" 허용 시 가능 (기본 꺼짐). 확정 시점 도래분 기준, 한도는 사이클 총량, 초과분은 사용일을 덮는 도래 생성분 중 사용종료일이 가장 늦은 건에 음수 잔여로 기록 (`hcgtheplus/optimiz-time#1642`, `be:pojo/leave/MonthlyAnnual*`)
    - 연차 외 휴가: 초과 사용 없음 (`CalcLeaveService` TODO)
    - 재계산 경로(규칙 변경·조정·취소 배치)는 초과 사용 제한을 우회 — 이미 초과된 상태는 보존
18. **1년 미만 연차 귀속연도(`CRT_YY`) = 연차기산일의 회계연도** (정상연차는 작업 연도). 선부여(`evmCrtMth=BF`)일 때만 작업 연도 (`be:LeaveCreationService.java:1518–1600`)
19. **`TM_LEAVE_CRT.USE_M_CNT`에는 확정 사용분만** 저장 (신청중은 계산 중에만 잔여 차단)
20. **연차 생성은 근무율(80%/만근)과 무관** — `LeaveCreationService.java:88` TODO
21. **잔여 마이너스 합산 표시는 사양** (예: 2025 −2일 + 2026 15일 → 13일)

## 알려진 제약 / 임시 동작

- 연차촉진 작업 **삭제 기능 없음** (2025.07.09 기준, 추가 계획 없음 — 확인됨)
- 휴먼컨설팅그룹 클라이언트는 연차촉진 프로덕션 체크리스트 진행 안 함
- 수동 휴가 지급의 단위는 **시간만 지원** — **의도된 설계**. 소정근로시간이 회사/사람마다 달라 일 단위가 모호함을 일으키므로 시간 단위로 강제

## 검증 / [TBD]

- [ ] `TM_LEAVE_SYSTEM` 의 연차/연차외 type 구분 컬럼 (정확한 이름) — (2026-11-05 Slack 재검토 생략: 코드 수준, 기획 영향 없음)
- [x] ~~`TM_ANL_CRT_RULE` vs `TM_ANL_CM_RULE` 책임 분리~~ **(2026-07-29 해소, 2026-11-05 본문 반영)** — `TM_ANL_CM_RULE`(연차 보상 및 적립 기준, 2024)은 validation에서만 참조되는 **죽은 코드**. 현행 정산은 `TM_ANNUAL_LEAVE_OPERATION_RULE`(2025-11) + `TM_LEAVE_GRP.ANNUAL_LEAVE_OPERATION_RULE_ID`. `TM_ANL_CRT_RULE` 한 로우에 정상연차(`ANL_*`)와 1년 미만 연차(`EVM_*`) 설정이 함께 있음 (`_learnings/2026-07-29-annual-leave-concept-map.md` §1, `hcgtheplus/optimiz-time#1642`)
- [ ] `TM_LEAVE_GRP_LEAVE_SYSTEM` 매핑 구조 (다대다 + 정산기준 어디?) — (2026-11-05 Slack 재검토 생략: 코드 수준, 기획 영향 없음)
- [ ] `TM_LEAVE_CRT` 컬럼 — 생성 이벤트 추적 메커니즘 — (2026-11-05 Slack 재검토 생략: 코드 수준, 기획 영향 없음)
- [x] ~~`TM_LEAVE_PAY_HISTORY_ACCESS_TIME` 용도~~ **(2026-11-05 해소)** — 어드민(로그인 구성원)별·관리구분(`LEAVE_MANAGE_CLASS`: ANL 등)별 **[부여 내역]/[지급 내역] 화면 마지막 열람 시각**. 권한 범위 내 `TM_LEAVE_PAY_HISTORY` 최신 수정 시각이 이보다 늦으면 `leave-payment-histories/updated`가 true → 버튼 빨간 점 깜빡임 (`be:SQL/time/leaveadmin/LeaveManagementMapper.xml` `getLeavePayHistoryLastAccessTime`/`getLeavePaymentLastTimeWithAuth`/`insertLeavePayHistoryAccessTime`)
- [x] ~~연차 자동생성 시 회계연도 기준 vs 입사일 기준의 정확한 분기 로직~~ → **(2026-11-05 Slack 확인)** 생성 기준일(회계연도 시작일 / 입사월일)에 소속된 휴가그룹 설정으로 생성, 첫 해는 근속연수 0년 행 기준(회계연도: 없으면 15일 기준 일할·월할 / 입사일: 없으면 0년차 미생성) — Slack #channeltalk 2026-04-27, #sq-time 2025-12-15. 상세 `KB:product/admin/leave/base-setting.md`
- [x] ~~정산 취소 시 "다음 귀속연도 잔여가 이월분보다 적으면 회수 불가" 의 정확한 로직 위치~~ → **(2026-11-05 Slack 확인)** 기획 결정: 차년도 잔여 < 이월 일수면 정산 취소 에러, 충분하면 이번 정산에서 넘어간 이월분만큼 차년도 이월에서 회수. 연차 외 휴가는 이월분을 썼으면 취소 불가 — Slack #ch-plan 2025-12-04 (https://hcgtheplus.slack.com/archives/C02VCP9MBQV/p1764832416057689?thread_ts=1761704202.867549&cid=C02VCP9MBQV). 코드: `be:service/leaveadmin/AnnualLeaveSettlementService.prepareLeaveCrtToCancel`
- [ ] `available-inout-info` API 응답 구조 (당일/익일 출근가능시간 계산) — (2026-11-05 Slack 재검토 생략: 코드 수준, 기획 영향 없음)
- [x] ~~1년 미만 연차의 "선부여" 부여방식 코드 값~~ **(2026-11-05 해소)** — `evmCrtMth = BF` (선부여). 이때만 `CRT_YY`가 작업 연도, 그 외는 연차기산일의 회계연도 (`be:LeaveCreationService.java:1518–1600`)
- [x] ~~`AdminDirectLeaveDialog` 흐름 (어드민 직접 등록 → 사용자 측 표시) 상세~~ → **(2026-11-05 Slack 확인)** 사용자 화면에서는 연차/연차 외 구분 없이 '관리자 등록' 휴가를 신청서 대신 **별도 모달(모바일은 드로워)**로 보여줌. 적용 화면: 내 근무 / 내 근무 상세 / 내 휴가 / 구성원 근무. 데이터는 기존 휴가 응답에 '신청 / 어드민 직접 등록' 구분값만 추가 — Slack #sq-time 2025-03-27 (https://hcgtheplus.slack.com/archives/C04QC2RJJBU/p1743052963553049?thread_ts=1743051920.971759&cid=C04QC2RJJBU, 로드맵 368)
- [ ] `LeaveApplsController` 의 휴가 신청 표준 액션 path (다른 신청서와 같은 패턴인지) — (2026-11-05 Slack 재검토 생략: 코드 수준, 기획 영향 없음)
- [x] ~~휴가그룹의 임시저장/확정 패턴이 근무그룹과 동일한지 (UI는 같아 보이는데 백엔드 동일?)~~ → **(2026-11-05 Slack 확인)** 백엔드도 같은 패턴(임시저장 여부 플래그 + 최초 생성/임시저장 전용 API, 확정 저장은 기존 저장 API) — Slack #sq-time 2024-08-05~19. 차이였던 '임시저장 상태인데 변경 없으면 [저장] 비활성'은 2026-06 근무그룹과 같게 수정(임시저장 상태면 변경 없어도 저장=확정 가능) — Slack #sq-time 2026-06-05 (https://hcgtheplus.slack.com/archives/C04QC2RJJBU/p1780643572910569?thread_ts=1780633505.503649&cid=C04QC2RJJBU), `hcgtheplus/talenx-admin#3818`

## 확인 완료 (해소된 [TBD])

- ✅ **(2026-11-05) 메뉴 분리** — 휴가 지급 및 관리 → 연차 관리 / 연차 외 휴가 관리 (2026-08-20, `hcgtheplus/talenx-admin#4185`). 옛 URL `/attendance/leave/management`는 연차 관리로 리다이렉트
- ✅ **(2026-11-05) 1년 미만 연차 초과 사용** — "초과 사용은 정상연차 전용"은 2026-09-17 이전 기준. 지금은 연차 제도 옵션으로 1년 미만 연차도 가능 (위 룰 17)

- ✅ **수동 휴가 지급 단위 = 시간만** — 의도된 설계 (소정근로시간이 회사/사람마다 달라 일 단위가 모호함을 일으키므로)
- ✅ **연차촉진 작업 삭제 기능** — 추가 계획 없음
- ✅ **휴먼컨설팅그룹 연차촉진 제외** — 현 deep-dive에서는 무관

## 잔여 두현님 답변 필요 항목

- ~~**`TM_RMT_WORK_*` vs `TM_WORK_FOR_HOME_*`**~~ ✅ **해소 (2026-05-19)**: 현행은 workForHome 단일 시스템. rmtWork는 timeold 패키지 legacy 잔재 + 일부 dead VO. 휴가 영역엔 이중 테이블 없음. 자세한 분석은 `KB:_learnings/2026-05-19-remote-vs-workforhome.md`

## 관련 문서

- `KB:operations/customer-setup-guide.md` ⭐ — **고객사 휴가 제도 세팅 의사결정** (연차 제도 / 연차 외 휴가 / 휴가그룹 / 자주 나오는 휴가 유형별 세팅 방향)
- `KB:product/user/applications/overview.md` — 신청서 표준 패턴 (휴가 신청도 같은 패턴)
- `KB:product/admin/work/group-setting.md` — 휴가그룹과 동일한 그룹 패턴
- `KB:product/admin/work/close-work-data.md` — 마감일 휴가 차단
- `KB:product/user/applications/overview.md` — 기타 신청서들과의 관계
- `KB:domain/business-rules.md` — § 9 근무 마감 후 제약
