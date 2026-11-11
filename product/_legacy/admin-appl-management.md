# 근무 신청 내역 관리 (어드민 #8)

## 개요

사용자가 신청한 근무 관련 신청서들을 **어드민이 일괄 조회·관리**하는 화면. 이 화면은 **4가지 신청서 타입**만 처리합니다 (휴가/재택/대체근무/사전휴일근무는 별도 처리).

이미 deep-dive 한 사용자 신청서들과 **1:1 짝**을 이루는 어드민 측 화면:

```
사용자 화면 신청 → 백엔드 저장 → 어드민이 여기서 조회·검토
```

## 진입 위치

- 어드민 메뉴: 근무관리 > 근무 신청 내역 관리
- URL: `/attendance/work/appl_management`
- 4개 탭 구성 (기본은 어떤 탭이 선택되는지 [TBD])

## QA 체크리스트

`talenx-admin/.claude/qa-checklist/attendance.md` **L645 ~ L729** (85줄)

4개 탭:
1. **근무계획 변경신청** (L647–670)
2. **근무내역 변경신청** (L671–677)
3. **기타근무 신청** (L678–708) — 가장 큼 (수동 등록 + 엑셀 업로드 포함)
4. **사전 연장·야간 신청** (L709–729)

## 어드민 4탭 ↔ 사용자 신청서 매핑

| 어드민 탭 | 사용자 신청서 | 사용자 컴포넌트 | DB 테이블 | 사용자 문서 |
|------|------|------|------|------|
| 근무계획 변경신청 | 근무계획 변경 (U19) | `pp:PlanEdit.tsx` | `TM_PSN_WORK_PLAN_APPL` | `KB:product/appl-other-forms.md` § 4 |
| 근무내역 변경신청 | 근무내역 변경 (U4 + U7) | `pp:RegEdit.tsx` | `TM_WORK_REG_ADJST_APPL` | `KB:product/appl-other-forms.md` § 5 |
| 기타근무 신청 | 기타근무 (U17) | `pp:OtherWorkApplications.tsx` | `TM_OTHER_WORK_APPL` (추정) | `KB:product/appl-other-forms.md` § 2 |
| 사전 연장·야간 신청 | 사전 연장/야간 (U15) | `pp:Overtime.tsx` | `TM_PSN_OT_PLAN_APPL` | `KB:product/appl-holiday-overtime.md` § 2 |

### 이 화면에 **없는** 신청서들 (별도 처리)

| 사용자 신청서 | 어드민 처리 위치 (추정) |
|------|------|
| **휴가 신청** (U8) | `KB:product/leave-domain.md` § C-3, C-4 (휴가 지급 및 관리 - 연차 사용 현황 / 연차 외 사용 현황 탭) |
| **재택근무 신청** (U16) | [TBD] 별도 화면 또는 워크플로우 시스템 직접 처리 |
| **대체근무 신청** (U18) | [TBD] 별도 화면 또는 워크플로우 시스템 직접 처리 |
| **사전 휴일근무 신청** (U14) | [TBD] 별도 화면 또는 워크플로우 시스템 직접 처리 |
| **출근/퇴근 요청** (출퇴근 위젯) | 워크플로우 시스템에서 처리 (별도 화면) |
| **취소 신청서들** (Cancel) | [TBD] 본 화면에서 함께 표시? 또는 별도? |

> 일부 신청서가 이 화면에 없다는 점이 흥미로움. 이유 추정:
> - 휴가는 별도 큰 도메인이라 분리
> - 사전 휴일근무 / 대체근무 / 재택은 사용 빈도 낮거나 워크플로우 직처리

## 코드 위치

### Admin 프론트 (`ad:src/`)

