# 근무스케줄 (사용자 U11)

> **용어 정리 (2026-05-13)**: **근무 스케줄 = 근무 계획** (동의어). **근무 계획의 종류 = 근무 템플릿**. 이 화면은 사용자가 자신의 근무 계획(=스케줄)을 보거나 수정 권한자가 다른 구성원의 계획을 편집하는 곳.

## 개요

**미래 근무 계획(=근무 스케줄)을 관리하는 화면.** 사용자는 자신의 미래 스케줄 확인(읽기 전용)이 기본이고, **근무스케줄 수정 권한이 있으면** 다른 구성원의 스케줄까지 편집 가능. 즉, 권한에 따라 **읽기 전용 / 편집 가능** 모드가 나뉨.

근무그룹 그룹스케줄(`KB:product/admin-work-group.md` § "그룹스케줄")의 **개인화/예외 화면** 성격. **개인스케줄 > 그룹스케줄** 우선순위가 적용됨 (`KB:product/appl-other-forms.md` § 4 참고).

## 진입 위치

- 근무관리 GNB 탭 > 근무스케줄
- URL:
  - 메인: `/attendance/work_schedule_setting`
  - 수정 페이지: `/attendance/work_schedule_setting/edit`

## QA 체크리스트

`ppfront/.claude/qa-checklist/attendance.md` **L550 ~ L617** (68줄)

3개 서브 섹션:
1. **공통** + **내 기준 탭** (L552–564)
2. **역할 기준 탭** (L565–587, 미확정 스케줄 확정 흐름 포함)
3. **근무스케줄 수정 페이지** (L588–616, 가장 큼)

## 코드 위치

### ppfront

```
pages/attendance/work_schedule_setting/
├── index.tsx                                          ← 메인 페이지 (내 기준 + 역할 기준 탭)
└── edit/index.tsx                                     ← 수정 페이지 (별도 라우트)

components/attendance/work_schedule_setting/
├── index.tsx
└── contents/
    ├── styles.ts
    ├── CustomDatePicker.tsx
    ├── CustomMobileDatePicker.tsx
    ├── WorkScheduleTabSection.tsx                     ← 탭 컨테이너
    ├── my_tab/                                        ← 내 기준 탭
    │   └── ReadOnlyConfirmContent.tsx
    └── role_tab/                                      ← 역할 기준 탭
        └── ConfirmContent.tsx

components/attendance/work_schedule_setting/edit/
└── contents/
    ├── ScheduleSetting.tsx                            ← 스케줄 설정 UI
    ├── WorkSchedule.tsx                               ← 스케줄 표시
    └── RepeatScheduleModal.tsx                       ← 반복 스케줄 적용 모달

modules/attendance/work_schedule_setting.ts            ← Redux 모듈 (6.6KB, 큰 파일)
```

---

## § 1. 공통 + 내 기준 탭 (L552–564)

### 권한별 탭 표시

- **근무스케줄 수정 권한 없음** → **내 기준 탭만** 표시
- **근무스케줄 수정 권한 있음** → **내 기준, 역할 기준 탭** 모두 표시

### 데이터 그리드 헤더 표시

- **주말 = gray**
- **공휴일 = red**

### 내 기준 탭

**조회 단위**: 년/월 셀렉트 (월 단위)

**구성원 항목**: **사용자 본인만** 조회 + 본인 스케줄만

**템플릿 모아보기 셀렉트**:
- 선택한 템플릿이 아닌 셀은 **회색 처리** (강조 외 dim)

**스케줄 호버**:
- 마우스 오버 시 **근무스케줄명 툴팁**

---

## § 2. 역할 기준 탭 (L565–587)

**수정 권한자가 자신의 작성 권한 대상자들의 스케줄을 관리**.

### 조회 영역

**필터**:
- 년/월 셀렉트
- **근무그룹 셀렉트** → 선택 그룹의 구성원/스케줄 조회
- **템플릿 모아보기** → 동일 (회색 처리)

**구성원**: 작성 권한자가 **작성 권한이 있는 대상**만 조회

### 미확정 스케줄 마킹

근무그룹 셀렉트 내 미확정 스케줄이 있는 그룹:
- **그룹 색상 = 파란색**
- **(확정 필요) 텍스트** 부착

### 수정 진입

- **[수정] 버튼** → 수정 페이지로 이동
- 스케줄 호버 → 근무스케줄명 툴팁

### 미확정 스케줄 보기 모드

미확정 스케줄이 있으면 → **미확정 스케줄 보기 토글 버튼** 활성화

**ON으로 토글 시**:
- 미확정 스케줄만 강조 + datagrid 기본값 선택 상태
- 템플릿 모아보기 select **비활성화**
- **전체선택/확정 버튼** 노출

