---
sidebar:
  order: 6
---

# 근무 마감

> **메뉴** 근무관리 › 근무 › 근무 마감  
> **URL** `/attendance/work/close_work_data`  
> **탭** 개인별 마감 상태 · 마감 내역  
> **원본** `product/_legacy/admin-work-close.md`

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
        │   ├── BulkReopenWorkConfirmContent.tsx    ← 일괄 해제 컨펌 본문
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

| 필드 | 의미 |
|------|------|
| `closeWorkDataHistoryId` | 마감 이력 ID (PK, TSID) |
| `startYmd` / `endYmd` | 마감 기간 |
| `closeTypeCode` | 마감 구분 (`CLOSE_BULK` / `CLOSE_INDIVIDUAL` / `REOPEN_BULK` / `REOPEN_INDIVIDUAL`) |
| `actorMemberId` | 처리 담당자 |
| `executeYmdhms` | 처리 일시 (UTC) — 화면 "처리일" |
| `note` | 메모 (해제 이력은 원본 메모를 복사) |
| `sourceHistoryId` | 해제 이력이 가리키는 원본 마감 이력 ID |
| (적용 그룹/구성원은 관계 테이블로 분리) | |

> ~~[TBD] VO 풀 필드는 직접 읽지 않음~~ → **(2026-11-05 해소)** `be:vo/CloseWorkDataHistoryVo.java:17-38` 위 8개 필드가 전부.

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

- `TM_CLOSE_WORK_DATA_HISTORY` — 마감 이력 (`SOURCE_HISTORY_ID` 컬럼 = 해제 이력의 원본 참조)
- `TM_CLOSE_WORK_DATA_HISTORY_MEMBER` — 마감 적용 구성원
- `TM_CLOSE_WORK_DATA_HISTORY_WORK_GROUP` — 마감 적용 근무그룹
- 일근태집계 `TM_DD_ATTEND_AGGR`의 `CLOSE_YN` / `CLOSE_YMDHMS` — 마감 시 Y + 마감일시, 해제 시 N + null

> ~~[TBD] 정확한 테이블명 확인 필요~~ → **(2026-11-05 해소)** 위 3개 테이블명 확정 (`be:src/main/resources/` 의 mapper XML · 마이그레이션 SQL에서 확인). `code/backend-tables.md` 추가는 공유 파일 변경 제안으로 보고.

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
| PUT | `/time/close-work-data/close-work-bulk/reopen` ⭐ | **일괄 해제** (`closeWorkDataHistoryIds[]`) — 마감 내역 탭 "일괄 해제" 버튼 |

> 개별 마감/개별 해제 엔드포인트는 없음 (2026-11-05 `be:controller/closeworkdata/CloseWorkDataController.java` 전수 확인).

> ~~별도 "마감 해제(unclose)" 엔드포인트는 발견 안 됨~~ → **(2026-07-09 해소) 마감 해제 존재**: `CloseWorkDataService.reopenCloseWorkBulk()` (be:service/closeworkdata/CloseWorkDataService.java:328). 마감 이력 ID 단위로 해제하며, 해제 시 `CLOSE_TYPE_CODE.REOPEN_BULK` 타입의 새 이력 INSERT (원본 이력은 보존, `sourceHistoryId`로 연결). `ReopenCloseWorkBulkRequestDto` + `BulkCloseAndReopenIntegrationTest` 존재.

## Cross-domain: closeYn이 체크되는 곳 ⭐

마감 영역의 핵심 가치는 **3개 레포 곳곳에서 일관되게 차단을 거는 것**. 어디서 차단되는지 정리:

### 어드민 (talenx-admin)

| 화면 | 동작 | 코드 위치 |
|------|------|------|
| 근무 데이터 관리 - 전사 근무현황 | `isClosed` 컬럼 표시 (마감/미마감) | `ad:.../check_work_data/.../WorkStatusList.tsx:640-648` |
| 근무 데이터 관리 - 출퇴근내역 | `isClosed` 컬럼 표시 + 상태 텍스트 | `ad:.../inout_records_tab/contents/InoutRecordsList.tsx:314-323` |
| 출퇴근내역 - 어드민 직접 편집 | `isClosedWorkDay` state로 편집 차단 | `ad:.../InoutRecordEditDialog.tsx:168, 538` |
| `/time/aggr/inout-records/valid-date` | 마감 여부 확인 → 차단 사유 응답 | `KB:product/admin/work/check-work-data.md` § "충돌 케이스" |