```
pages/attendance/work/appl_management/                                  ← 페이지 진입점

components/attendance/work/appl_management/
├── index.tsx                                                           ← 4탭 컨테이너
└── contents/
    ├── work_plan_change_appls_management_tab/                          ← 근무계획 변경신청
    │   ├── index.tsx
    │   └── contents/
    │       ├── WorkPlanChangeHistoryFilter.tsx
    │       ├── WorkPlanChangeHistoryTable.tsx
    │       └── TableFilterContextProvider.tsx
    ├── work_record_change_appls_management_tab/                        ← 근무내역 변경신청
    │   ├── index.tsx
    │   └── contents/
    │       ├── WorkRecordChangeApplsFilter.tsx
    │       ├── WorkRecordChangeApplsTable.tsx
    │       └── TableFilterContextProvider.tsx
    ├── other_work_status_tab/                                          ← 기타근무 신청 ⭐
    │   ├── index.tsx
    │   └── contents/
    │       ├── Filter.tsx
    │       ├── OtherWorkList.tsx
    │       ├── OtherWorkExcelUpload.tsx                                ← 엑셀 업로드 (수동 등록)
    │       ├── OtherWorkExcelUploadMemberError.tsx                     ← 업로드 에러 표시
    │       └── TableFilterContextProvider.tsx
    └── overtime_request_tab/                                           ← 사전 연장·야간 신청
        ├── index.tsx
        └── contents/
            ├── OvertimeRequestFilter.tsx
            ├── OvertimeRequestList.tsx
            └── TableFilterContextProvider.tsx

hooks/attendance/work/appl_management/
├── work_plan_change_appls_management_tab/
│   ├── useFilterOptions.ts
│   ├── useExcelDownload.ts
│   └── useControlTableFilter.ts
├── work_record_change_appls_management_tab/
│   ├── useFilterOptions.ts
│   ├── useExcelDownload.ts
│   └── useControlTableFilter.ts
├── other_work_status_tab/
│   ├── useFilterOptions.ts
│   ├── useOtherWorkExcelDownload.tsx
│   ├── useOtherWorkExcelUpload.tsx                                     ← 업로드 훅 (어드민 수동 등록)
│   └── useControlTableFilter.ts
└── overtime_request_tab/
    ├── useFilterOptions.ts
    ├── useExcelDownload.ts
    └── useControlTableFilter.ts

config/api/attendance/applManagement.ts                                  ← API 클라이언트
```

### 백엔드 (`be:com/hcg/optimiz/time/`)

**메인 컨트롤러**: `controller/workadmin/WorkApplManagementController.java`

이 컨트롤러가 4개 탭의 거의 모든 endpoint 담당.

---

## 4탭 공통 패턴

모든 탭이 동일한 UX 패턴을 따름:

### 공통 UI 구조

```
[Filter (필수 + 선택 필터)]
[Table (페이징 + 정렬)]
[Excel Download (사유 필수)]
```

### 공통 필터

| 필터 | 모든 탭? | 비고 |
|------|------|------|
| 필수 옵션 (일별/월별 또는 연도/기간) | ✅ | 디폴트값 자동 입력 |
| 구성원 | ✅ | 비활성 포함 포맷 |
| 회사 | ✅ | 디폴트 = 본인 회사 |
| 조직 | ✅ | **하위 조직 포함** 조회 |
| 근무 그룹 | ✅ | — |
| 활성 여부 | ✅ | — |
| 상태 | (일부) | 신청서 상태 |
| 등록 방식 | (일부) | 사용자 신청 vs 어드민 등록 구분 |

### 공통 동작

- **필터 재설정** 버튼 → 디폴트 복원
- **엑셀 다운로드** → 사유 입력 필수 + 모든 페이지 포함 + 테이블 컬럼과 일치
- **페이징** 처리
- 사용하지 않는 기타근무 유형은 **(사용안함) 텍스트** 부착 (탭 1, 3 해당)

---

## § 1. 근무계획 변경신청 탭 (L647–670)

### 필터

**필수**:
- 라디오: **일별 근무기록 / 월별 근무기록**
- 디폴트: 일별 = 이번달 1일 ~ 현재일 / 월별 = 이번달

