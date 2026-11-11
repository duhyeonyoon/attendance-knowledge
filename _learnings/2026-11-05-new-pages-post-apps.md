# 2026-11-05 신규 페이지 — 휴일근무(사후)·연장/야간근무(사후) 신청서

기준: ppfront·optimiz-time·talenx-admin `origin/dev` (2026-11-05 fetch). 새 페이지:
- `product/user/applications/holiday-work-post.md` ↔ `spec/user/applications/holiday-work-post.md` (order 2, `U-APL-HPS`)
- `product/user/applications/overtime-post.md` ↔ `spec/user/applications/overtime-post.md` (order 4, `U-APL-OTP`)

도입 PR: 휴일(사후) ppfront#11509 / optimiz-time#1711 / talenx-admin#4512, 연장(사후) ppfront#11392 / optimiz-time#1680 / talenx-admin#4362 (+ optimiz-system#1015 문서유형). QA 체크리스트에는 사후 항목 없음.

## 새 발견

| # | 발견 | 근거 | 다른 문서 영향 |
|---|---|---|---|
| 1 | **겹침 판정 풀이 사전+사후 합산**. 휴일근무: `HolidayWorkApplDuplicateValidator` → `HolidayWorkApplQueryService.getByMemberAndWorkYmdPeriod`(사전+사후). 연장: `OtApplsService.getValidOtApplListByPeriod`에 `findValidPostForMember` 합침 ("분리 이후에도 같은 시간대를 점유하므로 되돌려 합친다") | `be:validator/appls/holidaywork/HolidayWorkApplDuplicateValidator.java`, `be:service/appls/otwork/OtApplsService.java:588-613`, `be:service/appls/holidaywork/HolidayWorkApplsService.java:609-633` | `holiday-work.md`·`overtime.md`(KB·명세서)·`overview.md`의 "휴일근무(사전) 신청서만 비교" / "연장/야간(사전) 신청서만 비교" 표현이 현재 코드와 다름 → "사전·사후 같은 종류끼리" |
| 2 | 사전 휴일근무 `valid-appl-list`도 사후를 함께 반환 (안내 목록에 사후 건이 보임) | `be:controller/appls/holidaywork/HolidayWorkApplsController.java:162-167` | `holiday-work.md` § 캘린더 선택 "이미 신청된 문서" 설명 보강 가능 |
| 3 | 사후 = 지난 근무일 판정은 **현재 근무 귀속일** 기준(`workYmd < getValidWorkYmd(now)`), 프론트는 달력 오늘 기준 | `be:…/PostHolidayWorkApplsService.java:215-222`, `be:…/PostOtApplsService.java:221-229`, `pp:…/PostDayOff.tsx:266-271`, `pp:…/PostOvertime.tsx:388-392` | — |
| 4 | 당일 과거 시각 정책·PAST 차단은 `isPostAppl=true`로 스킵 | `be:…/OtApplsService.java:907-998`, `be:…/HolidayWorkApplsService.java:1010-1033` | — |
| 5 | 승인 반영 = 사전과 같은 집계 목록(사전+사후 완료·미취소). 승인 구간 ∩ 실제 출퇴근만 인정. 휴일은 근무시간 포함여부 "승인시간만 포함"일 때만 이 분기 | `be:service/overtime/OvertimeApplicationQueryService.java`, `be:common/workcalc/WorkTimeCalcService.java:2407-2440, 2963-3010` | `business-rules.md` § 3·4에 "사후 신청도 동일 인정" 추가 가능 |
| 6 | 사후 한도 차감은 근무시간 포함여부 연동: 휴일 "포함"→차감 0, 연장 "포함"→`max(집계, 기존사후+신규)−max(집계, 기존사후)` | `be:…/PostHolidayWorkApplsService.java:268-287`, `be:…/PostOtApplsService.java:244-271`, `be:service/overtime/OvertimeService.java:764-775` | 프론트는 정책 무관하게 전체 비교 → **FE/BE 불일치 의심** (아래 확인 필요) |
| 7 | 사후 신청서 설정(사용·설명·첨부/코멘트 필수) 기본값 **미사용** 백필 (opt-in). 당일 과거 시각 정책 컬럼 없음 | `be:resources/db/migrationSql/20260828_02_…`, `20260923_04_…` | — |
| 8 | 메뉴 노출: 휴일(사후) = `holiWorkPmitCd==="A"` && 사후 설정 `useYn`, 연장(사후) = 사후 설정 `useYn`만 | `pp:src/components/main/work_commute/contents/WorkRequest.tsx:173-189, 304-333` | `checkin-widget.md`(근무신청 메뉴 목록)에 사후 2종 추가 필요할 수 있음 |
| 9 | 연장(사후) 컨트롤러에 `submitApply`·`deleteApply` 미매핑 (휴일(사후)는 매핑) | `be:controller/appls/otwork/PostOtApplsController.java:53-190` | — |
| 10 | 연장(사후) `searchApply`에 `isClosed` 없음 → 결재 상세의 마감 사전 비활성 미동작 | `be:dto/appls/overtime/PostOtApplsResponseDto.java:20-72`, `pp:…/approval_drawer/index.tsx:545-551` | — |
| 11 | 연장(사후) 프론트 `validateClosedWorkYmd`(`closedWorkYmd`)는 OT valid-time이 반환하지 않는 코드 → 죽은 분기 | `be:dto/appls/overtime/OtApplValidTimeDto.java:20-31` | — |
| 12 | 휴일(사후) 상단 툴팁이 사전 키 `includesPreApprovedHolidayWork` 재사용 → "사전 승인 휴일 근무 시간을 포함합니다." | `pp:…/PostDayOff.tsx:502-516` | — |
| 13 | 휴일(사후) 취소 드로어는 예상 잔여시간 미표시, 연장(사후) 취소 드로어는 표시 | `pp:…/PostDayOffCancelDrawer.tsx`, `PostOvertimeCancelDrawer.tsx` | — |
| 14 | 연장(사후)은 사전의 "현재 근무중 종료 알림·요청 구간 기반 출퇴근 기록 생성"을 하지 않음 | `be:…/PostOtApplsService.java:43-52` | — |
| 15 | 사후 연장은 원래 사전 테이블 `AFT_APPL_YN` 플래그였고 전용 테이블 분리하며 컬럼 삭제 | optimiz-time#1680 본문 | glossary에 `AFT_APPL_YN` 있으면 폐기 표시 |

