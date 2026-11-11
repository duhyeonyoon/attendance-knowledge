# 사용자 작은 화면 묶음 (U5 + U12 + U13)

## 개요

각 영역이 작아서 묶어 정리:

| 영역 | 화면 | QA 라인 | 크기 |
|------|------|------|------|
| **U5** | 근무 현황 (통합홈 내 일부) | `pp-qa:L167–176` | 10줄 |
| **U12** | 위치정보 제공 조회 | `pp-qa:L618–634` | 17줄 |
| **U13** | 연차촉진 (사용자) | `pp-qa:L635–652` | 18줄 |

---

## § U5. 근무 현황 (L167–176)

### 위치

**통합홈 내 위젯**으로 등장 (별도 페이지 아님). `KB:product/user-home-and-dashboards.md` § U1과 일부 중복되지만 QA에서 별도 섹션으로 다룸.

### 동작

- **근무 현황 리스트** 확인 가능
- **출근 완료 시** → 본인 상태가 **'근무중'으로 변경**
- **조직/사람 검색**으로 구성원 리스트 추가/수정/삭제
  - 본인 소속 회사 하위 조직/구성원만
  - **2025.04.17 임시 제약** (회사-조직 릴레이션 고도화 전): 소속 구성원 있는 조직만 리스팅
- **상위 조직 필터링** → 하위 조직 인원의 근무 상태도 표시
- **출근/퇴근 이후 근무 현황 자동 새로고침**

### Cross-link

- `KB:product/user-home-and-dashboards.md` § U1 — 통합홈의 근무 현황 위젯 (모바일/웹 표시 룰)
- `KB:product/user-checkin-widget.md` — 출퇴근 위젯과 직접 연동 (출근/퇴근 → 근무현황 갱신)

---

## § U12. 위치정보 제공 조회 (L618–634)

### 진입 위치

- `pp:src/pages/attendance/location_access_logs/index.tsx`
- 페이지: 위치정보 제공 조회

### 코드

```
pages/attendance/location_access_logs/index.tsx
components/attendance/location_access_logs/contents/
containers/attendance/location_access_logs/
```

### 핵심 개념

**개인정보 보호 컴플라이언스 화면.** 타인이 본인의 위치를 조회한 이력을 확인할 수 있는 화면. **GDPR/개인정보보호법 대응** 성격.

### 전제 조건

> 다음 조건 모두 만족해야 로그가 쌓임:
> - **타인이 내 위치를 조회**
> - **위치 정보가 있는** 경우 (없으면 조회를 해도 로그 X)

### 로그가 쌓이는 케이스

근무지 외 출퇴근 신청 → 타인이 승인/참조로 문서 확인 시:
- **워크플로우 > 받은 문서함**
- **근무관리 > 구성원 근무 > 요청 모아보기**

→ 신청한 계정의 **위치정보 제공 조회 화면**에 로그 쌓임

### 로그가 쌓이지 않는 케이스

- 브라우저 위치 허용 거부 + 위치 정보 없음 상태로 근무지 외 출퇴근 신청 → 타인이 확인해도 **로그 안 쌓임**

### 화면 동작

- **셀렉트 필터** → 조건 데이터만 표시
- 테이블 페이지네이션

### Cross-domain

- `KB:product/user-checkin-widget.md` — 위치 정보 생성 (`gpsConfCd`, 하버사인 GPS 검증)
- `KB:product/user-member-view.md` § "요청 모아보기" — **3개월 이내만 위치 확인** 룰 ↔ 본 화면의 로그 보존 정책 [TBD]
- 위치 조회 = 본 화면 로그 + 매니저 화면 위치 확인 (양쪽)

### 비즈니스 룰

1. **로그 트리거 조건**: (타인 조회) + (위치 정보 있음) 둘 다
2. **위치 정보 없는 경우 로그 X**: 방문 자체를 기록 안 함 (조회 시도 자체는 로그 안 됨)
3. **셀렉트 필터 + 페이지네이션** (표준 패턴)

### [TBD]
- 백엔드 API endpoint
- 로그 보존 기간 (매니저 화면의 3개월 룰과 일치하는지?)
- 어떤 종류의 조회 액션이 로그에 기록되는지 (단순 클릭 vs 위치 보기 버튼?)

---

## § U13. 연차촉진 (사용자, L635–652)

### 진입 위치

- `pp:src/pages/attendance/annual_leave_encouragement/index.tsx`

### 코드

```
pages/attendance/annual_leave_encouragement/index.tsx

components/attendance/annual_leave_encouragement/
├── index.tsx
└── contents/
    ├── Header.tsx
    ├── Content.tsx
    ├── FilterSection.tsx
    ├── PlanList.tsx
    ├── PlanItem.tsx
    ├── DocumentItem.tsx
    ├── DocumentStatusChip.tsx
    └── annual_leave_encouragement_plan_dialog/      ← 연차 계획 작성 다이얼로그
        ├── index.tsx
        ├── AnnualLeaveEncouragementPlanSection.tsx
        ├── AnnualLeaveEncouragementPlanItemWrapper.tsx
        └── AnnualLeaveEncouragementPlanItem.tsx

modules/attendance/annual_leave_encouragement.ts        ← Redux 모듈
```

