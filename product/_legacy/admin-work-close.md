# 근무 마감 (어드민)

## 개요

**근무 마감**은 특정 기간의 근무 데이터를 **확정**하는 작업. 마감된 일자는 모든 신청/승인/취소가 차단됩니다. 회계/급여 계산의 신뢰 가능한 기준점을 만드는 단계.

다른 비즈니스 룰 곳곳에서 "마감 후 ~ 불가"가 등장했는데, **이 영역이 그 룰의 본체**입니다. `closeYn` flag는 일별 단위로 매겨지고, 3개 레포에서 광범위하게 체크됩니다.

## 진입 위치

- 어드민 메뉴: 근무관리 > 근무 마감
- URL: `/attendance/work/close_work_data`

## QA 체크리스트

`talenx-admin/.claude/qa-checklist/attendance.md` **L731 ~ L752** (22줄, 비교적 짧은 영역)

3개 서브 섹션:
1. 개인별 마감 상태 탭 (L733–740) — 조회 + **일괄 마감 모달**
2. 마감 내역 탭 (L742–746) — 과거 마감 이력 조회
3. 적용 구성원 화면 (L748–752) — 마감 적용 받은 구성원 목록

## 코드 위치

### Admin 프론트 (`ad:src/`)

```
pages/attendance/work/close_work_data/
├── index.tsx                                       ← 메인 페이지 (2탭)
└── apply_members/[closeWorkDataHistoryId].tsx      ← 적용 구성원 상세 (dynamic route)

components/attendance/work/close_work_data/
├── index.tsx                                       ← 2탭 컨테이너 (URL ?tab= 으로 탭 상태 유지)
└── contents/
    ├── individual_close_work_status_tab/           ← 개인별 마감 상태 탭
    │   ├── index.tsx
    │   └── contents/
    │       ├── IndividualCloseWorkStatusFilter.tsx
    │       ├── IndividualCloseWorkStatusList.tsx
    │       ├── BulkCloseWorkDialog.tsx             ⭐ 일괄 마감 모달
    │       ├── BulkCloseWorkConfirmContent.tsx     ← 컨펌 본문
    │       └── TableFilterContextProvider.tsx
    └── close_work_history_tab/                     ← 마감 내역 탭
        ├── index.tsx
        ├── contents/
        │   ├── CloseWorkHistoryFilter.tsx
        │   ├── CloseWorkHistoryList.tsx
        │   └── TableFilterContextProvider.tsx
        └── detail/                                 ← 적용 구성원 화면
            ├── index.tsx
            └── contents/
                └── CloseWorkDataApplyMembersList.tsx

hooks/attendance/work/close_work_data/
├── useFilterOptions.ts                             ← 공통 (근무그룹 옵션 등)
├── close_work_history_tab/
│   ├── useExcelDownload.ts
│   └── useControlTableFilter.ts
└── individual_close_work_status_tab/
    ├── useExcelDownload.ts
    └── useControlTableFilter.ts

config/api/attendance/closeWorkData.ts              ← API 클라이언트
```

### 백엔드 (`be:com/hcg/optimiz/time/`)

```
controller/closeworkdata/CloseWorkDataController.java        ⭐ 메인 컨트롤러

service/closeworkdata/
├── CloseWorkDataService.java
└── CloseWorkDataHistoryService.java

mapper/closeworkdata/
├── CloseWorkDataMapper.java
└── CloseWorkDataHistoryMapper.java

vo/
├── CloseWorkDataHistoryVo.java                    ← 마감 이력
├── CloseWorkDataHistoryMemberVo.java              ← 마감 적용 구성원
└── CloseWorkDataHistoryWorkGroupVo.java           ← 마감 적용 근무그룹

dto/closeworkdata/
├── DailyCloseStatusRequestDto.java
├── DailyCloseStatusResponseDto.java                ← 일별 마감 현황 응답
├── CloseWorkDataHistoryRequestDto.java
├── CloseWorkDataHistoryResponseDto.java            ← 마감 이력 응답
└── CheckWorkDataIsClosedDto.java                   ⭐ 마감 여부 확인용 (다른 영역에서 호출)
```

### ppfront 연결 (`pp:src/`)

`closeYn`/`isClosed` flag가 사용자 측에서 체크되는 곳:

- `pp:src/@types/customTypes/attendance/empDailyWorkDto.d.ts:366` — `isClosed: boolean` (dayWorkInfo)
- `pp:src/@types/customTypes/attendance/personalLeave.d.ts:120` — `isClosed: boolean` (휴가)
- `pp:src/components/workflow/shared/template_drawer/contents/RegEdit.tsx:304` — `isWorkClosedDay = workInformation.isClosed` 변경 신청 차단
- `pp:src/locales/ko/attendance.json:599` — `closedDayCannotApply: "선택한 일자의 근무가 마감되어 대체 근무를 신청할 수 없습니다."`
- `pp:src/@types/customTypes/attendance/unionType.d.ts` — `closeYn` 관련 타입

## 데이터 모델

### CloseWorkDataHistoryVo (마감 이력)

마감 작업 1건당 1 row. 일괄 마감 실행 시 `CloseWorkDataHistoryWorkGroupVo` (다대다), `CloseWorkDataHistoryMemberVo` (적용 구성원)와 함께 생성됨.

| 필드 | 추정 의미 |
|------|------|
| `closeWorkDataHistoryId` | 마감 이력 ID (PK) |
| `startYmd` / `endYmd` | 마감 기간 |
| `note` | 메모 |
| `regUserId` / `regYmdhms` | 실행자 / 실행 일시 |
| (적용 그룹/구성원 관계 테이블로 분리) | |

> [TBD] VO 풀 필드는 직접 읽지 않음 — 필요 시 `be:vo/CloseWorkDataHistoryVo.java` 확인

### CheckWorkDataIsClosedDto.CheckWorkDataIsClosedDailyDto

마감 여부 확인용 DTO. 다른 영역(출퇴근내역 편집, 신청서 검증 등)에서 호출.

```java
private String standardYmd;     // 기준일
private String closeYn;          // 마감여부 (Y/N)

@JsonProperty("isClosed")        // 프론트로는 boolean 노출
public boolean isClosed() {
  return ENUM_YN.YES.value().equals(this.closeYn);
}
```

### 관련 DB 테이블

- `TM_CLOSE_WORK_DATA_HISTORY` — 마감 이력 (추정 이름)
- `TM_CLOSE_WORK_DATA_HISTORY_MEMBER` — 마감 적용 구성원
- `TM_CLOSE_WORK_DATA_HISTORY_WORK_GROUP` — 마감 적용 근무그룹
- 집계 테이블 (`TM_DD_ATTEND_AGGR`, `TM_DD_WORK_AGGR`, `TM_MM_*`)의 `closeYn` 컬럼

> [TBD] 정확한 테이블명은 `mapper/closeworkdata/` 의 XML 또는 init SQL 확인 필요. 현재 `code/backend-tables.md`에는 누락됨 — 추가 필요

## 백엔드 API 엔드포인트

`be:controller/closeworkdata/CloseWorkDataController.java`:

| Method | Path | 용도 |
|--------|------|------|
| POST | `/time/close-work-data/daily-close-status/search` ⭐ | 일별 근무 마감 현황 조회 (개인별 마감 상태 탭) |
| POST | `/time/close-work-data/daily-close-status/excel-download/search` | 일별 마감 현황 엑셀 |
| POST | `/time/close-work-data/close-work-bulk` ⭐ | **근무 일괄 마감 실행** |
| POST | `/time/close-work-data/close-work-history/search` ⭐ | 근무 마감 내역 조회 (마감 내역 탭) |
| POST | `/time/close-work-data/close-work-history/excel-download/search` | 마감 내역 엑셀 |
| POST | `/time/close-work-data/close-work-history/{closeWorkDataHistoryId}/target-members/search` | 마감 적용 구성원 조회 (적용 구성원 화면) |

> ~~별도 "마감 해제(unclose)" 엔드포인트는 발견 안 됨~~ → **(2026-07-09 해소) 마감 해제 존재**: `CloseWorkDataService.reopenCloseWorkBulk()` (be:service/closeworkdata/CloseWorkDataService.java:328). 마감 이력 ID 단위로 해제하며, 해제 시 `CLOSE_TYPE_CODE.REOPEN_BULK` 타입의 새 이력 INSERT (원본 이력은 보존, `sourceHistoryId`로 연결). `ReopenCloseWorkBulkRequestDto` + `BulkCloseAndReopenIntegrationTest` 존재.

