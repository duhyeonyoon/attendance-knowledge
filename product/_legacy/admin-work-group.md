# 근무그룹 설정 (어드민)

## 개요

**근무그룹**은 근무 정책의 단위. 구성원을 그룹에 묶고, 그 그룹에 근무시간/연장/야간/휴일/출근지/휴일 캘린더 등 모든 근무 룰을 설정합니다. 사용자 화면(출퇴근 위젯, 내 근무 등)의 동작은 거의 모두 이 그룹 설정값에 의해 결정됩니다.

**3개 레포 모두 관여:**
- `talenx-admin` — 그룹 설정 화면
- `optimiz-time` — 그룹 정의/저장/룰 검증
- `ppfront` — 사용자 화면이 그룹 설정을 받아 동작 분기 (예: 출퇴근 위젯의 `holiWorkPmitCd`, `otPmitCd`, `nightPmitCd`)

## 진입 위치

- 어드민 메뉴: 근무관리 > 근무그룹 설정
- URL: `/attendance/work/group_setting` (목록), `/attendance/work/group_setting/[workGrpId]` (상세)

## QA 체크리스트

`talenx-admin/.claude/qa-checklist/attendance.md` **L317 ~ L546** (230줄)

5개 서브 섹션:
1. 메인화면 (L319–329) — 목록, 추가, 복제, 임시저장
2. 최초 생성 플로우 (L330–335) — 추가 → 상세 → 탭 이동 흐름
3. **근무설정 탭** (L336–447) — 8개 섹션 (기본/근무시간/신청서/휴일/출근지/기타근무/기타) ⭐ 가장 큰 영역
4. 구성원 설정 탭 (L448–502) — 구성원 변경 모달, 변경일 지정
5. 그룹스케줄 탭 (L503–546) — 템플릿 + 캘린더

## 코드 위치

### Admin 프론트 (`ad:src/`)

```
pages/attendance/work/group_setting/
├── index.tsx                              ← 목록 페이지
└── [workGrpId]/index.tsx                  ← 상세 페이지 (dynamic route)

components/attendance/work/group_setting/
├── contents/                              ← 메인화면 컴포넌트
│   ├── Filter.tsx
│   ├── WorkGroupAddDialog.tsx             ← 근무그룹 추가 모달
│   └── WorkGroupList.tsx                  ← 목록 (미확정 태그 표시)
└── detail/contents/                       ← 상세 페이지
    ├── Header.tsx                         ← 상단 헤더 (저장/취소/탭)
    ├── work_setting_tab/contents/         ⭐ 근무설정 탭
    │   ├── basic_setting/                 ← 기본 설정 (정산기간/소정근로시간)
    │   ├── work_time_setting/contents/    ← 근무시간 관리 (가장 복잡)
    │   │   ├── WorkTimeManagementFormSection.tsx
    │   │   ├── WorkLogManagementFormSection.tsx     ← 근무기록 관리 (출퇴근/계획/외부)
    │   │   ├── CompensatoryWorkManagementFormSection.tsx ← 대체근무
    │   │   ├── OvertimeManagementFormSection.tsx    ← 연장근무
    │   │   ├── NightWorkHoursManagementFormSection.tsx ← 야간근로시간
    │   │   ├── HolidayWorkManagementFormSection.tsx ← 휴일근무
    │   │   ├── OvertimeLimitCheckBox.tsx
    │   │   ├── MinMaxTimeInput.tsx
    │   │   └── RadioGroupBox.tsx
    │   ├── work_request_setting/          ← 근무 신청서 관리 (현재 근무계획변경만)
    │   ├── work_setting_check_list/       ← 우측 체크리스트 (설정 완료 상태)
    │   ├── holiday_setting/               ← 휴일 관리 (목록/달력 + 수정/추가)
    │   ├── workplace_setting/             ← 출근지 관리
    │   ├── etc_work_setting/              ← 기타근무 항목 관리
    │   └── etc_setting/                   ← 기타 설정 (개발 전, 조회만)
    ├── member_setting_tab/contents/       ← 구성원 설정 탭
    └── group_schedule_setting_tab/contents/ ← 그룹스케줄 탭

hooks/attendance/work/group_setting/detail/work_setting_tab/
└── useWorkRequestHeader.ts
```

> 어드민 hooks 디렉토리에 group_setting 하위 훅이 1개만 노출됨 — 나머지는 컴포넌트 내부 로컬 훅으로 추정. [TBD] 추가 탐색 필요

### 백엔드 (`be:com/hcg/optimiz/time/`)

