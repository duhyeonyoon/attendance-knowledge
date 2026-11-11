# Attendance Cross-Reference Index

> 🚨 **답변 전 필독: [`_meta/response-style.md`](./_meta/response-style.md)** — 응답 스타일 가이드 (간결성 우선, 코드 디테일은 명시 요청 시에만). SKILL.md의 "답변 작성"보다 이 문서가 우선합니다.

⭐ **이 문서가 핵심.** 기능 → 체크리스트 → 코드 위치를 한 줄에 매핑합니다.
질문이 들어오면 이 표에서 영역을 식별한 뒤 관련 문서/코드로 진입하세요.

> **고객사 신규 도입 / 세팅 컨설팅 질문이면** → `operations/customer-setup-guide.md` 우선 참조 (의사결정 플레이북).
>
> **`<PR브리핑> : <GitHub PR 링크>` 형태 요청이면** → `operations/pr-review-playbook.md`를 그대로 따른다 (폴더 자동 연결 → Chrome로 PR 메타 → Slack 스레드 → 로컬 git diff → KB 맥락 → 고정 포맷 브리핑).

## 레포 약어

- **PP** = `~/Documents/ppfront` (사용자 화면)
- **AD** = `~/Documents/talenx-admin` (어드민 화면)
- **BE** = `~/Documents/optimiz/optimiz-time` (백엔드, 패키지 `com.hcg.optimiz.time`)

## 실제 메뉴 → 문서 맵 (2026-11-05 스테이징 확인) ⭐

기능 명세(`product/`)는 **실제 메뉴의 페이지 단위**로 나뉘어 있습니다. 질문이 어느 화면 얘기인지 알면 여기서 바로 문서로 가세요. 그룹 공통 내용(데이터 모델·코드 맵·공통 룰)은 각 폴더의 `overview.md`에 있습니다: `admin/module-setting/overview.md`(모듈 설정·권한), `admin/leave/overview.md`(휴가 도메인), `user/applications/overview.md`(신청서). ⚠️ 표시는 문서가 실제 화면과 다른 페이지입니다.

### 어드민 (ap-tx · 근무관리 탭)

