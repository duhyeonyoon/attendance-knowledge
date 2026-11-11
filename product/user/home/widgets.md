---
sidebar:
  order: 4
---

# 통합홈 기타 위젯 (워크플로우·근무 대시보드·예정 휴가·구성원 휴가)

> **메뉴** 통합홈 › 처리할 문서 · 근무 대시보드(평균 근무시간 등) · 예정 휴가 · 구성원 휴가  
> **원본** `product/_legacy/user-home-and-dashboards.md`

## 개요

사용자 첫 진입 화면(통합홈)의 위젯들 + 어드민 근무 대시보드를 하나로 묶어 정리. 모두 **데이터 요약/모니터링 화면**이라는 공통점.

| 영역 | 화면 | 진입 |
|------|------|------|
| **U1** | 통합홈 (사용자) — 공통/워크플로우/근무 대시보드/예정휴가/구성원 휴가 | 사용자 첫 진입 |
| **U2** | 근무 요약 정보 위젯 (통합홈 + 내 근무 양쪽 표시) | 통합홈 내 또는 내 근무 |
| **#10** | 근무 대시보드 (어드민) | 어드민 메뉴: 근무관리 > 근무 대시보드 |

## QA 체크리스트

- **U1 통합홈**: `pp-qa:L1–51` (51줄, 6개 서브섹션)
- **U2 근무 요약 정보**: `pp-qa:L52–68` (17줄)
- **#10 근무 대시보드 (어드민)**: `ad-qa:L754–767` (14줄)

## 코드 위치

### ppfront 통합홈

```
pages/main/                                                ← 메인 페이지 진입점
└── mainDashboardSetting/                                   ← 대시보드 설정 페이지

containers/main/
├── index.tsx                                               ← 메인 컨테이너
├── Notice.tsx                                              ← 공지
├── AcceptTerms.tsx + AcceptTermsLocationDetailDialog.tsx   ← 약관 동의
├── MainDashboardSetting.tsx                                ← 대시보드 위젯 위치/표시 설정
└── summary_contents/                                       ← 요약 위젯들
    ├── ContentHeader.tsx
    ├── RecentActivityList.tsx
    ├── PendingObjectiveSummary.tsx
    ├── ObjectiveSummary.tsx
    └── MultiSourceFeedbackSummary.tsx

components/main/
├── work_status/WorkSummaryContents.tsx                     ← 근무 요약 표시
├── work_commute/                                           ← 출퇴근 위젯 (이미 deep-dive)
├── accept_terms/                                           ← 약관
└── dashboard_settings/                                     ← 대시보드 설정
    ├── DashboardSettingTabs.tsx
    └── DashboardPositionSetting.tsx
```

*원본 섹션: § U1. 통합홈 (사용자 첫 진입 화면)*

QA L1–51. 6개 서브섹션 + 출퇴근 위젯(이미 deep-dive)이 통합홈에 포함됨.

## U1-1. 공통 (L3–9)

리스트 표시 룰:
- **문서/예정 휴가 리스트**: 3개씩 + [더 보기] 버튼
- **근무현황/구성원 휴가 현황 리스트**: 웹은 스크롤 / **모바일은 5개씩**
- 모바일 근무현황 아코디언: **접힌 채로** (구성원 휴가 현황은 펼친 채로)
- 근무현황 리스트 돋보기 → 구성원 이름 검색
- 모바일 스크롤 시 우측 하단 `scrollToTop` 버튼

## U1-2. 워크플로우 (L11–24)

**처리할 문서 위젯**:
- 홈 접속 시 받은 문서 있으면 위젯 표시 (없으면 숨김)
- **2개 탭**: 승인필요 / 읽지않음
  - 탭 변경 시 스켈레톤 표시
  - **승인필요 문서는 읽지 않음 문서에 포함되지 않음**
- 문서 클릭 → drawer 오픈 → 승인/반려/취소 액션
- 액션 후 리스트 자동 갱신
- [더 보기] 버튼
- 타이틀 클릭 → 워크플로우 화면 이동

**알림 연계**:
- 요청 시 → 승인자에게 talenx 알림
- 승인/반려 시 → 작성자에게
- 코멘트 시 → 작성자 + 승인자 모두에게 (코멘트 작성자 제외)
- 통합알림 설정에서 off 가능 (프로필 - 계정설정 - 알림설정)

**연계 메뉴**:
- 근무/휴가 요청 → 승인자의 **구성원 근무 메뉴**에서 승인할 문서 조회
- 휴가 요청 → 승인자의 **구성원 휴가 메뉴**에서 휴가 문서 조회

## U1-3. 근무 대시보드 (사용자, L26–29)

**숫자 카드 클릭 → 근무정보 페이지로 이동**:

| 카드 | 항상 클릭 가능? |
|------|------|
| 평균 근무시간 | ✅ |
| 평균 출근시간 | ✅ |
| 평균 퇴근시간 | ✅ |
| 휴가 사용일 | 0이 아닐 때만 |
| 휴일 근무일 | 0이 아닐 때만 |
| 근무기록 누락일 | 0이 아닐 때만 |
| 지각 횟수 | 0이 아닐 때만 |
| 조퇴 횟수 | 0이 아닐 때만 |

## U1-4. 예정 휴가 (L31–40)

- 타이틀 클릭 → **내 휴가 페이지** 이동
- 리스트 항목 클릭 → drawer
- drawer에서 휴가 취소/승인 등 상태 변경 → 리스트 즉시 반영
- **관리자 등록 휴가** → 신청서 아닌 **별도 확인 모달** (모바일은 바텀드로워)
  - 출처: 어드민 > 휴가 지급 및 관리 > 연차 사용 현황탭 > 연차 수동등록
- 타이틀 옆 [휴가 신청] 버튼 → 휴가 신청 drawer

`KB:product/user/attendance/my-leave.md` § D 와 cross-link.

## U1-5. 구성원 휴가 (L42–50)

- 타이틀 클릭 → **구성원 휴가 페이지** 이동
- 주간 구성원 휴가 리스트 표시
- [설정] → 조직/사람 검색으로 구성원 리스트 추가/수정/삭제
  - **본인 소속 회사 하위의 조직/구성원만** 조회
  - **2025.04.17 기준** 임시 동작: 조직은 소속 구성원 있는 조직만 리스팅 (회사-조직 릴레이션 고도화 전까지)
- 상위 조직 필터링 시 하위 조직 인원 상태도 확인
- 날짜 클릭 → 설정한 휴가자 리스트 로드

## U1-6. 출퇴근 위젯

`KB:product/user/home/checkin-widget.md` 참조 (가장 큰 위젯). 통합홈에 포함되지만 별도 deep-dive 완료.

## Cross-domain 효과

| 동작 | 영향 |
|------|------|
| 사용자 통합홈 진입 | 처리할 문서/예정 휴가/구성원 휴가/근무 대시보드 데이터 동시 fetch |
| 통합홈 워크플로우 처리 (승인/반려) | 작성자에게 알림 + 다른 화면(내 근무/캘린더) 갱신 |
| 통합홈 예정 휴가 취소/승인 | 캘린더 즉시 반영 + 휴가 잔여 변동 |
| 어드민 근무 누락 알림 발송 | 사용자에게 알림 + 동시 변경신청 시 제외 처리 |
| 사용자 근무 요약 정보 기간 변경 | 통합홈 + 내 근무 양쪽 위젯 갱신 |
| 사용자 대시보드 카드 클릭 | 근무정보 페이지 이동 (다른 deep-dive 영역) |

## 비즈니스 룰

1. **3개 vs 5개 리스트 표시**: 문서/예정휴가 = 3개씩, 근무현황/구성원휴가 = 모바일 5개씩
2. **모바일 아코디언 기본 상태**: 근무현황 = 접힘, 구성원 휴가 현황 = 펼침
3. **승인필요 ≠ 읽지않음**: 두 탭이 배타 (승인필요는 읽지않음에 포함 X)
4. **숫자 카드 0 클릭 불가**: 카운트가 0인 카드는 비활성 (의미 없는 이동 방지)
5. **관리자 등록 휴가** → 신청서가 아닌 별도 확인 모달 (`AdminDirectLeaveDialog`)
6. **본인 소속 회사 한정 조회** (구성원 휴가 설정)
7. **회사-조직 릴레이션 임시 제약** (2025.04.17 기준) — 소속 구성원 있는 조직만 리스팅
8. **최소 근무시간 표시 = 엑셀세라퓨틱스 커스텀** (덤프 전용 테스트)
9. **어드민 누락 알림 = 조건 3개 만족** (누락 상태 + 미발송 + 변경 신청 없음)
10. **누락 알림 동시 변경 시나리오** → 모달로 해당 구성원 제외 처리

## 알려진 제약 / 임시 동작

- 회사-조직 릴레이션 고도화 전까지 임시 제약 (2025.04.17 기준)
- 최소 근무시간 표시 = 엑셀세라퓨틱스 단일 고객사 커스텀, 덤프 환경 한정
- 어드민 근무 대시보드는 **기간 선택 불가** (단일 일자만)

## 검증 / [TBD]

