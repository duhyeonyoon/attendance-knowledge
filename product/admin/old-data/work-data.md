---
sidebar:
  order: 1
---

# 과거 근무 데이터 관리

> **메뉴** 근무관리 › 과거 데이터 관리 › 과거 근무 데이터 관리  
> **URL** `/attendance/old_data_management/work_data`  
> **원본** `product/_legacy/admin-old-data.md`

[과거 휴가 데이터 관리](./leave-data.md)와 거의 같은 패턴이라, 두 화면의 공통 명세를 이 페이지에 둡니다.

## 개요

**서비스 도입 이전 또는 외부 시스템에서 누적된 과거 근무/휴가 데이터**를 엑셀로 업로드해서 시스템에 통합 조회 가능하게 하는 화면. **데이터 마이그레이션 / 이력 보존** 용도.

| 영역 | 화면 | QA |
|------|------|------|
| **#15** | 과거 근무 데이터 관리 | `ad-qa:L1247–1259` (13줄) |
| **#16** | 과거 휴가 데이터 관리 | `ad-qa:L1261–end` |

두 영역이 **거의 동일한 패턴** (필터/조회/업로드/삭제/권한). 묶어서 정리.

## 진입 위치

- 어드민 메뉴: 근무관리 > 과거 근무 데이터 관리 / 과거 휴가 데이터 관리
- URL:
  - 과거 근무: `/attendance/old_data_management/work_data`
  - 과거 휴가: `/attendance/old_data_management/leave_data`

## 코드 위치

```
pages/attendance/old_data_management/
├── work_data/
└── leave_data/

components/attendance/old_data_management/
├── work_data/
│   ├── index.tsx
│   └── contents/
│       ├── OldWorkDataFilter.tsx
│       ├── OldWorkDataTable.tsx
│       ├── OldWorkDataExcelUploadModal.tsx
│       └── TableFilterContextProvider.tsx
└── leave_data/
    ├── index.tsx
    └── contents/
        ├── OldLeaveDataFilter.tsx
        ├── OldLeaveDataTable.tsx
        ├── OldLeaveDataExcelUploadModal.tsx
        └── TableFilterContextProvider.tsx

hooks/attendance/old_data_management/
├── work_data/
│   ├── useFilterOptions.ts
│   ├── useOldWorkDataExcelUpload.tsx
│   └── useControlTableFilter.ts
└── leave_data/
    └── (유사 구조)

config/api/attendance/
├── oldWorkDataManagement.ts
└── oldLeaveDataManagement.ts

@types/attendance/
├── oldWorkDataManagement.d.ts
└── oldLeaveDataManagement.d.ts
```

### 백엔드

```
controller/olddata/OldWorkDataController.java           ← 근무 (2026-11-05 확인: /time/old-data/old-work-data/{init,search,...})
controller/olddata/OldLeaveDataController.java          ← 휴가
service/olddata/OldWorkDataService.java · OldLeaveDataService.java
SQL/time/olddata/OldWorkDataMapper.xml · OldLeaveDataMapper.xml   (테이블 TM_OLD_WORK_DATA · TM_OLD_LEAVE_DATA)

vo/
├── OldWorkDataVo.java
└── OldLeaveDataVo.java

dto/olddata/
├── OldWorkDataRequestDto.java
├── OldWorkDataResponseDto.java
├── OldLeaveDataRequestDto.java
├── OldLeaveDataResponseDto.java
└── UploadOldDataResponseDto.java                       ← 업로드 결과 공통 DTO
```

---

## § 공통 패턴 (#15 + #16 동일)

### 필터

| 영역 | 필수 필터 |
|------|------|
| 과거 근무 | **이번달 연월** (필수, 지울 수 없음) |
| 과거 휴가 | **올해 연도** (필수, 지울 수 없음) |

> 필터가 항상 채워져있어야 조회 가능. 빈 값으로 전체 조회 차단.

### 화면 진입 시 동작

- **기본은 데이터 없는 상태** (페이지 오픈 시 자동 조회 X)
- [조회] 버튼 클릭 → 필터 조건으로 데이터 조회

### 엑셀 업로드 (가장 핵심 기능)

[과거 데이터 업로드] 버튼 → **드래그 앤 드랍 모달**

**[엑셀 양식 다운로드]** 버튼:
- 양식 다운로드

**업로드 흐름**:
```
[엑셀 업로드]
   ↓ 밸리데이션
   ├─ 데이터 정상 → "총 n건의 조회용 과거 [근무|휴가] 데이터를 추가합니다." 컨펌
   │   ↓ [확인]
   │   엑셀 업로드 팝업 → 완료 시 스낵바
   └─ 데이터 오류 → "총 n건에서 m개의 데이터 오류 확인이 필요합니다." 메시지
       ↓
       몇 번째 행에서 문제 발생했는지 순차 표시
```

