---
sidebar:
  order: 3
---

# 근무 그룹 이력 관리

> **메뉴** 근무관리 › 근무 › 근무 그룹 이력 관리  
> **URL** `/attendance/work/group_setting_history_management`  
> **원본** `product/_legacy/admin-group-history.md`

[휴가 그룹 이력 관리](../leave/group-history.md)와 코드·API·UX가 완전히 대칭이라, 두 화면의 공통 명세를 이 페이지에 둡니다.

## 개요

구성원이 어떤 근무그룹/휴가그룹에 소속되었는지의 **이력**을 조회하는 어드민 화면. 두 영역(근무/휴가)이 **거의 동일한 패턴**으로 묶어서 정리.

> 이전 deep-dive(`KB:product/admin/work/group-setting.md` § "근무그룹 변경 이력 관리")에서 화면 존재만 확인했던 영역. 이번에 QA 정식 추가되어 deep-dive 진행.

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

> 1 구성원 × N 이력 row 구조 (한 구성원이 여러 그룹을 거치면 여러 row). 응답에는 `workTypeName`(근무제 유형 표시명, 서버가 시스템코드로 해석)과 `membershipDays`(서버 계산)가 추가됨.
> ~~휴가 측은 `workType` 대신 `leaveGroupName` 류로 대체 추정 [TBD]~~ → **(2026-11-05 해소)** 휴가 측은 근무제 유형이 없고 대신 **입사일(`enterYmd`)·연차기산일(`annualLeaveBaseYmd`)** 컬럼이 기본 정보에 추가됨 (`ad:src/components/attendance/leave/group_setting_history_management/contents/LeaveGroupSettingHistoryManagementList.tsx:219,232`).

### 화면 컬럼 (실제 라벨) ✅ (2026-11-05, `ad:.../WorkGroupSettingHistoryManagementList.tsx`, locale `WORK_GROUP_SETTING_HISTORY_MANAGEMENT`)

| 그룹 헤더 | 컬럼 | 비고 |
|---|---|---|
| (기본) | No · 사번 · 이름 · 회사 · 조직 · 직급 · 퇴사 여부("퇴사"/"재직") · 활성 여부("활성"/"비활성") · 현재 근무 그룹 | 휴가 측: 현재 휴가 그룹 · 입사일 · 연차기산일(툴팁 "연차기산일 입력시 입사일 대신 해당 날짜를 기준으로 연차를 산정합니다.") |
| 소속 이력 정보 | 근무 그룹 · 근무제 유형 · 소속 시작일 · 소속 종료일 · 소속 일수 | 휴가 측: 휴가 그룹 · 소속 시작일 · 소속 종료일 · 소속 일수 |

- 소속 종료일 툴팁: "마지막 소속 이력의 종료일은 9999.12.31로 표시됩니다."
- 소속 일수 툴팁: "소속 일수는 오늘 날짜 기준으로 계산됩니다. 종료일이 확정되지 않았거나 미래 날짜인 경우에도 오늘까지의 일수로 표시되며, 시작일이 미래인 이력은 0일로 표시됩니다."
- 날짜 표기 `YYYY.MM.DD`, 일수 표기 "{n}일"

### 관련 DB 테이블

- ~~`TM_WORK_GRP_HISTORY` / `TM_LEAVE_GRP_HISTORY`(추정)~~ → **(2026-11-05 해소)** 근무·휴가 모두 **`TM_GRP_HISTORY` 한 테이블**에 저장, `GRP_CLASS`로 근무그룹/휴가그룹 구분 (휴가 = `'L'`). `be:SQL/time/workadmin/WorkGroupHistoryMapper.xml:20`, `be:SQL/time/leaveadmin/LeaveGroupHistoryMapper.xml:11`

## 핵심 동작

### 조회

- **조회 기간 = 필수 옵션** (지울 수 없음, 백스페이스 비활성)
  - 디폴트: **이번년도 1월 1일 ~ 오늘**
  - **최대 365일** 제한 (양끝 포함 일수 기준)
- 필터 옵션 (실제 라벨, 2026-11-05 확인 — 활성여부 필터는 **없음**):
  - 근무 측: "조회 기간"(필수) / "구성원" / "회사" / "조직" / "근무 그룹(이력 기준)" / "근무제 유형"
  - 휴가 측: "조회 기간"(필수) / "구성원" / "회사" / "조직" / "휴가 그룹(이력 기준)"
  - 버튼: [조회] / [필터 재설정]
