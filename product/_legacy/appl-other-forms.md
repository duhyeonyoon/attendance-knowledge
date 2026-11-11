# 신청서 묶음 후속: 재택/기타근무/대체근무/근무계획변경/근무내역변경 (사용자)

## 개요

표준 신청서 패턴(`CONST_APPLY_ACTION` 8개 액션 + `Appls`/`CancelAppls` 분리)을 따르는 5개 신청서를 묶은 문서. 공통 패턴은 `KB:product/appl-holiday-overtime.md`에 정리됨 — 본 문서는 **각 신청서의 차이점**에 집중합니다.

| 사용자 영역 | 신청서 | ppfront 컴포넌트 | 백엔드 path |
|------|------|------|------|
| U16 | 재택근무 | `HomeWork.tsx` | `/time/appls/work-for-home` |
| U17 | 기타근무 | `OtherWorkApplications.tsx` | `/time/appls/other-work` |
| U18 | 대체근무 | `CompensatoryWork.tsx` | `/time/appls/compensatory-work` |
| U19 | 근무계획 변경 | `PlanEdit.tsx` | `/time/appls/work-plan-change` |
| U4 + U7 | 근무내역 변경 | `RegEdit.tsx` | `/time/appls/work-record-change` |

## QA 체크리스트

`ppfront/.claude/qa-checklist/attendance.md`:

- 재택근무 (U16): L715–728 (14줄)
- 기타근무 (U17): L729–780 (52줄)
- 대체근무 (U18): L781–805 (25줄)
- 근무계획 변경 (U19): L806–883 (~78줄)
- 당일 근무내역 변경 (U4): L155–166 (12줄)
- 근무내역 변경 본체 (U7): L210–258 (49줄)

## 신청서별 정리

---

### 1. 재택근무 신청 (U16)

**조건**: 어드민 근무그룹 설정에서 **재택근무 허용** 체크 (`workGrpVo.workForHomePmitYn === "Y"`)

**ppfront 컴포넌트**:
- `pp:src/components/workflow/shared/template_drawer/contents/HomeWork.tsx` ⭐
- 검증 로직: 응답에 `dupPeriodDtls` (요청 중 재택), `workForHomeDays` (신청 완료 일자), `closedDays` (마감 일자)

**백엔드**:
- 신청: `be:controller/appls/WorkForHomeApplsController` — `/time/appls/work-for-home/*`
- 취소: `be:controller/appls/WorkForHomeCancelApplsController` — `/time/appls/work-for-home-cancel/*`
- VO: `WorkForHomeApplVo`, `WorkForHomeCancelApplVo` (추정)
- DB: `TM_WORK_FOR_HOME_APPL`, `TM_WORK_FOR_HOME_APPL_DTL`, `TM_WORK_FOR_HOME_CANCEL_APPL`, `TM_WORK_FOR_HOME_CANCEL_APPL_DTL`, `TM_RMT_WORK_LOC` (위치)

> ⚠️ DB 테이블명은 `WORK_FOR_HOME` (재택)인데 `TM_RMT_WORK_*` 테이블도 별도 존재 — 두 그룹 관계 [TBD]. 인벤토리에서는 같이 묶어 정리됨

**핵심 동작 (QA L719–727)**:

- **단일 일자 신청만** — "근무일과 결재선 선택 후 [요청] → 당일 날짜로 신청 완료" (체크리스트 L720). 즉, 신청서 자체가 단일 일자 단순 워크플로우
- **승인 완료 시 표시**:
  - 홈 출퇴근 위젯 **상단에 재택 Chip**
  - 구성원 근무 현황에 재택 Chip
  - **단, 기타근무 신청 Chip이 있으면 재택 Chip은 노출되지 않음** (체크리스트 L722) — 우선순위 룰
- **재택 승인 = 위치 제약 해제** — "재택근무 승인 이후에는 근무지 여부에 상관없이 출/퇴근 할 수 있다" (체크리스트 L727). 출퇴근 위젯 GPS 검증을 우회

**알림**: 신청/승인/반려/코멘트 → talenx 알림. 통합알림 설정에서 "근무 내역/계획 변경 - 재택근무" off 가능

**마감 차단**: 마감된 일자 요청/승인/취소 모두 불가

---

### 2. 기타근무 신청 (U17)

**조건**: 어드민에서 **기타근무 항목 관리**에 항목이 등록되어 있어야 함 (근무그룹 상속). 항목별로 코멘트/파일 첨부 필수 여부 설정 가능

