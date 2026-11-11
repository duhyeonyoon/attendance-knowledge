# 개인 근무 스케줄 관리 (어드민 #11)

## 개요

**근무그룹의 그룹스케줄에서 만들어지는 일반 스케줄과 별개**로, 개인별 예외/맞춤 스케줄(개인스케줄)을 어드민이 일괄 관리하는 화면. 이미 정리된 개인스케줄 vs 그룹스케줄 우선순위 룰의 어드민 처리 측면.

> **명명 정정 (2026-05-13 두현님 확인)**:
> - **근무 스케줄 = 근무 계획** (동의어)
> - **근무 계획의 종류 = 근무 템플릿**
> 
> 따라서 **`personal_work_template_management` = "개인 근무 템플릿 관리" = 개인별 근무 계획(스케줄)의 종류 관리**. UI 표기 "개인 근무 스케줄 관리"와 정합. **명명 불일치 아님**.

## 진입 위치

- 어드민 메뉴: 근무관리 > 개인 근무 스케줄 관리
- URL: `/attendance/work/personal_work_template_management`

## QA 체크리스트

`talenx-admin/.claude/qa-checklist/attendance.md` **L769–796** (28줄)

QA에 "권장: 탭이 생기면 별도의 서브 섹션으로 아래 항목을 분리"라고 적혀있어 **향후 탭 추가 예정** 상태.

## 코드 위치

```
pages/attendance/work/personal_work_template_management/

components/attendance/work/personal_work_template_management/
├── index.tsx
├── PersonalWorkTemplateUploadProgressWatcher.tsx       ← 엑셀 업로드 진행 워처
└── contents/
    ├── PersonalWorkTemplateManagementFilter.tsx
    ├── PersonalWorkTemplateManagementList.tsx
    ├── PersonalWorkTemplateExcelUploadDialog.tsx       ← 엑셀 업로드 다이얼로그
    └── TableFilterContextProvider.tsx

hooks/attendance/work/personal_work_template_management/
├── useFilterOptions.ts
├── useExcelDownload.ts
├── usePersonalWorkTemplateExcelUpload.tsx              ← 엑셀 업로드 훅
└── useControlTableFilter.ts

helpers/attendance/work/personal_work_template_management/

config/api/attendance/personalWorkTemplateManagement.ts
```

## 핵심 동작

### 조회 (L773–781)

**필터**: 회사 / 조직 / 근무그룹 / 템플릿 + **월별 기록 / 일별 기록 라디오** ⭐ (staging 실측 추가 발견)

**상단 액션 버튼**:
- 조회 / 필터 재설정 / 삭제 / 엑셀 다운로드
- **그룹 스케줄** ⭐ (staging 실측 추가 발견 — 그룹스케줄 화면 진입 추정)

**제약**:
- **근무그룹에 속하지 않은 대상자는 조회되지 않음** (그룹 미소속 = 스케줄 없음)

**변경 구분 컬럼**:

| 변경 출처 | 표시 |
|------|------|
| 근무계획변경 신청서 승인 | "근무계획변경신청서" |
| 직책자 변경 확정 (`KB:product/user-work-schedule.md` § 2 역할 기준 탭) | "스케줄변경(직책자)" |
| 대체근무신청서 승인 | "대체근무신청서" |

> 개인스케줄이 **3가지 출처**로 만들어짐을 보여줌. 사용자/직책자/대체근무 워크플로우 모두가 여기로 흘러옴.

### 엑셀 다운로드 (L782–784)

- **사유 입력 필수** (다른 영역과 일관)

### 삭제 (L786–790)

- **개인스케줄 hard delete** (기존 동작 유지)
- **삭제 차단 조건**:
  - **근무계획 변경 신청 진행 중**인 경우 삭제 불가
  - **대체근무 신청 진행 중**인 경우 삭제 불가
  - 에러 케이스 제외 나머지는 삭제됨 (= 부분 삭제 가능)