| 메뉴 | URL | 탭 | 문서 |
|---|---|---|---|
| 모듈 설정 › 구성원 정보 | `/attendance/module_setting/member_information_management` | — | `product/admin/module-setting/member-information.md` |
| 모듈 설정 › 조직 설정 | `/attendance/module_setting/organization` | — | `product/admin/module-setting/organization.md` |
| 모듈 설정 › 직책 설정 | `/attendance/module_setting/duty_setting` | — | `product/admin/module-setting/duty-setting.md` |
| 권한 › 직책자 권한 | `/attendance/authority/manager` | — | `product/admin/authority/manager.md` |
| 권한 › 서브어드민 권한 | `/attendance/authority/custom` | — | `product/admin/authority/custom.md` |
| 근무 › 근무 설정 | `/attendance/work/base_setting` | 시간 조회 · 휴일 설정 · 출근지 설정 · 근무 템플릿 · 기타근무 항목 설정 | `product/admin/work/base-setting.md` |
| 근무 › 근무 그룹 설정 | `/attendance/work/group_setting` | — | `product/admin/work/group-setting.md` |
| 근무 › 근무 그룹 이력 관리 | `/attendance/work/group_setting_history_management` | — | `product/admin/work/group-history.md` |
| 근무 › 근무 데이터 관리 | `/attendance/work/check_work_data` | 전사 근무현황 · 출퇴근 내역 | `product/admin/work/check-work-data.md` |
| 근무 › 근무 신청 내역 관리 | `/attendance/work/appl_management` | 근무계획 변경 신청 · 통합 근무내역 변경 신청 · 출퇴근 내역 변경 신청 · 기타근무 신청 · 재택근무 신청 · 연장/야간 근무(사전) 신청 · 연장/야간 근무(사후) 신청 · 휴일근무(사전) 신청 · 휴일근무(사후) 신청 · 대체근무 신청 | `product/admin/work/appl-management.md` |
| 근무 › 근무 마감 | `/attendance/work/close_work_data` | 개인별 마감 상태 · 마감 내역 | `product/admin/work/close-work-data.md` |
| 근무 › 근무 대시보드 | `/attendance/work/dashboard` | — | `product/admin/work/dashboard.md` |
| 근무 › 개인 근무 스케줄 관리 | `/attendance/work/personal_work_template_management` | 근무 스케줄 · 선택적 근로 스케줄 | `product/admin/work/personal-schedule.md` |
| 휴가 › 휴가 설정 | `/attendance/leave/base_setting` | 연차 제도 · 연차 정산 기준 · 연차 외 휴가 제도 | `product/admin/leave/base-setting.md` |
| 휴가 › 휴가 그룹 설정 | `/attendance/leave/group_setting` | — | `product/admin/leave/group-setting.md` |
| 휴가 › 휴가 그룹 이력 관리 | `/attendance/leave/group_setting_history_management` | — | `product/admin/leave/group-history.md` |
| 휴가 › 연차 관리 | `/attendance/leave/annual_management` | 연차 보유현황 · 연차 사용 현황 | `product/admin/leave/annual-management.md` |
| 휴가 › 연차 외 휴가 관리 | `/attendance/leave/non_annual_management` | 연차 외 휴가 보유현황 · 연차 외 휴가 사용 현황 | `product/admin/leave/non-annual-management.md` |
| 휴가 › 연차 촉진 | `/attendance/leave/encouragement` | — | `product/admin/leave/encouragement.md` |
| 과거 데이터 관리 › 과거 근무 데이터 관리 | `/attendance/old_data_management/work_data` | — | `product/admin/old-data/work-data.md` |
| 과거 데이터 관리 › 과거 휴가 데이터 관리 | `/attendance/old_data_management/leave_data` | — | `product/admin/old-data/leave-data.md` |
| 근무관리 메뉴 외 — 인사관리·시스템 쪽에서 근무 모듈로 들어오는 연동 | — | — | `product/admin/etc/sync.md` |

### 사용자 (app-tx · 통합홈 + 근무관리 탭 + 근무 신청서)

| 메뉴 | URL | 탭 | 문서 |
|---|---|---|---|
| 통합홈 › 우측 출퇴근 카드 (출근/퇴근 버튼 · 근무 신청 · 근무 현황) | — | — | `product/user/home/checkin-widget.md` |
| 통합홈 › 출퇴근 카드 안 '근무 현황' 펼침 영역 | — | — | `product/user/home/work-status.md` |
| 통합홈 › 기간 근무시간 요약 카드 (실근무 / 소정근무 / 잔여근무) | — | — | `product/user/home/work-summary.md` |
| 통합홈 › 처리할 문서 · 근무 대시보드(평균 근무시간 등) · 예정 휴가 · 구성원 휴가 | — | — | `product/user/home/widgets.md` |
| 내 근무 | `/attendance/work` | (요약) 실근무 · 소정근무 · 잔여근무 + 근무 캘린더 | `product/user/attendance/my-work.md` |
| 내 휴가 | `/attendance/leave` | 예정휴가 · 사용기록 | `product/user/attendance/my-leave.md` |
| 구성원 근무 | `/attendance/member_work` | 구성원 근무 일정 · 구성원 근무 현황 | `product/user/attendance/member-work.md` |
| 구성원 휴가 | `/attendance/member_leave` | 구성원 휴가 일정 · 구성원 휴가 현황 | `product/user/attendance/member-leave.md` |
| 근무스케줄 | `/attendance/schedule` | 내 기준 · 역할 기준 | `product/user/attendance/schedule.md` |
| 위치정보 제공 조회 | `/attendance/location_access_logs` | — | `product/user/attendance/location-access-logs.md` |
| 연차촉진 | `/attendance/annual_leave_encouragement` | — | `product/user/attendance/annual-leave-encouragement.md` |
| 근무 신청 › 휴일근무(사전) | — | — | `product/user/applications/holiday-work.md` |
| 근무 신청 › 휴일근무(사후) | — | — | `product/user/applications/holiday-work-post.md` |
| 근무 신청 › 연장/야간근무(사전) | — | — | `product/user/applications/overtime.md` |
| 근무 신청 › 연장/야간근무(사후) | — | — | `product/user/applications/overtime-post.md` |
| 근무 신청 › 재택근무 | — | — | `product/user/applications/remote-work.md` |
| 근무 신청 › 기타근무 | — | — | `product/user/applications/other-work.md` |
| 근무 신청 › 대체근무 | — | — | `product/user/applications/compensatory-work.md` |
| 근무 신청 › 근무계획 변경 | — | — | `product/user/applications/plan-change.md` |
| 근무 신청 › 근무계획 수립 | — | — | `product/user/applications/work-plan-establishment.md` |
| 근무 신청 › 통합 근무내역 변경 (당일 / 과거) | — | — | `product/user/applications/reg-adjust.md` |
| 근무 신청 › 출퇴근 내역 변경 | — | — | `product/user/applications/inout-record-change.md` |