- [ ] 어드민 근무 대시보드의 정확한 컬럼 구성 (2026-11-05 Slack 검색: 컬럼 확정 논의 없음. #bizops-center 2026-09-17 "비활성 인원 배지·활성 여부 컬럼" 질의만 있음 → `KB:product/admin/work/dashboard.md` 담당)
- [ ] 누락 알림 발송 시점 (즉시 vs 큐?) (2026-11-05 Slack 검색: 발송 시점 논의 없음. 어드민 알림 발송 설정 ON/OFF가 어드민 액션 알림 생성 여부를 제어한다는 일반 설명만 있음 — #cx 2026-10-08)

**(2026-11-05 해소)**
- ✅ 통합홈 위젯 트리 — `pp:src/containers/main/index.tsx`가 탭별 대시보드 설정(`webWidgetMenus` LEFT/RIGHT, `mobileWidgetMenus`)을 받아 위젯 타입별로 렌더. 좌측 `renderHomeLeftWidget`: `processing_documents`(처리할 문서) · `work_detail`(이번달 근무 현황 = `components/main/work_detail/WorkSummaryDashBoard.tsx`) · `leave_plan` · `my_objectives` · `approve_objectives` · `feedbacks` · `multisource_feedbacks` · `notice` 등. 우측 `renderHomeRightWidget`: `work_commute`(출퇴근 위젯) · `team_leave`(구성원 휴가) · `work_status`(근무 현황 상세 = 근무 요약 정보 위젯 `WorkSummaryContents`, **근무시간 비공개(`workTimeVisibleCd=DENIED`) 그룹이면 미노출**)
- ✅ 근무 요약 정보 위젯 API — `GET /time/members/me/work-time-summary?staYmd&endYmd` (구성원 대상: `/time/members/{memberId}/work-time-summary`). → `KB:product/user/home/work-summary.md`
- ✅ `MemberSummary.tsx` — 근무 정보 상세 페이지(`/attendance/work_info`, `type=member|manager`)에서만 사용. 통합홈 위젯은 공용 `components/attendance/shared/work_summary/WorkSummaryWidget.tsx` 사용
- ✅ 대시보드 설정 — 통합홈 헤더의 **[대시보드 설정]** 버튼 → `/workspaces/:workspaceId/mainDashboard` (`pp:src/containers/main/MainDashboardSetting.tsx`). 탭(대시보드)별로 위젯 사용 여부·위치(웹 좌/우, 모바일 순서 별도 커스텀)를 설정하고 [저장] (`sortMainDashboardWidget`, `OPTIMIZ_SYSTEM_API`). 위젯이 하나도 없으면 저장 시 경고. 위젯 이름/설명은 `pp:src/locales/ko/sharedFunction.json` `mainDashboard` (예: "이번달 근무 현황", "출퇴근", "근무 현황 상세")
- ✅ 근무 대시보드(사용자, `work_detail`) 카드 집계 기간 — **이번 달** 고정 (`loadMemberWorkInfo({periodType:"MONTH"})`, `WorkSummaryDashBoard.tsx:725`)

## 두현님께 질문 (선택)

1. ~~위젯 커스터마이징 가능 여부~~ → 가능 ([대시보드 설정], 2026-11-05 코드 확인).
   - [x] ~~설정이 사용자 개인별인지 회사 공통인지~~ → **(2026-11-05 Slack 확인) 회사(고객사) 단위로 모드를 정함.** 어드민 > 홈 설정 > **홈 대시보드 설정**에서 ① **기본 설정**(고객사 공통, 오너·시스템 관리자만 수정) ② **회사별 설정** — 회사마다 `어드민 일괄 설정`(관리자가 정한 위젯 구성을 전 구성원에게 적용, 개인 편집 제한) / `구성원 직접 설정`(구성원이 통합홈 [대시보드 설정]으로 개인 편집) / `기본 설정 따름` 중 선택. 회사별 설정은 2026-10 프로덕션 오픈, 서브어드민 '홈 대시보드 설정' 권한은 talenx-admin#4627(2026-10-26)로 추가 — Slack #cx 2026-10-21 (https://hcgtheplus.slack.com/archives/C01AVJ2CJBW/p1792569797607629?thread_ts=1792458834.345299&cid=C01AVJ2CJBW), #github-talenx-admin 2026-10-26 (https://hcgtheplus.slack.com/archives/C05HD5UGV4M/p1792986578757019), #sq-core 2026-08-11 체크리스트 "구성원 직접 설정으로 지정할 수 있다 / 어드민 일괄 설정으로 지정할 수 있다". 메뉴(모듈) 미사용 시 해당 위젯은 숨김. 개인 설정 저장 데이터는 어드민 설정 변경 시 갱신 이슈 있었음(#sq-core 2026-08-21)
2. 어드민 근무 대시보드는 **기간 단위 통계 없이 일별만** 보이는 게 의도된 디자인인가요? (월/주 단위는 다른 화면에서?)
3. **엑셀세라퓨틱스 외 다른 클라이언트도** 최소 근무시간 요청 가능성이 있는지?

## 관련 문서

- `KB:product/user/home/checkin-widget.md` — 통합홈의 출퇴근 위젯
- `KB:product/user/attendance/my-work.md` — 내 근무 캘린더 (근무 요약 정보 양쪽 표시)
- `KB:product/user/attendance/my-leave.md` § D — 예정 휴가 / 관리자 등록 휴가
- `KB:product/admin/work/check-work-data.md` — 근무 누락 데이터 (어드민 다른 화면)
- `KB:product/admin/work/base-setting.md` § 1 — 한 주의 시작 요일 (기간 단위 설정 기준)