- **조회 대상 이력 = 조회 기간과 겹치는 이력** (시작일 ≤ 조회 종료일 AND 종료일 ≥ 조회 시작일)

### 조회 실패 처리 ✅ (2026-11-05 해소, `ad:.../WorkGroupSettingHistoryManagementFilter.tsx:285-318`)

| 상황 | 처리 |
|---|---|
| 기간 미선택 | 에러 알림 — 제목 "조회 실패", 본문 "기간을 선택해주세요." (조회 요청 안 함) |
| 기간 365일 초과 | 에러 알림 — 제목 "조회 실패", 본문 "조회 기간은 365일 이내로 설정합니다." (조회 요청 안 함) |

서버도 동일하게 365일 검증 (`be:service/workadmin/WorkGroupHistoryQueryService.java:30` `MAX_PERIOD_DAYS = 365`, `validateYmdRange`) — 이중 방어.

### 필터 의미 정정 ⭐

> **"근무그룹/근무제 유형 필터 = 이력 기준"** (현재 소속 기준 X)
>
> 예: 구성원 A가 작년에 그룹 X에 있다가 올해 그룹 Y로 옮겼을 때, 그룹 X로 필터 시 → A의 작년 이력이 노출됨 (현재 소속이 Y여도)

이 룰이 일반 근무 데이터 화면(`KB:product/admin/work/check-work-data.md`)과 다른 점. 일반 화면들은 보통 "현재 소속" 기준 필터.

### 조회 제약

- **그룹에 한번도 소속된 적 없는 인원은 조회 불가** (이력 자체가 없으므로)
- (코드상) **오늘 기준 소속 근무그룹이 없는 구성원도 조회되지 않음** — "현재 근무 그룹" 표시용 조인이 INNER JOIN(오늘 날짜가 걸친 이력 필수)이라 오늘 시점 이력이 없으면 과거 이력도 함께 빠짐 (`be:WorkGroupHistoryMapper.xml:40-49`). 의도인지는 미확인

### 소속일수 컬럼 분기

~~소속종료일이 미래면 0일~~ → **(2026-11-05 정정)** 기준은 **종료일이 아니라 시작일**. 서버 계산(`be:WorkGroupHistoryQueryService.calcMembershipDays:156`, 휴가 측 동일):

| 이력 | 소속 일수 |
|------|------|
| 시작일이 미래 (미리 입력한 변경 예정 이력) | **0일** |
| 종료일 9999.12.31(진행 중) 또는 종료일이 미래 | 시작일 ~ **오늘** (양끝 포함) |
| 종료일이 과거 | 시작일 ~ 종료일 (양끝 포함, 예: 20250101~20250102 = 2일) |

> 이전 이력은 다음 이력 시작일 전날에 끝나므로 양끝 포함 계산이 맞음

### 엑셀 다운로드

- 조회 필터 동일 적용 (프론트가 페이지를 순회하며 엑셀 조립)
- 사유 입력 필수 (`TALENX-LOG-REASON`, 다른 영역과 일관). 모달 제목 "근무그룹 이력 관리 엑셀 다운로드", 파일명 `근무그룹이력관리_일별_{시작}~{종료}`. 서버도 사유 공백이면 "사유를 입력해야 다운로드 가능합니다." (`be:WorkGroupHistoryQueryService:115`)

## ⭐ 데이터 흐름 — 그룹 변경 → 이력 자동 기록

근무/휴가 그룹의 구성원 변경(`KB:product/admin/work/group-setting.md` § "구성원 설정 탭", `KB:product/admin/leave/group-setting.md` § B "구성원 설정 탭")이 일어나면:

```
[어드민 근무그룹 / 휴가그룹 → 구성원 설정 탭]
   ↓ 구성원 변경 모달 → 변경일 지정 → 확정 저장
[백엔드: TM_GRP_HISTORY 에 row 추가 (GRP_CLASS로 근무/휴가 구분)]
   - be:common/grouphistory/TimeGroupHistoryService.createGroupHistory:180
     "그룹 구성원 생성 요청의 권한·시작일·마감일을 검증하고 소속 이력을 대체한다"
   - 시작일 = 변경일, 변경일 이후 이력은 대체
   - 기간 연속 보정: 이전 이력 종료일 = 변경일 - 1일 (빈 기간 없게) (:381)
   - 변경 로그(insertGrpHistoryChangeLogs)도 함께 기록
   ↓
[본 화면: 이력 조회 가능]
   - 미래 변경일 입력 시 → 미래 row의 소속일수 = 0일
```