**ppfront 컴포넌트**:
- `pp:src/components/workflow/shared/template_drawer/contents/OtherWorkApplications.tsx` ⭐
- 관련 훅: `pp:src/hooks/attendance/useAdminDirectOtherWorkDisplay.tsx` (어드민 직접 등록 시 표시)
- 관련 컴포넌트: `pp:src/components/attendance/shared/admin_direct_dialog/AdminDirectOtherWorkDialog.tsx` (어드민 등록 안내)

**백엔드**:
- 신청: `be:controller/appls/otherwork/OtherWorkApplsController` — `/time/appls/other-work/*`
- 취소: `be:controller/appls/otherwork/OtherWorkCancelApplsController` — `/time/appls/other-work-cancel/*`
- DB: `TM_WORK_FOR_HOME_APPL`, `TM_WORK_FOR_HOME_APPL_DTL` (테이블명 헷갈리지만 기타근무에 사용됨? 또는 별도 `TM_OTHER_WORK_APPL` [TBD])

**핵심 동작 (QA L731–779)** — 신청서 중 **가장 복잡**한 영역:

#### 기간 신청 + 일자별 토글

다른 신청서들과 달리 **기간 신청 지원**:
- 기간 내 휴일/휴무일은 **토글이 비활성화 상태**로 표시 — 토글을 활성화하면 그 일자도 포함 가능
- **전체 종일 적용** 버튼 — 모든 활성화된 일자를 종일로 일괄 체크
- 토글 비활성화 상태일 때는 종일 체크박스도 비활성화
- 휴일/휴무일은 전체 종일 선택 시에도 (토글 비활성이면) 체크 안 됨
- 모두 휴일/휴무일이고 모든 토글 비활성 상태로 요청 시 → "요청일을 선택합니다" 에러

#### 사용 시간 옵션

- **종일** vs **직접 입력** — 일자별로 선택
- 종일 신청 시 캘린더에 시간 출력되지 않음
- 종일 신청한 일자에 또 종일 신청 시도 → 요청 버튼 비활성

#### 표시

- 출퇴근 위젯에 기타근무 요약 표시 (2건 이상은 아코디언)
- 팀 근무 현황에 기타근무 아이콘
- **종일 기타근무 승인 시 출퇴근 누락 → 누락 처리 안 함** (단, 근무스케줄 있어야 함, 체크리스트 L740–741)
- 요청중/승인 완료/취소중 문서가 처리할 문서, 내근무 캘린더, 구성원 근무에 표시되며 상태 변경 시 즉시 업데이트

#### 유효성 검사 (3단계)

**기간 유효성**:
- 이미 신청한 기타근무가 있으면 리스트 표시
- 사용시간 총 합 표시
- 종일 신청 내역 있는 날짜 → disabled
- 종일 아닌 신청 내역 있는 날짜 → [직접 입력] 기본 설정
- 마감된 일자 포함 → 요청 불가

**일자별 유효성**:
- 시작 = 종료 → "시작 종료시간이 같습니다"
- 시작 > 종료 → "종료 시간이 시작 시간 전입니다"
- 근무귀속일 벗어남 → "당일XX:XX~익일XX:XX 이내로 신청합니다"
- 기존 신청 시간 겹침 → 예제 문구

**요청 유효성**:
- 종일 신청한 날에 또 신청 → 요청 버튼 비활성
- 날짜 미선택 → 요청 버튼 비활성
- 직접입력 시 시작/종료 미입력 → 에러
- 기타근무 유형 코멘트 필수 → "코멘트를 입력합니다."
- 기타근무 유형 첨부 필수 → "첨부파일을 업로드합니다."

#### 어드민 직접 등록 (별도 흐름)

어드민이 사용자의 기타근무를 직접 등록할 수 있음. 이 경우 사용자 화면에 **별도 다이얼로그**가 뜸 (`AdminDirectOtherWorkDialog.tsx`).
- 메시지: `ADMIN_DIRECT_OTHER_WORK.registeredByAdmin` = "해당 근무는 별도의 신청/승인 과정 없이 관리자에 의해 등록되었습니다."
- → 일반 신청 워크플로우 우회

---

### 3. 대체근무 신청 (U18)

