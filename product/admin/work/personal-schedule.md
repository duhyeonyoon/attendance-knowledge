---
sidebar:
  order: 8
---

# 개인 근무 스케줄 관리

> **메뉴** 근무관리 › 근무 › 개인 근무 스케줄 관리  
> **URL** `/attendance/work/personal_work_template_management` (탭은 URL 파라미터로 유지, 기본 탭 = 근무 스케줄)  
> **탭** 근무 스케줄 · 선택적 근로 스케줄  
> **원본** `product/_legacy/admin-personal-schedule.md`

> ~~⚠️ 실제 화면과 차이: 선택적 근로 스케줄 탭 미정리~~ → **(2026-11-05 해소)** talenx-admin `origin/dev` 코드 기준으로 2탭 모두 정리. 선택적 근로 스케줄 탭은 hcgtheplus/talenx-admin#4176 "[근무] 선택적근로제 - admin - 개인별 근무계획수립 현황 조회" (2026-08-20)로 추가.

## 개요

**근무그룹의 그룹스케줄과 별개**로 구성원별로 지정된 개인스케줄(개인 근무 계획)을 어드민이 조회·등록·삭제하는 화면. 화면 안내 문구: "근무그룹의 기준 스케줄과 개인별로 변경된 근무 스케줄을 조회하고 수정합니다."

- **근무 스케줄 탭**: 구성원 × 근무일 단위로 그룹 스케줄과 개인 스케줄을 나란히 보여주고, 개인 스케줄을 **엑셀로 일괄 등록**하거나 **삭제**
- **선택적 근로 스케줄 탭**: 선택적 근로시간제 대상자가 직접 수립한 근무 스케줄을 **조회만** (안내 문구 "선택적 근로시간제 대상자가 직접 수립한 근무 스케줄을 조회합니다.") — 수립 경로는 [근무계획 수립 신청](../../user/applications/work-plan-establishment.md) (2026-11-05 링크 추가)

> **명명 정정 (2026-05-13 두현님 확인)**:
> - **근무 스케줄 = 근무 계획** (동의어)
> - **근무 계획의 종류 = 근무 템플릿**
> 
> 따라서 **`personal_work_template_management` = "개인 근무 템플릿 관리" = 개인별 근무 계획(스케줄)의 종류 관리**. UI 표기 "개인 근무 스케줄 관리"와 정합. **명명 불일치 아님**.

## 진입 위치

- 어드민 메뉴: 근무관리 > 개인 근무 스케줄 관리
- URL: `/attendance/work/personal_work_template_management`
- 권한: 서브어드민 "개인 근무 관리" (`JOB_AUTH_TM.PERSONAL_WORK_PLAN_MANAGE`) 또는 `TALENX_TIME_ADMIN` — 두 탭 API 모두 동일 권한

## QA 체크리스트

`talenx-admin/.claude/qa-checklist/attendance.md` **L769–796** (28줄) — 탭·엑셀 업로드 추가 전(근무 스케줄 조회·삭제만) 기준.

## 코드 위치

```
pages/attendance/work/personal_work_template_management/

components/attendance/work/personal_work_template_management/
├── index.tsx                                         ← 2탭 컨테이너 (useTabParam)
└── contents/
    ├── Header.tsx                                    ← 제목 + 탭
    ├── work_schedule_tab/                            ← 근무 스케줄 탭
    │   ├── index.tsx
    │   └── contents/
    │       ├── Header.tsx                            ← 안내 문구 + "스케줄 등록" 버튼
    │       ├── PersonalWorkTemplateManagementFilter.tsx
    │       ├── PersonalWorkTemplateManagementList.tsx
    │       ├── PersonalWorkTemplateExcelUploadDialog.tsx
    │       ├── PersonalWorkTemplateUploadProgressWatcher.tsx   ← 비동기 업로드 job 폴링
    │       └── TableFilterContextProvider.tsx
    └── work_plan_establishment_tab/                  ← 선택적 근로 스케줄 탭
        ├── index.tsx
        └── contents/ (Header · WorkPlanEstablishmentStatusFilter · WorkPlanEstablishmentStatusList · TableFilterContextProvider)

hooks/attendance/work/personal_work_template_management/
├── work_schedule_tab/ (useFilterOptions · useExcelDownload · usePersonalWorkTemplateExcelUpload · usePersonalWorkTemplateUploadJobId · useControlTableFilter)
└── work_plan_establishment_tab/ (useFilterOptions · useExcelDownload · useControlTableFilter)

helpers/attendance/work/personal_work_template_management/
├── work_schedule_tab/index.ts                        ← 선택 가능 행 판정, 포맷터
├── work_schedule_tab/excelUploadValidator.ts
└── work_plan_establishment_tab/index.ts

config/api/attendance/personalWorkTemplateManagement.ts
config/api/attendance/personalWorkPlanEstablishmentStatus.ts
```

