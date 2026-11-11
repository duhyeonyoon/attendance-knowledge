# 2026-11-05 미결 해소 — user-attendance (내 근무 · 구성원 근무 · 내 휴가 · 구성원 휴가)

기준: ppfront `origin/dev`, optimiz-time `origin/dev` (2026-11-05 fetch). 워킹트리 변경 없음.

## 해소 목록

### 내 근무 (`product/user/attendance/my-work.md`)
| 항목 | 결론 | 근거 |
|---|---|---|
| URL | `/attendance/work` → `pages/attendance/personal_work`. `?newAttendance=YYYYMMDD`로 근무내역 변경 신청서 자동 오픈 | `pp:src/App.jsx:1029`, `MyWorkCalendarCell.tsx` |
| 우측 위젯 구성 | 출퇴근 위젯 + 근무 요약(근무시간 표시 안 함 그룹이면 숨김). 워크플로우 위젯 없음 | `pp:src/components/attendance/personal_work/index.tsx` |
| 모바일 1셀 우선순위 | 휴일/휴무일 근무→WorkReg, 종일휴가 1건→LeaveReg, 그 외 표시 순서 첫 항목. 나머지 색 점 | `MyWorkCalendarCell.tsx:439–490` |
| MoreHoriz | 항목 > visibleCount(3, 태블릿 2)면 `···` → `WorkDailyDrawer`. 모바일은 셀 클릭 | `MyWorkCalendarCell.tsx:924–1045` |
| getWorkAttendData / 표시 순서 | 본문 표로 정리 | `personalWork.ts:1905–2265` |
| getWorkRegInfo | 표 재작성. "근무 내역 변경이 필요합니다"/"근무 내역 변경 요청 중"은 출퇴근 위젯 문구였음(캘린더는 "누락"/"요청중") | `personalWork.ts:432–750`, `attendance.json:218–219` |
| 화면 문구 | "예정됨"→"계획", "요청 중"→"요청중", "취소 요청 중"→"취소중", "휴무일"→"휴무", "연장근무"→"연장/야간근무", 휴일명은 타이틀 아님, 신규 "미수립" | `sharedFunction.json attendance.*` |
| RestReg | 미사용 타입. 자리비움 누락은 WorkReg "누락" | `unionType.d.ts:165` (생성 코드 없음) |
| psnHoliWorkAppl vs holidayWorkAppl | psnHoliWorkAppl Deprecated(항상 빈 배열). 최상위 holidayWorkAppl/overtimeWorkAppl = 승인 raw | `be:timeold/dto/work/EmpDailyWorkDto.java:290–299,646–690` |
| applsInProgress | 19종으로 갱신 (출퇴근 내역 변경, 사후 휴일/연장 추가) | 동일 |
| 누락 조건 | 백엔드 `missingInoutRegYn` 스키마 설명대로 재작성 (QA "모두 만족"은 논리 모순) | `EmpDailyWorkDto.java:143–160` |
| 툴팁 | OtherWork 항상, ApprovedOvertimeWork 4글자 초과만 | `CalendarCellContent.tsx:297` |
| 클릭 분기 | 표로 정리. 계획 그룹 오늘 클릭 무동작, 기본 신청서 = 출퇴근 내역 변경 우선 | `MyWorkCalendarCell.tsx:600–787` |
| 근무 마감 | 셀 클릭은 막지 않음. 드로어에서 경고 + 요청 비활성 | `RegEdit.tsx:1191,2453`, `workflow.json:192,490,566` |
| hasModifiedWorkRecord 모순 | = 승인 완료된 근무내역/출퇴근 내역 변경 신청 존재. 출퇴근 위젯 버튼 전환용, 변경 신청 차단 아님. "관리자에 의해 수정된 내역..." 문구 코드에 없음 | `be:CalendarService.java:1172–1205`, `CalendarMapper.xml:73`, `CommuteButton.tsx:113`, Slack #channeltalk 2026-08-13 |
| 대체근무 요청 시 계획 가림 | 현재 코드는 가리지 않음 (isPendingRequest에 미포함) | `personalWork.ts` isPendingRequest |
| 재택 vs 기타근무 | 현재 캘린더 코드에 기타근무 조건 없음 → 둘 다 표시 (기획 ≠ 구현 의심) | `personalWork.ts` homeWork |