## Cross-domain: closeYn이 체크되는 곳 ⭐

마감 영역의 핵심 가치는 **3개 레포 곳곳에서 일관되게 차단을 거는 것**. 어디서 차단되는지 정리:

### 어드민 (talenx-admin)

| 화면 | 동작 | 코드 위치 |
|------|------|------|
| 근무 데이터 관리 - 전사 근무현황 | `isClosed` 컬럼 표시 (마감/미마감) | `ad:.../check_work_data/.../WorkStatusList.tsx:640-648` |
| 근무 데이터 관리 - 출퇴근내역 | `isClosed` 컬럼 표시 + 상태 텍스트 | `ad:.../inout_records_tab/contents/InoutRecordsList.tsx:314-323` |
| 출퇴근내역 - 어드민 직접 편집 | `isClosedWorkDay` state로 편집 차단 | `ad:.../InoutRecordEditDialog.tsx:168, 538` |
| `/time/aggr/inout-records/valid-date` | 마감 여부 확인 → 차단 사유 응답 | `KB:product/admin-work-data.md` § "충돌 케이스" |

### 사용자 (ppfront)

| 화면/동작 | 차단 메시지 | 코드 위치 |
|------|------|------|
| 출퇴근 위젯 (출근/퇴근 요청, 승인, 취소) | "근무 마감된 일자" 차단 (QA L90) | `pp:.../work_commute/` |
| 근무내역 변경 신청 | `isWorkClosedDay = true` 차단 | `pp:src/components/workflow/shared/template_drawer/contents/RegEdit.tsx:304` |
| 대체근무 신청 | "선택한 일자의 근무가 마감되어 대체 근무를 신청할 수 없습니다." | `pp:locales/ko/attendance.json:599` |
| 휴가 신청 | `personalLeave.isClosed` 체크 | `pp:src/@types/customTypes/attendance/personalLeave.d.ts:120` |
| 출퇴근내역 편집 (당일 변경) | `dayWorkInfo.isClosed` 차단 | `pp:src/@types/customTypes/attendance/empDailyWorkDto.d.ts:366` |
| 그룹스케줄 변경 (어드민 측에도 적용) | "근무 마감된 일자의 경우 스케줄 삭제, 추가, 확정이 불가" (QA L546) | `KB:product/admin-work-group.md` § 그룹스케줄 |

### 정산 (pay 도메인)

근무 마감은 정산까지 영향. ppfront 정산 화면 곳곳에서 `closeYn === "Y"`로 입력/수정 비활성화:

- `pp:src/components/pay/settlement/detail/index.tsx:100` — `const isClosed = settleWorkData.closeYn === "Y"` → 버튼 disabled
- `pp:src/components/pay/settlement/detail/steps/UploadStep.tsx:72-141` — 업로드 차단
- `pp:src/components/pay/settlement/detail/FamilyEditModal/index.tsx:101` — 모달 입력 차단

> 정산 도메인은 attendance 범위 밖이지만, 마감 효과가 정산까지 전파됨을 보여줌

## 핵심 동작 — 탭 1: 개인별 마감 상태

### 조회

필터 (`useFilterOptions`로 옵션 제공):
- 구성원, 회사, 조직, 근무그룹, 활성여부 등 (정확한 필드 [TBD])

API: `POST /time/close-work-data/daily-close-status/search?page&pageSize`
페이로드: `IndividualCloseWorkStatusPayload`
응답: `PageResponse<IndividualCloseWorkStatusContent>`

각 row는 구성원 × 일자 단위 + 현재 마감 여부.

### 일괄 마감 (가장 중요한 액션)

QA L736–739. **컴포넌트**: `BulkCloseWorkDialog.tsx`

**필수 입력 (staging 실측 2026-05-15 갱신)**:
1. **회사** (필수, default = 로그인 사용자 회사)
2. **근무그룹** (다중 선택, `MultiSelectAutocomplete`) — 회사 선택 후 해당 회사의 그룹만 옵션 노출
3. **마감 기간**: `startYmd` ~ `endYmd` (`ReactFlatPickr`)
4. **메모** (`TextArea`, `note`, 선택)
5. **적용일** ⭐ (textbox, default = 오늘) — 마감 처리 적용 일자. **QA/KB 양쪽 누락이었던 필드**, staging UI에서 확인됨