백엔드:
- `be:controller/workadmin/PersonalWorkPlanAdminController.java` — 근무 스케줄 탭 (조회·삭제·엑셀)
- `be:service/workadmin/PersonalWorkPlanAdminCommandService.java` — 삭제 분류 로직
- `be:pojo/workadmin/PersonalWorkPlanActionContext` / `WorkPlanEditablePeriod` — 어드민 변경 허용 기간 정책
- `be:controller/workadmin/WorkPlanEstablishmentAdminController.java` — 선택적 근로 스케줄 탭
- 참고: 슈퍼어드민용 `SuperAdminPersonalWorkPlanController` (`/time/super-admin/personal-work-plans/*`)는 기간 하한 없이 허용

### API

| Method | Path | 용도 |
|---|---|---|
| GET | `/time/personal-work-plans/filter-options` | 필터 옵션 |
| POST | `/time/personal-work-plans/search` | 근무 스케줄 조회 |
| POST | `/time/personal-work-plans/excel-download/search` | 근무 스케줄 엑셀 다운로드 |
| PUT | `/time/personal-work-plans/delete` | 개인 스케줄 일괄 삭제 (부분 실패 허용) |
| POST | `/time/personal-work-plans/excel-upload` | 스케줄 등록(엑셀 업로드) — 비동기 job |
| GET | `/time/personal-work-plans/jobs/recent` · `/jobs/{jobId}` · `/jobs/{jobId}/failures` | 업로드 job 진행·실패 조회 |
| PUT | `/time/personal-work-plans/jobs/{jobId}/acknowledge` | 업로드 결과 확인 처리 |
| POST | `/time/personal-work-plan-establishments/search` | 선택적 근로 스케줄 조회 |
| POST | `/time/personal-work-plan-establishments/excel-download/search` | 선택적 근로 스케줄 엑셀 다운로드 |

> ~~[TBD] `personalWorkTemplateManagement.ts` 의 정확한 endpoint~~ → **(2026-11-05 해소)** 위 표.

---

## § 1. 근무 스케줄 탭

### 필터

- 라디오 **[월별 조회 | 일별 조회]**, 기본 = **월별**(이번 달). 일별로 바꾸면 이번 달 1일 ~ 오늘. 일별 조회 기간은 **365일 이내** ("조회 기간은 365일 이내로 설정합니다.")
- 구성원 · 회사 · 조직 · 근무그룹 · **근무템플릿** · 활성 여부 → [조회] [필터 재설정]
- 기간 미선택 시 "조회 실패" / "기간을 선택해주세요."
- **근무그룹에 속하지 않은 대상자는 조회되지 않음**

### 상단 버튼

- **스케줄 등록** (탭 헤더 우측) — 엑셀 업로드 다이얼로그
- 목록 상단: **삭제**(선택 시 "N건 선택됨"), **컬럼 고정 설정**, **엑셀 다운로드**
- 인라인 편집 "변경 취소" / "저장" 버튼은 코드에 주석 처리(미노출). locale에 인라인 저장 문구만 남아 있음