### 권한 (L792–796)

- **서브어드민 권한에서 "개인 근무 관리"** 항목 설정 가능
- **권한 보유 시**:
  - 어드민 메뉴에 **개인 근무 관리 메뉴 노출**
  - 조회 / 엑셀 다운로드 / 삭제 가능

`KB:product/admin-system-entry.md` § #4-2 서브어드민 권한과 짝.

## 데이터 흐름

```
[3가지 개인스케줄 생성 출처]
   ├─ 근무계획변경 신청서 승인 (사용자)
   ├─ 직책자 직접 입력/확정 (KB:user-work-schedule.md § 2)
   └─ 대체근무 신청서 승인 (사용자)
        ↓ 모두 같은 TM_PSN_WORK_PLAN_APPL 또는 TM_EMP_WORK_PLAN에 저장
[본 화면: 통합 조회 / 삭제]
        ↓
[사용자 캘린더에 WorkPlan 타입으로 표시 (개인스케줄 > 그룹스케줄 우선)]
```

`KB:product/user-my-work-calendar.md` § "Type 2: WorkPlan"의 표시는 이 화면에서 관리되는 개인스케줄 + 근무그룹의 그룹스케줄이 합쳐진 결과.

## Cross-domain 효과

| 동작 | 영향 |
|------|------|
| 어드민이 개인스케줄 삭제 | 사용자 캘린더에서 즉시 제거 + 그룹스케줄로 fallback (개인스케줄 우선순위 해제) |
| 진행 중 신청서 있음 | 삭제 차단 (워크플로우 진행 보호) |
| 권한 없음 | 메뉴 자체 미노출 |
| 엑셀 다운로드 | 감사 로그 (사유 필수) |

## 비즈니스 룰

1. **3가지 출처 통합 관리**: 근무계획변경 / 직책자 변경 / 대체근무
2. **근무그룹 소속 필수**: 미소속이면 조회 X
3. **Hard delete** (soft delete 아님)
4. **진행 중 신청서 = 삭제 차단**
5. **권한 = 서브어드민 권한 (`개인 근무 관리`)**
6. **엑셀 사유 필수**
7. **개인스케줄 > 그룹스케줄 우선순위** (`KB:product/appl-other-forms.md` § 4)

## 알려진 제약 / 임시 동작

- QA에 "탭이 생기면 분리" → **향후 탭 추가 예정**

## 확인 완료 (해소된 [TBD])

- ✅ **디렉토리 명명 = 의도된 것**: `근무 스케줄 = 근무 계획` 동의어이고 `근무 템플릿 = 근무 계획의 종류`이므로 `personal_work_template_management`는 "개인 근무 템플릿 관리" = "개인 근무 계획(스케줄)의 종류 관리"로 정합

## 검증 / [TBD]

- [ ] `personalWorkTemplateManagement.ts` 의 정확한 endpoint
- [ ] hard delete 시 사용자에게 즉시 반영되는 메커니즘 (push? polling?)
- [ ] 향후 추가될 탭의 종류
- [ ] 진행 중 신청서 종류별 정확한 차단 룰

## 관련 문서

- `KB:product/user-work-schedule.md` § 2 — 직책자가 역할 기준 탭에서 변경 → 본 화면에 반영
- `KB:product/appl-other-forms.md` § 4 — 근무계획 변경 신청서 → 본 화면에 반영
- `KB:product/appl-other-forms.md` § 3 — 대체근무 신청서 → 본 화면에 반영
- `KB:product/user-my-work-calendar.md` § "Type 2: WorkPlan" — 개인스케줄이 캘린더에 표시되는 흐름
- `KB:product/admin-system-entry.md` § #4-2 — 서브어드민 권한 (개인 근무 관리)
- `KB:product/admin-work-group.md` § "그룹스케줄" — 그룹스케줄 (개인스케줄에 가려짐)
