# 2026-11-05 미결 해소 — admin-work-a (근무 신청 내역 관리 · 근무 마감 · 근무 대시보드 · 개인 근무 스케줄 관리)

근거 기준: talenx-admin `origin/dev`(2026-11-04), optimiz-time `origin/dev`, GitHub PR 본문, Slack #sq-time.

## 해소 목록

### 근무 신청 내역 관리 (`product/admin/work/appl-management.md`)
| 항목 | 결과 | 근거 |
|---|---|---|
| 실제 10탭 vs 문서 4탭 | 10탭 전체 정리 (필터·컬럼·상태·API·DB) | `ad:src/components/attendance/work/appl_management/index.tsx:28-89`, `be:controller/workadmin/WorkApplManagementController.java` |
| 기본 선택 탭 | 근무계획 변경 신청 (URL 파라미터 유지) | `index.tsx:43-46` |
| 승인/반려 가능 여부 | 불가, 조회 전용. 쓰기는 기타근무 수동등록·삭제뿐 | onRowClick/onCellClick 0건 |
| 근무내역 변경 탭 반려/취소 미표시 이유 | 백엔드가 110/200/700/900만 조회 (의도 주석 없음) | `be:service/workadmin/WorkApplManagementService.java:72-101` |
| 사전 연장·야간 "기타근무 유형" 필터 | 없음 (QA 오기). 야간근무 여부 필터도 미렌더링 | `OvertimeRequestFilter.tsx:292-376` |
| 각 탭 컬럼 | 탭별 정리 | 각 *Table/List.tsx |
| 재택/대체/사전휴일근무 어드민 처리 위치 | 이 화면의 탭 (조회), 결재는 워크플로우 | 탭 추가 PR #3738 / #3896 / #3993 |
| 취소 신청서 표시 | 별도 행 없음 — 탭별 방식 상이 | `WorkForHomeApplAdminQueryService`, `OvertimeApplAdminQueryService`, `HolidayWorkApplAdminQueryService` |
| 기타근무 DB 테이블 | `TM_OTHER_WORK_APPL` / `_DTL` (MyBatis only) | `OtherWorkDataAdminMapper.xml` |
| 기타근무 삭제 실제 동작 | 물리 삭제 아님 → 상태 930 + 집계 이벤트 | `OtherWorkAdminCommandService.java:706-772` |

**QA → 코드 변경점**: 기간 필터가 전 탭 "월별/일별, 기본 월별"로 통일됨 (QA: 근무계획 일별 기본, 기타근무 연도별/기간 조회).

### 근무 마감 (`product/admin/work/close-work-data.md`)
| 항목 | 결과 | 근거 |
|---|---|---|
| 메모 필수 여부 모순 | **선택** (프론트 * 없음·검증 없음, 백엔드 미검증) | `BulkCloseWorkDialog.tsx`, `CloseWorkDataService.java:281-316` |
| 적용일 필드 의미 | 읽기 전용 "오늘" 표시, payload 미전송 — 안내용 | `BulkCloseWorkDialog.tsx` (DatePicker disabled) |
| 일괄해제 UI 노출 | 마감 내역 탭 체크박스 + "일괄 해제" 버튼 (CLOSE_BULK & 미해제만 선택) | `CloseWorkHistoryList.tsx:104-419`, hcgtheplus/talenx-admin#3814 (2026-06-11) |
| 개별 마감 진입 | 없음 — 코드값·라벨만 존재, API 없음 | 컨트롤러 전수 |
| 에러 문구 | 백엔드 문구 표로 정리. 대상 0건은 실제로 "근무 마감 이력 생성 대상자가 없습니다" (null 체크가 빈 리스트를 못 잡음, 코드 추론) | `CloseWorkDataService.java:129-181` |
| 테이블명 | `TM_CLOSE_WORK_DATA_HISTORY` / `_MEMBER` / `_WORK_GROUP` | mapper XML/마이그레이션 |
| VO 풀 필드 | 8필드 | `CloseWorkDataHistoryVo.java:17-38` |
| 결재중 신청서 처리 | 마감 시 신청서 건드리지 않음 | `closeWorkBulk` |
| 개인별 마감 상태/마감 내역 필터·컬럼 | 정리 | 각 Filter/List |
| 회사 필드 | 단일 아닌 **다중 선택** | `BulkCloseWorkDialog.tsx` |

### 근무 대시보드 (`product/admin/work/dashboard.md`)
| 항목 | 결과 | 근거 |
|---|---|---|
| "근무내역 변경" 컬럼 | 진행 중 신청 있으면 "요청중", 없으면 "-" | `DailyWorkStatusList.tsx:738-759` |
| 알림 발송 제외 모달 문구 | 원문 확보 + 제외 사유 3종 | ko locale `WORK_DASHBOARD.*` |
| 누락 건만 보기 비활성 | **2026-10-22 변경: 오늘 이후에도 체크 가능** (기획 변경) | hcgtheplus/talenx-admin#4581 |
| 알림 활성 조건 | QA 3개 + **활성 구성원** 조건 추가 | `isRowSelectable` `:941-946` |
| 백엔드 발송 제약 | 오늘 이전 날짜만 | `WorkDashboardAdminService.java:498-522` |