> ~~상단 액션 "그룹 스케줄" 버튼 — 그룹스케줄 화면 진입 추정~~ → **(2026-11-05 해소)** **버튼이 아니라 목록의 컬럼 그룹 헤더** "그룹 스케줄" / "개인 스케줄" (`PersonalWorkTemplateManagementList.tsx:628-660`). 화면 이동 기능 없음.

### 컬럼 (`PersonalWorkTemplateManagementList.tsx:320-660`)

- 체크박스 + **[기본 정보]** No · 사번 · 이름 · 회사 · 조직 · 직급 · 퇴사 여부 · 활성 여부 · 근무그룹 · 마감(마감/마감 전) · 근무일
- **[그룹 스케줄]** 스케줄명 · 근무 구분(근무일/휴일/휴무일) · 시작기준(당일/익일) · 시작시각 · 종료기준 · 종료시각 · 최종 변경 시각
- **[개인 스케줄]** 스케줄명 · 근무 구분 · 시작기준 · 시작시각 · 종료기준 · 종료시각 · 메모 · **변경 구분** · 최종 변경 시각
- 시각 표기: 자율이면 "자율", 근무시간형이면 "N 근무", 미정이면 "미정". 삭제된 템플릿은 "(삭제된 템플릿)" 표시

**변경 구분 표기** (locale `valueChangeType*`):

| 변경 출처 | 표시 |
|------|------|
| 근무계획 변경 신청서 승인 | "근무계획변경신청서" |
| 직책자 변경 확정 (`KB:product/user/attendance/schedule.md` § 2 역할 기준 탭) | "개인스케줄 변경(직책자)" |
| 대체근무 신청서 승인 | "대체근무신청서" |
| 어드민 엑셀 일괄 등록 (이 화면 "스케줄 등록") | "개인스케줄 변경(어드민)" |

> ~~"스케줄변경(직책자)" · 3가지 출처~~ → **(2026-11-05 해소)** 현재 화면 표기는 "개인스케줄 변경(직책자)", 그리고 어드민 일괄 등록 출처 **"개인스케줄 변경(어드민)"이 추가되어 4가지 출처**.

### 스케줄 등록 (엑셀 업로드) ⭐

hcgtheplus/talenx-admin#3659 "개인 근무 스케줄 관리 > 엑셀 업로드 및 비동기 처리" (2026-05-19)로 추가. QA 체크리스트에는 없음.

- 다이얼로그 "스케줄 등록": 드래그&드롭 또는 파일 선택, "엑셀 양식 다운로드"(파일명 "개인스케줄_등록_양식")
- 작성 안내:
  1. 필수 항목 : 사번, 근무일, 개인 스케줄명
  2. 근무일 : YYYYMMDD 형식 입력 (예: 2026년 10월 09일 → 20261009)
  3. 개인 스케줄명 : 템플릿명 입력
  4. 메모 : 255자 이내로 입력
  5. 3번째 줄부터 정보를 입력(1~2번째 줄과 D열 이후의 셀 수정 금지)
- 프론트 검증 실패 → "업로드 실패": "{행}행: {컬럼}은 필수 입력 항목입니다." / "{행}행: 근무일 날짜 형식이 올바르지 않습니다." / "{행}행: 메모는 255자 이내로 작성합니다." · 비밀번호 걸린 파일 → "비밀번호가 설정된 엑셀 파일은 업로드할 수 없습니다."
- 확인 창: "{이름}님 등 **N건**의 스케줄을 등록합니다."
- **백그라운드(비동기) 처리**: "엑셀 파일을 백그라운드에서 처리 중입니다." — job ID로 진행 상태 폴링(`PersonalWorkTemplateUploadProgressWatcher`). 이전 업로드가 진행 중이면 "이전 업로드가 진행 중입니다."로 차단
- 결과:
  - 전체 성공: "스케줄 등록 완료" / "스케줄 등록을 완료했습니다."
  - 일부 실패: "일부 스케줄 등록 제외 안내" — "오류 항목을 제외한 스케줄 등록을 완료했습니다. 아래 확인 필요 항목은 수정 후 다시 업로드 바랍니다."
  - 전체 실패: "스케줄 등록 실패 안내" — "스케줄을 등록할 수 없습니다. 아래 확인 필요 항목은 수정 후 다시 업로드 바랍니다."
  - 실패 행 형식 "{행}행: {사유}"