**밸리데이션 (staging 실측)**:
- 근무그룹 미선택 → "근무 그룹을 선택합니다"
- 마감 기간 미선택 → "마감 기간을 선택합니다"

**밸리데이션**:
- 근무그룹 미선택 → `CLOSE_WORK_DATA.workGroupSelectValidationMessage`
- 마감 기간 미입력/잘못된 값 → `CLOSE_WORK_DATA.closePeriodSelectValidationMessage`

**플로우**:
```
[일괄 마감 버튼 클릭]
   ↓
[BulkCloseWorkDialog 오픈]
   ↓ 필수 입력 (그룹/기간/메모) + 적용 클릭
   ↓ validateWorkGroups + validateClosePeriod
   ↓ 통과 시: showConfirm 컨펌 (BulkCloseWorkConfirmContent에 마감 기간/그룹 표시)
   ↓ 확인 클릭
[POST /time/close-work-data/close-work-bulk]
   ↓
[성공 → showSnackbar + queryClient.invalidateQueries → 테이블 최신화]
```

**Mutation**: `useMutation(postCloseWorkDataCloseWorkBulk)` + `react-query` 키 무효화로 테이블 자동 리프레시

### 엑셀 다운로드

- 사유 입력 후 `postCloseWorkDataDailyCloseStatusExcelDownloadSearch` 호출
- 필터 조건 적용된 데이터 다운로드 (`TALENX-LOG-REASON` payload 포함)

## 핵심 동작 — 탭 2: 마감 내역

### 조회

QA L744–746. 필터로 마감 이력 조회:
- API: `POST /time/close-work-data/close-work-history/search?page&pageSize`
- 응답: `PageResponse<CloseWorkHistoryContent>`
- 각 row = 1건의 마감 이력 (실행자/일시/기간/적용 그룹 수/적용 구성원 수 등)

**적용 구성원 셀 클릭** → `/attendance/work/close_work_data/apply_members/[closeWorkDataHistoryId]` 페이지로 이동

### 엑셀 다운로드

`postCloseWorkDataCloseWorkHistoryExcelDownloadSearch` (사유 필수)

## 핵심 동작 — 적용 구성원 화면

QA L750–752:

- URL: `/attendance/work/close_work_data/apply_members/[closeWorkDataHistoryId]`
- API: `POST /time/close-work-data/close-work-history/{id}/target-members/search?page&pageSize`
- 응답: `CloseWorkHistoryApplyMembersTableResponse`
- 테이블: 해당 마감에 적용된 구성원 목록
- 우측 상단: 마감 정보 요약 (기간, 그룹, 메모 등)
- 뒤로가기: 마감 내역 탭으로 복귀

### 마감 내역 탭 컬럼 (staging 실측 2026-05-15)

스테이징 확인 결과 실제 컬럼: **마감 기간 / 마감 구분 ⭐ / 근무 그룹 / 적용 구성원 / 담당자 / 처리일 / 메모**

> ⭐ **`마감 구분` 컬럼 = `CLOSE_TYPE_CODE`** (2026-07-09 해소): `CLOSE_BULK`(일괄마감) / `CLOSE_INDIVIDUAL`(개별마감) / `REOPEN_BULK`(일괄해제). `be:constant/CONST_TIME_CODE.CLOSE_TYPE_CODE`. 해제 이력은 `SOURCE_HISTORY_ID`로 원본 마감 이력을 참조.

## 비즈니스 룰

1. **마감 단위는 일자 + 구성원**: `closeYn`은 `TM_DD_ATTEND_AGGR.closeYn` 컬럼에 표현됨 (DTO에서는 `isClosed: boolean`)
2. **마감 실행 단위는 근무그룹 × 기간**: 일괄 마감 모달은 근무그룹 다중 선택 + 기간 → 해당 그룹 소속 구성원의 해당 기간 일자가 모두 마감됨
3. **마감 후 차단 범위** (위 cross-domain 표 참조):
   - 출퇴근 요청 / 승인 / 취소 (체크리스트 L90)
   - 근무내역 변경 신청 / 대체근무 신청 / 휴가 신청
   - 어드민 출퇴근내역 직접 편집
   - 그룹스케줄 변경 (마감 일자)
   - 정산 입력 수정