**핵심 VO**: `vo/WorkGrpVo.java` (60+ 필드 — 아래 데이터 모델 참조)

**Controllers**:
- `controller/setting/WorkGroupSettingController.java` ⭐ 메인
- `controller/workadmin/WorkGroupHistoryController.java` (히스토리)
- `controller/setting/ClientWorkSettingController.java` (클라이언트 레벨 — 휴일/출근지/기타근무 상속용)

**Services**:
- `service/setting/WorkGroupSettingService.java` (메인 서비스)
- `service/setting/rule/WorkGrpSettingService.java` (룰 관련 별도 서비스)
- `service/setting/rule/WorkGrpSettingValidator.java` (검증)

**DTOs (`dto/setting/`)**:
- `WorkGrpCreateDto`, `WorkGrpRequestDto`, `WorkGrpResponseDto`
- `WorkGrpSettingDto` (전체 설정 묶음)
- `WorkGrpConfirmDto` (확정 저장)
- `WorkGrpCopyDto` (복제)
- `WorkGrpHoliCalenDto` / `WorkGrpHoliCalenSettingDto` (휴일 캘린더)
- `WorkGrpWorkPlcDto` / `WorkGrpWorkPlcSettingDto` (출근지)
- `WorkGrpWorkPlanDto` / `WorkGrpWorkPlanSettingDto` (근무 계획)
- `WorkGrpDdWorkPlanSettingDto` (일별 근무 계획)
- `WorkGrpAttendItemDto` / `WorkGrpAttendItemSettingDto` (근태 항목)
- `WorkGrpOtherWorkDto` / `WorkGrpOtherWorkSettingDto` (기타근무)
- `WorkGrpApplFormSummaryDto` (신청서 양식 요약)

### ppfront (사용자 측 영향) — 그룹 설정값 활용

`workGrpVo`는 사용자의 출퇴근 위젯 / 내 근무 / 신청서 등 거의 모든 화면에 전달됨.
출퇴근 위젯에서의 활용은 `KB:product/user-checkin-widget.md` 참조.

핵심 활용 필드:
- `holiWorkPmitCd` / `otPmitCd` / `nightPmitCd` — 출퇴근 사전 차단 / 색상 분기
- `validWorkCd` — `PLAN`이면 출퇴근 버튼 미노출 (`EXTERNAL`은 세콤 연동)
- `workTimeVisibleCd === "DENIED"` — 근무시간 숨김
- `gpsLimitYn` — GPS 검증 ON/OFF
- `ddAggrTime` / `ddAggrTimeClass` — 자정 cutoff (단, 백엔드 `ValidWorkDayResolver`와 일치성 [TBD])

## 데이터 모델: WorkGrpVo

`be:com/hcg/optimiz/time/vo/WorkGrpVo.java` — 60+ 필드. 카테고리별 정리:

### 기본 정보
| 필드 | 의미 |
|------|------|
| `workGrpId` | 근무그룹 ID |
| `companyCode` | 회사 코드 |
| `workGrpNm` | 근무조명 |
| `workType` | 근무유형 (시스템코드 `WORK_TYPE_1`) |
| `timeZoneId` | 타임존 ID |
| `tempSaveYn` | 임시저장 여부 (default `Y`) ⭐ |
| `confirmYmdhms` | 확정 일시 |
| `delYn` | 삭제 여부 |
| `note` | 비고 |

### 정산 / 소정근로시간 (기본 설정 탭)
| 필드 | 의미 |
|------|------|
| `workAdjUnit` | 근무정산단위 (시스템코드 `WORK_ADJ_UNIT_1`) — `1W`/`2W`/`3W`/`4W`/`1M`/`2M`/`3M` |
| `adjPmitWorkTimeCd` | 정산허용근무시간코드 (시스템코드 `ADJ_PMIT_WORK_TIME_1`) |
| `adjStdYmd` | 정산기준일 (예: `20230101`) |
| `cenDdWorkTime` | 계약일근무시간 (분 단위) |
| `contractedWorkingTimeCalcStd` | 소정근로시간 기준 — `근무 계획 기준` or `법적 기준` |

정적 메소드:
- `WorkGrpVo.getWorkAdjUnitNum(workAdjUnit)` — `1W`/`2M` 같은 문자열에서 숫자만 추출
- `WorkGrpVo.isWeeklyWorkAdj(workAdjUnit)` — 주단위 여부 (`W` 포함)
- `WorkGrpVo.isMonthlyWorkAdj(workAdjUnit)` — 월단위 여부 (`M` 포함)