### 사용자 (ppfront)

| 화면/동작 | 차단 메시지 | 코드 위치 |
|------|------|------|
| 출퇴근 위젯 (출근/퇴근 요청, 승인, 취소) | "근무 마감된 일자" 차단 (QA L90) | `pp:.../work_commute/` |
| 근무내역 변경 신청 | `isWorkClosedDay = true` 차단 | `pp:src/components/workflow/shared/template_drawer/contents/RegEdit.tsx:304` |
| 대체근무 신청 | "선택한 일자의 근무가 마감되어 대체 근무를 신청할 수 없습니다." | `pp:locales/ko/attendance.json:599` |
| 휴가 신청 | `personalLeave.isClosed` 체크 | `pp:src/@types/customTypes/attendance/personalLeave.d.ts:120` |
| 출퇴근내역 편집 (당일 변경) | `dayWorkInfo.isClosed` 차단 | `pp:src/@types/customTypes/attendance/empDailyWorkDto.d.ts:366` |
| 그룹스케줄 변경 (어드민 측에도 적용) | "근무 마감된 일자의 경우 스케줄 삭제, 추가, 확정이 불가" (QA L546) | `KB:product/admin/work/group-setting.md` § 그룹스케줄 |

### 정산 (pay 도메인)

근무 마감은 정산까지 영향. ppfront 정산 화면 곳곳에서 `closeYn === "Y"`로 입력/수정 비활성화:

- `pp:src/components/pay/settlement/detail/index.tsx:100` — `const isClosed = settleWorkData.closeYn === "Y"` → 버튼 disabled
- `pp:src/components/pay/settlement/detail/steps/UploadStep.tsx:72-141` — 업로드 차단
- `pp:src/components/pay/settlement/detail/FamilyEditModal/index.tsx:101` — 모달 입력 차단

> 정산 도메인은 attendance 범위 밖이지만, 마감 효과가 정산까지 전파됨을 보여줌

## 핵심 동작 — 탭 1: 개인별 마감 상태

### 조회

필터 (2026-11-05 `ad:.../individual_close_work_status_tab/contents/IndividualCloseWorkStatusFilter.tsx` 확인):
- **조회 기간** (range, 기본 = 이번 달 1일 ~ 오늘) · 구성원 · 회사(기본 = 로그인 사용자 회사) · 조직 · 근무 그룹 · **마감 여부** · 활성 여부 → [조회] [필터 재설정]

컬럼 (`IndividualCloseWorkStatusList.tsx:87-311`): No · 사번 · 이름 · 회사 · 조직 · 직급 · 퇴사 여부(퇴사/재직) · 활성 여부 · 근무 그룹 · 날짜 · **마감 상태**(마감/마감 전) · **처리일**(YYYY.MM.DD HH:mm)

API: `POST /time/close-work-data/daily-close-status/search?page&pageSize`
페이로드: `IndividualCloseWorkStatusPayload`
응답: `PageResponse<IndividualCloseWorkStatusContent>`

각 row는 구성원 × 일자 단위 + 현재 마감 여부.

### 일괄 마감 (가장 중요한 액션)

QA L736–739. **컴포넌트**: `BulkCloseWorkDialog.tsx`

**입력 항목 (2026-11-05 `ad:.../BulkCloseWorkDialog.tsx` 코드 확인)** — 모달 제목 "일괄 마감":
1. **회사** * (필수, **다중 선택** `MultiSelectAutocomplete`, default = 로그인 사용자 회사) — 변경 시 근무그룹 선택 초기화
2. **근무 그룹** * (필수, 체크박스 다중 선택) — 선택한 회사의 그룹만 옵션 노출
3. **마감 기간** * (필수, range `ReactFlatPickr`, **선택 가능 최대일 = 어제**) — 툴팁 "마감 기간은 최대 100일로 제한됩니다."
4. **메모** (선택, `TextArea`, placeholder "메모 입력") — 필수 표시(*)·밸리데이션 없음, 비우면 `note: null` 전송
5. **적용일** (읽기 전용 DatePicker, 항상 **오늘** 표시, 비활성) — **payload로 전송되지 않는 표시용 필드**. 마감 처리 시각(=처리일)은 서버가 요청 시점 현재시각으로 기록하므로 "오늘 처리된다"는 안내 역할. 확인 창 문구에도 "(적용일 : YYYY.MM.DD)"로 표시