**선택**:
- 구성원, 회사, 조직, 근무 그룹, **최종 근무계획 선택**, 상태 선택, 활성여부

**필터 간 의존성**:
- 근무계획 필터 선택 후 회사/근무그룹 변경 → **근무계획 필터 초기화**
- 근무그룹 필터 선택 후 회사 변경 → **근무그룹 필터 초기화**

### 테이블

**표시 상태** (4종):
- 승인완료
- 요청중
- 반려
- 취소

**컬럼**: [TBD] (정확한 컬럼 구성 미확인)

### 백엔드 API

| Method | Path | 용도 |
|--------|------|------|
| GET | `/time/aggr/work-plan-change-appls/filter-options` | 필터 옵션 조회 |
| POST | `/time/aggr/work-plan-change-appls/search` | 신청 내역 조회 |
| POST | `/time/aggr/work-plan-change-appls/excel-download/search` | 엑셀 다운로드 |

### 관련 DB 테이블

- `TM_PSN_WORK_PLAN_APPL` — 개인 근무계획 변경 신청
- `TM_PSN_WORK_PLAN_CANCEL_APPL` — 취소 신청
- `TM_WORK_GRP_CHG_APPL` — 그룹 정보 (이미 발견: `KB:product/admin-work-group.md`)

---

## § 2. 근무내역 변경신청 탭 (L671–677)

### 필터 + 동작

- 필터 설정 후 조회 (공통 패턴)
- **같은 사람·같은 날짜는 셀 병합** 표시 (가독성)
- 표시 상태 (2종): **신청중 / 승인완료**
  - § 1보다 상태 종류가 적음 (반려/취소 미표시? 또는 표시 안 한 의도?) [TBD]
- 엑셀 다운로드

### 백엔드 API

| Method | Path | 용도 |
|--------|------|------|
| POST | `/time/aggr/work-record-change-appls/search` | 조회 |
| POST | `/time/aggr/work-record-change-appls/excel-download/search` | 엑셀 다운로드 |

### 관련 DB 테이블

- `TM_WORK_REG_ADJST_APPL` — 근무 등록 보정 신청

### Cross-link

이 신청은 출퇴근 위젯에서도 트리거됨 — `KB:product/user-checkin-widget.md` § "우선순위 분기" + `KB:product/appl-other-forms.md` § 5.

---

## § 3. 기타근무 신청 탭 (L678–708) — 가장 큼

### 필터

**필수**:
- 라디오: **연도별 조회 / 기간 조회**
- 디폴트: 올해 / 이번달
- 연도 옵션: **권한 상 조회 가능한 구성원의 기타근무 내역 중 가장 오래된 ~ 내년**

**선택**:
- 구성원, 회사, 조직, 근무 그룹, **기타근무 유형**, **등록 방식**, 활성여부

### 테이블

**표시 상태** (2종): 승인완료 / 요청중

### 엑셀 다운로드

공통 패턴 (사유 필수)

### ✍️ 기타근무 수동 등록 (어드민 특화 기능)

**엑셀 업로드 흐름** (L701–707):

```
[양식 다운로드]
   ↓
[엑셀 작성 + 업로드]
   ↓
[밸리데이션]
   ├─ 형식 오류 / 빈 값 / 잘못된 기타근무 항목 → 업로드 실패
   ├─ 근무 중복 / 마감일 포함 + 정상 내역 있음 → "이어서 진행"으로 정상 내역만 등록
   └─ 모든 내역이 중복/마감 → 확인만 가능, 이어서 진행 불가
   ↓
[등록 완료]
```

**삭제**: 어드민 등록 기타근무 중 **근무 마감되지 않은 내역**은 선택해서 삭제 가능

### 백엔드 API