### 자동 집계
| 필드 | 의미 |
|------|------|
| `autoYmdWorkAggrYn` | 자동 일근무 집계 여부 |
| `ddAggrTimeClass` | 일집계시간 구분 (시스템코드 `YMD_AGGR_TIME_CLASS_CD_1`) — `NTDAY` 등 |
| `ddAggrTime` | 일집계 시간 |
| `autoMmWorkAggrYn` | 자동 월근무 집계 여부 |
| `mmAggrTimeClass` | 월집계시간 구분 (`MM_AGGR_TIME_CLASS_CD_1`) |
| `mmAggrTime` | 월집계 시간 |
| `mmAggrWorkStaCd` / `mmAggrWorkEndCd` | 월집계 근무 시작/종료 코드 |
| `mmAggrAttendStaCd` / `mmAggrAttendEndCd` | 월집계 근태 시작/종료 코드 |

### 근무 허용 코드 (3종 — 핵심)
모두 `P`(가능) / `A`(승인 시) / `N`(불가) 패턴:

| 필드 | 시스템코드 | 의미 |
|------|------|------|
| `otPmitCd` | `OT_PMIT_CD_1` | 연장근무 허용 |
| `holiWorkPmitCd` | `HOLI_WORK_PMIT_CD_1` | 휴일근무 허용 |
| `nightPmitCd` | (별도) | 야간근무 허용 |

### 연장/휴일/야간 집계 코드
| 필드 | 시스템코드 | 의미 |
|------|------|------|
| `otWorkAggrCd` | `OT_WORK_AGGR_CD` | 연장근무 집계 |
| `otPayAggrCd` | `OT_WORK_AGGR_CD` | 연장근무 급여 집계 |
| `otPastApplyPolicyCd` | `OT_PAST_APPLY_POLICY_CD` | 당일 과거 시각 허용 정책 |
| `holiWorkAggrCd` | `HOLI_WORK_AGGR_CD` | 휴일근무 집계 |
| `holiPayAggrCd` | `HOLI_WORK_AGGR_CD` | 휴일근무 급여 집계 |
| `nightWorkAggrCd` | `NIGHT_WORK_AGGR_CD` | 야간근무 집계 |
| `nightPayAggrCd` | `NIGHT_WORK_AGGR_CD` | 야간근무 급여 집계 |
| `workOverAggrCd` | `OVER_AGGR_CD_1` | 근무 연장 집계 |
| `workOverTimeStd` | `OVER_TIME_STD_1` | 근무 연장 시간 기준 |
| `paidOverAggrCd` | `OVER_AGGR_CD_1` | 유급 연장 집계 |
| `paidOverTimeStd` | `OVER_TIME_STD_1` | 유급 연장 시간 기준 |

### 야간 시간대
| 필드 | 의미 |
|------|------|
| `nightStaHm` | 야간 시작 시분 (`2200` 고정) |
| `nightEndHm` | 야간 종료 시분 (`0600` 고정) |

> ✅ **확인됨**: 어드민에 야간 시간 설정 화면이 없음 → 그룹별 커스터마이징 불가, **법정 기준 22~06시 고정**. VO 필드는 정의되어 있으나 사실상 dead 필드 (저장값 변하지 않음). `checkNightWork()` 함수도 22~06시 하드코딩됨 (`pp:src/lib/attendance/personalWork.ts:2131`).

### 위치 / 디바이스 / 표시
| 필드 | 의미 |
|------|------|
| `useDeviceClass` | 사용 기기 구분 |
| `gpsLimitYn` | GPS 제한 여부 |
| `ipLimitYn` | IP 제한 여부 |
| `wifiLimitYn` | WiFi 제한 여부 |
| `workTimeVisibleCd` | 근무시간 노출 (`WORK_TIME_VISIBLE_CD_1`) — `DENIED`면 숨김 (특정 고객사 요청) |
| `workForHomePmitYn` | 재택근무 허용 여부 |
| `compensatoryWorkPermitCode` | 대체근무 허용 (`COMPENSATORY_WORK_PERMIT_CODE`) |
| `templateAddPmitYn` | 템플릿 추가 허용 여부 |

### 유효 근무 코드 / 출퇴근 옵션
| 필드 | 의미 |
|------|------|
| `validWorkCd` | 유효근무코드 (시스템코드 `TIME_ORDER_NO_CD_1`, 기존 근무시간우선순위 대체) — `PLAN` / `EXTERNAL` 등 |
| `inoutRecordOption` | 출퇴근 기록 옵션 — 출근만 필수 / 출퇴근 모두 등 |