**조건**: 어드민 근무그룹 설정 > 대체근무 관리 > 대체근무 허용 = **'승인 시에만 대체근무 가능'** (`workGrpVo.compensatoryWorkPermitCode`)

**ppfront 컴포넌트**:
- `pp:src/components/workflow/shared/template_drawer/contents/CompensatoryWork.tsx` ⭐
- 타입: `pp:src/@types/customTypes/workflow/compensatoryWork.d.ts`

**백엔드**:
- 신청: `be:controller/appls/CompensatoryWorkApplsController` — `/time/appls/compensatory-work/*`
- 취소 컨트롤러 별도 발견 안 됨 — `/cancel` 액션만 사용? [TBD]
- DB: `TM_*_COMP*` 추정 (정확 이름 [TBD])
- VO: `be:vo/...CompensatoryWork...` (정확 위치 [TBD]) — 단, `dto/appls/compensatorywork/CompensatoryWorkApplValidationDto`는 존재
- 흥미로운 발견: `TM_WORK_GRP_CHG_APPL` 테이블을 `CompensatoryWorkApplsService`가 사용 (`KB:product/admin-work-group.md` § "확인 완료" 참조)

**핵심 동작 (QA L789–804)**:

- **대체 근무일** = 근무스케줄 상 **휴일/휴무일로 지정된 일자만** 선택 가능 (스케줄 없는 날 신청 불가)
- **대체 휴일/휴무일** = 근무스케줄 상 **근무일로 지정된 일자만** 선택 가능 (스케줄 없는 날 신청 불가)
- 즉 한 쌍의 (근무일 → 휴일/휴무일) + (휴일/휴무일 → 근무일) 교환

**유효성 검사 (8가지 불가 케이스)**:
1. 이미 요청중 대체근무 신청서 존재 → "기존 대체근무 정보와 중복되지 않는 경우에만"
2. 해당 일자에 **근무계획 변경 신청서 요청중** → 불가
3. 선택 일자가 **서로 다른 정산기간** → 불가
4. 선택 일자가 **서로 다른 근무그룹 소속** → 불가
5. 해당 일자 그룹 설정이 **대체근무 불가** → 불가
6. 대체 근무일 선택 시 기존 스케줄이 휴일/휴무일이 아님 → 불가
7. 대체 휴일/휴무일 선택 시 기존 스케줄이 근무일이 아님 → 불가
8. 선택 일자에 근무그룹/스케줄 없음 → 불가
9. **근무 마감일** → 요청/승인 불가

> 대체근무는 **두 일자가 짝**으로 묶이는 신청이라 다른 신청서들보다 유효성 검사 조건이 많음

---

### 4. 근무계획 변경 신청 (U19)

**조건**: 어드민 근무그룹 설정 > 근무 신청서 관리 > 근무계획 변경 신청 **사용 여부 ON** (시드 데이터는 ON 상태). `KB:product/admin-work-group.md` § "근무 신청서 관리" 참조 (현재 이 섹션에서 설정 가능한 유일한 신청서가 근무계획 변경)

**ppfront 컴포넌트**:
- `pp:src/components/workflow/shared/template_drawer/contents/PlanEdit.tsx` ⭐
- 타입: `pp:src/@types/customTypes/workflow/workplan.d.ts`

**백엔드**:
- 신청: `be:controller/appls/ddworkplanchange/DdWorkPlanChangeApplsController` — `/time/appls/work-plan-change/*`
- 취소 컨트롤러 별도 발견 안 됨 — `/cancel` 액션만 사용? [TBD]
- 서비스: `be:service/appls/ddworkplanchange/DdWorkPlanChangeApplsService`
- DB: `TM_PSN_WORK_PLAN_APPL`, `TM_PSN_WORK_PLAN_CANCEL_APPL`, `TM_WORK_GRP_CHG_APPL` (이전 deep-dive에서 확인)

**핵심 개념 — 개인스케줄 vs 그룹스케줄** (체크리스트 L809–815):

```
개인스케줄: 사용자 화면의 근무스케줄 또는 근무계획 변경으로 생성된 스케줄
그룹스케줄: 근무그룹의 그룹스케줄에서 생성된 스케줄
우선순위: 개인스케줄 > 그룹스케줄 (개인 있으면 그룹 변경해도 적용 안 됨)
```

알려진 문제 (QA에 🚨 표시):
- 근무그룹 변경 시 개인스케줄이 삭제되지 않아서 이전 근무그룹 스케줄이 잔존 가능 (국인님 처리 예정)
- 위 경우 사용자 화면 근무스케줄에서 변경된 그룹의 개인스케줄 변경 확정해야 함