> ~~메모 필수 (비즈니스 룰 #6) vs 선택 (모달 필드) 모순~~ → **(2026-11-05 해소)** **메모는 선택**. 프론트 필수 표시·검증 없음, 백엔드 `validateCloseWorkBulkRequest`도 note 미검증.  
> ~~적용일 = 마감 처리 적용 일자 (의미 미확인)~~ → **(2026-11-05 해소)** 표시 전용. 요청 payload는 `workGroupIdList` · `startYmd` · `endYmd` · `note` 4개뿐.

**밸리데이션 (프론트, 필드 하단 에러 문구)**:
- 회사 미선택 → "회사를 선택합니다"
- 근무그룹 미선택 → "근무 그룹을 선택합니다"
- 마감 기간 미입력/잘못된 값 → "마감 기간을 선택합니다"

**백엔드 밸리데이션 문구** (`be:service/closeworkdata/CloseWorkDataService.java:281-316`, 실패 시 `handleAttendanceError`로 얼럿 — 제목 "요청 실패 에러가 발생했습니다.", 본문 = 서버 메시지):
| 조건 | 메시지 |
|---|---|
| 근무그룹 없음 | "근무 그룹을 선택합니다." |
| 기간 없음 | "마감 기간을 선택합니다." |
| 날짜 형식 오류 | "유효하지 않은 마감 기간입니다." |
| 시작일 > 종료일 | "마감 시작일은 종료일 이전이어야 합니다." |
| 오늘 이후 포함 | "마감 기간은 현재일 이전이어야 합니다." |
| 100일 초과 (양끝 포함) | "마감 기간을 100일 이내로 선택합니다." |
| 마감 대상 0건 | "근무 마감 이력 생성 대상자가 없습니다" (아래 주의 — 2026-03-04 로컬 테스트에서 실제 이 문구 노출 확인, Slack #sq-time [#054 스레드](https://hcgtheplus.slack.com/archives/C04QC2RJJBU/p1772065269988409)) |

> ⚠️ 대상 0건 메시지: `closeWorkBulk`의 `targetList == null` 체크("근무 마감 대상이 존재하지 않습니다")는 MyBatis가 빈 리스트를 반환하므로 사실상 도달하지 않고, 이어지는 `makeCloseWorkHistory`의 `isEmpty` 체크("근무 마감 이력 생성 대상자가 없습니다", `:179-181`)에서 걸림 (코드 기준 추론 → 2026-03-04 로컬 테스트에서 실제 노출 확인, Slack #sq-time). 의도 문구로 바꿀 계획은 Slack에 없음.  
> 프론트에서 기간 picker가 어제까지만 허용하므로 "현재일 이전" 오류는 일반적으로 화면에서 발생하지 않음. 100일 초과는 프론트 검증이 없어 서버 메시지로 노출.

**플로우**:
```
[일괄 마감 버튼 클릭]
   ↓
[BulkCloseWorkDialog 오픈]
   ↓ 필수 입력 (회사/그룹/기간, 메모 선택) + [확인] 클릭
   ↓ validateCompanies + validateWorkGroups + validateClosePeriod
   ↓ 통과 시: showConfirm "근무 마감" — "근무를 마감합니다. 마감 후에는 근무·휴가 관련 변경이 불가합니다. (적용일 : 오늘)" + 마감 기간 + "마감 대상 그룹"
   ↓ 확인 → POST                    ↓ 취소 → "정말 취소하시겠습니까?" 재확인 → 모달 닫기
[POST /time/close-work-data/close-work-bulk]
   ↓
[성공 → 스낵바 "근무를 마감했습니다." + 개인별 마감 상태 쿼리 무효화 → 테이블 최신화]
```

- 저장 중에는 오버레이 스피너 + 닫기 차단

**Mutation**: `useMutation(postCloseWorkDataCloseWorkBulk)` + `react-query` 키 무효화로 테이블 자동 리프레시

### 엑셀 다운로드

- 사유 입력 후 `postCloseWorkDataDailyCloseStatusExcelDownloadSearch` 호출
- 필터 조건 적용된 데이터 다운로드 (`TALENX-LOG-REASON` payload 포함)

## 핵심 동작 — 탭 2: 마감 내역

### 조회

QA L744–746. 필터로 마감 이력 조회:
- 필터 (`CloseWorkHistoryFilter.tsx`): **조회 기간**(기본 이번 달 1일 ~ 오늘) · 구성원 · 회사 · 조직 · 근무 그룹 · **마감 구분**(단일 선택)
- API: `POST /time/close-work-data/close-work-history/search?page&pageSize`
- 응답: `PageResponse<CloseWorkHistoryContent>`
- 각 row = 1건의 마감 이력. 근무 그룹 셀 = "{{그룹명}} 등 N개", 적용 구성원 셀 = "N명" 버튼, 처리일 = YYYY.MM.DD HH:mm

**적용 구성원 셀 클릭** → `/attendance/work/close_work_data/apply_members/[closeWorkDataHistoryId]` 페이지로 이동

### 일괄 해제 (마감 해제 UI) ⭐

> ~~해제 존재 — 어드민 UI 노출 여부는 [TBD]~~ → **(2026-11-05 해소)** **마감 내역 탭에 "일괄 해제" 버튼으로 노출**. hcgtheplus/talenx-admin#3814 "[근무] 근무 일괄 마감 해제" (2026-06-11). `ad:.../close_work_history_tab/contents/CloseWorkHistoryList.tsx:104-419`

- 마감 내역 목록에 체크박스. **선택 가능 행 = 마감 구분 `CLOSE_BULK`(일괄 마감) 이면서 아직 해제되지 않은 건**(`!isReopened`, `:354-356`)
- 선택 시 "N건 선택됨" 표시, 미선택이면 [일괄 해제] 비활성
- [일괄 해제] → 확인 창 "일괄 해제": "**총 N건**의 마감된 내역을 해제합니다. 해제 후에는 근무·휴가 관련 변경이 가능합니다. (적용일 : 오늘)" — 취소 시 "정말 취소하시겠습니까?" 재확인
- `PUT /time/close-work-data/close-work-bulk/reopen` (`closeWorkDataHistoryIds`) → 스낵바 "마감된 근무를 해제했습니다."
- 백엔드 (`CloseWorkDataService.reopenCloseWorkBulk`, `:328-`): `CLOSE_BULK`/`CLOSE_INDIVIDUAL` 이력만 대상(REOPEN_* 자동 제외) → 원본 이력에 연결된 `TM_DD_ATTEND_AGGR` 행을 `CLOSE_YN='N'`, 마감일시 null로 갱신 → 원본마다 `REOPEN_BULK` 이력 새로 INSERT(기간·메모·그룹·구성원 복사, `SOURCE_HISTORY_ID`=원본). 집계 대상이 없어도 이력은 생성
- 서버 오류 문구: "해제할 마감 이력을 선택합니다." / "해제 대상 마감 이력이 존재하지 않습니다"
- 해제는 **이력 단위 전체 해제**만 가능 (특정 구성원·일자만 골라 해제 불가)

### 엑셀 다운로드

`postCloseWorkDataCloseWorkHistoryExcelDownloadSearch` (사유 필수)

## 핵심 동작 — 적용 구성원 화면

QA L750–752:

- URL: `/attendance/work/close_work_data/apply_members/[closeWorkDataHistoryId]`
- API: `POST /time/close-work-data/close-work-history/{id}/target-members/search?page&pageSize`
- 응답: `CloseWorkHistoryApplyMembersTableResponse`
- 테이블: 해당 마감에 적용된 구성원 목록 (제목 "적용 구성원", 총 N명)
- 상단 "마감 정보" 요약: **마감 구분 | 마감 기간 | 대상 근무그룹("그룹명 등 N개")** — 메모는 표시하지 않음 (`ad:.../close_work_history_tab/detail/index.tsx:120-150`)
- 뒤로가기: 마감 내역 탭으로 복귀

### 마감 내역 탭 컬럼 (staging 실측 2026-05-15)

스테이징 확인 결과 실제 컬럼: **마감 기간 / 마감 구분 ⭐ / 근무 그룹 / 적용 구성원 / 담당자 / 처리일 / 메모**

> ⭐ **`마감 구분` 컬럼 = `CLOSE_TYPE_CODE`** (2026-07-09 해소): `CLOSE_BULK`(일괄 마감) / `CLOSE_INDIVIDUAL`(개별 마감) / `REOPEN_BULK`(일괄 해제) / `REOPEN_INDIVIDUAL`(개별 해제). `be:constant/CONST_TIME_CODE.java:4520-4526`. 해제 이력은 `SOURCE_HISTORY_ID`로 원본 마감 이력을 참조.  
> **개별 마감/개별 해제**는 코드값·화면 라벨만 정의되어 있고 **진입 UI와 API가 없음** (2026-11-05 talenx-admin·optimiz-time `origin/dev` 전수 grep). 기획 시점 Slack #sq-time 2025-11-07/11-19 API 스펙 논의에서 4종 코드가 함께 정의됨 — 향후 기능용 예약값으로 보임 (추정). 현재 실제로 생기는 이력은 `CLOSE_BULK`/`REOPEN_BULK` 두 종류뿐.

## 비즈니스 룰

1. **마감 단위는 일자 + 구성원**: `closeYn`은 `TM_DD_ATTEND_AGGR.closeYn` 컬럼에 표현됨 (DTO에서는 `isClosed: boolean`)
2. **마감 실행 단위는 근무그룹 × 기간**: 일괄 마감 모달은 근무그룹 다중 선택 + 기간 → 해당 그룹 소속 구성원의 해당 기간 일자가 모두 마감됨
3. **마감 후 차단 범위** (위 cross-domain 표 참조):
   - 출퇴근 요청 / 승인 / 취소 (체크리스트 L90)
   - 근무내역 변경 신청 / 대체근무 신청 / 휴가 신청
   - 어드민 출퇴근내역 직접 편집
   - 그룹스케줄 변경 (마감 일자)
   - 정산 입력 수정
4. ~~마감은 단방향~~ → **마감 해제 가능** (2026-07-09, UI 2026-11-05 확인): `PUT /time/close-work-data/close-work-bulk/reopen` — 마감 내역 탭 "일괄 해제". 마감 이력 단위 해제, 해제 이력 별도 INSERT
5. **누락/미완성 근무내역이어도 마감 차단 없음** (2026-07-09 검증): `validateCloseWorkBulkRequest`는 기간·그룹·기간≤100일·현재일 이전만 검증. 마감 대상은 `TM_DD_ATTEND_AGGR`에서 기간+그룹+미마감(`CLOSE_YN='N' OR NULL`) 조건으로만 조회 (`getCloseWorkTarget`, CloseWorkDataMapper.xml:181) — 출퇴근 기록 누락 여부는 안 봄. 집계 row 자체가 없는 날은 조용히 스킵. 대상이 기간 전체에 0건일 때만 에러 (실제 문구는 "근무 마감 이력 생성 대상자가 없습니다" — 위 밸리데이션 표 참조)
6. ~~마감 시 메모 필수~~ → **(2026-11-05 해소) 메모는 선택** — 프론트·백엔드 모두 검증 없음. 입력 시 마감 내역 "메모" 컬럼에 표시, 해제 이력에도 복사됨
6-1. **결재중 신청서는 마감 시 건드리지 않음**: `closeWorkBulk`는 일근태집계 `CLOSE_YN` 갱신 + 이력 생성만 수행 — 진행 중 신청서를 자동 반려/보류하는 로직 없음 (2026-11-05 코드 확인). 마감 이후 해당 신청의 승인·취소 시 동작은 각 신청서의 마감 체크에 따름
7. **엑셀 다운로드 사유 필수**: 일관된 감사 로그 정책
8. **마감 기간 제약** (2026-07-09): 최대 100일(`MAX_DAYS_FOR_WORK_CLOSE`), 시작·종료일 모두 현재일 이전(당일 포함 마감 불가)

## 마감 밸리데이션 변경 이력 (git, 2026-07-09 확인)

`CloseWorkDataService.java`를 건드린 커밋은 3개뿐:

1. `f22451f13` (2025-12-04, #1150) — 최초 구현. 마감 불가 조건 셋은 현재와 동일 (그룹/기간 필수, 역순 불가, 현재일 이전, 기간 제한, 대상 0건). 단 기간 제한 **90일** + 기간 계산에 off-by-one (양끝 포함 안 됨 → 실제 91일 허용)
2. `390aee9fb` (2026-01-15, #1230) — 기간 제한 90→**100일**, `+1` 로 양끝 포함 계산 수정, 에러 메시지 문구 정비
3. `a369f3207` — 일괄 해제(reopen) 추가

→ **누락/미승인/결재중 신청서 체크는 어느 시점에도 존재한 적 없음.** 조건 구조는 최초 구현부터 불변, 숫자(90→100)만 변경.

## 알려진 제약 / 미구현

- ~~마감 해제 UI 노출 여부 [TBD]~~ → **(2026-11-05 해소)** 마감 내역 탭 "일괄 해제" 버튼 (위 § 일괄 해제)
- ~~개별 마감 진입 UI/API [TBD]~~ → **(2026-11-05 해소)** **없음**. `CLOSE_INDIVIDUAL`/`REOPEN_INDIVIDUAL`은 코드값·라벨만 존재
- 어드민이 사용자별 마감 상태를 다르게 적용하는 기능 없음 — 마감·해제 모두 근무그룹 × 기간(이력) 단위 (2026-11-05 코드)
- 해제는 `CLOSE_BULK` 이력만 선택 가능, 한 번 해제한 이력은 다시 선택 불가 (재마감은 일괄 마감으로 새로 실행)

## 검증 / [TBD]

- [x] ~~`CloseWorkDataHistoryVo` 풀 필드~~ → 데이터 모델 표 (2026-11-05)
- [x] ~~백엔드 테이블 이름~~ → `TM_CLOSE_WORK_DATA_HISTORY` / `_MEMBER` / `_WORK_GROUP` (2026-11-05)
- [x] ~~마감 해제(unclose) 메커니즘~~ → 일괄 해제 API + UI (2026-11-05)
- [x] ~~`CloseWorkBulkPayload` 구조~~ → `workGroupIdList` · `startYmd` · `endYmd` · `note` (백엔드 DTO에는 `isAllWorkGroup`도 있으나 프론트 미전송)
- [ ] 마감 시 어떤 데이터가 함께 스냅샷 되는지 — 코드상 `CLOSE_YN`/`CLOSE_YMDHMS` 갱신 + 이력·적용 구성원 기록만 확인됨. 별도 스냅샷 없음(추정)
- [x] ~~일괄 마감 시 진행 중 신청서 처리~~ → 자동 반려/보류 없음, 신청서는 그대로 남음 (비즈니스 룰 6-1)
- [x] ~~마감 이후 남아있던 결재중 신청서를 결재자가 승인하려 할 때 차단되는지~~ → **(2026-11-05 Slack 확인)** 차단됨. 결재함에는 '승인필요'로 남지만 승인을 누르면 **'기한만료'로 거절**되고, 화면상 **반려만 선택 가능**. 승인이 필요하면 **마감 해제 → 승인 → 재마감**으로 안내 — Slack #cx 2026-08-25 (https://hcgtheplus.slack.com/archives/C01AVJ2CJBW/p1787646308384229?thread_ts=1787630719.002329&cid=C01AVJ2CJBW), #cx 2026-10-13 (https://hcgtheplus.slack.com/archives/C01AVJ2CJBW/p1791883591973619). 목록에서부터 '기한만료'로 바꿔 보이게 하는 개선은 근무+코어 양쪽 작업이 필요해 논의만 됨(결론 없음, https://hcgtheplus.slack.com/archives/C01AVJ2CJBW/p1787657523428229?thread_ts=1787630719.002329&cid=C01AVJ2CJBW)
- [ ] (2026-11-05 Slack 신규) 기획 초안(Slack #ch-plan 2025-10-29, https://hcgtheplus.slack.com/archives/C02VCP9MBQV/p1761740806119959?thread_ts=1761737316.880899&cid=C02VCP9MBQV)은 "마감은 정상 근무기록만 가능, **요청중 신청서가 있으면 제외**"였으나 구현은 결재중 신청서와 무관하게 일괄 마감(비즈니스 룰 6-1). 이 변경이 의도된 결정인지 Slack에 기록 없음

## 두현님 답변 받으면 좋을 것

- 개별 마감/개별 해제(`CLOSE_INDIVIDUAL`/`REOPEN_INDIVIDUAL`) 기능 계획이 있는지, 없으면 코드값 정리 대상인지 — (2026-11-05 Slack 검색: 도입 계획 언급 없음. 코드값은 2025-11-07/11-19 API 스펙에서 정의된 것뿐. 고객사가 1명만 해제하고 싶어 했으나 "근무그룹 전체 해제가 필요"로 안내된 사례 있음 — #cx 2026-10-14)
- 마감 전 결재중 신청서를 운영상 어떻게 안내하는지 (마감 전 정리 권고 등)

## 관련 문서

- `KB:product/admin/work/check-work-data.md` — 어드민 출퇴근내역 편집 시 마감 차단 (`validateInoutDate`)
- `KB:product/admin/work/group-setting.md` — 구성원 그룹 변경일 지정 시 마감일 이전 변경 불가 + 그룹스케줄 마감일 변경 불가
- `KB:product/user/home/checkin-widget.md` — 출퇴근 요청/승인/취소 시 마감 차단
- `KB:domain/business-rules.md` § 9 "근무 마감 후 제약"