### 근무시간 / 연장시간 제한 옵션
| 필드 | 의미 |
|------|------|
| `hasMaxWorkLimit` | 최대 근무시간 제한 사용 여부 (boolean) |
| `maxWorkLimitUnitCd` | 제한 단위 코드 |
| `maxWorkLimitMinutes` | 제한 분 수 |
| `hasOvertimeLimit` | 연장시간 제한 사용 여부 (boolean) |
| `overtimeMinutesLimitOnWorkDay` | 평일 연장시간 상한 (분) |
| `overtimeMinutesLimitOnOffDay` | 휴무일 연장시간 상한 |
| `overtimeMinutesLimitOnHoliday` | 휴일 연장시간 상한 |
| `overtimeMinutesLimitPerWeek` | 주단위 연장 상한 |
| `overtimeMinutesLimitPerMonth` | 월단위 연장 상한 |
| `overtimeMinutesLimitPerMonthOnHoliday` | 월단위 휴일 연장 상한 |
| `minOvertimeMinutesOnWorkDay` | 평일 최소 연장 |
| `minOvertimeMinutesOnOffDay` | 휴무일 최소 연장 |
| `minOvertimeMinutesOnHoliday` | 휴일 최소 연장 |

### Deprecated 필드 (코드 정리 대기)
- `workGrpNmMetaId`, `workRuleCd`, `orderNo`, `staWday` — `@Deprecated` 마킹

## 백엔드 API 엔드포인트

`be:controller/setting/WorkGroupSettingController.java` — 25개 엔드포인트:

### 그룹 CRUD
| Method | Path | 용도 |
|--------|------|------|
| POST | `/time/work-grps/search` | 그룹 목록 검색 |
| GET | `/time/work-grps/{workGrpId}` | 그룹 상세 조회 |
| POST | `/time/work-grps/init-save` | **최초 생성** (임시저장 상태로) |
| POST | `/time/work-grps/{workGrpId}/confirm-save` | **확정 저장** (메소드명은 `tempSaveWorkGrp`인데 path는 confirm-save — 코드 점검 필요) |
| POST | `/time/work-grps/{workGrpId}/copy` | 그룹 복제 |
| DELETE | `/time/work-grps/{workGrpId}` | 그룹 삭제 |

### 정산 / 소정근로
| Method | Path | 용도 |
|--------|------|------|
| GET | `/time/work-grps/calc-cycle-list` | 정산주기 목록 (정산주기 확인 모달) |
| GET | `/time/work-grps/legal-contracted-working-times` | 법적 소정근로시간 (소정근로시간 확인 모달) |

### 구성원 (구성원 설정 탭)
| Method | Path | 용도 |
|--------|------|------|
| POST | `/time/work-grps/{workGrpId}/subjects/search` | 그룹 소속 구성원 검색 (필터) |
| POST | `/time/work-grps/emps/search` | 사원 검색 (구성원 변경 모달의 좌측) |
| GET | `/time/work-grps/{workGrpId}/subjects` | 현재 소속 구성원 |
| POST | `/time/work-grps/{workGrpId}/subjects` | 구성원 변경 저장 |

### 일별 근무 계획 (그룹스케줄 탭)
| Method | Path | 용도 |
|--------|------|------|
| GET | `/time/work-grps/{workGrpId}/dd-work-plans` | 일별 근무 계획 목록 |
| POST | `/time/work-grps/{workGrpId}/dd-work-plans` | 일별 근무 계획 일괄 생성 (그룹 스케줄 적용) |
| POST | `/time/work-grps/{workGrpId}/dd-work-plan` | 일별 근무 계획 단건 생성 |
| GET | `/time/work-grps/{workGrpId}/dd-work-plans/{ddWorkPlanId}` | 단건 조회 |
| PUT | `/time/work-grps/{workGrpId}/dd-work-plans/{ddWorkPlanId}` | 수정 |
| DELETE | `/time/work-grps/{workGrpId}/dd-work-plans/{ddWorkPlanId}` | 삭제 |
| POST | `/time/work-grps/{workGrpId}/common-schedule` | **공통 스케줄 확정 저장** (반복 스케줄 적용 결과) |

### 기타근무 (기타근무 항목 관리)
| Method | Path | 용도 |
|--------|------|------|
| GET | `/time/work-grps/{workGrpId}/other-works/{otherWorkId}` | 기타근무 항목 상세 |