### 내 휴가 (`my-leave.md`)
| 항목 | 결론 | 근거 |
|---|---|---|
| −2h vs −3h | 휴가 신청 가능 시간대도 `ValidWorkDayResolver`(−3h, 기본 06시). −2h는 2025-02-25 이전 값 | `be:EmpDailyWorkService.java:3831`, `ValidWorkDayResolver.java:32,204–240`, `hcgtheplus/optimiz-time#674` |
| DirectLeaveCalc 일수 환산 | 어드민 직접 등록·정산 경로는 근무그룹 표준근로시간만 사용 → 단축 템플릿 구성원은 경로별 일수 상이 가능 (의도 미확인) | `be:DirectLeaveCalcDto.java:952–965` |

### 구성원 근무 (`member-work.md`)
| 항목 | 결론 | 근거 |
|---|---|---|
| 일괄 승인 방식 | 건별 처리, `approveError` 맵으로 부분 성공 | `pp:ApprovalRequestDrawer.tsx:820–870` |
| 위치 3개월 룰 | 신청일+3개월을 열람 종료일로 저장, 만료 시 응답에서 주소 제거 + 배치 파기 | `be:PrivacyComplianceService`, `InApplsService.java:483,792–811` |
| 신규: 캘린더 보기 | 2026-09 추가 (목록/캘린더 전환, 상세 패널 구성원별/유형별) | `hcgtheplus/ppfront#11423` |

### 구성원 휴가 (`member-leave.md`)
| 항목 | 결론 | 근거 |
|---|---|---|
| "휴가 유형이 생성 필요" | 연차 휴가 > 전체 휴가일 때만 미생성 구성원 포함, 휴가 유형 칸 "생성 필요" | `be:EmpLeavesService.java:368–425,805–812`, `EmpLeavesMapper.xml:297–303` |
| 필터 구조 | 2단(연차 휴가/연차 외 휴가 → 세부) | `FilterSection.tsx:95–135`, `optimiz-time#1425` |
| 신규: 엑셀 다운로드 | 사유 입력 필수 | `optimiz-time#1469`, `ExcelDownloadReasonDialog.tsx` |

## 남은 항목
- 재택 칩 vs 기타근무 칩 동시 노출이 의도인지 (기획 확인)
- 대체근무 요청중 근무계획 표시가 의도인지
- 어드민 직접 등록·정산 경로의 일수 환산 차이가 의도인지
- 매니저 권한 = 직책자 권한만으로 충분한지
- 동시 승인 경합의 내부 실패 메커니즘

## 공유 파일 영향 (직접 수정 안 함, 보고서에 제안)
- `product/admin/work/check-work-data.md`, `product/user/applications/reg-adjust.md`, `product/user/applications/overview.md`의 "어드민 수정 → 변경 신청 차단" 서술 — ~~현재 코드와 다름~~ → (교차 검증) 차단은 `hasAdminModifiedWork`로 구현돼 있음. 다른 건 flag 이름과 문구뿐이며 해당 문서들은 실제 문구로 정정 완료
- `product/user/applications/remote-work.md` § 1 "기타근무 > 재택" — 내 근무 캘린더 구현과 다름

## 2026-11-05 Slack 재검토

항목마다 `slack_search_public_and_private` 2~3회 이상 수행. 사람 이름 생략.