## 두현님 확인 필요

1. 프론트 최대 한도 검증이 근무시간 포함여부 "포함" 그룹에서 서버보다 엄격 → 실제로 과차단 나는지 스테이징 확인
2. 출퇴근 기록 없는 날 사후 승인 → 인정 0 (승인 ∩ 실제 기록). 의도된 정책인지
3. 연장(사후) `submitApply` 미매핑 — 워크플로우가 신청 시 어떤 액션을 호출하는지 (`saveApply`만으로 충분한 구조인지)
4. 연장(사후) 결재 상세 마감 버튼 사전 비활성 누락 — 의도 여부
5. 자정~귀속일 전환 구간에서 프론트(오늘)·서버(귀속일) "지난 날" 판정 차이
6. 휴일(사후) 툴팁의 "사전" 문구
7. 연장/야간·휴일 허용이 '승인 시에만'에서 바뀌었을 때 사후 신청서 `useYn` 처리

## 2026-11-05 추가 — Slack 교차 확인 (신규 4페이지 확인 필요 7건)
| # | 항목 | 결과 | 근거 |
|---|---|---|---|
| 1 | 출퇴근 기록 없는 날 사후 승인 → 인정 0 | **의도** | #sq-time 2026-10-07 "사전/사후 모두 승인을 받더라도 실제로 그 시간에 근무를 해야 인정" |
| 2 | 화면(항상 비교) vs 서버(포함 시 차감 0) 한도 | **기획 = 화면 쪽** ("집계에서 제외되더라도 신청 단계에서 막아야"). 서버 동작은 기획과 어긋날 수 있음, 스테이징 실측 필요 | #bizops-center 2026-10-01 스프린트 #69 결정사항 |
| 3 | 휴일근무(사후) 툴팁 "사전" 문구 | 논의 없음 (미해소) | — |
| 4 | 근무 신청 내역 관리에 수립 탭 없음 | 어드민 조회는 개인 근무 스케줄 관리 선택적 근로 스케줄 탭으로 별도 설계. 탭 추가 논의 없음 (부분 해소) | Group DM 2026-07-27, #sq-time 2026-08-25 |
| 5 | 지난 날짜 수립/재수립 | **의도** (고객 안내에 사용) | #ch-sc 2026-10-20 FAQ, #channeltalk 2026-10-12, #cx 2026-10-26 |
| 6 | 어드민 수정 일자 서버 재검증 없음 | 차단 정책은 확정, 서버 재검증 누락은 논의 없음 (구현 누락 가능성) | #bizops-center 스프린트 #69 결정사항 |
| 7 | optimiz-time #1786, #1789 | 2026-11-05 기준 둘 다 OPEN | gh |