- **서버 실패 사유 코드** (`excelUploadFailureReasonCode`):

| 코드 | 문구 |
|---|---|
| `PERMISSION_DENIED` | 접근 권한이 없습니다. |
| `CLOSED_PERIOD` | 마감된 기간입니다. |
| `PLAN_CHANGE_APPL_PENDING` | 근무계획 변경 신청이 진행 중입니다. |
| `COMPENSATORY_WORK_APPL_PENDING` | 대체근무 신청이 진행 중입니다. |
| `INVALID_FORMAT_EMPLOYEE_NUMBER` | 사번은 필수 입력 항목입니다. |
| `INVALID_FORMAT_WORK_YMD` | 근무일 날짜 형식이 올바르지 않습니다. |
| `INVALID_FORMAT_TEMPLATE_NAME` | 유효하지 않은 스케줄입니다. |
| `NOTE_TOO_LONG` | 메모는 255자 이내로 작성합니다. |
| `PERSONAL_SCHEDULE_NOT_AVAILABLE` | 사용 가능한 스케줄이 아닙니다. |
| `PAST_DATE_NOT_ALLOWED` | 미래 날짜만 업로드 할 수 있습니다. |
| `MEMBER_NOT_IN_WORKGROUP_ON_DATE` | 소속된 근무그룹이 없습니다. |
| `SELECTIVE_WORK_GROUP_NOT_ALLOWED` | 선택적 근로제 근무그룹 소속 인원은 업로드할 수 없습니다. |
| `UPSERT_FAILED` | 시스템 오류가 발생했습니다. |

### 엑셀 다운로드 (L782–784)

- **사유 입력 필수** — 다이얼로그 "개인 스케줄 관리 엑셀 다운로드", 파일명 "개인스케줄관리_월별_YYYYMM" / "개인스케줄관리_일별_시작~종료"

### 삭제 (L786–790)

- **선택 가능 행** = 근무일이 **내일 이후** + 개인 스케줄이 있는 행 (`helpers/.../work_schedule_tab/index.ts:240-248`). 오늘·과거 행, 그룹 스케줄만 있는 행은 체크 불가
- 확인 창: "선택한 개인 근무 계획 **N건**을 삭제합니다. 계속 진행하시겠습니까?"
- **백엔드 분류** (`PersonalWorkPlanAdminCommandService.delete`, 우선순위 순): 권한 없음 → 허용 기간 밖(어드민 = 내일부터만, `WorkPlanEditablePeriod.adminFrom`) → **근무 마감** → **근무계획 변경 신청 진행 중**(신청 적용 기간에 근무일 포함) → **대체근무 신청 진행 중**(근무일 또는 휴일 일자와 일치) → 삭제 가능
- **부분 삭제 허용**: 가능한 건만 삭제하고 실패 건은 사유와 함께 응답
- 결과 메시지:
  - 전체 성공: "개인 근무 계획 N건이 삭제되었습니다."
  - 실패 건 있음: 얼럿 "개인 근무 계획 삭제 불가" — "삭제 불가한 구성원 N" + 구성원별 사유("권한 없음" / "근무 마감" / "근무계획 변경 신청 중" / "대체근무 신청 중" / 그 외 "시스템 오류")
  - 요청 실패: "개인 근무 계획 삭제 실패" / "개인 근무 계획 N건을 삭제하지 못했습니다."
- **Hard delete + 변경 이력 보존**: 삭제 직전 원본을 변경 로그(`CHG_LOG_ACTION.HARD_DELETE`, 변경 유형 `ADMIN_BULK_DELETE`)로 캡처한 뒤 물리 삭제. 그룹 스케줄(`TM_WORK_GRP_WORK_PLAN`)은 건드리지 않음

> ~~[TBD] 진행 중 신청서 종류별 정확한 차단 룰~~ → **(2026-11-05 해소)** 위 분류 순서. QA에 없던 **근무 마감**·**권한**·**오늘/과거** 차단도 존재.