| # | 항목 | 분류 | 결론 | 근거(채널·날짜·링크) |
|---|---|---|---|---|
| 1 | 내 근무 캘린더 재택·기타근무 동시 표시 | 부분 | "기타근무 > 재택(한 칩 공간 공유)" 결정은 **출퇴근 위젯 칩** 대상(#030 2025-02-07), 전사 근무계획 캘린더는 "휴가 > 기타근무 > 재택, 겹치면 툴팁으로 재택 표시(디자인 필요)"(#ch-plan 2025-06-18), #ch-ux 2024-10-23도 위젯 근무현황 기준. **내 근무 캘린더 대상 결정은 없음** → 버그 확정 근거 없음, 기획 확인 필요 | #030 https://hcgtheplus.slack.com/archives/C08CPRL8BRN/p1738906946224039?thread_ts=1738906905.526529&cid=C08CPRL8BRN · #ch-plan https://hcgtheplus.slack.com/archives/C02VCP9MBQV/p1750229718322709?thread_ts=1750227993.860649&cid=C02VCP9MBQV |
| 2 | 대체근무 요청중 근무계획 표시 | 해소-의도 | 요청중은 계획을 바꾸거나 가리지 않음(승인 시 확정 스케줄 swap). 단 2025-11-12 결론 "요청중 대체근무 정보는 캘린더에 안 보여줘도 됨"과 달리 현재 '요청중' 항목은 표시됨(이후 추가 추정) | #sq-time 2025-11-12 https://hcgtheplus.slack.com/archives/C04QC2RJJBU/p1762926468097889?thread_ts=1762912671.172489&cid=C04QC2RJJBU · #sq-time 2026-07-01 |
| 3 | 어드민 직접 휴가 등록·정산의 표준근로시간 환산 | 부분 | 원칙 = 시간 단위 관리, **일수는 표준근로시간 환산**; 템플릿 하루 시간은 종일 **차감 분** 기준 → 어드민 경로가 원칙과 일치, 사용자 경로의 일수 표시가 템플릿 기준이면 그쪽이 예외(코드 재확인 필요) | #sq-time 2026-05-26 https://hcgtheplus.slack.com/archives/C04QC2RJJBU/p1779762197852909?thread_ts=1779428727.746959&cid=C04QC2RJJBU · #channeltalk 2026-10-08 https://hcgtheplus.slack.com/archives/C06ULEEM88M/p1791440235689699?thread_ts=1791433855.695899&cid=C06ULEEM88M · #cx 2026-08-05 · #068 2026-09-21 |
| 4 | 매니저 권한 범위 | **해소-결정** | 별도 매니저 권한 없음 = 직책자 권한(직책 그룹 · 메뉴 · 범위 본인조직/본인+하위 · 조직장만 조건). 조직장 지정만으로는 권한 없음, '회사 전체' 옵션 없음. '일정' 탭은 전원 조회, '현황'·요청 처리만 직책자 | #cx 2026-08-31 https://hcgtheplus.slack.com/archives/C01AVJ2CJBW/p1788155822035629?thread_ts=1788153874.131529&cid=C01AVJ2CJBW · #channeltalk 2026-10-23 https://hcgtheplus.slack.com/archives/C06ULEEM88M/p1792739157298519?thread_ts=1792738679.894869&cid=C06ULEEM88M · #channeltalk 2026-10-20 https://hcgtheplus.slack.com/archives/C06ULEEM88M/p1792460025665519?thread_ts=1792457985.558159&cid=C06ULEEM88M |
| 5 | 동시 승인 실패 기준 | Slack에 없음 | 근무 신청서 경합 논의 없음(검색된 '동시 승인'은 성과 모듈 건) | 검색: "동시 승인 실패", "approveError", "일괄 승인 근무 요청 모아보기" |

동기화: `product/user/attendance/my-work.md` ↔ `spec/user/attendance/my-work.md` (4 요청중 표, 7) · `member-work.md` ↔ spec (4.1 #1, 7) · `my-leave.md` ↔ spec (4.1, 7)

### 공유 파일 제안 (직접 수정 안 함)
- `product/user/applications/remote-work.md` § 1 "기타근무 > 재택" — 적용 화면을 "출퇴근 위젯 칩(한 칸 공유)·구성원 근무 일정"으로 한정 표기 제안
- `product/admin/authority/manager.md` — 직책 그룹 단위·범위 2종·'조직장만' 조건·개인 예외 불가·'일정 탭은 권한 무관' 정리 반영 여부 확인
- `product/admin/work/group-setting.md` 연장근무 허용 '불가' 옵션 — "현재 신규 선택 비활성(개발 전), 과거 저장 그룹만 존재" 표기 제안
- `domain/*` 휴가 환산: "일수 표시 = 표준근로시간, 종일 차감 = 템플릿 소정" 원칙 문장 추가 제안