**진입 경로**:
1. 과거 근무내역 변경요청서 → 유형을 근무계획 변경으로 변경
2. 내 근무 캘린더에서 클릭 가능한 케이스:
   - **오늘 / 미래 + 근무계획이 근무일**인 경우 (✅ 클릭 가능)
   - 미래 + 근무계획 미정 / 휴일 / 휴무일 (❌ 클릭 불가)
3. 출퇴근 위젯의 근무신청

**유효한 요청일**:
- "근무일" 근무계획으로 이루어진 기간
- "근무일" + "휴일"/"휴무일" 혼합 기간

**기간 유효성 (5가지)** — 동일 기간에 여러 밸리데이션이 있어도 **가장 가까운 것 1개만 노출**:

| 케이스 | 메시지 |
|------|------|
| 선택 기간에 미정 근무계획 있음 | "선택한 기간에 기존 근무계획이 정해져 있지 않은 기간이 존재합니다..." |
| 선택 기간에 근무그룹 변경 있음 | "요청 시작일에 속한 근무그룹에 대해서만 근무계획을 변경할 수 있습니다.(~ 현 근무그룹 종료일)" |
| 선택 기간에 요청된 근무계획 변경 있음 | "선택한 기간에 요청된 근무계획 변경 사항이 있습니다..." |
| 선택 기간에 요청된 대체근무 신청 있음 | "선택한 기간에 요청된 대체근무 신청이 있습니다..." |
| 선택 기간 전체가 휴일 | "선택한 요청일 모두 휴일입니다. 근무 스케줄이 있는 근무일을 포함하여..." |

**변경 결과**:
- 기간은 휴일/휴무일 선택 가능하지만 **실제 변경은 불가** — **근무일 템플릿만 변경 가능**
- 기존 근무계획에 휴일은 노출되지 않음
- 기간으로 선택 시 기존 근무계획이 다르면 기간 별로 표시

**변경할 근무 계획 유효성**:
- 변경 이전과 이후 모두 동일 → "변경 이전과 이후가 동일합니다."

**근무 계획 변경 신청서 설정 유효성** (어드민에서 설정한 룰):
- 변경 대상 기간 외 일자 → 캘린더에서 비활성화
- 신청 가능 기간 외 → 경고 모달 + 신청서 닫힘
- 파일 첨부 / 코멘트 필수 여부

**마감 차단**: 요청/승인 불가

---

### 5. 근무내역 변경 신청 (U4 + U7)

**조건**: 모든 사용자 가능. 단, 마감되지 않은 일자에만

**ppfront 컴포넌트**:
- `pp:src/components/workflow/shared/template_drawer/contents/RegEdit.tsx` ⭐
- 출퇴근 위젯에서 트리거 (`KB:product/user-checkin-widget.md` § "우선순위 분기")
- 검증 라이브러리: `pp:src/lib/attendance/custom/reg_edit_application/index.ts`
- 잔여 OT 계산: `getRemainOvertimeMinutes` from `modules/workflow/document.ts`
- 시간 검증: `getValidWorkTime` from `modules/workflow/attendance/validation.ts`

**백엔드**:
- `be:controller/appls/WorkRecordChangeApplsController` — `/time/appls/work-record-change/*`
- 취소 컨트롤러 별도 없음 — `/cancel` 액션만 사용

**진입 경로**:
1. **당일 근무내역 변경** (U4, L155–166): 출퇴근 위젯에서 "근무 내역 변경" 버튼으로 진입
   - 트리거 조건: 출근 요청이 취소/반려되어 출근 기록 없는데 퇴근만 있는 경우 (`workHistoryChangeRequired`)
   - "근무 내역 변경이 필요합니다" 문구
   - 요청 시 "요청중" 상태 + 버튼 disabled
   - 승인 시 "퇴근" 상태 + 출근/퇴근 시간 노출 + 재신청 가능
2. **근무내역 변경 (일반)** (U7, L210–258): 내 근무 캘린더에서 과거 날짜 클릭 또는 출퇴근 위젯에서 근무 신청 → 근무내역 변경 선택