## § 2. 선택적 근로 스케줄 탭 (조회 전용)

- 대상: **선택적 근로제 근무그룹 소속 구성원 × 근무일** 행 (백엔드 Operation 설명). 선택적 근로제 대상자는 본인이 근무 스케줄을 직접 수립 (`KB:product/admin/work/group-setting.md` 선택적 근로제 근무 유형)
- 필터: 월별/일별(기본 월별, 일별 365일 이내) · 구성원 · 회사 · 조직 · 근무그룹 · 활성 여부 (근무템플릿 필터 없음)
- 컬럼 (`WorkPlanEstablishmentStatusList.tsx:180-430`): **[기본 정보]** No · 사번 · 이름 · 회사 · 조직 · 직급 · 퇴사 여부 · 활성 여부 · 근무그룹 · 마감 · 근무일 → **[그룹 스케줄]** 근무 구분 · 최종 변경 시각 → **[개인 스케줄]** 시작기준 · 시작시각 · 종료기준 · 종료시각 · 최종 변경 시각
- 체크박스·삭제·등록 없음. 컬럼 고정 설정 + 엑셀 다운로드(사유 필수, "근무계획 수립 내역 엑셀 다운로드", 파일명 "근무계획수립내역_월별/일별_…")
- 선택적 근로제 근무그룹 소속자는 근무 스케줄 탭 엑셀 등록 불가(`SELECTIVE_WORK_GROUP_NOT_ALLOWED`) — 이 탭에서 조회만

> ~~[TBD] 향후 추가될 탭의 종류~~ → **(2026-11-05 해소)** 선택적 근로 스케줄 탭.

---

## 데이터 흐름

```
[4가지 개인스케줄 생성 출처]
   ├─ 근무계획변경 신청서 승인 (사용자)
   ├─ 직책자 변경 확정 (KB:user-work-schedule.md § 2)
   ├─ 대체근무 신청서 승인 (사용자)
   └─ 어드민 엑셀 일괄 등록 (이 화면 "스케줄 등록")
        ↓
[본 화면 근무 스케줄 탭: 통합 조회 / 등록 / 삭제]
        ↓
[사용자 캘린더에 WorkPlan 타입으로 표시 (개인스케줄 > 그룹스케줄 우선)]

[선택적 근로제 대상자 본인 수립] → [본 화면 선택적 근로 스케줄 탭: 조회]
```

`KB:product/user/attendance/my-work.md` § "Type 2: WorkPlan"의 표시는 이 화면에서 관리되는 개인스케줄 + 근무그룹의 그룹스케줄이 합쳐진 결과.

## Cross-domain 효과

| 동작 | 영향 |
|------|------|
| 어드민 엑셀 일괄 등록 | 해당 일자 개인스케줄 생성/갱신, 변경 구분 "개인스케줄 변경(어드민)" |
| 어드민이 개인스케줄 삭제 | 사용자 캘린더에서 제거 + 그룹스케줄로 fallback (개인스케줄 우선순위 해제) |
| 진행 중 신청서 / 마감 | 등록·삭제 차단 (워크플로우 진행 보호) |
| 권한 없음 | 메뉴 자체 미노출 |
| 엑셀 다운로드 | 감사 로그 (사유 필수) |

## 비즈니스 룰

1. **4가지 출처 통합 관리**: 근무계획변경 / 직책자 변경 / 대체근무 / 어드민 일괄 등록
2. **근무그룹 소속 필수**: 미소속이면 조회 X, 등록 시 "소속된 근무그룹이 없습니다."
3. **어드민 변경(등록·삭제)은 내일 이후 근무일만** — 오늘·과거 불가 (슈퍼어드민 경로는 하한 없음)
4. **Hard delete** (soft delete 아님), 단 삭제 직전 원본을 변경 로그로 보존
5. **삭제·등록 차단**: 권한 없음 / 근무 마감 / 근무계획 변경 신청 진행 중 / 대체근무 신청 진행 중 — 차단 건만 제외하고 나머지는 처리(부분 처리)
6. **선택적 근로제 근무그룹 소속자**는 근무 스케줄 탭 엑셀 등록 불가, 선택적 근로 스케줄 탭에서 조회만
7. **권한 = 서브어드민 권한 (`개인 근무 관리`)**
8. **엑셀 다운로드 사유 필수**
9. **개인스케줄 > 그룹스케줄 우선순위** (`KB:product/user/applications/plan-change.md` § 4)