### 관련 DB 테이블
- `TM_WORK_GRP` — 그룹 마스터
- `TM_WORK_GRP_HISTORY` (또는 `TM_GRP_HISTORY`) — 변경 이력
- `TM_WORK_GRP_ATTEND_ITEM` — 근태 항목
- `TM_WORK_GRP_DD_WORK_PLAN` — 일별 근무 계획 (그룹스케줄)
- `TM_WORK_GRP_WORK_PLAN` — 근무 계획
- `TM_WORK_GRP_WORK_PLC` — 근무지 매핑
- `TM_WORK_GRP_HOLI_CALEN` — 휴일 캘린더 매핑
- `TM_WORK_GRP_CHG_APPL` — **근무그룹 자체 변경이 아니라, 근무계획 변경 신청서 / 대체근무 신청서에서 그룹 정보 처리용**으로 사용됨. 사용처: `be:service/appls/ddworkplanchange/DdWorkPlanChangeApplsService.java`, `be:service/appls/CompensatoryWorkApplsService.java` (VO: `WorkGrpChgApplVo.java`)

### 별도 화면: 근무그룹 변경 이력 관리

QA 체크리스트에는 없지만 별도 화면 존재:

```
ad:src/pages/attendance/work/group_setting_history_management/index.tsx
ad:src/components/attendance/work/group_setting_history_management/
ad:src/containers/attendance/work/group_setting_history_management/
ad:src/hooks/attendance/work/group_setting_history_management/
ad:src/@types/attendance/workGroupSettingHistoryManagement.d.ts
ad:src/config/api/attendance/workGroupSettingHistoryManagement.ts
```

엑셀 업로드/다운로드 훅도 존재 (`useWorkGroupSettingHistoryExcelUpload`, `useExcelDownload`). [TBD] 이 화면의 정확한 용도와 QA 체크리스트 누락 여부 확인 필요. 별도 영역으로 신규 product 문서 작성 권장.

## 핵심 동작

### 1. 임시저장 → 확정 저장 워크플로우

**임시저장 (`tempSaveYn = 'Y'`)**:
- 메인화면에서 [근무그룹 추가] → 정보 입력 → 모달 확인 → `init-save` API → **임시저장 상태**로 생성, 상세 페이지로 이동
- 메인화면 목록에 "미확정" 태그 표시 (`tempSaveYn === 'Y'`)
- **근무설정 탭에서 한 번이라도 저장하지 않으면** 그대로 임시저장 상태 유지
- 근무설정 탭에서 한 번이라도 저장하면 **확정 (`tempSaveYn = 'N'`, `confirmYmdhms` 채워짐)**
- **근무그룹 복제 시에도 임시저장 상태로 생성** (`/copy` 엔드포인트 Swagger 설명: "복제된 근무그룹은 임시저장 상태로 생성")

**백엔드 처리** (`be:service/setting/rule/WorkGrpSettingService.java:408`):
```java
String tempSaveYn = originDto.getTempSaveYn();
boolean isTempSave = ENUM_YN.YES.value().equals(tempSaveYn);
```

**`confirm-save` 엔드포인트의 메소드명 `tempSaveWorkGrp`는 역사적 잔재** (역할 변경 후 메소드명 미수정 추정). Swagger 설명에서 명확히 "근무그룹 확정 저장 — 최초 생성 후 임시저장 상태의 근무그룹을 확정 처리한다"로 정의되어 있고, 내부적으로 `service.confirmWorkGrp()` 호출.

