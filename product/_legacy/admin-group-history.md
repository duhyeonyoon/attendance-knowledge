# 그룹 이력 관리 (어드민) — 근무 그룹 이력 + 휴가 그룹 이력

## 개요

구성원이 어떤 근무그룹/휴가그룹에 소속되었는지의 **이력**을 조회하는 어드민 화면. 두 영역(근무/휴가)이 **거의 동일한 패턴**으로 묶어서 정리.

> 이전 deep-dive(`KB:product/admin-work-group.md` § "근무그룹 변경 이력 관리")에서 화면 존재만 확인했던 영역. 이번에 QA 정식 추가되어 deep-dive 진행.

| 영역 | QA 라인 | 메뉴 위치 |
|------|------|------|
| **근무 그룹 이력 관리** | `ad-qa:L552–560` | 어드민 — 근무관리 |
| **휴가 그룹 이력 관리** | `ad-qa:L981–989` | 어드민 — 휴가관리 |

QA 양쪽 모두 9줄. 거의 동일 텍스트 (work ↔ leave 단어만 다름).

## 코드 위치

### Admin 프론트 (양쪽 미러 구조)

```
pages/attendance/
├── work/group_setting_history_management/index.tsx
└── leave/group_setting_history_management/index.tsx

components/attendance/
├── work/group_setting_history_management/
│   ├── index.tsx
│   └── contents/
│       ├── WorkGroupSettingHistoryManagementList.tsx
│       ├── WorkGroupSettingHistoryManagementFilter.tsx
│       └── TableFilterContextProvider.tsx
└── leave/group_setting_history_management/
    ├── index.tsx
    └── contents/
        ├── LeaveGroupSettingHistoryManagementList.tsx
        ├── LeaveGroupSettingHistoryManagementFilter.tsx
        └── TableFilterContextProvider.tsx

hooks/attendance/
├── work/group_setting_history_management/
│   ├── useFilterOptions.ts
│   ├── useExcelDownload.ts
│   └── useControlTableFilter.ts
└── leave/group_setting_history_management/  (동일 구조)

containers/attendance/
├── work/group_setting_history_management/index.tsx
└── leave/group_setting_history_management/index.tsx

config/api/attendance/
├── workGroupSettingHistoryManagement.ts
└── leaveGroupSettingHistoryManagement.ts
```

### 백엔드 (양쪽 미러)

```
controller/workadmin/WorkGroupHistoryController.java
controller/leaveadmin/LeaveGroupHistoryController.java

service/workadmin/WorkGroupHistoryQueryService.java   (Query only — 읽기 전용)
service/leaveadmin/LeaveGroupHistoryQueryService.java

mapper/workadmin/WorkGroupHistoryMapper.java
mapper/leaveadmin/LeaveGroupHistoryMapper.java

dto/workadmin/WorkGroupHistoryDto.java
dto/leaveadmin/LeaveGroupHistoryDto.java
```

> **`QueryService` 명명**: 읽기 전용 조회 서비스. 이력은 시스템이 자동 기록 → 어드민은 조회만.

### ppfront 영향

**없음**. 어드민 전용 조회 화면, 사용자 화면에 직접 영향 X.

## 백엔드 API (양쪽 동일 패턴)

| 영역 | Method | Path |
|------|------|------|
| 근무 그룹 이력 — 조회 | POST | `/time/work-group-histories/search` |
| 근무 그룹 이력 — 엑셀 다운로드 | POST | `/time/work-group-histories/excel-download/search` |
| 휴가 그룹 이력 — 조회 | POST | `/time/leave-group-histories/search` |
| 휴가 그룹 이력 — 엑셀 다운로드 | POST | `/time/leave-group-histories/excel-download/search` |

엔드포인트가 단순 (조회 + 엑셀만). `CONST_APPLY_ACTION` 같은 표준 액션 패턴 미사용 — 이력 = 읽기 전용이므로.

## 데이터 모델

### `WorkGroupHistoryQueryRecord` (대표 — `LeaveGroupHistoryDto`도 유사)

| 필드 | 의미 |
|------|------|
| `memberId`, `employeeNumber`, `name` | 구성원 식별 |
| `companyName`, `organizationName`, `gradeName` | 소속 정보 |
| `isRetired`, `isActive` | 퇴직/활성 상태 |
| `currentWorkGroupId`, `currentWorkGroupName` | 현재 소속 근무그룹 |
| `groupHistoryId` | 이력 row PK |
| `workGroupId`, `workGroupName`, `workType` | 이력상의 근무그룹 + 유형 |
| `membershipStartYmd`, `membershipEndYmd` | 소속 시작/종료일 |

> 1 구성원 × N 이력 row 구조 (한 구성원이 여러 그룹을 거치면 여러 row).
> 휴가 측 `LeaveGroupHistoryDto`는 `workType` 필드가 빠지고 `leaveGroupName` 류로 대체 추정 (필드 정확 매칭 [TBD]).

### 관련 DB 테이블

- `TM_WORK_GRP_HISTORY` — 근무그룹 소속 이력 (이미 `KB:code/backend-tables.md`에 인벤토리됨)
- `TM_LEAVE_GRP_HISTORY` (추정) — 휴가그룹 소속 이력 [TBD] 정확 이름

## 핵심 동작

### 조회

- **조회 기간 = 필수 옵션** (지울 수 없음)
  - 디폴트: **이번년도 1월 1일 ~ 오늘**
  - **최대 365일** 제한
- 필터 옵션:
  - 근무 측: 구성원 / 회사 / 조직 / **근무그룹** / **근무제 유형** / 활성여부 등
  - 휴가 측: 구성원 / 회사 / 조직 / **휴가그룹** / 활성여부 등