### 개인 근무 스케줄 관리 (`product/admin/work/personal-schedule.md`)
| 항목 | 결과 | 근거 |
|---|---|---|
| 선택적 근로 스케줄 탭 | 조회 전용, 컬럼·필터 정리 | `work_plan_establishment_tab/`, hcgtheplus/talenx-admin#4176 (2026-08-20) |
| endpoint | 전체 표 | `config/api/attendance/personalWorkTemplateManagement.ts` |
| 진행 중 신청서별 삭제 차단 | 권한 → 허용기간(내일부터) → 마감 → 근무계획변경 → 대체근무 순 분류, 부분 삭제 | `PersonalWorkPlanAdminCommandService.delete` |
| "그룹 스케줄" 버튼 | 버튼 아님 — 컬럼 그룹 헤더 | `PersonalWorkTemplateManagementList.tsx:628-660` |
| 미문서화 기능 | "스케줄 등록" 엑셀 업로드(비동기 job) — hcgtheplus/talenx-admin#3659 (2026-05-19), 변경 구분 "개인스케줄 변경(어드민)" 추가 | locale/코드 |
| 변경 구분 라벨 | "스케줄변경(직책자)" → 현재 "개인스케줄 변경(직책자)" | ko locale |
| Hard delete | 맞음, 단 삭제 직전 변경 로그 캡처 | `recordAndDeletePersonalWorkPlans` |