| Method | Path | 용도 |
|--------|------|------|
| GET | `/time/other-works/combo` | 콤보용 기타근무 항목 (필터) |
| GET | `/time/other-works/filter-options` | 조회 필터 옵션 (디폴트 올해+내년) |
| POST | `/time/aggr/other-works/search` | 기타근무 현황 조회 |
| POST | `/time/aggr/other-works/excel-download/search` | 엑셀 다운로드 |
| POST | `/time/other-work-admin/excel-upload` ⭐ | **어드민 일괄 등록 (엑셀 업로드)** |
| PUT | `/time/other-work-admin/direct-registrations/cancel` ⭐ | 어드민 수동 등록 기타근무 취소(삭제) |

### 관련 DB 테이블

- `TM_OTHER_WORK_APPL` 또는 `TM_WORK_FOR_HOME_APPL` (테이블 이름 [TBD] — 이전 deep-dive에서도 미확정)

### 어드민 직접 등록 → 사용자 화면 영향

어드민이 이 화면에서 등록한 기타근무는:
- 사용자 화면에 **`AdminDirectOtherWorkDialog`** 별도 다이얼로그 표시 (`KB:product/admin-work-data.md` § "신규 발견 영역")
- 메시지: "해당 근무는 별도의 신청/승인 과정 없이 관리자에 의해 등록되었습니다."
- 사용자 내 근무 캘린더에 `OtherWork` 타입으로 표시 (`KB:product/user-my-work-calendar.md` § "Type 4: OtherWork")

---

## § 4. 사전 연장·야간 신청 탭 (L709–729)

### 필터

**필수**:
- 라디오: **일별 조회 / 월별 조회**
- 디폴트: **월별 조회** (다른 탭과 다름 — 일별이 일반적)

**선택**:
- 구성원, 회사, 조직, 근무 그룹, **기타근무 유형**(?), **등록 방식**, 활성여부

> ⚠️ QA L714에 "기타근무 유형"이 적혀있는데, 이게 사전 연장·야간 탭에 진짜 필요한지 의문. **오타 또는 QA 가 다른 탭에서 복붙된 가능성** [TBD]

### 야간 포함 여부

- **시작시각과 종료시각 범위에 따라 자동 체크**
- **야간 판정 기준 = 22:00 ~ 06:00** (법정 기준 고정, `KB:product/admin-work-group.md` § "야간 시간대"와 일치)

### 테이블

**표시 상태** (5종): 요청중 / 승인완료 / 취소 / 반려 / **승인완료 후 취소**

> 5번째 "승인완료 후 취소"가 추가됨 — 결재 완료 후 취소 신청서가 별도 처리되는 것 (`KB:product/appl-holiday-overtime.md` § "Cancel 컨트롤러 분리")

### 백엔드 API

| Method | Path | 용도 |
|--------|------|------|
| POST | `/time/aggr/ot-appls/search` | 사전 연장/야간 신청 내역 조회 |
| POST | `/time/aggr/ot-appls/excel-download/search` | 엑셀 다운로드 |

### 관련 DB 테이블

- `TM_PSN_OT_PLAN_APPL` — 사전 연장/야간 신청
- `TM_PSN_OT_PLAN_CANCEL_APPL` — 취소 신청

---

## 백엔드 API 종합 — WorkApplManagementController

`be:controller/workadmin/WorkApplManagementController.java`:

### 근무계획 변경

| Method | Path |
|--------|------|
| GET | `/time/aggr/work-plan-change-appls/filter-options` |
| POST | `/time/aggr/work-plan-change-appls/search` |
| POST | `/time/aggr/work-plan-change-appls/excel-download/search` |

### 근무내역 변경

| Method | Path |
|--------|------|
| POST | `/time/aggr/work-record-change-appls/search` |
| POST | `/time/aggr/work-record-change-appls/excel-download/search` |

### 기타근무

| Method | Path | 비고 |
|--------|------|------|
| GET | `/time/other-works/combo` | 필터용 콤보 |
| GET | `/time/other-works/filter-options` | 조회 필터 옵션 |
| POST | `/time/aggr/other-works/search` | 조회 |
| POST | `/time/aggr/other-works/excel-download/search` | 엑셀 다운로드 |
| POST | `/time/other-work-admin/excel-upload` | **수동 등록** |
| PUT | `/time/other-work-admin/direct-registrations/cancel` | **수동 등록 취소(삭제)** |