**확정 흐름**:
- 확정할 스케줄 없음 → **모달 표시 + 확정할 스케줄 있는 달로 자동 이동** (가장 오래된 달)
- 확정할 스케줄 있음 → **확정 필요 사원 우선 정렬** (기존 정렬 무시)

**전체선택 동작**:
- 클릭 시 전체 미확정 스케줄 선택/해제 토글

**개별 선택**:
- 미확정 스케줄 cell 클릭 → 해당 스케줄만 선택/해제

**확정/삭제 버튼**:
- 선택 개수가 **확정 버튼에 숫자로** 표기
- **확정 버튼**: 선택한 미확정 → 확정 스케줄로 변경 + 메인 페이지 이동
  - 다시 미확정 보기 진입 시 사라져있음
- **삭제 버튼**: 선택한 미확정 → 삭제 (확정 스케줄 변동 없음)

---

## § 3. 근무스케줄 수정 페이지 (L588–616) — 가장 복잡

URL: `/attendance/work_schedule_setting/edit`

### 화면 구성

- **왼쪽**: 대상자 리스트
- **캘린더 헤더**: 근무 계획 표시
- 대상자 필터: 조직, 성명

### 필터 동작

- 필터 입력 → 필터 대상의 계획만 캘린더 노출
- 필터 유지: **월 이동/계획 추가/삭제 시에도** 필터 유지

### 캘린더 선택 (3가지)

1. **요일 선택**: 캘린더 요일 헤더 클릭 → 해당 요일 선택
2. **기간 선택**: 다른 날을 두 번 클릭 → 기간 선택
3. **개별 선택**: 단일 셀 클릭

### 수정 데이터 유지

- **수정 후 다음 달/이전 달 이동 → 돌아오면 수정 데이터 유지**
- **저장 안 하고 페이지 나가면 → 수정한 내용 출력 안 됨**

### 페이지 이탈 경고

- 저장 없이 다음 행동 시 **경고창**:
  - 뒤로가기
  - 근무스케줄 외 다른 메뉴로 이동
  - 대상자 근무 그룹 변경

### 반복 스케줄 적용 ⭐

[반복 스케줄 적용] 버튼 → **반복 스케줄 적용 모달** (`RepeatScheduleModal.tsx`)
- 설정 후 [확인] 클릭
- 기간 내 **확정된 스케줄 있으면** → 확정 스케줄 개수 알림창
- [확인] → 반복 스케줄이 캘린더에 적용

### 캘린더 내부 리스트

- 4개 이상 시 **[더보기] 버튼** 표시
- 더보기 또는 리스트 클릭 → **선택 모달**
- 선택 모달 [취소] → 미반영
- 선택 모달 [확인] → 캘린더에 반영

### 보기 방식 2가지

- **구성원 기준** 보기
- **템플릿 기준** 보기

### 캘린더 조작

- 리스트의 **X 버튼** → 해당 리스트 제거
- 수정한 스케줄 있으면 **저장 버튼 활성화**
- 수정 후 원래 데이터로 되돌리면 **저장 버튼 비활성화**

### 소프트키 (가속 입력) ⭐

| 키 | 동작 |
|------|------|
| **숫자 키** (근무그룹 표시) | 구성원 + 날짜 선택 후 누르면 → 해당 근무 계획이 캘린더에 반영 |
| **Cmd + Z** | 최대 **10번**까지 수정 내역 되돌리기 |
| **Esc** | 캘린더 선택 해제 |

### 비우기 / 마감 / 저장

**[비우기] 버튼**: 선택된 날짜의 모든 근무 스케줄 삭제

**근무 마감 보호**:
- **기간 내 근무 마감된 구성원 포함** 시 → **저장 불가**
- `KB:product/admin-work-close.md` § "Cross-domain"의 마감 차단 일관 적용

**[저장] 버튼**:
- 클릭 → **확정 페이지로 이동** (미확정 스케줄 보기 체크된 상태)
- 저장 후 미확정 보기에서:
  - **추가/삭제의 확정을 기다리는 확정대기 스케줄이 있는 사원이 최상단** 정렬
  - 미확정 스케줄 정보는 수정 화면으로 돌아왔을 때 달력에 노출 안 됨 (= 확정 대기 중 = 별도 영역)

---

## ⭐ 근무 스케줄 / 그룹 스케줄의 관계

```
[어드민 근무그룹 설정 → 그룹스케줄 탭]              ← 그룹 단위 마스터
    KB:product/admin-work-group.md § 그룹스케줄
        ↓ (구성원 적용)
[근무스케줄 화면 (역할 기준 탭) - 권한자가 수정]    ← 본 화면 § 2-3
        ↓ (개인 스케줄로 저장)
[근무스케줄 화면 (내 기준 탭) - 본인 확인]         ← 본 화면 § 1
        ↓ (캘린더 반영)
[내 근무 캘린더 (WorkPlan 타입)]
    KB:product/user-my-work-calendar.md § Type 2: WorkPlan
```