**열림 시 동작**:
- 이미 입력된 출근/퇴근 정보 있으면 입력된 상태로 모달 오픈
- **근무시간 표시 안함 + 출근인정시각 이전 출근**한 경우 → 첫 출근시간이 **출근인정시각으로 보정**되어 표시
- 출근인정시간 이전으로 출근시간 설정 시 → "출근 인정시간 전 근무 미인정" 문구
- 근무 귀속일 하루 시간 벗어난 입력 → 요청 시 경고 모달:
  > "입력하신 출퇴근 시각은 익일 근무를 포함하고 있습니다. 해당 시간은 선택한 날짜의 근무로 기록됩니다..."

**밸리데이션 (5종)**:

1. **시간 역전**
   - 출근/퇴근 역전 → "퇴근시간이 출근시간 전입니다."
   - 두 번째 출근시간 < 첫 번째 퇴근시간 → "출근시간이 이전 퇴근시간 전입니다."

2. **자리비움**
   - 자리비움 시작/종료 역전 → "종료시간이 시작시간 전입니다."
   - 자리비움이 출퇴근 시간 외 → "자리비움 시간은 출퇴근 시간 이내로 작성해야합니다."

3. **초과근무제한시간 (최대)**
   - 변경 시간에 연장/야간 근무 포함 시 잔여시간 문구 표시
   - 잔여시간 초과 시 밸리데이션

4. **초과근무제한시간 (최소)** — 근무그룹 룰
   - **휴일**: 기본근무시간이 최소 미만 → 인정근무 제외 + 경고
   - **근무일/휴무일**: 연장근무시간이 최소 미만 → 인정근무 제외 + 경고

5. **연장근무 정보**
   - 연장 휴게시간 포함 시 정보 표시
   - 고정 유형 연장휴게시간은 시간정보까지 확인 가능

**관리자 수정 후 사용자 측 차단**: 어드민이 출퇴근내역 직접 수정한 일자에 사용자가 변경 신청 시도 → "관리자에 의해 수정된 내역이 있어 신청할 수 없습니다" (`KB:product/admin-work-data.md` § "사용자 관점 검증 시나리오" 참조)

**마감 차단**: 요청/승인 불가

---

## Cross-domain 효과 (5개 신청서 통합)

| 신청서 | 출퇴근 위젯 영향 | 다른 영역 영향 |
|------|------|------|
| 재택 | 승인 시 GPS 검증 우회 + 재택 Chip 표시 | 구성원 근무 현황 Chip |
| 기타근무 | 출퇴근 위젯에 요약 표시 (2건+ 아코디언) / 재택 Chip 가림 | 종일 승인 시 누락 미처리 / 캘린더 표시 |
| 대체근무 | 직접 영향 없음 | 근무계획 변경 신청을 막음 (역도 마찬가지) |
| 근무계획 변경 | 직접 영향 없음 | 대체근무 신청을 막음 / 그룹 스케줄 우회 (개인스케줄 우선) |
| 근무내역 변경 | "근무 내역 변경" 버튼으로 진입 | 어드민 직접 수정 시 차단 |

## 비즈니스 룰 (5개 신청서 공통/특이)

1. **모든 신청서 마감 차단** — 동일하게 적용 (`KB:product/admin-work-close.md` § "Cross-domain")
2. **재택 단일 일자 / 기타·계획변경·내역변경·대체 = 기간 가능**
3. **재택 Chip < 기타근무 Chip** — 우선순위 룰 (둘 다 있을 때 기타근무가 표시됨)
4. **재택 승인 = GPS 우회** (체크리스트 L727)
5. **기타근무 종일 + 근무스케줄 있음 → 누락 처리 안 함** (체크리스트 L740)
6. **대체근무는 짝(swap)**: 근무일 → 휴일/휴무일 + 휴일/휴무일 → 근무일
7. **근무계획 변경의 변경 결과는 근무일 템플릿만 변경 가능** (휴일/휴무일은 변경 불가)
8. **개인스케줄 > 그룹스케줄 우선순위**
9. **근무계획 변경 ↔ 대체근무는 상호 배타** (한쪽이 요청중이면 다른 쪽 불가)
10. **근무내역 변경 시 출근인정시각 자동 보정** (근무시간 표시 안함 + 인정시각 이전 출근)
11. **어드민 직접 수정한 일자 → 변경 신청 차단** (`hasModifiedWorkRecord` flag)
12. **간주근로자 휴가 사용 시 특수 계산** (체크리스트 L249–257):
    - 근무시간 = (소정근로시간) − min(소정근로시간, 기타근무시간)
    - 인정 근무시간 = 근무시간 + 기타근무시간 + 휴가사용시간
    - 최대 소정근로시간 초과한 기타근무는 가산됨