## 2026-11-05 Slack 재검토
| # | 항목 | 분류 | 결론 | 근거(채널·날짜·링크) |
|---|---|---|---|---|
| 1 | 자정 직후 귀속일 전날 선택 시 서버 거절 (휴일·연장 사후) | Slack에 없음 | 키워드 \"사후 귀속일\"·\"사후 자정\"·\"사후 지난 근무일 오늘\" 결과 없음. 근무그룹 시간대 기준 판정 통일(ppfront#11651·optimiz-time#1794, 2026-11 진행)과 함께 재확인 필요 | — |
| 2 | 허용 설정이 '승인 시에만'에서 바뀐 그룹의 사후 `useYn` | 해소-의도 | 소속 구성원 있는 근무그룹은 설정 수정 불가(복제→소속 이동), 허용 옵션은 최초 확정 후 화면에서 변경 불가. 확정 시 사전 휴일근무·대체근무 사용 여부 자동 동기화. 허용 미충족 행은 어드민에서 비활성+툴팁. 사후는 기본 미사용(관리자 ON). API 직접 변경만 공백 | #cx 2026-10-15 https://hcgtheplus.slack.com/archives/C01AVJ2CJBW/p1792036044368419?thread_ts=1791948496.453579 · #sq-time 2026-10-15 https://hcgtheplus.slack.com/archives/C04QC2RJJBU/p1792028972588959?thread_ts=1791953371.211939 |
| 2a | (번복 기록) 사후 신청서 노출 시점 | 해소-결정(철회) | 스프린트 #69 메모에 \"이전 그룹이 사용했으면 이동 후에도 노출 / 고도화로 신청 가능 기간 옵션\" 안이 있었으나 **취소선 처리** → 현재는 오늘 소속 그룹 설정 기준(코드도 동일) | #bizops-center 2026-10-06 https://hcgtheplus.slack.com/archives/C0AC4BH6QLB/p1791276814350419?thread_ts=1790745475.348859 |
| 3 | 연장(사후) `submitApply` 미매핑 영향 | 해소(코드 확인, Slack 논의 없음) | 영향 없음 — 전자결재는 신청 시에도 `/saveApply`만 호출, `/submitApply` 호출 경로 없음(`optimiz-system ApplicationsService.java:1539-1560`). **새 발견**: `/deleteApply`는 문서 삭제 시 호출(`:512, 1594-1615`) → 연장(사후) 문서 삭제 시 업무단 호출 실패 가능(추정, 스테이징 확인 필요) | Slack \"submitApply\"·\"사후 연장 deleteApply\"·\"사후 임시저장 삭제\" 검색 결과 없음 |
| 4 | 연장(사후) 결재 상세 마감 버튼 사전 비활성 누락 | Slack에 없음 | \"isClosed\"·\"사후 마감 승인 버튼\" 결과 없음. 서버가 막으므로 데이터 영향 없음 | — |
| 5 | 휴일(사후) 툴팁 '사전' 문구 | Slack에 없음 | \"사후 휴일 툴팁\"·\"사전 승인 휴일 근무 시간을 포함합니다\" 재검색 결과 없음 | — |
| 6 | 화면 한도(항상 비교) vs 서버(포함 시 차감 0) | (이미 확인) | 기획=화면, 스테이징 실측 필요 — 중복 검색 생략 | #bizops-center 2026-10-01 |