### 개인스케줄 vs 그룹스케줄 우선순위

`KB:product/appl-other-forms.md` § 4에서 본 룰:
- **개인스케줄 > 그룹스케줄**
- 개인스케줄 있으면 그룹스케줄 변경해도 적용 안 됨

이 화면이 **개인스케줄을 만드는 진입점**.

### 미확정 스케줄 = 그룹스케줄의 임시저장과 유사

근무그룹 설정의 임시저장 패턴(`KB:product/admin-work-group.md` § "임시저장")과 동일한 메타 구조:
- 미확정 = 작성 중 / 수정 보류
- 확정 = 적용 (사용자에게 노출)

---

## Cross-domain 효과

| 동작 | 영향 |
|------|------|
| 수정 권한자가 스케줄 확정 | 해당 구성원의 내 근무 캘린더에 `WorkPlan` 표시 |
| 수정 권한자가 스케줄 삭제 | 해당 구성원의 미래 캘린더에서 `WorkPlan` 제거 |
| 반복 스케줄 적용 | 기간 내 확정 스케줄 충돌 시 알림 |
| 마감 일자 포함 수정 시도 | 저장 불가 (마감 차단) |
| 스케줄 변경 후 미저장 채로 페이지 이탈 | 경고창 + 데이터 유지 옵션 |
| 그룹스케줄 변경 (어드민) | 개인스케줄 있으면 미반영, 없으면 반영 |
| 근무계획 변경 신청서 (사용자) | 다른 워크플로우 — 결재선 통해 적용 |

## 비즈니스 룰

1. **권한 분기**:
   - 권한 없음 → 내 기준 탭만
   - 권한 있음 → 내 기준 + 역할 기준 + 수정 페이지
2. **개인스케줄 > 그룹스케줄 우선순위**
3. **미확정 스케줄 = 임시저장 상태** (확정 안 하면 사용자 캘린더 미반영)
4. **확정/삭제 분리**: 미확정 → 확정으로 추가 OR 미확정 → 삭제 (확정 스케줄 변동 X)
5. **마감일 포함 수정 불가**
6. **데이터 그리드 색상**: 주말 gray, 공휴일 red
7. **저장 안 한 채 페이지 이탈 → 경고창 + 미저장 데이터 소실**
8. **반복 스케줄 적용 시 확정 스케줄 충돌 알림**
9. **소프트키로 빠른 입력**:
   - 숫자 키 = 근무그룹 단축 입력
   - Cmd+Z 10회 = 되돌리기
   - Esc = 선택 해제
10. **확정 후 정렬**: 확정 대기 사원이 최상단 (운영 효율)

## 근무템플릿 정렬 순서 ✅ (2026-06-19 백엔드 코드 검증, 인스파이어 고객사 문의)

**결론: 템플릿 정렬 순서의 명시적 기준이 없음 = 사실상 "랜덤 UUID 순서".** 백엔드 쿼리에 `ORDER BY`가 없어서 MySQL(InnoDB)이 드라이빙 테이블의 PK(클러스터드 인덱스) 순서로 반환하는데, 그 PK가 전부 랜덤 UUID라 결과는 UUID 문자열 사전순(=임의)으로 나옴.

- 템플릿 PK `DD_WORK_PLAN_ID` = `UuidUtil.generateString()` (`be:DdWorkPlanSettingService.java:232`)
- 매핑 PK `WORK_GRP_DD_WORK_PLAN_ID` = `UuidUtil.generateString()` (`be:WorkGrpSettingService.java:1494`)
- DB = MySQL (`application-backend.yml`). `UuidUtil`은 랜덤 UUID (별도로 시간정렬 `TsidUtil`이 존재 → UuidUtil은 비-시간정렬).
- ⚠️ **"추가(INSERT) 순서"가 아님** — UUID가 난수라 새 템플릿은 목록 맨 끝이 아니라 임의 위치에 끼어듦. (이전 버전 KB의 "INSERT 순서" 서술은 오류, 2026-06-19 정정.)
- 각 행 UUID는 고정 → 구성 불변 시 순서는 안정적이나 의미는 임의.