> 아래 두 표(어드민 #1–16 / 사용자 U1–U19)는 **QA 체크리스트 영역 번호 기준** 매핑입니다. 체크리스트 라인으로 찾을 때 쓰세요.

## 어드민 영역 (talenx-admin/.claude/qa-checklist/attendance.md 기준)

| # | 영역 | QA 체크리스트 | AD 코드 | BE 관련 | 상세 문서 |
|---|------|------|------|------|------|
| 1 | 연동 (인사/시스템 모듈) | L1–32 | `ad:src/config/api/attendance/` 인사 연동 + SyncMemberByApiController + SyncSecomRecordController | (인사 모듈 연계 + 세콤 외부 시스템) | ✅ `product/admin/etc/sync.md` |
| 2 | 모듈 설정 (구성원/조직/직책) | L34–71 | `ad:src/pages/attendance/module_setting/` (organization/duty_setting/member_information_management) + MemberInformationController + OrganizationSettingController | TM 직책/조직 (인사 연동) | ✅ `product/admin/module-setting/member-information.md` |
| 3 | 총괄 권한 | L73–77 | (시스템 권한 기반, 별도 화면 없음) | — | ✅ `product/admin/module-setting/overview.md` |
| 4 | 권한 (직책자/서브어드민) | L79–180 | `ad:src/pages/attendance/authority/` (manager + custom/auth_group_detail) + TimeAdminAuthGroupSettingController + TimeManagerAuthGroupController | 권한그룹 / 담당자 / 권한 범위 테이블 | ✅ `product/admin/authority/manager.md` |
| 5 | 근무설정 (시간/휴일/출근지/템플릿/기타근무) | L182–315 | `ad:src/pages/attendance/work/base_setting/` (5탭) + `ad:src/components/attendance/work/base_setting/contents/` (5개 탭 디렉토리) + ClientWorkSettingController | TM_TIME_OPTION (+ 회사별), TM_HOLI_CALEN, TM_WORK_PLC (+ IP/WIFI), TM_DD_WORK_PLAN, TM_ATTEND_ITEM | ✅ `product/admin/work/base-setting.md` |
| 6 | 근무그룹 설정 | L317–546 | `ad:src/pages/attendance/work/group_setting/[workGrpId]/` + `ad:src/components/attendance/work/group_setting/` (메인 + detail + 3 tabs) | TM_WORK_GRP, TM_WORK_GRP_HISTORY, TM_WORK_GRP_ATTEND_ITEM, TM_WORK_GRP_DD_WORK_PLAN, TM_WORK_GRP_WORK_PLAN, TM_WORK_GRP_WORK_PLC, TM_WORK_GRP_HOLI_CALEN, TM_WORK_GRP_CHG_APPL | ✅ `product/admin/work/group-setting.md` |
| 7 | 근무 데이터 관리 (전사현황/출퇴근내역) | L548–643 | `ad:src/pages/attendance/work/check_work_data/` + `ad:src/components/.../check_work_data/` (2탭) + `ad:src/config/api/attendance/checkWorkData.ts`, `inoutRecords.ts` | TM_INOUT_REG, TM_INOUT_REG_ADJST_DTL, TM_REST_REG, TM_DD_ATTEND_AGGR, TM_DD_WORK_AGGR, TM_MM_ATTEND_AGGR, TM_MM_WORK_AGGR | ✅ `product/admin/work/check-work-data.md` |
| 8 | 근무 신청 내역 관리 | L645–729 | `ad:src/pages/attendance/work/appl_management/` + `ad:src/components/.../appl_management/` (10탭) + `ad:src/config/api/attendance/applManagement.ts` + WorkApplManagementController | TM_DD_WORK_PLAN_CHG_APPL, TM_WORK_REG_ADJST_APPL, TM_INOUT_REG_ADJST_APPL, TM_OTHER_WORK_APPL, TM_WORK_FOR_HOME_APPL, TM_PSN_OT_PLAN_APPL, TM_PSN_OT_POST_APPL, TM_HOLIDAY_WORK_APPL, TM_POST_HOLIDAY_WORK_APPL, TM_COMPENSATORY_WORK_APPL | ✅ `product/admin/work/appl-management.md` |
| 9 | 근무 마감 | L731–752 | `ad:src/pages/attendance/work/close_work_data/` + `ad:src/components/.../close_work_data/` (2탭 + 상세) + `ad:src/config/api/attendance/closeWorkData.ts` | TM_CLOSE_WORK_DATA_HISTORY (+_MEMBER, _WORK_GROUP) + `closeYn` 컬럼이 TM_DD_*_AGGR 곳곳에 | ✅ `product/admin/work/close-work-data.md` |
| 10 | 근무 대시보드 (어드민) | L754–767 | `ad:src/pages/attendance/work/dashboard/` + `ad:src/components/attendance/work/dashboard/` + `ad:src/config/api/attendance/dashboard.ts` | TM_DD_WORK_AGGR, TM_MM_WORK_AGGR | ✅ `product/admin/work/dashboard.md` |
| 11 | 개인 근무 스케줄 관리 | L769–796 | `ad:src/pages/attendance/work/personal_work_template_management/` + `ad:src/components/attendance/work/personal_work_template_management/` | TM_EMP_WORK_PLAN, TM_EMP_EXCE_DD_WORK_PLAN, TM_PSN_WORK_PLAN_APPL | ✅ `product/admin/work/personal-schedule.md` |
| 12 | 휴가설정 (연차/연차정산/연차외) | L798–872 | `ad:src/pages/attendance/leave/base_setting/` (3종 룰) + `ad:src/components/attendance/leave/base_setting/contents/` | TM_LEAVE_SYSTEM, TM_LEAVE_CRT, TM_ANL_CRT_RULE, TM_ANL_CM_RULE | ✅ `product/admin/leave/base-setting.md` |
| 13 | 휴가그룹 설정 | L874–958 | `ad:src/pages/attendance/leave/group_setting/` + LeaveGroupSettingController + TimeLeaveAdminController | TM_LEAVE_GRP, TM_LEAVE_GRP_LEAVE_SYSTEM | ✅ `product/admin/leave/group-setting.md` |
| 14 | 휴가 지급 및 관리 (보유/사용/촉진) | L960–1245 | `ad:src/pages/attendance/leave/management/` (5탭) + `ad:src/components/attendance/leave/management/` + `ad:src/components/attendance/leave/encouragement/` + LeaveManagementController | TM_LEAVE_PAY_HISTORY, TM_LEAVE_PAY_HISTORY_ACCESS_TIME, TM_LEAVE_USE, TM_LEAVE_USE_HISTORY, TM_LEAVE_CRT | ✅ `product/admin/leave/annual-management.md` · `non-annual-management.md` · `encouragement.md` (메뉴 3개로 분리됨) |
| 15 | 과거 근무 데이터 관리 | L1247–1259 | `ad:src/pages/attendance/old_data_management/work_data/` + `ad:src/components/.../old_data_management/work_data/` + `ad:src/config/api/attendance/oldWorkDataManagement.ts` | OldWorkDataVo (조회 전용 별도 테이블) | ✅ `product/admin/old-data/work-data.md` |
| 16 | 과거 휴가 데이터 관리 | L1292–1308 (갱신) | `ad:src/pages/attendance/old_data_management/leave_data/` + `ad:src/components/.../old_data_management/leave_data/` + OldLeaveDataController | OldLeaveDataVo (조회 전용 별도 테이블) | ✅ `product/admin/old-data/leave-data.md` |
| **#H1** | **근무 그룹 이력 관리** ⭐신규 | **L552–560** | `ad:src/pages/attendance/work/group_setting_history_management/` + `ad:src/components/.../work/group_setting_history_management/` + WorkGroupHistoryController + WorkGroupHistoryQueryService | TM_WORK_GRP_HISTORY | ✅ `product/admin/work/group-history.md` |
| **#H2** | **휴가 그룹 이력 관리** ⭐신규 | **L981–989** | `ad:src/pages/attendance/leave/group_setting_history_management/` + `ad:src/components/.../leave/group_setting_history_management/` + LeaveGroupHistoryController + LeaveGroupHistoryQueryService | TM_LEAVE_GRP_HISTORY (추정) | ✅ `product/admin/work/group-history.md` |
| 📌 | 배포 이슈 리스트 (운영 메모) | L1309–end | (QA 항목 아님 — 운영팀 이슈 트래킹 placeholder) | — | 📌 `product/admin/work/group-history.md` 부록 참조 |

> **2026-05-15 갱신**:
> - **talenx-admin 체크리스트**: 신규 영역 2개 추가(`#H1` 근무 그룹 이력, `#H2` 휴가 그룹 이력) + 운영 메모(배포 이슈 리스트). 기존 영역 라인 일부 밀림 (예: 근무 데이터 관리 L548→L562, 근무 마감 L731→L745, 휴가지급 L960→L991, 과거 근무 데이터 L1247→L1278).
> - **ppfront 체크리스트**: 신규 영역 0개. 변화 = 상단 운영 규칙 헤더 8줄 신설 + 구성원 휴가 영역에 "수동부여 연차 외 휴가 테스트" 서브섹션 추가 (L559~). 모든 영역 라인 +8~+15 시프트.
> - 정확한 라인 확인이 필요하면 `attendance.md` 직접 grep 권장.

## 사용자 영역 (ppfront/.claude/qa-checklist/attendance.md 기준)

| # | 영역 | QA 체크리스트 | PP 코드 | BE 관련 | 상세 문서 |
|---|------|------|------|------|------|
| U1 | 통합홈 - 공통/워크플로우/근무대시보드/예정휴가/구성원휴가 | L1–51 | `pp:src/pages/main/` + `pp:src/containers/main/` + `pp:src/components/main/` (출퇴근 위젯 외 위젯들) | 워크플로우 시스템 / 휴가 / 근무 집계 테이블 다수 | ✅ `product/user/home/widgets.md` |
| U2 | 통합홈 - 근무 요약 정보 | L52–68 | `pp:src/components/attendance/work_info/` (Header/Content/WorkTimeSummary/WorkInfoCard/MemberSummary) | TM_DD_WORK_AGGR, TM_MM_WORK_AGGR | ✅ `product/user/home/work-summary.md` |
| U3 | 통합홈 - 출퇴근 위젯 (연장/야간/휴일 분기 다수) | L69–154 | `pp:src/components/main/work_commute/WorkComponent.tsx` (메인) + `contents/*.tsx` (16개) + `pp:src/modules/attendance/work_record.ts` (API) | TM_INOUT_REG, TM_REST_REG, TM_IN_APPL, TM_OUT_APPL, TM_PSN_OT_PLAN_APPL, TM_PSN_HOLI_WORK_APPL, TM_WORK_PLC | ✅ `product/user/home/checkin-widget.md` |
| U4 | 당일 근무 내역 변경 신청 | L155–166 | `pp:src/components/workflow/shared/template_drawer/contents/RegEdit.tsx` (U7과 동일 컴포넌트) | TM_WORK_REG_ADJST_APPL | ✅ `product/user/applications/reg-adjust.md` |
| U5 | 근무 현황 | L167–176 | (통합홈 위젯 일부) — `KB:product/user/home/widgets.md` § U1과 일부 중복 | (실시간 출퇴근 상태) | ✅ `product/user/home/work-status.md` |
| U6 | 내 근무 (캘린더, 누락 조건 등) | L179–209 | `pp:src/components/attendance/personal_work/` (캘린더 컴포넌트 5개) + `pp:src/lib/attendance/personalWork.ts` (3000줄+ 로직) + `pp:src/modules/attendance/personal_work.ts` + `pp:src/hooks/attendance/personal_work/useMyWorkCalendar.ts` | TM_DD_ATTEND_AGGR, TM_DD_WORK_AGGR, TM_DD_WORK_PLAN, TM_INOUT_REG, TM_LEAVE_USE, TM_LEAVE_APPL, TM_*_APPL 12종 | ✅ `product/user/attendance/my-work.md` (15 AttendType × 6 색상 × 24 flag 완전 정리) |
| U7 | 근무내역 변경 신청 + 밸리데이션 | L210–258 | `pp:src/components/workflow/shared/template_drawer/contents/RegEdit.tsx` + `pp:src/lib/attendance/custom/reg_edit_application/` | TM_WORK_REG_ADJST_APPL | ✅ `product/user/applications/reg-adjust.md` |
| U8 | 내 휴가 + 휴가 신청 밸리데이션 | L259–389 | `pp:src/components/attendance/personal_leave/contents/` (Header/잔여/캘린더/Drawer/리스트) + `pp:src/components/workflow/shared/template_drawer/contents/Leave.tsx` + `pp:src/modules/attendance/personal_leave.ts` + `pp:src/lib/attendance/__tests__/leaveValidation.test.ts` | TM_LEAVE_APPL, TM_LEAVE_APPL_DTL, TM_LEAVE_CANCEL_APPL, TM_LEAVE_USE, TM_LEAVE_USE_HISTORY | ✅ `product/user/attendance/my-leave.md` |
| U9 | 구성원 근무 + 근무 상세 | L390–499 | `pp:src/components/attendance/member_work/` (work_status_tab + day_schedule_tab + calendar) + `pp:src/modules/attendance/member_work.ts` | 워크플로우 / 근무 집계 / 신청서 12종 | ✅ `product/user/attendance/member-work.md` |
| U10 | 구성원 휴가 | L500–549 | `pp:src/components/attendance/member_leave/` (member_leave_summary_tab + member_leave_schedule_tab) + `pp:src/modules/attendance/member_leave.ts` | TM_LEAVE_APPL / 휴가 관련 테이블 | ✅ `product/user/attendance/member-leave.md` |
| U11 | 근무스케줄 (메인페이지) | L550–617 | `pp:src/pages/attendance/work_schedule_setting/` (index + edit) + `pp:src/components/attendance/work_schedule_setting/` (my_tab + role_tab + edit) + `pp:src/modules/attendance/work_schedule_setting.ts` | TM_EMP_WORK_PLAN, TM_EMP_EXCE_DD_WORK_PLAN, TM_WORK_GRP_WORK_PLAN | ✅ `product/user/attendance/schedule.md` |
| U12 | 위치정보 제공 조회 | L618–634 | `pp:src/pages/attendance/location_access_logs/` + `pp:src/components/attendance/location_access_logs/` + `pp:src/containers/attendance/location_access_logs/` | (개인정보 로그 별도 테이블) | ✅ `product/user/attendance/location-access-logs.md` |
| U13 | 연차촉진 (사용자) | L635–652 | `pp:src/pages/attendance/annual_leave_encouragement/` + `pp:src/components/attendance/annual_leave_encouragement/` + `pp:src/modules/attendance/annual_leave_encouragement.ts` | (연차촉진 작업 / 통지서 / 계획서 / 통보) | ✅ `product/user/attendance/annual-leave-encouragement.md` |
| U14 | 신청서 - 사전 휴일근무 | L655–676 | `pp:src/components/workflow/shared/template_drawer/contents/DayOff.tsx` + `pp:src/hooks/attendance/useHolidayWorkRequestValidation.ts` + `pp:src/modules/workflow/attendance/validation.ts` | TM_PSN_HOLI_WORK_APPL (+ HolidayWorkCancel) | ✅ `product/user/applications/overview.md` |
| U15 | 신청서 - 사전 연장/야간 | L677–714 | `pp:src/components/workflow/shared/template_drawer/contents/Overtime.tsx` + 승인/취소 측 + `pp:src/modules/workflow/document.ts` | TM_PSN_OT_PLAN_APPL, TM_PSN_OT_PLAN_CANCEL_APPL | ✅ `product/user/applications/overview.md` (묶음) |
| U16 | 신청서 - 재택근무 | L715–728 | `pp:src/components/workflow/shared/template_drawer/contents/HomeWork.tsx` + WorkForHomeAppls/CancelAppls 백엔드 | TM_WORK_FOR_HOME_APPL (+ DTL, CANCEL), TM_RMT_WORK_* | ✅ `product/user/applications/remote-work.md` |
| U17 | 신청서 - 기타근무 | L729–780 | `pp:src/components/workflow/shared/template_drawer/contents/OtherWorkApplications.tsx` + `pp:src/hooks/attendance/useAdminDirectOtherWorkDisplay.tsx` + OtherWorkAppls/CancelAppls 백엔드 | TM_WORK_FOR_HOME_APPL [TBD 별도 OtherWork 테이블?] | ✅ `product/user/applications/other-work.md` |
| U18 | 신청서 - 대체근무 | L781–805 | `pp:src/components/workflow/shared/template_drawer/contents/CompensatoryWork.tsx` + CompensatoryWorkAppls 백엔드 | TM_WORK_GRP_CHG_APPL (사용처 1) | ✅ `product/user/applications/compensatory-work.md` |
| U19 | 신청서 - 근무계획 변경 | L806–end | `pp:src/components/workflow/shared/template_drawer/contents/PlanEdit.tsx` + DdWorkPlanChangeAppls 백엔드 | TM_PSN_WORK_PLAN_APPL, TM_PSN_WORK_PLAN_CANCEL_APPL, TM_WORK_GRP_CHG_APPL | ✅ `product/user/applications/plan-change.md` |

## 비즈니스 룰 인덱스 (검증 필요한 핵심 룰들 — domain/business-rules.md 에서 상세)

- **연장근무 처리**: 자유허용 / 승인시에만 / 근무계획시간 외 모든 시간 — 체크리스트 L184–186 등
- **야간근무 (22시–06시)**: 승인시 가능 / 불가 — 체크리스트 L119, L134–142
- **휴일근무**: 승인시 가능 / 불가 — 체크리스트 L143–153
- **출퇴근 위치 (GPS)**: 등록 근무지 외 출/퇴근 처리 — 체크리스트 L72
- **근무 마감 후 제약**: 요청/승인/취소 모두 불가 — 체크리스트 L90
- **출근 인정 시각**: 인정시각 이전 출근은 근무시간 미인정 — 체크리스트 L75
- **근무내역 승인 vs 미승인 시 시간 인정 로직** — 체크리스트 L183–188

## 알림 시스템 연계

워크플로우/근무내역/휴가 등 다양한 이벤트가 talenx 알림과 연계됨. 사용자가 통합알림 설정에서 off 가능. (체크리스트 L20–22, L78, L91–93 등)

---

**범례**
- `[TBD]` = 아직 매핑 안 됨 (Phase 2 후속 작업으로 채울 예정)
- 표의 라인 번호는 QA 체크리스트 절대 라인입니다 (영역 식별용)