## 표준 워크플로우 패턴 (재참조)

8개 표준 액션 (`CONST_APPLY_ACTION`):

```
/search        조회
/temp-saved    임시저장
/apply         신청
/cancel        결재 전 신청 자체 취소
/rejected      반려
/approval-done 결재완료
/complete      완료
/delete        삭제
```

각 신청서마다 path prefix만 다름 (`/time/appls/{name}/*`).

**Cancel 컨트롤러 분리 패턴**:

| 신청서 | Cancel 컨트롤러 존재? |
|------|------|
| 사전 휴일근무 / 사전 연장·야간 / 재택 / 기타근무 / 휴가 | ✅ 별도 존재 (`*CancelApplsController`) |
| 대체근무 / 근무계획 변경 / 근무내역 변경 | ❌ 메인 컨트롤러의 `/cancel` 액션만 사용 |

→ 워크플로우 흐름이 다름. **Cancel 컨트롤러가 있는 것들은 "결재 완료 후 취소"가 별도 워크플로우** (취소 신청서를 발행). **없는 것들은 단순 `/cancel` 액션으로 처리** ([TBD] 정확한 차이 확인 필요).

## 알려진 제약 / 임시 동작

- **개인스케줄 잔존 버그**: 근무그룹 변경 시 이전 그룹의 개인스케줄 삭제 안 됨 (QA L814 🚨, 처리 예정)
- **DB 테이블 이름과 컴포넌트 이름 불일치**: 재택 컴포넌트는 `HomeWork.tsx`인데 DB 테이블은 `TM_WORK_FOR_HOME_*` (그리고 별도로 `TM_RMT_WORK_*` 존재 — 두 그룹 관계 불명)
- **기타근무 ↔ 재택 Chip 우선순위**: 가시화 룰 (둘 다 승인 시 기타근무가 표시됨)
- **Compensatory / DdWorkPlanChange / WorkRecordChange**: Cancel 컨트롤러 별도 없음. 다른 워크플로우 흐름

## 검증 / [TBD]

- [ ] `TM_RMT_WORK_*` vs `TM_WORK_FOR_HOME_*` 두 테이블 그룹의 정확한 관계
- [ ] `Compensatory`, `DdWorkPlanChange`, `WorkRecordChange`의 결재 완료 후 취소가 어떻게 처리되는지 (Cancel 컨트롤러 없는데 어떻게 동작?)
- [ ] `Remote.tsx` 컴포넌트의 정확한 용도 — `HomeWork.tsx`가 재택 신청서면 `Remote.tsx`는 무엇인가?
- [ ] `WorkGroup.tsx` 컴포넌트의 용도 (template_drawer 내)
- [ ] `MultiLeavePeriodDialog.tsx` 의 정확한 용도 (다중 기간 휴가)
- [ ] 기타근무 항목 마스터가 어드민에서 어떻게 정의되는지 (`KB:product/admin-work-group.md` § "기타근무 항목 관리"와 연결, but 상세 정의 화면이 어디?)
- [ ] `OtherWorkApplValidationDto` 의 구조

## 두현님 답변 받으면 좋을 것

1. **Cancel 컨트롤러가 없는 신청서** (대체/계획변경/내역변경)의 결재 완료 후 취소는 어떻게 처리?
2. **`Remote.tsx` / `WorkGroup.tsx` / `MultiLeavePeriodDialog.tsx` 컴포넌트들의 용도**
3. **재택 / 기타근무 Chip 우선순위**가 의도적인지, 아니면 사용성 이슈인지

## 관련 문서

- `KB:product/appl-holiday-overtime.md` — 신청서 표준 패턴 (이 문서의 베이스)
- `KB:product/user-checkin-widget.md` — 근무내역 변경 트리거 / 재택 Chip 표시 / 기타근무 요약
- `KB:product/admin-work-group.md` — 그룹 설정 (workForHomePmitYn, compensatoryWorkPermitCode 등)
- `KB:product/admin-work-data.md` — 어드민 직접 수정 후 사용자 변경 신청 차단
- `KB:product/admin-work-close.md` — 마감 차단
- `KB:domain/business-rules.md` — § 1 근무시간 인정 / § 9 근무 마감