### 사전 연장/야간

| Method | Path |
|--------|------|
| POST | `/time/aggr/ot-appls/search` |
| POST | `/time/aggr/ot-appls/excel-download/search` |

---

## ⭐ 사용자 신청서와의 워크플로우 흐름

각 탭의 신청서가 어떻게 흘러가는지 전체 그림:

```
[사용자 ppfront 신청서]
   ↓ /apply (CONST_APPLY_ACTION)
[백엔드: TM_*_APPL 테이블에 저장 + 워크플로우 시작]
   ↓ 결재선 따라 승인자에게 알림
[승인자 어드민이 워크플로우 시스템에서 처리 (승인/반려)]
                              OR
[어드민이 이 화면에서 조회 + 모니터링]   ← 본 화면의 주 역할
   ↓
[결과: 승인완료 / 반려 / 취소]
   ↓
[사용자 화면 캘린더에 반영 + 정산/집계 영향]
```

### 본 화면의 역할

이 화면은 **신청 승인 처리 화면이 아니라 신청 내역 조회/모니터링 화면** (의 인상):
- 표시 상태에 "승인 처리"가 아니라 결과만 표시
- 엑셀 다운로드는 사후 감사용
- **단, 기타근무 탭만 어드민이 직접 등록 가능** (수동 등록 = 신청-승인 우회)

> 정확한 승인 처리 로직 (이 화면에서 승인/반려 가능한가?)은 [TBD] — 컴포넌트 코드 직접 확인 필요

---

## 모든 신청서 종합 표 — 어드민 처리 매핑

지금까지 정리된 정보 종합:

| 신청서 (한글) | 사용자 컴포넌트 | 어드민 처리 화면 | DB 테이블 |
|------|------|------|------|
| 출근 요청 | 출퇴근 위젯 | 워크플로우 시스템 (별도) | TM_IN_APPL |
| 퇴근 요청 | 출퇴근 위젯 | 워크플로우 시스템 (별도) | TM_OUT_APPL |
| 근무내역 변경 | RegEdit | **이 화면 § 2** | TM_WORK_REG_ADJST_APPL |
| 근무계획 변경 | PlanEdit | **이 화면 § 1** | TM_PSN_WORK_PLAN_APPL |
| 기타근무 | OtherWorkApplications | **이 화면 § 3** (+ 어드민 수동 등록) | TM_OTHER_WORK_APPL |
| 사전 휴일근무 | DayOff (오해의 명명) | [TBD] 워크플로우 / 별도? | TM_PSN_HOLI_WORK_APPL |
| 사전 연장/야간 | Overtime | **이 화면 § 4** | TM_PSN_OT_PLAN_APPL |
| 재택근무 | HomeWork | [TBD] 워크플로우 / 별도? | TM_WORK_FOR_HOME_APPL |
| 대체근무 | CompensatoryWork | [TBD] 워크플로우 / 별도? | TM_*_CHG_APPL |
| 휴가 | Leave | `KB:product/leave-domain.md` § C-3, C-4 | TM_LEAVE_APPL |

---

## Cross-domain 효과

| 어드민 동작 | 다른 영역 영향 |
|------|------|
| 기타근무 어드민 수동 등록 (엑셀) | 사용자 캘린더에 `OtherWork` + `AdminDirectOtherWorkDialog` 표시 |
| 기타근무 어드민 수동 등록 삭제 | 사용자 캘린더에서 제거 + 누락 조건 변경 가능 |
| 신청서 조회 (4탭) | 사후 모니터링만, 변경 영향 없음 |
| 엑셀 다운로드 | 감사 로그 (`TALENX-LOG-REASON`) |

---

## 비즈니스 룰