> 이력은 **시스템이 자동 누적** — 어드민이 직접 추가/수정/삭제 불가 (조회 전용)

## Cross-domain 효과

| 동작 | 영향 |
|------|------|
| 근무그룹 구성원 변경 (`KB:product/admin/work/group-setting.md` § 구성원 설정) | `TM_GRP_HISTORY`(근무)에 row 추가 → 본 화면에서 조회됨 |
| 휴가그룹 구성원 변경 | `TM_GRP_HISTORY`(GRP_CLASS='L')에 row 추가 |
| 변경일을 미래로 지정 | 새 이력(시작일 미래)의 소속일수 = 0일, 직전 이력은 오늘까지 일수로 표시 |
| 구성원 마지막 근무 마감일 이전 변경 시도 | 차단 (`KB:product/admin/work/group-setting.md`) — 본 화면 이력에 영향 X |
| 구성원 퇴직 → `isRetired = true` | 이력은 그대로 남음 (조회 가능) |

## 비즈니스 룰

1. **읽기 전용 화면** — 이력 추가/수정/삭제 X, 시스템 자동 기록만
2. **조회 기간 = 필수, 최대 365일** (프론트·서버 이중 검증)
3. **필터 = 이력 기준** (현재 소속 X) — 일반 화면과 다른 점
4. **한번도 소속 안 됐던 인원 조회 불가** (이력 row 없음)
5. **시작일이 미래인 이력 소속일수 = 0일**, 진행 중·종료일 미래 이력은 오늘까지 일수
6. **엑셀 사유 필수** (다른 영역과 일관)
7. **근무 ↔ 휴가 영역 완전 대칭** (코드/API/UX 모두 미러)

## 알려진 제약 / 검증 / [TBD]

- [x] ~~`TM_LEAVE_GRP_HISTORY` 정확한 테이블 이름~~ → 근무·휴가 공용 `TM_GRP_HISTORY` + `GRP_CLASS` (2026-11-05)
- [x] ~~`LeaveGroupHistoryDto` 필드 구성~~ → 근무제 유형 없음, 입사일·연차기산일 추가 (2026-11-05)
- [x] ~~이력 자동 기록 트리거 위치~~ → `be:TimeGroupHistoryService.createGroupHistory:180` (2026-11-05)
- [x] ~~조회 기간 365일 초과 시 에러 메시지~~ → "조회 실패" / "조회 기간은 365일 이내로 설정합니다." (2026-11-05)
- [ ] 오늘 기준 소속 그룹이 없는 구성원이 목록에서 빠지는 동작이 의도인지 — (2026-11-05 Slack 검색: 관련 논의 없음. 화면 신설 PR #3642 공유 메시지 외 설계 논의 없음)

## 두현님께 질문 (선택)

- 미래 이력 입력 케이스가 실제로 자주 발생하나요? (예시: 분기 시작일에 그룹 변경 미리 입력)
- 이력 365일 제한의 이유 (DB 부하? 고객사 요청? 운영 정책?)
- 오늘 시점 소속 이력이 없는 구성원(예: 이력이 과거에 끊긴 퇴사자)을 이 화면에서 제외하는 게 의도인가요?

## 관련 문서

- `KB:product/admin/work/group-setting.md` § "구성원 설정 탭" — 이력 row가 만들어지는 입구
- `KB:product/admin/leave/group-setting.md` § B "구성원 설정 탭" — 휴가 측 동일
- `KB:product/admin/work/close-work-data.md` § "Cross-domain" — 마감일 이전 변경 차단
- `KB:code/backend-tables.md` — `TM_WORK_GRP_HISTORY` 인벤토리

---

## 📌 부록: "배포 이슈 리스트" (`ad-qa:L1309–1318`)

QA 체크리스트 신규 추가됐지만 **deep-dive 대상 아님**:

- 운영팀의 **이슈 트래킹/관리 메모** 형식
- "이슈로 다뤄야 할 내용 리스트업 → 핫픽스/과제화/이슈등록 분류 → 완료처리 ✅" 운영 워크플로우
- QA 항목이 아니라 **변경 사항 추적용 placeholder** (`[프론트] 이슈1`, `[프론트, 백] 이슈2` 형태)

→ KB의 영역 카운트에 포함 X. 운영 메모로만 인지.
