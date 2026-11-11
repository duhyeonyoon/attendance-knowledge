---
sidebar:
  order: 3
---

# 근무 요약 정보 위젯

> **메뉴** 통합홈 › 기간 근무시간 요약 카드 (실근무 / 소정근무 / 잔여근무)  
> **원본** `product/_legacy/user-home-and-dashboards.md`

## 코드 위치

### ppfront 근무 요약 정보 (U2 위젯)

> **(2026-11-05 확인)** 위젯 본체는 공용 컴포넌트 `pp:src/components/attendance/shared/work_summary/WorkSummaryWidget.tsx`. 사용처 3곳: 통합홈 우측 `components/main/work_status/WorkSummaryContents.tsx`(위젯명 "근무 현황 상세", 근무시간 비공개 그룹이면 미노출) · 내 근무 `components/attendance/personal_work/index.tsx` · 근무 정보 상세 페이지 `components/attendance/work_info/index.tsx`.
> 아래 `work_info/` 트리는 **근무 정보 상세 페이지**(`/attendance/work_info`, `type=member|manager`) 쪽 코드.

```
components/attendance/work_info/
├── index.tsx                                               ← 진입점
└── contents/
    ├── Header.tsx                                          ← 헤더 (제목, 설정 버튼)
    ├── Content.tsx                                         ← 본문
    ├── WorkTimeSummary.tsx                                 ← 실근무/소정/잔여 표시
    ├── WorkInfoCard.tsx                                    ← 카드 UI
    └── MemberSummary.tsx                                   ← 구성원 요약 (근무 정보 상세 페이지 전용, member/manager 양쪽)

pages/attendance/work_info/index.tsx                        ← 별도 페이지로도 존재
```

*원본 섹션: § U2. 근무 요약 정보 위젯 (사용자)*

QA L52–68. 통합홈 + 내 근무 양쪽에 표시되는 위젯.

## 핵심 표시

- **실근무 / 소정근무 / 잔여근무** 표시
- Info(?) 아이콘 → 설명 툴팁

## 기간 단위 설정

- **홈화면**: [설정] 버튼으로 기간 단위 모달
- **근무관리 > 내근무 화면**: 케밥 메뉴 버튼으로 모달

**옵션**: 월단위 / 주단위 (모달 "기간단위 설정" — "근무 현황 상세 위젯에 집계하는 기간 단위를 설정합니다.", 저장 시 "근무 요약 기간 단위 설정을 변경했습니다.")
- 즉각 반영
- **사용자 개인 설정으로 저장** (`timeModuleUser.preference.workDetailViewPeriodUnit`, 기본 `MONTH`) → 통합홈·내 근무 위젯이 같은 값을 씀
- 위젯 내 이전/다음/오늘 이동으로 기간 이동 (`usePeriodNavigation`)
- 주 단위 조회 시: 어드민 근무관리 > 근무 설정 > 시간 조회 탭의 **한 주의 시작 요일** 기준
  - 회사별 설정 우선, 예외 없으면 클라이언트 기본 설정 적용
  - `KB:product/admin/work/base-setting.md` § 1 참조

## 최소 근무시간 표시 (엑셀세라퓨틱스 커스텀)

**덤프 환경에서만 테스트** 가능.

- 설정된 최소근무시간 값 있으면 위젯에 **'소정 근무시간' / '최소 근무시간' 탭** 등장
- 소정 근무시간 탭: 실근무/소정근무/잔여근무 (기본)
- **최소 근무시간 탭**: 실근무 정보만 + 그래프 기준이 최소근무 시간

> 또 하나의 클라이언트 특화 기능. `workTimeVisibleCd === "DENIED"` (`KB:product/user/home/checkin-widget.md`)와 비슷한 패턴 — 특정 고객사의 별도 요구사항.

## 백엔드 데이터