1. **이 화면은 조회/모니터링 중심** (단, 기타근무는 어드민 직접 등록 가능)
2. **4개 탭만 처리** — 휴가/재택/대체/사전휴일근무는 별도 화면
3. **공통 필터 패턴**: 일별/월별 또는 연도/기간 + 구성원/회사/조직/근무그룹/활성여부
4. **회사 필터 디폴트 = 본인 회사**, 조직 필터는 하위 조직 포함
5. **사용 안 함 기타근무 유형**: 기타근무명 옆에 "(사용안함)" 표시
6. **엑셀 다운로드 사유 필수** (`TALENX-LOG-REASON`) — 다른 영역과 일관
7. **기타근무 어드민 등록 → 마감 미감지 일자만 삭제 가능** (마감일자 삭제 불가)
8. **사전 연장/야간 탭의 야간 자동 체크**: 22:00-06:00 (법정 기준 고정)
9. **표시 상태 종류는 탭마다 다름**:
   - § 1: 4종 (승인완료/요청중/반려/취소)
   - § 2: 2종 (신청중/승인완료)
   - § 3: 2종 (승인완료/요청중)
   - § 4: 5종 (요청중/승인완료/취소/반려/승인완료 후 취소)

---

## 알려진 제약 / 임시 동작

- § 4 (사전 연장/야간)의 필터 항목에 "기타근무 유형" 표기 — **QA 오타 또는 잘못된 복붙 가능성**
- § 2 (근무내역 변경)의 표시 상태가 2종 (신청중/승인완료)만 — **반려/취소 미표시 의도** [TBD]

---

## 검증 / [TBD]

- [ ] 이 화면에서 신청 **승인/반려 처리** 가능한지 (조회 only인지)
- [ ] § 4의 필터 항목 "기타근무 유형" 정확한 내용 (오타 추정)
- [ ] § 2가 반려/취소를 표시하지 않는 이유
- [ ] 각 탭의 정확한 테이블 컬럼 구성
- [ ] 누락된 신청서들 (휴가/재택/대체/사전휴일근무)의 어드민 처리 위치:
  - 재택근무 어드민 처리 화면 (워크플로우 시스템?)
  - 대체근무 어드민 처리 화면
  - 사전 휴일근무 어드민 처리 화면
- [ ] 사용자 출근/퇴근 요청(`InAppl`/`OutAppl`)의 어드민 처리 흐름 — 워크플로우 시스템에서?
- [ ] 어드민 등록 기타근무가 사용자 캘린더에 `OtherWork` 타입으로 표시될 때 어떻게 구분 표시되는지

---

## 두현님께 질문 (선택)

1. **이 화면에서 신청 승인/반려 처리** 가능한지, 조회만 가능한지?
2. **§ 2가 반려/취소 미표시** 인 이유 (의도된 디자인?)
3. **재택/대체근무/사전휴일근무**는 어드민이 어디서 처리하나요? (별도 화면 / 워크플로우 시스템 직접?)
4. **§ 4의 필터 "기타근무 유형"** 표기 — QA 오타? 실제 필터가 다른가?
5. **휴가는 별도 도메인**으로 분리된 게 명확한데, **휴가가 워크플로우 시스템에서 별도 처리**되는지 또는 휴가 관리 화면에서만 처리되는지?

---

## 관련 문서

- `KB:product/appl-other-forms.md` — 사용자 신청서 5종 (이 화면의 3개 탭과 짝)
- `KB:product/appl-holiday-overtime.md` — 사용자 사전 연장/야간 (§ 4 짝)
- `KB:product/leave-domain.md` § C — 휴가의 어드민 처리 (이 화면 밖, 휴가 관리 화면)
- `KB:product/admin-work-data.md` — 출퇴근내역 직접 편집 (어드민 다른 관점)
- `KB:product/admin-work-close.md` — 마감일 신청서 처리 제약
- `KB:product/admin-work-group.md` — 야간 시간 22-06 고정 (§ 4 야간 체크)
- `KB:product/user-my-work-calendar.md` — 어드민 등록 기타근무가 사용자 캘린더에 표시되는 흐름