## 확인 완료 (해소된 [TBD])

- ✅ **디렉토리 명명 = 의도된 것**: `근무 스케줄 = 근무 계획` 동의어이고 `근무 템플릿 = 근무 계획의 종류`이므로 `personal_work_template_management`는 "개인 근무 템플릿 관리" = "개인 근무 계획(스케줄)의 종류 관리"로 정합
- ✅ endpoint 전체 (2026-11-05)
- ✅ 추가된 탭 = 선택적 근로 스케줄 (2026-11-05)
- ✅ 진행 중 신청서 종류별 삭제 차단 룰 (2026-11-05)
- ✅ "그룹 스케줄" = 컬럼 그룹 헤더 (2026-11-05)

## 검증 / [TBD]

- [ ] hard delete 시 사용자 화면 반영 방식 (다음 조회 시 반영으로 보임 — push 여부 미확인) — 기획 영향 낮음, Slack 검색 생략
- [ ] 인라인 편집·저장 기능(코드 주석 처리 상태)의 출시 계획 — (2026-11-05 Slack 검색: 부분) 2026-04 메뉴 신설 시 "테이블 수정 / 엑셀 업로드 / 근무템플릿 중복"을 범위가 커 **다음 스프린트로 미룸**, 개인스케줄 '메모' 컬럼도 "수정 기능 개발 때 추가"로 보류. 엑셀 업로드는 이후 출시(#3659)됐지만 테이블 수정은 이후 일정 언급 없음 — Slack #sq-time "(058) admin - 개인스케줄 조회 & 관리" (https://hcgtheplus.slack.com/archives/C04QC2RJJBU/p1776841527319959)
- [x] ~~근무 스케줄 탭 목록에 선택적 근로제 근무그룹 소속자가 함께 조회되는지~~ → **(2026-11-05 Slack 확인)** 조회됨. 그룹 스케줄은 표시되고 **개인 스케줄 칸은 공백**(본인이 수립한 계획은 선택적 근로 스케줄 탭에서 확인). 대체근무 등 **신청서로 바뀐 날만 개인 스케줄이 표시**. 어드민 등록·직책자 변경·근무계획 변경 신청 모두 불가 — Slack #sq-time 2026-08-25 (https://hcgtheplus.slack.com/archives/C04QC2RJJBU/p1787638249823189?thread_ts=1787635908.267959&cid=C04QC2RJJBU)

## 관련 문서

- `KB:product/user/attendance/schedule.md` § 2 — 직책자가 역할 기준 탭에서 변경 → 본 화면에 반영
- `KB:product/user/applications/plan-change.md` § 4 — 근무계획 변경 신청서 → 본 화면에 반영
- `KB:product/user/applications/compensatory-work.md` § 3 — 대체근무 신청서 → 본 화면에 반영
- **(2026-11-05)** `KB:product/user/applications/work-plan-establishment.md` — 근무계획 수립 신청(선택적 근로제) → 본 화면 선택적 근로 스케줄 탭에서 조회
- `KB:product/user/attendance/my-work.md` § "Type 2: WorkPlan" — 개인스케줄이 캘린더에 표시되는 흐름
- `KB:product/admin/authority/custom.md` § #4-2 — 서브어드민 권한 (개인 근무 관리)
- `KB:product/admin/work/group-setting.md` § "그룹스케줄" — 그룹스케줄 (개인스케줄에 가려짐), 선택적 근로제 근무 유형
- `KB:product/admin/work/close-work-data.md` — 마감 일자 등록·삭제 차단
