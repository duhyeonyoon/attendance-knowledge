# 2026-11-05 미결 해소 — user-home 영역 (통합홈 위젯 + 근무스케줄 · 위치정보 제공 조회 · 연차촉진)

기준: ppfront `origin/dev`, optimiz-time `origin/dev` (2026-11-05 fetch). Slack은 보조.

## 해소 목록

| # | 항목 | 결론 | 근거 |
|---|---|---|---|
| 1 | 연장근무 자유 허용 시 예상 퇴근 초과 안내 (KB "미표시" vs business-rules "주황색") | **주황색** "예상 퇴근 시간이 지났습니다." (P). A는 빨간색, N은 위젯 안내 없음. NP 그룹은 계획 출근 전 미표시, S 그룹/최대근무 초과는 "소정근무시간을 초과했습니다." | `pp:src/components/main/work_commute/contents/WorkStatusSummary.tsx:109-256` |
| 2 | 자정 cutoff 프론트(정적)·백엔드(동적) 불일치 | 프론트 `checkNextDayAndBeforeAggrTime`/`ddAggrTime` **제거됨** (hcgtheplus/ppfront#11005, 2026-05-18). 위젯은 `/time/calendars/day?currentYn=Y`로 백엔드 `getValidWorkYmd`(ValidWorkDayResolver) 판정 결과를 사용 → 단일화 | `pp:src/hooks/attendance/work_commute/useTodayWork.ts:92`, `be:timeold/service/calendar/CalendarService` |
| 3 | 위치 확인 불가(U)/권한 거부(D) 처리 | GPS 검증 ON이면 근무지외 판정 → "위치 확인 필요" 컨펌 → 요청 모달. OFF면 정상 출퇴근. GPS_OR_IP는 IP 일치 시 통과. 웹 GPS 타임아웃(10초)은 별도 컨펌(GPS 새로고침/출근 요청) | `pp:src/lib/attendance/gpsOutOfWorkPlace.ts`, `outOfWorkPlaceCommute.ts`, `WorkCommuteWidget.tsx:137-277` |
| 4 | 어드민 수정일 '근무 내역 변경' 버튼 (checkin-widget vs my-work 모순) | 위젯의 `hasModifiedWorkRecord`는 **승인 완료된 근무내역/출퇴근 내역 변경 신청 존재** 여부(어드민 수정 아님). 어드민 직접 수정(`TM_WORK_REG_ADMIN_ADJST`)은 위젯이 안 보고, 신청서 `getValidDate.hasAdminModifiedWork`로 "해당 일자의 근무내역은 어드민이 수정 및 확정하였습니다." 차단 → 두 문서 모두 맞게 정리하면 모순 없음 | `be:SQL/timeold/calendar/CalendarMapper.xml:73`, `be:WorkRecordChangeApplsService#getValidDate`, `pp:InoutRecordChange.tsx:442` |
| 5 | 자리비움 입력 항목 | 업무 복귀 예정시간(필수, 기본 +1h, 현재 이후) + 코멘트(필수). 복귀 버튼 라벨은 "업무 시작" | `pp:.../RestDialog.tsx`, locale `PERSONAL_WORK.restDialog` |
| 6 | 미승인 안내 다이얼로그 | 정책 API `needNotice` 시 "{출근/퇴근} 안내" 다이얼로그 → 강제 등록. needNotice 조건 = 승인시 정책 미승인(휴일/연장/야간), 초과근무 한도, 최대근무 초과, 퇴근 시 불가 정책 위반 | `be:WorkRecordWidgetService#evaluateInoutPolicy`, `pp:useClockInOutSubmit.ts` |
| 7 | 위젯 API base URL / 사전 차단 함수 위치 / 정책 API 응답 구조 | `config/api.js` ATTENDANCE.WORK_RECORD, `useDayWorkInfo.ts:25-33`, `InoutPolicyResultDto` | 코드 |
| 8 | 근무스케줄 URL | `/attendance/schedule`, `/attendance/schedule/edit` (work_schedule_setting은 폴더명) | `pp:src/App.jsx:1074-1089` |
| 9 | 근무스케줄 숫자키 | 1~9 = 우측 템플릿 목록 N번째 템플릿 토글(칩에 번호 표시). "근무그룹 단축"은 오류 | `pp:.../edit/contents/EditContent.tsx:285-360,941` |
| 10 | 반복 스케줄 모달 옵션 | 반복 기간 / 반복 패턴(템플릿×일수) / 휴일 근무(휴일 템플릿 vs 반복) / 휴일 템플릿 / 휴일 이후 반복 적용 | `RepeatScheduleModal.tsx` |
| 11 | 위치정보 보관 기간 | 위치정보 = 신청일+3개월 후 새벽 배치 파기(NULL). 조회 로그(TM_LOC_HISTORY_LOG)는 파기 로직 없음 | `be:PrivacyComplianceService`, `LocHistoryLogMapper` |
| 12 | 위치 로그가 남는 조회 행위 | 출/퇴근 요청 문서 열람(searchApply) + 위치 확인(getLocationInformation) 둘 다, 타인·접근 기간 내만 | `be:LocHistoryLogService` 호출처 |
| 13 | 위치정보 제공 조회 컬럼/필터 | 사번·제공 받은자·위치정보 취득경로·주소정보 취득경로·제공 서비스·제공방법·이용제공일시 / 년·월 셀렉트 | `pp:LocationAccessLogsTable.tsx`, locale |
| 14 | 연차 계획 작성 다이얼로그 항목·검증 | 사용일+사용시간, 자동 행 생성, 합계 = 촉진 필요 시간이어야 확정 | `pp:.../annual_leave_encouragement_plan_dialog/` |
| 15 | 근무 요약 위젯 API / 산정 기간 / MemberSummary | `/time/members/me/work-time-summary`, 선택 기간(월/주) 기준, 기간 단위는 사용자 preference. MemberSummary는 근무정보 상세 페이지 전용 | `pp:WorkSummaryWidget.tsx`, `modules/attendance/work_info.ts` |
| 16 | 통합홈 대시보드 설정 / 근무 대시보드 집계 기간 | [대시보드 설정]으로 위젯 사용·배치 가능 / 이번 달 고정 | `pp:MainDashboardSetting.tsx`, `WorkSummaryDashBoard.tsx:725` |

## 부수 발견
- ppfront 출퇴근 위젯 대규모 리팩터링: `WorkComponent.tsx` → `WorkCommuteWidget.tsx` + `hooks/attendance/work_commute/*`, `Status.tsx` → `WorkStatusSummary.tsx`, `BottomDrawer.tsx` → `ClockInOutBottomDrawer.tsx`, IP 검증 모드(IP_ONLY/GPS_OR_IP), `NOT_ALLOWED`(채널별 출퇴근 불가) 신설, 10분 자동 새로고침
- 출근 정책 API가 BLOCK을 줘도 프론트는 needNotice만 봄 → 연장 불가 + 연장시간대 출근의 화면 처리 미확인
- 위치정보 취득경로 컬럼이 조회 시점 Request 값이던 버그 → 수집 시점 값 복사로 수정됨 (Slack #sq-time 2026-10-20)
- Slack #sq-sys 2025-06-26: 연차촉진 문서 서명 정책 "미사용연차 통지서(서명 X) / 연차사용계획서(서명 O) / 사용시기지정통보서(서명 X)" — KB의 "미사용 연차 통지서 서명(제출)"과 다를 수 있음 (미검증)

## 남은 항목
- 연장근무 불가 그룹의 연장시간대 출근 시 실제 화면 (서버 BLOCK 응답 처리)
- 조회 로그 무기한 보존이 의도인지
- 대시보드 설정이 개인별/회사 공통인지
- 근무 요약 수치의 기간 경계 안분 방식, 툴팁 문구
- "휴일 이후 반복 적용" 선택지별 동작
- 휴먼컨설팅그룹 연차촉진 체크리스트 제외 이유 (Slack 상 프로덕션 테스트 대상 고객사로 사용된 기록만 있음)
- 근무스케줄 권한 체크 메커니즘, 미확정 스케줄 저장 방식, 백엔드 API (이번 범위에서 미조사)

## 2026-11-05 Slack 재검토

범위: `product/user/home/*` 4개 + 같은 learnings가 다룬 `user/attendance/{schedule,location-access-logs,annual-leave-encouragement}.md` 및 짝 spec. 항목마다 키워드 2~3조합으로 `slack_search_public_and_private` 수행(검색어는 결론 칸의 인용 참고). 사람 이름은 생략.

| # | 항목 | 분류 | 결론 | 근거(채널·날짜·링크) |
|---|---|---|---|---|
| 1 | 연장 불가 그룹이 연장시간대 출근 시 화면 처리 | **버그·구현누락 확인** | 설계는 "BLOCK = 실제 출퇴근 이벤트에서 서버 차단, NOTI만 사전 검증 API" → 서버 차단은 의도. 프론트는 `OVERTIME_NOT_ALLOWED`를 분기하지 않아 **무안내**(드로어만 닫힘) — 팀이 "다음에 출근 불가하게 작업 필요"로 남긴 TODO. 어드민 '연장 불가' 옵션은 현재 신규 선택 비활성이라 과거 '불가' 저장 그룹만 해당. 부수: 휴일 불가 failReason 문자열 불일치(`HOLIDAY_NOT_ALLOWED` vs 프론트 `HOLIDAY_WORK_NOT_ALLOWED`) | #sq-time 2026-02-12 https://hcgtheplus.slack.com/archives/C04QC2RJJBU/p1770871842345429?thread_ts=1770256043.928359&cid=C04QC2RJJBU · #sq-time 2026-01-26 https://hcgtheplus.slack.com/archives/C04QC2RJJBU/p1769404725280029?thread_ts=1769045807.733759&cid=C04QC2RJJBU · #channeltalk 2026-10-08 https://hcgtheplus.slack.com/archives/C06ULEEM88M/p1791437987351259?thread_ts=1791433855.695899&cid=C06ULEEM88M · #notice-talenx 2026-03-10 핫픽스 |
| 2 | QA 체크리스트 "05시" 표현 | 해소-의도 | 현행 규칙 = 고정 출근일 계획 출근 −3시간(기본 06시). "05시"는 2023-12 체크리스트 잔재 → 체크리스트 문구만 갱신 | #cx 2026-10-08 https://hcgtheplus.slack.com/archives/C01AVJ2CJBW/p1791433888967679?thread_ts=1789952197.507599&cid=C01AVJ2CJBW · #sq-time 2023-12-06 |
| 3 | 진행 중 신청서(12종)와 위젯 버튼 상호작용 | 부분 | 출퇴근 내역 변경 요청중 사유 분리(`INOUT_RECORD_CHANGE_REQUESTED`), [근무 내역 변경] 비활성 툴팁 정리 논의만 있고 전체 매트릭스 없음 | #sq-time 2026-10-01, 2026-10-02 |
| 4 | `parseDayWorkInfo` 변환 로직 | 기획 영향 없음 | Slack 검색 생략 | — |
| 5 | 자리비움 복귀 후 화면 / 근로 거부 안내문 (spec "(추정)") | Slack에 없음 | 복귀 중복 요청 이슈(#sq-time 2025-11-21)만, 표시 규칙 논의 없음 | 검색: "자리비움 복귀 위젯", "노무수령거부 출퇴근 위젯" |
| 6 | 통합홈 대시보드 설정 개인별/회사 공통 | **해소-결정** | 회사 단위 모드: 기본 설정(고객사 공통) / 회사별 `어드민 일괄 설정` / `구성원 직접 설정`. 2026-10 프로덕션 오픈, 서브어드민 권한 추가(talenx-admin#4627) | #cx 2026-10-21 https://hcgtheplus.slack.com/archives/C01AVJ2CJBW/p1792569797607629?thread_ts=1792458834.345299&cid=C01AVJ2CJBW · #github-talenx-admin 2026-10-26 https://hcgtheplus.slack.com/archives/C05HD5UGV4M/p1792986578757019 · #sq-core 2026-08-11 체크리스트 |
| 7 | 어드민 근무 대시보드 컬럼 구성 | Slack에 없음 | 비활성 인원 배지 질의(#bizops-center 2026-09-17)만 | 검색: "근무 대시보드 어드민 컬럼" |
| 8 | 누락 알림 발송 시점 | Slack에 없음 | 어드민 알림 발송 설정 일반 설명만(#cx 2026-10-08) | 검색: "누락 알림 발송" |
| 9 | 어드민 대시보드 일별만 / 최소근무시간 타 고객 확장 | Slack에 없음 | "최소근무시간 없으면 탭 없애야겠다"(그룹 DM 2025-12-15)뿐 | 검색: "최소 근무시간 탭" |
| 10 | 근무 요약 위젯 기간 ≠ 정산기간 계산, 툴팁 | 해소-의도 (코드 + 이슈) | 안분 없음 — 선택 기간 자체로 계산. 최대 = 52h/7×달력일수, 소정 = 법적 기준이면 40h/7×일수 / 계획 기준이면 계획 합. 툴팁 문구 코드 확인. 남은 질문: 최대 기준 변경(이슈 #1491 "검토 중") | optimiz-time#1491 코멘트(2026-06-19, #sq-time 공유) · ppfront#11115 · `PrescribedWorkCalculator` |
| 11 | "휴일 이후 반복 적용" 선택지 | Slack에 없음 → 코드로 해소 | POSTPONE "기존 근무 일정을 다음날로 미루어 적용"(패턴 정지) / REPLACE "휴일만큼 건너뛰고 적용"(패턴 진행) | `CONST_TIME_CODE.CRE_SCH_HOLI_WORK_PLAN_1`, `PersonalWorkScheduleSettingService:1252-1285` |
| 12 | 근무스케줄 권한 체크 | **해소-결정** | 직책자 권한(직책 그룹 › 근무스케줄 역할 기준 + 범위). 메뉴는 전원 노출, 무권한은 본인 읽기 전용. 직책자는 과거/미래·휴일 포함 수정, 선택적 근로제 구성원은 수정 불가 | #cx 2026-08-31 https://hcgtheplus.slack.com/archives/C01AVJ2CJBW/p1788155822035629?thread_ts=1788153874.131529&cid=C01AVJ2CJBW · #channeltalk 2026-07-02 https://hcgtheplus.slack.com/archives/C06ULEEM88M/p1782973475857639?thread_ts=1782949946.004189&cid=C06ULEEM88M · #ch-front 2024-08-05 · #sq-time 2026-08-25 |
| 13 | 미확정 스케줄 저장 방식 | 해소-의도 (Slack + 코드) | 같은 개인 근무계획 행의 확정 상태로 관리, [저장]=미확정 저장 → [확정]. 삭제도 '삭제 예정' 경유 | 그룹 DM 2026-10-26 · #sq-time 2025-11-26 · optimiz-time#1781 · `work_schedule_setting.ts` |
| 14 | 근무스케줄 백엔드 API / 캘린더 라이브러리 / 숫자키 사용성 | 기획 영향 없음 | Slack 검색 생략 | — |
| 15 | Cmd+Z 10회 제한 이유 | Slack에 없음 | 2024-03 체크리스트 항목(ppfront#7490)만 | 검색: "되돌리기 스케줄" |
| 16 | 위치정보 제공 조회 로그 무기한 보관 | 부분 | 법적 하한 "이용·제공사실 확인자료 6개월 이상 자동 보존, 위치값 포함 금지" 확인(2026 정기 실태점검 대응). 상한 결정 없음 | #sq-time 2026-06-22 https://hcgtheplus.slack.com/archives/C04QC2RJJBU/p1782120302639539?thread_ts=1782116967.818109&cid=C04QC2RJJBU · #cx 2026-11-04 |
| 17 | 연차촉진 프로덕션 체크리스트에서 특정(자사) 클라이언트 제외 이유 | 부분 (추정) | 명시 사유 없음. 해당 클라이언트는 자사이며 오픈 직후 실제 사내 촉진 운영에 사용 → 작업 삭제 불가라 섞이지 않게 뺀 것으로 추정 | #sq-sys 2025-06-26/30 · #notice-talenx 2025-06-30 · #sq-strategy 2025-07-09 |
| 18 | 연차촉진 서명 대상 | **해소-결정** | 서명 필수 = 연차 사용 계획서만. 미사용 연차 통지서·사용시기 지정 통보서는 서명 없이 확인. KB/spec의 "통지서 서명" 정정 | #sq-time 2025-06-10 https://hcgtheplus.slack.com/archives/C04QC2RJJBU/p1749527404507349?thread_ts=1749444345.441229&cid=C04QC2RJJBU · #sq-sys 2025-06-26 https://hcgtheplus.slack.com/archives/C04V0TUNRGV/p1750929103598859?thread_ts=1750903393.871339&cid=C04V0TUNRGV · #sq-time 2025-04-16 |
| 19 | 연차촉진 강제 모달 구현 | 기획 영향 없음 | Slack 검색 생략 | — |

동기화: `product/user/home/checkin-widget.md` ↔ `spec/user/home/checkin-widget.md` (4.2 표·주의, 7) · `widgets.md` ↔ spec (3.1 U-HOME-WDG-15, 4 #6, 7) · `work-summary.md` ↔ spec (4 #4·#6, 7) · `user/attendance/location-access-logs.md` ↔ spec (4 보존기간, 7) · `annual-leave-encouragement.md` ↔ spec (1, 3 U-ATT-ENC-02/03, 4 표·#4, 7) · `schedule.md` ↔ spec (4 #8·#9, 7)