4. ~~마감은 단방향~~ → **마감 해제 가능** (2026-07-09): `POST reopen` 계열 — `reopenCloseWorkBulk`. 마감 이력 단위 해제, 해제 이력 별도 INSERT
5. **누락/미완성 근무내역이어도 마감 차단 없음** (2026-07-09 검증): `validateCloseWorkBulkRequest`는 기간·그룹·기간≤100일·현재일 이전만 검증. 마감 대상은 `TM_DD_ATTEND_AGGR`에서 기간+그룹+미마감(`CLOSE_YN='N' OR NULL`) 조건으로만 조회 (`getCloseWorkTarget`, CloseWorkDataMapper.xml:181) — 출퇴근 기록 누락 여부는 안 봄. 집계 row 자체가 없는 날은 조용히 스킵. 대상이 기간 전체에 0건일 때만 "근무 마감 대상이 존재하지 않습니다" 에러
6. **마감 시 메모 필수**: 모달 필드 (감사 로그 + 사유 보관 용도로 추정)
7. **엑셀 다운로드 사유 필수**: 일관된 감사 로그 정책
8. **마감 기간 제약** (2026-07-09): 최대 100일(`MAX_DAYS_FOR_WORK_CLOSE`), 시작·종료일 모두 현재일 이전(당일 포함 마감 불가)

## 마감 밸리데이션 변경 이력 (git, 2026-07-09 확인)

`CloseWorkDataService.java`를 건드린 커밋은 3개뿐:

1. `f22451f13` (2025-12-04, #1150) — 최초 구현. 마감 불가 조건 셋은 현재와 동일 (그룹/기간 필수, 역순 불가, 현재일 이전, 기간 제한, 대상 0건). 단 기간 제한 **90일** + 기간 계산에 off-by-one (양끝 포함 안 됨 → 실제 91일 허용)
2. `390aee9fb` (2026-01-15, #1230) — 기간 제한 90→**100일**, `+1` 로 양끝 포함 계산 수정, 에러 메시지 문구 정비
3. `a369f3207` — 일괄 해제(reopen) 추가

→ **누락/미승인/결재중 신청서 체크는 어느 시점에도 존재한 적 없음.** 조건 구조는 최초 구현부터 불변, 숫자(90→100)만 변경.

## 알려진 제약 / 미구현

- ~~마감 해제 기능이 명시적으로 없음~~ → 해제 존재 (`reopenCloseWorkBulk`, 위 참조). 어드민 UI 노출 여부는 [TBD]
- 개별 일자 마감: `CLOSE_TYPE_CODE.CLOSE_INDIVIDUAL` 코드가 존재하므로 개별 마감 개념은 있음 — 진입 UI/API [TBD]
- 어드민이 사용자별 마감 상태를 다르게 적용할 수 있는지 (위 모달은 그룹+기간 단위) [TBD]

## 검증 / [TBD]

- [ ] `CloseWorkDataHistoryVo` 풀 필드 — 정확한 컬럼 구성
- [ ] 백엔드 테이블 이름 (`TM_CLOSE_WORK_DATA_HISTORY*`) — `init/` SQL 또는 mapper XML 확인 필요. **`code/backend-tables.md`에 마감 관련 테이블 추가 필요**
- [ ] 마감 해제(unclose) 메커니즘 — API 없으면 DB 직접? 운영 정책?
- [ ] `IndividualCloseWorkStatusPayload` / `CloseWorkBulkPayload` 정확한 구조
- [ ] 마감 시 어떤 데이터가 함께 스냅샷 되는지 — 사후 변경 영향
- [ ] 일괄 마감 시 진행 중 신청서가 있는 일자는 어떻게 처리? (자동 반려? 보류? 차단?)

## 두현님 답변 받으면 좋을 것

- 운영상 마감 해제 절차 (코드 없으면 DB 직접 수정인지)
- 일괄 마감 도중 결재중 신청서가 있는 경우 처리 룰

## 관련 문서

- `KB:product/admin-work-data.md` — 어드민 출퇴근내역 편집 시 마감 차단 (`validateInoutDate`)
- `KB:product/admin-work-group.md` — 구성원 그룹 변경일 지정 시 마감일 이전 변경 불가 + 그룹스케줄 마감일 변경 불가
- `KB:product/user-checkin-widget.md` — 출퇴근 요청/승인/취소 시 마감 차단
- `KB:domain/business-rules.md` § 9 "근무 마감 후 제약"