### 어드민 측과의 짝

`KB:product/leave-domain.md` § C-5 (어드민 연차촉진)에서 정의한 워크플로우의 **사용자 측**.

```
[어드민이 연차촉진 작업 생성]
   ↓ (대상자로 지정된 경우)
[사용자에게 미사용 연차 통지서 발송]
   ↓ 본 화면에서 조회/서명
[연차 계획서 작성]
   ↓ 본 화면에서 작성/확정
[어드민이 사용시기 지정 통보 (선택)]
   ↓ 본 화면에서 통보 문서 + 알림 팝업
```

### 임시 동작

> **2025년 7월 9일 기준**: 연차촉진은 작업 삭제 기능 없음 (확인됨, 추가 계획 없음).
> **휴먼컨설팅그룹 클라이언트는 연차촉진 프로덕션 체크리스트 진행 안 함.**

### 사용자 측 동작 흐름

#### 1단계: 그룹 표시

- **어드민에서 연차촉진 그룹 생성 시** → 상단 셀렉트에 노출
- 사용자가 셀렉트로 자신이 속한 연차촉진 그룹 선택

#### 2단계: 미사용 연차 통지서 (어드민이 통지 실행 후)

- **미사용 연차 통지 문서 조회** + **서명(제출)**

#### 3단계: 연차 계획서 작성

- 미사용 연차 통지 서명 후 → **연차 계획서 작성 문서** 노출
- **연차 계획서 미작성 상태 + 클릭** → 연차 계획 작성 다이얼로그 (`annual_leave_encouragement_plan_dialog/`)
- **계획서 확정** → 연차 사용 계획에 작성한 계획 표시
- 확정 후 → 연차 계획서 작성 문서 **조회 + 서명** 가능

#### 4단계 (선택): 사용시기 지정 및 통보 (어드민 측)

어드민이 사용시기 지정 통보 실행 시:
- **사용시기 지정 통보 문서** 노출
- **연차 사용 계획에 어드민이 지정한 계획 표시**
- **유저 화면에서 통보 날짜에 통보 알림 팝업**
  - **확인 누르기 전까지 다른 웹페이지 요소 클릭 불가** (강제 모달)

### 노무수령거부 팝업 (이전 deep-dive)

`KB:product/leave-domain.md` § C-5의 노무수령거부 팝업 노출 조건이 사용자 측 본 화면과 연계 (4가지 조건):
- 공통: 전체 알림 ON + 일반 알림 ON + 노무수령거부 상세 알림 ON + 당일 미동의
- 웹/앱 알림 분기

### Cross-domain 효과

| 동작 | 영향 |
|------|------|
| 어드민 연차촉진 작업 생성 | 사용자 셀렉트에 그룹 노출 |
| 어드민 통지 실행 | 사용자에게 미사용 연차 통지 문서 + 알림 |
| 사용자 연차 계획서 확정 | 어드민 연차촉진 상세에서 계획서 열람 가능 |
| 사용자 연차 사용 (지정 일자) | 어드민 노무수령거부 현황 탭에서 "O" |
| 어드민 사용시기 지정 통보 | 사용자에게 통보 문서 + 강제 알림 팝업 |
| 노무수령거부 알림 ON 사용자 | 지정 연차일 미사용 시 팝업 + 동의 시 시간 기록 |

### 비즈니스 룰

1. **사용자 측은 어드민이 트리거하는 것에 반응**: 통지 수신 → 서명 → 계획 작성 → 확정 → 통보 수신
2. **계획서 확정 전까지** 연차 계획 수정 가능
3. **사용시기 지정 통보 알림 팝업**: **강제 모달** (확인 전 다른 작업 불가)
4. **연차 사용 여부는 연차에만 카운트** (`leave-domain.md` § C-5와 일관)
5. **노무수령거부 팝업** 4가지 조건 (`leave-domain.md` § C-5)

### [TBD]
- 미사용 연차 통지서/연차 계획서/사용시기 지정 통보 문서의 백엔드 API
- 강제 모달의 정확한 구현 (다른 페이지 요소 차단 메커니즘)
- 휴먼컨설팅그룹 제외 이유 (이전 deep-dive에서도 [TBD])

---

## 관련 문서

- `KB:product/user-home-and-dashboards.md` § U1 — 통합홈의 근무 현황 위젯 (U5와 중복)
- `KB:product/user-checkin-widget.md` — 위치 정보 생성 (U12 로그 트리거)
- `KB:product/user-member-view.md` § "요청 모아보기" — 위치 확인 3개월 룰 (U12와 연결)
- `KB:product/leave-domain.md` § C-5 — 어드민 연차촉진 (U13의 어드민 측)
- `KB:product/admin-system-entry.md` — 알림 설정 권한