### 삭제

- **테이블 행마다 좌측 체크박스**
- 체크 후 좌측 상단 [삭제] 버튼 → 선택 데이터 삭제

### 권한 제어 (가장 중요한 차별 룰)

| 권한 | 조회 범위 |
|------|------|
| **근무 총괄** | **전체 조회 가능** |
| **서브어드민** | **(talenx 기준) 본인 소속 회사의 사용자가 등록한 데이터만** 조회 |

> 데이터 등록자 기준 격리. 같은 클라이언트 내 회사간 데이터 분리.

**📌 테스트 안내**:
> (2026.02.13 기준) 스테이징 - sh 계정으로 서브어드민 확인 가능 (sh:유월컴퍼니 소속)

---

## § 차이점

거의 동일한데 미세한 차이:

| 항목 | 과거 근무 (#15) | 과거 휴가 (#16) |
|------|------|------|
| 기본 필터 | 이번달 **연월** | 올해 **연도** |
| 메시지 | "조회용 과거 **근무** 데이터" | "조회용 과거 **휴가** 데이터" |
| 컴포넌트 | `OldWorkData*` | `OldLeaveData*` |
| API | `oldWorkDataManagement.ts` | `oldLeaveDataManagement.ts` |
| VO | `OldWorkDataVo` | `OldLeaveDataVo` |
| 백엔드 컨트롤러 | `OldWorkDataController` | `OldLeaveDataController` |
| 데이터 단위 | 구성원 × **연도/월** 1행 (월 집계) | 구성원 × 휴가 유형 × 귀속연도(사용기간) 1행 |
| 추가 필터 | — | 휴가 유형 |

**공유**: `UploadOldDataResponseDto` (업로드 결과 공통 DTO)

---

## 데이터 모델

**(2026-11-05 해소)** 엑셀 양식·목록 컬럼 (`ad:src/hooks/attendance/old_data_management/*/useOld*DataExcelUpload.tsx`, `ad:src/locales/ko/attendance.json` `OLD_*_DATA_MANAGEMENT`):

**과거 근무** — 사번 · 이름 · 회사(명) · 조직 · 직급 · 연도/월(YYYYMM) | 근무 계획: 계획 근무일 · 계획 근무 시간 · 최대 근무 시간 | 사전 승인 추가 근무시간: 연장/야간/휴일 근무시간 | 지각/조퇴: 지각 횟수 · 지각 시간 · 조퇴 횟수 · 조퇴 시간 | 확정 근무 시간(근무일): 근무일 · 총/기본/연장/야간 근무 시간 | 확정 근무 시간(휴무일): 휴무일 근무일 · 휴무일 총/기본/연장/야간 근무 시간 | 확정 근무 시간(휴일): 휴일 근무일 · 휴일 총/기본/연장/야간 근무 시간 | 메모
- 필수: 사번 · 이름 · 회사명 · 연도/월. 시간 필드는 **분 단위 0 이상 정수** (예: 1시간 30분 → 90)

**과거 휴가** — 사번 · 이름 · 회사 · 조직 · 직급 · 입사일 · 연차기산일 | 휴가 정보: 휴가 유형 · 귀속연도(YYYY) · 사용 시작일 · 사용 종료일 | 부여 정보: 부여 · 자동 · 조정 · 부여-이월 (각 일/시간) | 사용 정보: 사용 · 의무 사용 · 의무 사용외 | 잔여 정보: 잔여 | 정산 결과: 소멸 · 보상 · 정산-이월 | 메모
- 필수: 사번 · 이름 · 회사명 · 휴가 유형 · 귀속연도 · 사용 시작일 · 사용 종료일. 날짜 YYYYMMDD, 숫자는 소수점 4자리까지

- 구성원은 **이름/사번/회사명 텍스트로 저장** (근무 모듈 구성원과 연결하지 않음 — 필터 옵션도 업로드된 데이터의 distinct 값으로 구성, `be:OldWorkDataService.oldWorkDataInit:45-64`)
- 등록자 회사코드(`REGISTERED_COMPANY_CODE`) · 등록자 ID 함께 저장

→ **이 데이터는 일반 근무/휴가 테이블과 별도** (조회 전용). 집계/정산에 영향 X.

## 데이터 흐름

```
[외부 시스템 또는 도입 전 데이터]
   ↓ 엑셀 작성
[어드민 업로드 화면]
   ↓ 밸리데이션
   ├─ 정상 → 컨펌 → DB 저장
   └─ 오류 → 행별 오류 표시
[저장된 데이터]
   ↓ 권한별 조회
   ├─ 총괄: 전체
   └─ 서브어드민: 본인 소속 회사 등록분만
```

## Cross-domain 효과

| 동작 | 영향 |
|------|------|
| 과거 데이터 업로드 | 별도 테이블에 저장, **일반 근무/휴가 집계에 영향 X** |
| 사용자 조회 | **(2026-11-05 해소) 어드민 전용** — ppfront에 과거 데이터 API/화면 참조 없음 (`git grep old-work-data\|old-leave-data` 0건) |
| 데이터 삭제 | **(2026-11-05 해소) hard delete** — `DELETE FROM TM_OLD_WORK_DATA/TM_OLD_LEAVE_DATA WHERE ... IN (...)` (`be:OldWorkDataMapper.xml:175-182`, `OldLeaveDataMapper.xml:204`), 복구 불가 |
| 권한 분리 | 회사간 데이터 격리 (서브어드민) |

## 비즈니스 룰

1. **조회 전용 별도 테이블** (집계/정산 영향 X)
2. **필터 필수**: 빈 값으로 전체 조회 차단
3. **수동 조회**: 페이지 오픈 시 자동 조회 X (서버 부하 보호)
4. **엑셀 업로드 + 행별 밸리데이션**: 부분 오류 시 정확한 행 표시. **(2026-11-05 확인) 오류가 1행이라도 있으면 전체 저장하지 않음** (`be:OldWorkDataService.uploadOldWorkDataFromExcel:160-166` — `response.hasError()`면 insert 없이 반환, 휴가도 동일 `OldLeaveDataService:172`). 프론트에서도 같은 항목을 선검증("{행}행: {메시지}")
   - **중복 업로드 = 그대로 추가** — 같은 구성원·같은 연월(휴가는 같은 유형·귀속연도) 데이터를 다시 올려도 덮어쓰기/거부 없이 새 행으로 저장 (PK가 행 ID뿐이고 중복 체크·유니크 키 없음, `be:db/migrationSql/20260206_01_init_TM_OLD_WORK_DATA.sql`, `20260205_02_init_TM_OLD_LEAVE_DATA.sql`). 잘못 올리면 체크 후 삭제
5. **권한 분리**: 총괄 = 전체 / 서브어드민 = 본인 회사 등록분만. **"등록 회사" = 업로드한 사람의 소속 회사코드(로그인 정보)** — 엑셀의 회사명 컬럼과 무관 (`be:OldWorkDataController` `userManager.getCompanyCode()` → `REGISTERED_COMPANY_CODE`, Mapper `isTimeAdmin == false`일 때만 조건)
6. **체크박스 다중 삭제** 지원

## 알려진 제약 / 임시 동작

- 과거 데이터 = 별도 테이블, 집계 영향 X (의도된 격리)

## 검증 / [TBD]

- [x] ~~`OldWorkDataController` 백엔드 컨트롤러 위치~~ → `be:controller/olddata/OldWorkDataController.java` (권한 `OLD_WORK_DATA_MANAGE` 또는 근무 총괄)
- [x] ~~엑셀 양식 정확한 컬럼 구성~~ → § 데이터 모델
- [x] ~~삭제 메커니즘~~ → hard delete
- [x] ~~사용자 화면에 과거 데이터 노출되는지~~ → 어드민 전용
- [x] ~~등록 회사 = 등록자 회사인지~~ → 등록자 소속 회사코드
- [x] ~~업로드 시 중복 처리~~ → 중복 체크 없이 추가 저장

## 두현님께 질문 (선택)

1. ~~**언제 이 화면을 사용**하나요?~~ → **(2026-11-05 Slack 확인)** 신규 도입 고객사의 이전 시스템 근무·휴가 기록 이관용(로드맵 '과거 데이터 마이그레이션' 과제, 연차 화면 우선 개발). 근무 모듈의 구성원·소속·설정과 **무관한 단순 과거 기록**으로 보고 필수값·형식만 검증, 프로필 사진도 일부러 연결하지 않음("마이그레이션해서 데이터 활용하려는 헛된 기대 방지") — Slack #sq-time 2026-02 과거 휴가 데이터 관리 개발 스레드 (https://hcgtheplus.slack.com/archives/C04QC2RJJBU/p1770196802998979), 이관 사례 #ch-plan 2025-12-10
2. 중복 업로드 시 새 행으로 쌓이는 현재 동작이 의도인지 (덮어쓰기 요구 여부) — (2026-11-05 Slack 부분: '입력받은 그대로 신뢰, 필수·형식만 검증'이라는 설계 방침만 있고 중복 처리 자체에 대한 논의는 없음)

## 관련 문서

- `KB:product/admin/authority/custom.md` — 서브어드민 권한 (조회 범위 분기)
- `KB:product/admin/work/check-work-data.md` — 일반 근무 데이터 (집계 데이터, 별도)
- `KB:product/admin/leave/overview.md` — 일반 휴가 데이터 (별도)
- `KB:domain/glossary.md` — 회사 격리 룰