### 필터 의미 정정 ⭐

> **"근무그룹/근무제 유형 필터 = 이력 기준"** (현재 소속 기준 X)
>
> 예: 구성원 A가 작년에 그룹 X에 있다가 올해 그룹 Y로 옮겼을 때, 그룹 X로 필터 시 → A의 작년 이력이 노출됨 (현재 소속이 Y여도)

이 룰이 일반 근무 데이터 화면(`KB:product/admin-work-data.md`)과 다른 점. 일반 화면들은 보통 "현재 소속" 기준 필터.

### 조회 제약

- **그룹에 한번도 소속된 적 없는 인원은 조회 불가** (이력 자체가 없으므로)

### 소속일수 컬럼 분기

| 소속종료일 | 표시 |
|------|------|
| 미래 (예: 미리 입력한 변경 예정일) | **0일** |
| 현재 또는 과거 | (실제 소속일수) |

> 미래 이력 = "예정"이지만 아직 발생 X → 0일로 처리해서 통계 왜곡 방지

### 엑셀 다운로드

- 조회 필터 동일 적용
- 사유 입력 필수 (`TALENX-LOG-REASON`, 다른 영역과 일관)

## ⭐ 데이터 흐름 — 그룹 변경 → 이력 자동 기록

근무/휴가 그룹의 구성원 변경(`KB:product/admin-work-group.md` § "구성원 설정 탭", `KB:product/leave-domain.md` § B "구성원 설정 탭")이 일어나면:

```
[어드민 근무그룹 / 휴가그룹 → 구성원 설정 탭]
   ↓ 구성원 변경 모달 → 변경일 지정 → 확정 저장
[백엔드: TM_WORK_GRP_HISTORY / TM_LEAVE_GRP_HISTORY 에 row 추가]
   - 시작일 = 변경일
   - 이전 이력 row의 종료일 = 변경일 - 1일 (또는 변경일)
   ↓
[본 화면: 이력 조회 가능]
   - 미래 변경일 입력 시 → 미래 row의 소속일수 = 0일
```

> 이력은 **시스템이 자동 누적** — 어드민이 직접 추가/수정/삭제 불가 (조회 전용)

## Cross-domain 효과

| 동작 | 영향 |
|------|------|
| 근무그룹 구성원 변경 (`KB:product/admin-work-group.md` § 구성원 설정) | `TM_WORK_GRP_HISTORY`에 row 추가 → 본 화면에서 조회됨 |
| 휴가그룹 구성원 변경 | `TM_LEAVE_GRP_HISTORY`에 row 추가 |
| 변경일을 미래로 지정 | 본 화면 소속일수 = 0일 (집계 미반영) |
| 구성원 마지막 근무 마감일 이전 변경 시도 | 차단 (`KB:product/admin-work-group.md`) — 본 화면 이력에 영향 X |
| 구성원 퇴직 → `isRetired = true` | 이력은 그대로 남음 (조회 가능) |

## 비즈니스 룰

1. **읽기 전용 화면** — 이력 추가/수정/삭제 X, 시스템 자동 기록만
2. **조회 기간 = 필수, 최대 365일** (성능 보호)
3. **필터 = 이력 기준** (현재 소속 X) — 일반 화면과 다른 점
4. **한번도 소속 안 됐던 인원 조회 불가** (이력 row 없음)
5. **미래 이력 소속일수 = 0일** (예정만 있고 실 발생 X)
6. **엑셀 사유 필수** (다른 영역과 일관)
7. **근무 ↔ 휴가 영역 완전 대칭** (코드/API/UX 모두 미러)

## 알려진 제약 / 검증 / [TBD]

- [ ] `TM_LEAVE_GRP_HISTORY` 정확한 테이블 이름 (`TM_WORK_GRP_HISTORY`와 대칭이지만 미확인)
- [ ] `LeaveGroupHistoryDto` 정확한 필드 구성 (work과 미세 차이 — `workType` → 휴가 측은 [TBD])
- [ ] 이력 자동 기록 트리거 위치 (구성원 변경 저장 시점의 백엔드 코드 [TBD])
- [ ] 조회 기간 365일 초과 시 정확한 에러 메시지 / UI 처리

## 두현님께 질문 (선택)

- 미래 이력 입력 케이스가 실제로 자주 발생하나요? (예시: 분기 시작일에 그룹 변경 미리 입력)
- 이력 365일 제한의 이유 (DB 부하? 고객사 요청? 운영 정책?)

## 관련 문서

- `KB:product/admin-work-group.md` § "구성원 설정 탭" — 이력 row가 만들어지는 입구
- `KB:product/leave-domain.md` § B "구성원 설정 탭" — 휴가 측 동일
- `KB:product/admin-work-close.md` § "Cross-domain" — 마감일 이전 변경 차단
- `KB:code/backend-tables.md` — `TM_WORK_GRP_HISTORY` 인벤토리

---

## 📌 부록: "배포 이슈 리스트" (`ad-qa:L1309–1318`)

QA 체크리스트 신규 추가됐지만 **deep-dive 대상 아님**:

- 운영팀의 **이슈 트래킹/관리 메모** 형식
- "이슈로 다뤄야 할 내용 리스트업 → 핫픽스/과제화/이슈등록 분류 → 완료처리 ✅" 운영 워크플로우
- QA 항목이 아니라 **변경 사항 추적용 placeholder** (`[프론트] 이슈1`, `[프론트, 백] 이슈2` 형태)

→ KB의 영역 카운트에 포함 X. 운영 메모로만 인지.