## 기획 ≠ 구현 / 변경
- 대시보드 "누락 건만 보기": QA(오늘 이후 비활성) → 2026-10-22 의도적 변경(PR 본문 명시). 기획 변경으로 판단
- 근무 마감 개별 마감/개별 해제: 기획 시점(Slack #sq-time 2025-11-07, 11-19) 코드 4종 정의 → 구현은 일괄 마감/일괄 해제만
- 근무 마감 대상 0건 메시지: 의도 문구 "근무 마감 대상이 존재하지 않습니다" ≠ 실제 노출 "근무 마감 이력 생성 대상자가 없습니다" (코드 추론, 런타임 미검증)
- 근무 신청 내역 관리 QA 표기(근무계획 일별 기본, 기타근무 연도별, 사전 OT 기타근무 유형 필터) ≠ 현재 화면

## 남은 항목
- 통합 근무내역·출퇴근 내역 변경 탭의 반려/취소 제외가 기획 의도인지
- 어드민 등록 기타근무의 사용자 캘린더 구분 표시
- 마감 후 남은 결재중 신청서 승인 시 차단 여부
- 개별 마감/해제 도입 계획
- 개인 스케줄 인라인 편집(주석 처리) 출시 계획, 근무 스케줄 탭에 선택적 근로제 소속자 포함 여부
- APPL_STAT 코드 의미(110/200/300/310/700/900/930)는 optimiz-system 로컬 브랜치에서만 확인 — origin 미검증

## 2026-11-05 Slack 재검토

검색 범위: Slack 전체(공개·비공개·그룹 DM) — #sq-time, #cx, #channeltalk, #ch-plan, #ch-time-developer, #bizops-center 등. 항목당 2~5개 키워드 조합, 관련 스레드는 전문 확인. 코드 재확인은 optimiz-time `origin/dev` (읽기만).

| # | 항목 | 분류 | 결론 | 근거(채널·날짜·링크) |
|---|---|---|---|---|
| 1 | 통합 근무내역·출퇴근 내역 변경 탭의 반려/취소 제외 의도 | 부분 | 탭 목적은 "출퇴근 내역은 승인 확정건만 보이니 요청중까지 보기". 반려·취소 제외 결정 기록 없음. 출퇴근 내역 변경 1차 QA에서도 "반려/취소" 미확인으로 남음 | 그룹 DM 2026-03-10 https://hcgtheplus.slack.com/archives/C0972K4H86Q/p1773122249004409 · #sq-time 2026-10-07 https://hcgtheplus.slack.com/archives/C04QC2RJJBU/p1791375200514449?thread_ts=1791372323.280559&cid=C04QC2RJJBU (검색어: 통합 근무내역 변경 반려 / 근무신청내역 취소 / 출퇴근 내역 변경 탭 승인완료 / 근무내역변경신청 내역 페이지) |
| 2 | 어드민 등록 기타근무의 사용자 캘린더 구분 | 해소-결정 | 사용자 화면 3곳(내 근무 캘린더·근무내역 상세·구성원 근무 현황)에 등록 방식(APPL/DIRECT) 추가 → 직접 등록 건은 어드민 전용 다이얼로그 + 등록 사유(없으면 미표시). 캘린더 표시 자체를 달리하는 결정은 없음 | #sq-time 2026-02-26~03 "(#054) 기타근무 수동 등록" https://hcgtheplus.slack.com/archives/C04QC2RJJBU/p1772065269988409 (검색어: 어드민 등록 기타근무 캘린더 / AdminDirect / 기타근무 수동등록 사용자 / inputType) |
| 3 | (신규) 출근/퇴근 요청이 근무 신청 내역 관리 어디에도 안 나옴 | 부분 | CS 사례: 어드민 편집이 "요청 중"으로 막혔는데 통합 근무내역 변경 탭에 데이터 없음 → 출근 요청이었음. "출근/퇴근 신청 내역 탭 고도화" 로드맵 과제로 올리기로 함(미확정) | #channeltalk 2026-11-03 https://hcgtheplus.slack.com/archives/C06ULEEM88M/p1793670910494619?thread_ts=1793668630.185329&cid=C06ULEEM88M |
| 4 | 마감 후 남은 결재중 신청서 승인 시 차단 여부 | 해소-의도 | 차단됨: 결재함엔 '승인필요'로 남지만 승인 시 '기한만료'로 거절, 반려만 가능. 마감 해제 → 승인 → 재마감으로 안내. 목록에서 '기한만료'로 구분 표시하는 개선은 근무+코어 작업 필요로 논의만 | #cx 2026-08-25 https://hcgtheplus.slack.com/archives/C01AVJ2CJBW/p1787646308384229?thread_ts=1787630719.002329&cid=C01AVJ2CJBW · #cx 2026-10-13 https://hcgtheplus.slack.com/archives/C01AVJ2CJBW/p1791883591973619 (검색어: 마감 결재중 승인 / 기한만료 마감 / 근무 마감 요청중 신청서) |
| 5 | 개별 마감/해제 도입 계획 | 부분 | 도입 계획 언급 없음. 코드값은 2025-11-07/11-19 API 스펙 정의뿐. 고객이 1명만 해제 원했으나 "근무그룹 전체 해제 필요"로 안내된 사례 | #sq-time 2025-11-07/11-19 · #cx 2026-10-14 (위 #4 스레드) (검색어: 개별 마감 / CLOSE_INDIVIDUAL / 구성원별 마감 해제) |
| 6 | (신규) 마감 시 결재중 신청서 처리 — 기획 초안 vs 구현 | 부분 | 기획 초안 "요청중 신청서가 있으면 마감에서 제외" ≠ 구현(제외 없이 일괄 마감, `CloseWorkDataService`에 신청서 조건 없음 — origin/dev 재확인). 변경 결정 기록 없음 | #ch-plan 2025-10-29 https://hcgtheplus.slack.com/archives/C02VCP9MBQV/p1761740806119959?thread_ts=1761737316.880899&cid=C02VCP9MBQV |
| 7 | 마감 대상 0건 메시지 | 부분 | 실제 노출 문구 "근무 마감 이력 생성 대상자가 없습니다"를 2026-03-04 로컬 테스트에서 확인(코드 추론 → 런타임 확인). 의도 문구로 바꿀 계획은 없음 | #sq-time 2026-03-04 (#054 스레드 내) https://hcgtheplus.slack.com/archives/C04QC2RJJBU/p1772065269988409 (검색어: "마감 이력 생성 대상자가 없습니다" / "마감 대상이 존재하지") |
| 8 | 개인 스케줄 인라인 편집(주석 처리) 출시 계획 | 부분 | 2026-04 메뉴 신설 때 "테이블 수정/엑셀 업로드/템플릿 중복"을 범위 문제로 다음 스프린트로 미룸. 엑셀 업로드만 출시(#3659), 테이블 수정 이후 일정 언급 없음. 개인스케줄 '메모' 컬럼도 수정 기능 때 추가 예정 | #sq-time "(058) admin - 개인스케줄 조회 & 관리" https://hcgtheplus.slack.com/archives/C04QC2RJJBU/p1776841527319959 (검색어: 개인 스케줄 수정 저장 어드민 / 개인 근무계획 수정 upsert / 테이블 수정 개인스케줄) |
| 9 | 근무 스케줄 탭에 선택적 근로제 소속자 포함 여부 | 해소-의도 | 포함됨. 그룹 스케줄 표시, 개인 스케줄 칸은 공백(수립 계획은 선택적 근로 스케줄 탭), 신청서로 바뀐 날만 개인 스케줄 표시. 어드민 등록·직책자 변경·근무계획 변경 신청 불가 | #sq-time 2026-08-25 https://hcgtheplus.slack.com/archives/C04QC2RJJBU/p1787638249823189?thread_ts=1787635908.267959&cid=C04QC2RJJBU (검색어: 선택적 근로 개인 근무 스케줄 관리 / 선택적 근로제 공백) |
| 10 | 마감 시 스냅샷 데이터 | 기획 영향 없음 | Slack 검색 생략 | — |
| 11 | 개인 스케줄 hard delete 사용자 반영(push) | 기획 영향 없음 | Slack 검색 생략 | — |
| 12 | APPL_STAT 코드값 origin 미검증 | 기획 영향 없음 | Slack 검색 생략 | — |
| 13 | 대시보드 "오늘 날짜는 발송 대상이 생기지 않음"(추정) | 기획 영향 없음 | Slack 검색 생략 | — |

반영: `product/admin/work/appl-management.md`·`close-work-data.md`·`personal-schedule.md` 검증 절, 짝 `spec/admin/work/*` 4절·7절 (dashboard는 변경 없음).