- 메인 렌더링: `WorkSummaryWidget.tsx` (근무정보 상세 페이지 · 이번달 근무 현황 대시보드는 `work_info/contents/WorkTimeSummary.tsx`)
- API ~~[TBD]~~ → **(2026-11-05 해소)** `GET /time/members/me/work-time-summary?staYmd&endYmd` (본인), `GET /time/members/{memberId}/work-time-summary?staYmd&endYmd` (구성원 대상) — `pp:src/modules/attendance/work_info.ts:93-129`, `pp:src/config/api.js:730-731`
- 데이터: ~~정산기간 기준~~ → **선택한 기간(월/주의 staYmd~endYmd) 기준** 요약. 응답 `WorkTimeSummaryResponse`:
  - `prescribed` 소정: 소정근로일 · 소정근로시간 · 최대근로시간
  - `actual` 실근무: 근무일 · 근무시간 · 기타 근무시간 · 휴가사용 · 인정 근무시간(`totalWorkMinutes`) · 연장/야간/휴일 근무시간
  - `remaining` 잔여: 잔여 근무일 · 잔여 소정근로시간 · 잔여 최대근로시간
  - `displayOptions` 최소근무시간 탭 노출 여부·값
- 화면 라벨 (`pp:src/locales/ko/attendance.json` `WORK_INFO.*`): 근무일, 근무시간, 기타 근무시간, 인정 근무시간, 휴가사용, 휴일 근무시간, 연장 근무시간, 야간 근무시간, 소정근로일, 소정근로시간, 최대근로시간, 잔여 근무일, 잔여 소정근로시간, 잔여 최대근로시간 / 탭 "소정 근무시간"·"최소 근무시간"
- [x] ~~각 수치의 백엔드 산정식 (특히 기간 경계가 정산기간과 어긋날 때 소정·최대근로시간 안분 방식)~~ → **(2026-11-05 Slack + 코드 확인) 정산기간과 무관하게 "선택 기간" 자체로 계산(안분 없음).** `be:pojo/worktimesummary/PrescribedWorkCalculator#calculateAll` — 선택 기간을 근무그룹 소속 구간별로 나눠 합산:
  - **소정근로시간**: 그룹의 소정근로시간 기준이 '법적 기준(LEGAL_CALENDAR_BASED)'이면 `주 40h ÷ 7 × 구간 달력일수`, 그 외(근무 계획 기준)는 구간 내 근무일 계획(`WORK_TIME_CD`) 합
  - **최대근로시간**: 항상 `주 52h ÷ 7 × 구간 달력일수` (`TimeServiceUtil#calculateCalcCycleLegalContractedWorkingTime`, 소수 1자리 절사)
  - **소정근로일**: 구간 내 근무일 계획 수
  - 잔여 = 소정/최대 − 인정근무시간(휴가·기타근무 인정분 포함), 음수면 0. 잔여 근무일은 오늘 제외 이후 계획 근무일
  - 툴팁 문구(코드 확인): "조회 기간 내 연장근무를 포함해 근무할 수 있는 법정 최대 기준 시간입니다." / "주 52시간 기준으로 조회 기간 달력일수에 비례해 계산됩니다." / "소정근로시간에서 인정근무시간을 차감한 잔여 시간입니다." / "휴가나 기타근무만 있는 날은 근무일수에 포함되지 않습니다." / 인정 근무시간 "…같은 시간대가 겹치는 경우 중복을 제거하여 집계" + "당일이 포함된 기간 선택시 전일까지의 근무기록만 집계" (`pp:locales/ko/attendance.json` `WORK_INFO.sentence*`)
  - 근거: Slack #sq-time 2026-06-19 API 신설(https://github.com/hcgtheplus/optimiz-time/issues/1491 코멘트 "계산 정책 미확정: maxWorkMinutes 주 52시간 표준 → 소정근로시간 기준 변경 검토 중"), ppfront#11115(2026-06-22, 기간 이동·항목별 인포 문구). 정산기간 잔여 표시는 **신청서 화면** 쪽 결정(#sq-time 2026-11-03 "잔여 = 정산기간 한도 − 정산기간 근무 − 신청 중 시간")으로 이 위젯과 별개
  - 남은 질문: 최대근로시간을 주 52h 비례에서 다른 기준으로 바꿀지(이슈 #1491에서 "검토 중"으로 멈춤)