- 사용자 스케줄 편집 템플릿 picker: `be:SQL/time/workschedule/PersonalWorkScheduleSettingMapper.xml:254` `getDdWorkPlansByWorkGrp` → **ORDER BY 없음**.
- 어드민 근무그룹 그룹스케줄 템플릿 목록: `be:SQL/time/setting/WorkGrpSettingMapper.xml:377` `getWorkGrpDdWorkPlansByWorkGrpId` → **ORDER BY 없음**.
- → 어드민/사용자 순서가 동일하게 보이는 이유 = 둘 다 같은 매핑 테이블(`TM_WORK_GRP_DD_WORK_PLAN`)을 정렬 없이 조회하기 때문.
- 템플릿 모아보기(필터): `be:SQL/time/me/WorkFilterOptionsMapper.xml:95` `getWorkPlans` → `ORDER BY DD_WORK_PLAN_ID, WORK_GRP_ID` (ID순. 이건 별개 경로).

**순서 변경 / 시간순 정렬: 현재 불가.**
- 템플릿 테이블(`TM_DD_WORK_PLAN`, `TM_WORK_GRP_DD_WORK_PLAN`)에 정렬용 컬럼(`ORDER_NO` 등) **없음** (`DdWorkPlanVo`/`WorkGrpDdWorkPlanVo` 확인). 사용자/어드민이 순서를 지정할 수단 자체가 없음.
- 어드민에 reorder UI/엔드포인트 없음.
- 시간순 정렬을 하려면 백엔드 쿼리에 `ORDER BY T1.WORK_STA_HM` 추가하는 **코드 수정 필요** (`WORK_STA_HM` 컬럼은 존재). 프론트 측 sort도 없음.

**프론트 측 검증 (어드민 그룹스케줄 탭):**
- 목록 fetch: `loadWorkGroupWorkTemplateList` → `GET /time/work-grps/{workGrpId}/dd-work-plans` → BE `getWorkGrpDdWorkPlanList` → `getWorkGrpDdWorkPlansByWorkGrpId` (ORDER BY 없음). 응답 `workGrpDdWorkPlanVoList`를 그대로 `setWorkTemplateList`에 넣음 — **프론트 sort 없음** (`ad:group_schedule_setting_tab/index.tsx:366`).
- 표시: `WorkTemplateList` DataGrid `rowData={workTemplateList}` 그대로 렌더 — sort 없음 (`ad:components/attendance/shared/work_template/WorkTemplateList.tsx`).
- 추가: "전체목록에서 추가" `createMappedWorkTemplate`(POST `/dd-work-plans`) / "새 템플릿" `createNewWorkTemplate`(POST `/dd-work-plan`) → `TM_WORK_GRP_DD_WORK_PLAN`에 INSERT (랜덤 UUID PK 부여). INSERT 시점과 표시 위치는 무관.
- → 어드민/사용자 모두 정렬 로직 없음. 표시 순서 = 백엔드가 UUID PK 순으로 반환한 순서. 둘이 동일하게 보이는 것은 같은 템플릿 UUID에 좌우되는 것일 뿐 보장된 동작 아님.

> ⚠️ ORDER BY 부재 = MySQL 실행계획/PK(UUID) 순서에 의존. UUID는 난수라 순서가 임의이고, 데이터·DB버전·실행계획에 따라 달라질 수 있음 (잠재 리스크).

## 알려진 제약 / 임시 동작

- 수정 페이지의 캘린더 내부 리스트 4개 초과 시 더보기 (UI 제약)
- Cmd+Z **최대 10번**만 되돌리기 (메모리 제약)

## 검증 / [TBD]

- [ ] 백엔드 API endpoints (work-schedule-setting 관련)
- [ ] 권한 체크 메커니즘 (`KB:product/admin-work-group.md` § "권한"과의 연결)
- [ ] 미확정 스케줄의 DB 저장 방식 (별도 테이블? flag?)
- [ ] 소프트키 숫자 키의 정확한 동작 (어떤 그룹 단축?)
- [ ] 반복 스케줄 적용 모달의 정확한 옵션 (요일/기간 단위?)
- [ ] 수정 페이지의 캘린더 시각화 라이브러리

## 두현님께 질문 (선택)

1. **소프트키 숫자 키 단축**이 익숙한 직책자에게 잘 알려져 있나요? (사용성)
2. **Cmd+Z 10번 제한**의 이유 — 의도된 디자인? 향후 늘릴 계획?
3. **미확정 스케줄 vs 확정 스케줄의 DB 저장** — 별도 테이블, 별도 row, 또는 flag?

## 관련 문서

- `KB:product/admin-work-group.md` § "그룹스케줄 탭" — 그룹 단위 스케줄 (이 화면이 개인화)
- `KB:product/appl-other-forms.md` § 4 (근무계획 변경) — 개인스케줄 > 그룹스케줄 우선순위
- `KB:product/user-my-work-calendar.md` § "Type 2: WorkPlan" — 확정 스케줄이 캘린더에 표시되는 흐름
- `KB:product/admin-work-close.md` — 마감 차단
- `KB:product/admin-work-setting.md` § 4 — 근무 템플릿 (스케줄에서 선택하는 옵션)