**확정 후 제약** ✅ (2026-11-02 코드 검증, `be:WorkGrpSettingService.java:611`):
- 확정 후에도 반영되는 필드: 그룹명/메모, 재택 허용, GPS/IP·모바일/PC 출퇴근 제한, 근무시간 표시, 대체근무 허용, 자동집계(개발 전), 최대근무시간 제한, 최소 연장시간. 휴일/출근지/기타근무 매핑도 수정 가능
- 연장/야간/휴일 허용·정산·근무유형·근무기록 방식 등 **집계 룰은 변경 불가** (요청값 무시, 원본 유지)
- **정식 절차**: 그룹 복제 → 잘못된 설정만 수정 → 새 그룹에 구성원 추가(소속 변경). 고객사 공식 안내 문구 존재 (#cx 2026-10-15). 과거일자 변경 시 재집계 별도 요청. 상세: `_learnings/2026-11-02-group-tbd-resolution.md`

### 2. 최초 생성 후 탭 이동 흐름

QA L330–335:
- 최초 생성 후 페이지를 벗어나지 않고 **상단 저장 버튼 클릭** → **다음 탭으로 자동 이동**
- 최초 생성 후 페이지를 벗어나지 않고 **탭 직접 클릭** → 저장 후 클릭한 탭으로 이동

### 3. 근무설정 탭 — 8개 섹션 구조

QA L336–447:

| 섹션 | 내용 | 관련 필드 |
|------|------|------|
| 기본 설정 | 정산 기간, 정산 기준일, 소정근로시간 기준 | `workAdjUnit`, `adjStdYmd`, `contractedWorkingTimeCalcStd` |
| 근무시간 관리 | 근무기록 관리(출퇴근/계획/외부) + 대체/연장/야간/휴일 + 최대근무 + 초과근무 제한 | `inoutRecordOption`, `validWorkCd`, `compensatoryWorkPermitCode`, `otPmitCd`, `nightPmitCd`, `holiWorkPmitCd`, max/overtime limit 필드들 |
| 근무 신청서 관리 | 현재(2026.03.06)는 근무계획 변경 신청서만 | [TBD] |
| 휴일 관리 | 사용할 휴일 목록 + 사용 여부 (클라이언트 휴일 상속) | `TM_WORK_GRP_HOLI_CALEN` |
| 출근지 관리 | 재택근무 허용 + 출퇴근 제한 + 출근지 (클라이언트 출근지 상속) | `workForHomePmitYn`, `gpsLimitYn`, `ipLimitYn`, `wifiLimitYn`, `TM_WORK_GRP_WORK_PLC` |
| 기타근무 항목 관리 | 사용할 기타근무 항목 + 사용 여부 (클라이언트 기타근무 상속) | `TM_WORK_GRP_ATTEND_ITEM` |
| 기타 설정 | 자동 집계, 월 단위 집계 기준 (개발 전, 조회만) | `autoYmdWorkAggrYn`, `autoMmWorkAggrYn`, `ddAggrTime*`, `mmAggrTime*` |

**우측 체크리스트** (`work_setting_check_list/`): 각 섹션 설정 완료 여부를 시각화 (파란 체크 / 회색 체크). 필수값 누락 시 회색.

**상속 체계**: 휴일/출근지/기타근무 항목은 **클라이언트 레벨**(어드민 화면 근무 > 근무 설정 / 출근지 설정 / 기타근무 항목 관리)에서 정의된 항목을 상속. 그룹에서는 사용 여부만 토글 가능.

### 4. 근무시간 관리 세부 룰 (가장 복잡)

QA L368–390 + `work_time_setting/contents/` 컴포넌트들:

- **근무기록 관리** (`WorkLogManagementFormSection`): 출퇴근 기록 / 근무 계획 / 외부 시스템 중 선택
  - 외부 시스템 = 세콤 연동 (`validWorkCd === "EXTERNAL"`)
  - 출퇴근 기록 또는 외부 시스템 선택 시 → "출퇴근 기록 옵션" 활성화 (출근만 필수 등)
- **연장/야간/휴일 근무 허용** (각각 별도 FormSection): "허용" / "승인 시에만 허용" / "불가"
  - "허용" or "승인 시" → "근무시간 포함여부" 옵션 노출 (단, "미포함"은 disabled)
- **연장시간 관리 방식** = "정산기간의 근무시간 합계가 기본 근무시간을 넘어가면 연장근무로 기록" 일 때:
  - 정산기간 = 1주 → 주단위 + 월단위(휴일/전체) 필드만
  - 정산기간 = 2주~1개월 → 월단위(휴일/전체)만
  - 정산기간 = 2개월/3개월 → 자동 "제한 없음", 시간 제한 적용 disabled

### 5. 구성원 설정 탭

QA L448–502. 핵심:

- **구성원 변경 모달**: 좌측 검색 (회사/조직/이름/사번) ↔ 우측 그룹 소속 (>>, <<, >, < 버튼 이동)
- **변경일 지정 화면**: 추가된 구성원의 그룹 소속 변경일 입력
  - 초기값: 당일
  - 기존 근무그룹이 없으면 변경일 수정 불가, 초기값은 입사일과 연차기산일 중 작은 값
  - **마지막 근무 마감일 이전으로 변경 불가** (근무 마감 후 다른 그룹 이동 시 마감일 이전 변경 불가)
- **저장 시**: 컨펌창 → 확정 저장 → 메인 리스트로 복귀
- 추가된 구성원은 리스트 상단에 **노란색 배경**으로 표시

### 6. 그룹스케줄 탭

> **용어 정리**: 그룹스케줄 = 근무그룹 단위로 적용된 **근무 계획**. 근무 계획의 종류는 **근무 템플릿**. 즉 "그룹스케줄에 템플릿 적용" = "그룹 단위로 어떤 종류의 근무 계획을 적용할지 선택".

QA L503–546. 핵심:

- **템플릿 설정**: 클라이언트 공통 템플릿(`기본 설정 > 근무 템플릿`) 중 선택해서 그룹에 추가, 또는 새 템플릿 생성
  - 공통 템플릿 수정 시 → "근무그룹" 구분으로 신규 저장됨 (원본 보존)
- **그룹스케줄 캘린더**: 일자 선택 → 템플릿 클릭하여 적용
  - 미확정 스케줄 삭제: 즉시 삭제
  - 확정 스케줄 삭제: 취소선 + 툴팁 ("확정 시 삭제")
  - 반복 스케줄 적용 가능
- **저장**: 확인 모달 표시 (어떤 스케줄을 확정할지)
- **근무 마감된 일자**: 스케줄 삭제/추가/확정 모두 불가 (체크리스트 § 9 룰 적용)

## 사용자 화면 영향 (cross-domain)

근무그룹 설정 변경이 사용자 화면에 미치는 영향:

| 그룹 설정 변경 | 사용자 화면 영향 |
|------|------|
| `validWorkCd === "PLAN"` | 출퇴근 위젯에 출/퇴근 버튼 미노출, "근무 중" 텍스트만 |
| `validWorkCd === "EXTERNAL"` (세콤) | 출퇴근 위젯 동작 분기 (외부 시스템에서 기록) |
| `holiWorkPmitCd === "N"` + 휴일 | 출퇴근 위젯 출근 시 차단 안내문 (`isHolidayWorkUnavailableOnWork`) |
| `nightPmitCd === "N"` + 22~06시 | 출퇴근 위젯 출근 시 차단 안내문 (`isNightWorkUnavailableOnWork`) |
| `otPmitCd === "A"` | 예상 퇴근시간 초과 시 빨간색 텍스트 (`shouldCheckOvertime`) |
| `gpsLimitYn === "N"` | 근무지 외 출퇴근 자동 허용 (체크리스트 L72) |
| `workTimeVisibleCd === "DENIED"` | 근무시간 화면 미표시 (특정 고객사) |
| 휴일 관리 변경 | 사용자 캘린더 / 근무스케줄 화면 휴일 표시 변경 |
| 출근지 관리 변경 | 출퇴근 위젯 GPS 검증 대상 변경 |
| 그룹스케줄 변경 | 사용자의 내 근무 캘린더에 계획 반영 |

이러한 cross-domain 영향 때문에 **근무그룹 설정 변경 = 매우 신중해야 하는 작업**. 확정 후 잠금이 걸리는 이유.

## 비즈니스 룰 / 제약

- **확정 후 핵심 룰 변경 불가** — 근무그룹 룰을 한 번 확정하면 그룹명/메모 외 변경 불가 (집계 일관성 보장)
- **마지막 근무 마감일 이전으로 구성원 변경일 지정 불가** — 마감 데이터 무결성 보호
- **근무 마감된 일자 그룹스케줄 변경 불가** — 마감 데이터 무결성 보호
- **공통 템플릿은 수정 시 그룹용으로 신규 저장** — 다른 그룹 영향 방지
- **휴일/출근지/기타근무는 클라이언트에서 상속** — 그룹은 사용 여부만 결정 (클라이언트 정의 변경이 모든 그룹에 전파)
- **임시저장 그룹은 미확정 태그** — UI 가시성

### 근무그룹 삭제 조건 ✅ (2026-06-19 백엔드 코드 검증)

삭제는 `tempSaveYn`에 따라 2분기 (`be:service/setting/rule/WorkGrpSettingService.java:1290` `deleteWorkGrp`):

- **임시저장 (`tempSaveYn='Y'`)** → 조건 검사 없이 **hard delete** (`deleteTempWorkGrp`, :1312). 출근지/템플릿/휴일/기타근무/신청서 설정까지 실제 DELETE.
- **확정 (`tempSaveYn='N'`)** → `checkDeletableWorkGrp`(:1381) 통과해야만 **아카이브(soft delete, `removeToArchive...`)**. `deleteWorkGrpArchive`(:1356).

**삭제 불가 조건 (확정 그룹만 해당):**
- **구성원 설정 이력이 1건이라도 있으면 삭제 불가** → 예외 `"구성원 설정 이력이 있는 근무그룹은 삭제할 수 없습니다"`.
- 카운트 쿼리 `getGroupMemberCountByWorkGrpId`는 `TM_GRP_HISTORY`를 셈 (`be:SQL/time/setting/WorkGrpSettingMapper.xml:1028`). 호출 시 `stdYmd=null`로 넘겨 → `END_YMD>=stdYmd` 필터 미적용 → **현재 소속 0명이어도 과거 배정 이력이 있으면 차단** (현재 인원이 아니라 전체 이력 기준).
- 공통: 그룹 조회 결과 없으면 `"존재하지 않는 근무그룹입니다."`

> ✅ "이력 기준" 차단은 **사실상 최종 스펙** — 고객사 공식 안내(#cx 2026-10-15)와 일치. `//TODO` 주석은 2024-09 잔재. 운영에선 소속 이력을 백엔드에서 정리 후 기능으로 삭제. 고객사 "구성원 다 뺐는데 삭제 안 됨" 문의 시 이 `stdYmd=null`이 원인.

## 알려진 제약 / 임시 동작

- **근무 신청서 관리** (QA L391–400): 현재(2026.03.06) 근무계획 변경 신청서 설정만 가능, 다른 신청서 설정은 미구현
- **기타 설정** (QA L442–446): 개발 전, 고정 기본값만 입력되며 조회만 가능
- **근무계획 변경 신청서 기간 역전 검증**: 백엔드만 걸림, 프론트 검증 추가 예정 (QA L398)

## 검증 / [TBD]

- [ ] `WorkGrpSettingService` (rule 폴더) vs `WorkGroupSettingService` 의 책임 구분 — 백엔드 개발자 영역
- [ ] 근무그룹 변경 이력 관리 화면(`group_setting_history_management/`)의 정확한 용도, QA 체크리스트 누락 이유
- [ ] 어드민 hooks가 1개만 노출됨 — 실제 데이터 fetching 패턴 (react-query keys, mutation 등) 추가 탐색 필요

## 확인 완료 (해소된 [TBD])

- ✅ **복제 범위** (2026-11-02) — 근무설정 탭 전체 + 휴일/출근지(근무그룹 유형은 설정까지 새 ID로) + 기타근무 매핑(사용여부 유지) + 신청서 설정 9종. **구성원·근무 템플릿·그룹스케줄은 복제 안 됨**(설계 의도). `be:WorkGrpSettingService.copyWorkGrp:781`

- ✅ **`confirm-save` 메소드명 미스매치** — 메소드명 `tempSaveWorkGrp`는 역사적 잔재. Swagger 설명("근무그룹 확정 저장 — 최초 생성 후 임시저장 상태의 근무그룹을 확정 처리한다")과 내부 호출(`service.confirmWorkGrp()`) 모두 확정 저장 의미. 코드 정리 대기 중인 것으로 추정
- ✅ **`nightStaHm`/`nightEndHm` 그룹별 커스터마이징 여부** — 어드민에 설정 화면 없음. 22~06시 법정 기준 고정. VO 필드는 dead로 보임 (저장값 변경 불가)
- ✅ **`TM_WORK_GRP_CHG_APPL` 용도** — 근무그룹 변경 신청서가 아니라, **근무계획 변경 신청서** (`DdWorkPlanChangeApplsService`) 및 **대체근무 신청서** (`CompensatoryWorkApplsService`) 에서 사용. 신청서 처리 시 그룹 정보 처리용으로 추정
- ✅ **임시저장 동작** — 신규 추가 / 복제 모두 임시저장 상태로 시작. 근무설정 탭에서 한 번이라도 저장하면 확정 전환

## 관련 문서

- `KB:operations/customer-setup-guide.md` ⭐ — **고객사 세팅 시 근무그룹 만드는 의사결정** (5가지 근무제 유형별 레시피)
- `KB:product/user-checkin-widget.md` — 그룹 설정값을 사용자 화면이 어떻게 활용하는지
- `KB:domain/business-rules.md` — § 1 근무시간 인정, § 2 야간, § 3 연장, § 4 휴일 — 모두 그룹 설정에 의존
- `KB:domain/glossary.md` — `holiWorkPmitCd`, `otPmitCd`, `nightPmitCd`, `validWorkCd`, `workTimeVisibleCd`, `gpsConfCd`, WorkStatus 등
- `KB:code/backend-tables.md` — `TM_WORK_GRP*` 테이블들
