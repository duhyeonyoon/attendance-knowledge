# 과거 데이터 관리 (어드민 #15 + #16)

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
controller/olddata/OldLeaveDataController.java          ← 휴가 (이미 leave-domain.md에서 발견)
                                                          (근무 측 컨트롤러도 있을 것 [TBD])

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
| 백엔드 컨트롤러 | [TBD] (`OldWorkDataController` 추정) | `OldLeaveDataController` |

**공유**: `UploadOldDataResponseDto` (업로드 결과 공통 DTO)

---

## 데이터 모델

`be:vo/OldWorkDataVo.java` / `OldLeaveDataVo.java` — 정확한 필드 [TBD], 추정 구조:
- 구성원 식별 (memberId/empNo)
- 일자
- 근무 시간 / 휴가 정보
- 등록자 / 등록 회사 (권한 분기 기준)
- 등록 일시

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
| 사용자 조회 | (사용자 화면에 노출되는지 [TBD] — 어드민 전용일 가능성) |
| 데이터 삭제 | hard delete 추정 |
| 권한 분리 | 회사간 데이터 격리 (서브어드민) |

## 비즈니스 룰

1. **조회 전용 별도 테이블** (집계/정산 영향 X)
2. **필터 필수**: 빈 값으로 전체 조회 차단
3. **수동 조회**: 페이지 오픈 시 자동 조회 X (서버 부하 보호)
4. **엑셀 업로드 + 행별 밸리데이션**: 부분 오류 시 정확한 행 표시
5. **권한 분리**: 총괄 = 전체 / 서브어드민 = 본인 회사 등록분만
6. **체크박스 다중 삭제** 지원

## 알려진 제약 / 임시 동작

- 과거 데이터 = 별도 테이블, 집계 영향 X (의도된 격리)

## 검증 / [TBD]

- [ ] `OldWorkDataController` 백엔드 컨트롤러 위치 (휴가 측만 발견됨)
- [ ] 엑셀 양식 정확한 컬럼 구성
- [ ] 삭제 메커니즘 (hard delete? soft delete?)
- [ ] 사용자 화면에 과거 데이터 노출되는지
- [ ] 등록 회사 = 등록자 회사인지 명시적 회사 입력인지
- [ ] 업로드 시 중복 처리 (같은 일자 같은 구성원 데이터)

## 두현님께 질문 (선택)

1. **과거 데이터가 사용자 화면에 노출**되나요? (어드민 전용?)
2. **업로드 시 중복 처리** 룰? (덮어쓰기? 거부? 두 row 모두 유지?)
3. **언제 이 화면을 사용**하나요? (신규 클라이언트 도입 시? 외부 시스템 마이그레이션?)

## 관련 문서

- `KB:product/admin-system-entry.md` § #4 — 서브어드민 권한 (조회 범위 분기)
- `KB:product/admin-work-data.md` — 일반 근무 데이터 (집계 데이터, 별도)
- `KB:product/leave-domain.md` — 일반 휴가 데이터 (별도)
- `KB:domain/glossary.md` — 회사 격리 룰
