# 2026-11-05 미결 해소 — admin-work-b (근무 설정 / 근무 그룹 설정 / 근무 그룹 이력 관리 / 근무 데이터 관리)

근거 기준: talenx-admin `origin/dev`(2026-11-04), optimiz-time `origin/dev`, ppfront `origin/dev`. Slack #sq-time 일부.

## 해소 목록

### product/admin/work/base-setting.md
- 회계연도 시작일 = 조회 전용(기본 설정 영역 필드 항상 disabled). `ad:src/components/attendance/work/base_setting/contents/base_setting_tab/index.tsx:134,156`
- 한 주의 시작 "(개발필요)" = QA 메모일 뿐. 실제는 "회사 기준 추가" 모달로 **회사당 1회 등록**, 등록 후 변경·삭제 불가. 서버 거절 메시지 "이미 등록된 회사별 설정이 존재합니다." / "기존 시작일 기준으로 이미 정산이 완료되어 변경이 불가합니다." `be:common/timeoption/TimeOptionsService.java:81-125`
- 회사별 옵션 테이블 = `TM_COMPANY_TIME_OPTION`. POST가 항상 새 ID인 건 이력 보존이 아니라 INSERT 전용 구조
- 기타근무 "직접등록" 여전히 disabled (`ad:src/components/attendance/work/common/EtcWorkEditor.tsx`), 툴팁 "[기타 근무일정 등록]을 통해 직접 기록합니다."
- 신규: 공통 템플릿 사용→사용안함 저장 시 **모든 그룹 매핑 hard delete**, 재사용 시 그룹별 재매핑 필요 (`be:DdWorkPlanSettingService.java:314`)
- 신규: 근무 설정 화면은 공통 템플릿만 수정·삭제 가능, 템플릿명 그룹 내 중복 검사

### product/admin/work/group-setting.md
- 연장/야간/휴일 허용 실제 라벨 = 시스템코드 enum 표시명 (`be:constant/CONST_TIME_CODE.java`), e2e로 교차 확인
  - 연장: "연장 가능" / "승인 시에만 연장 가능" / "연장 불가"(**disabled**)
  - 야간: "야간 가능" / "승인 시에만 야간 가능" / "야간 불가"
  - 휴일: "근무 가능" / "승인 시에만 근무 가능" / "근무 불가"
  - 연장시간 관리 방식 4종(NP/P/M/S) 문구, 근무시간 포함여부 "포함"/"승인시간만 포함"/"미포함"(항상 disabled)
  - business-rules.md § 3의 "자유 허용 / 승인 시에만 / 근무계획시간 외 모든 시간"은 허용 옵션과 관리 방식을 섞은 표기 → 모순 해소
- 근무그룹 추가 모달: 근무그룹명·회사·메모·표준근로시간(일)(기본 8:00)·근무시간 관리(3택). `ad:.../group_setting/contents/WorkGroupAddDialog.tsx`
- 근무 신청서 관리: 근무계획 변경 1종 → 9종 + 활성화 조건 툴팁. `ad:.../work_request_form_setting/index.tsx:164-260`
- 출근지 관리 실제 라벨(재택근무 허용, 모바일앱/PC 출퇴근 허용, 출퇴근 등록 조건 4종)
- 섹션명 정정: "기타근무 항목 관리" → 실제 "기타근무 항목 설정", "기본설정", "기타설정"
- 근무그룹 이력 관리 화면 용도 TBD → group-history.md로 해소

### product/admin/work/group-history.md
- 365일 초과 처리: "조회 실패" / "조회 기간은 365일 이내로 설정합니다." (프론트) + 서버 `MAX_PERIOD_DAYS = 365`
- 실제 컬럼·필터 라벨 (활성 여부 필터 없음)
- **정정**: 소속 일수 0일 기준은 "종료일 미래"가 아니라 "시작일 미래". 진행 중(9999.12.31)/종료일 미래 이력은 오늘까지 일수. `be:WorkGroupHistoryQueryService.calcMembershipDays:156`
- 테이블: 근무·휴가 공용 `TM_GRP_HISTORY` + `GRP_CLASS` (TM_WORK_GRP_HISTORY/TM_LEAVE_GRP_HISTORY 아님)
- 이력 기록 트리거: `be:common/grouphistory/TimeGroupHistoryService.createGroupHistory:180`
- 휴가 측 컬럼: 근무제 유형 대신 입사일·연차기산일
- 신규 발견: 오늘 기준 소속 이력이 없으면 INNER JOIN 때문에 과거 이력도 목록에서 빠짐 (의도 미확인)

### product/admin/work/check-work-data.md
- 편집 차단 문구: 마감 "선택한 일자의 근무가 마감되어 통합 근무내역을 변경할 수 없습니다." / 진행 중 신청 "동일한 일자에 요청 중인 통합 근무내역 변경 신청이 있어, 통합 근무내역을 변경할 수 없습니다." — [적용] 비활성
- 진행 중 판정 대상: 출근·퇴근·통합 근무내역 변경 신청, 상태 결재중·수신처 처리중. 마감 먼저 판정. `be:InoutDataAdminService.getValidDate:785`, `findExistingApplicationInProgress:1165`
- **정정**: 연장 초과 메시지는 "연장근무 가능 시간을 초과했습니다"가 아니라 단위별 "일/주/월/월(휴일) 단위 초과근무 제한시간을 초과합니다" (`be:service/overtime/RemainingOvertime.java`)
- 엑셀 사유 필수 범위: 전사 근무현황 일/월 + 출퇴근 내역 일/월 모두. 편집 창 "등록 사유"는 선택
- 등록 방식 5종, 근무 구분 옵션 근무일/휴무일/휴일, 상태 구분 근무/자리비움
- 조회 기간 제한: 전사 일별 60일(프론트), 출퇴근 내역 31일(서버)
- `excel-download/all/search`는 프론트 미사용
- 첫 출퇴근 삭제 불가는 "기록 없는 날"에만 해당 (`ad:InoutRecordEditDialog.tsx:676`)

## 남은 항목
- 근무그룹에서 공통 템플릿 수정 시 fork 여부 (Slack #sq-time 2026-09-08 스레드에서 정책 논의, 코드상 그룹 측 fork 경로 미확인)
- 기타근무 "직접등록" 활성화 시점
- "연장 불가" disabled 이유
- 이력 화면에서 현재 소속 없는 구성원 제외가 의도인지
- `TM_DD_WORK_PLAN` 일별 적용본 구분 컬럼, WorkGrpSettingService vs WorkGroupSettingService 책임 구분, 어드민 hooks 패턴, DTO 필드 매핑, 우선순위 로직 위치, 어드민 직접 등록 기타근무 사용자 흐름, 휴일 추가 전파 시점

## 2026-11-05 Slack 재검토

검색 범위: Slack 전체(공개·비공개·그룹 DM). 항목당 2~5개 키워드 조합, 관련 스레드 전문 확인. 코드 보조 확인은 optimiz-time·talenx-admin `origin/dev` (읽기만).

| # | 항목 | 분류 | 결론 | 근거(채널·날짜·링크) |
|---|---|---|---|---|
| 1 | 공통 템플릿을 근무그룹에서 수정 시 그룹 복제 (2026-09-08 논의) | 해소-결정 | 정리된 정책: 근무그룹 설정 — 공통 템플릿 수정 = 복제(기존 동작), 그룹 템플릿 수정 = 불가(로 변경) / 근무 설정 — 공통·그룹 템플릿 수정 = 불가. 휴게 '자동' 계산 기준(로드맵 726)의 "저장 후 수정 불가 항목" 맥락이라 '불가'는 해당 항목 한정으로 보임(추정). ⚠️ 백엔드 `updateWorkGrpDdWorkPlan`은 같은 ID 갱신 — 복제가 프론트에서 일어나는지 코드 미확인 | #sq-time 2026-09-08 https://hcgtheplus.slack.com/archives/C04QC2RJJBU/p1788854849975349?thread_ts=1787721270.470399&cid=C04QC2RJJBU (검색어: 공통 템플릿 근무그룹 수정 / 복제) |
| 2 | 기타근무 "직접등록" 활성 시점 | 부분 | 일정 언급 없음. 의미: "기타근무도 출퇴근 체크를 하기 위한 옵션". 승인 없이 기록하려면 요청/승인 + 본인 결재선으로 운영하도록 안내 | #cx 2025-04-08 https://hcgtheplus.slack.com/archives/C01AVJ2CJBW/p1744073235761519 (검색어: 직접등록 기타근무 / 직접등록 버튼 / 기록 방식 기타근무) |
| 3 | "연장 불가" 옵션 비활성 이유 | 해소-의도 | 미개발이라 전 근무그룹 비활성(선택적 근로제 때문 아님). 출퇴근 기록·근무내역 변경 신청에서 연장 불가 처리 흐름 없음. 개발 계획 아직 없음, 수당 미지급은 급여 계산식으로 대응. (2026-01-21 과제 "연장불가/야간불가 옵션 활성" 중 야간만 활성) | #channeltalk 2026-10-08 https://hcgtheplus.slack.com/archives/C06ULEEM88M/p1791437987351259?thread_ts=1791433855.695899&cid=C06ULEEM88M · #cx 2026-10-08 https://hcgtheplus.slack.com/archives/C01AVJ2CJBW/p1791442813222909?thread_ts=1791441741.090759&cid=C01AVJ2CJBW (검색어: 연장불가 / "연장 불가") |
| 4 | 기타 설정(자동 집계·월 단위 집계 기준) 기본값·개발 일정 | 부분 | 기획 기본값: 일 자동 집계 사용·익일 06시 / 월 자동 집계 미사용 / 집계 기준월 1일~말일, 모두 비활성, 근무그룹 생성 시 초기값. 개발 일정 언급 없음 | #sq-time 2024-08-19 https://hcgtheplus.slack.com/archives/C04QC2RJJBU/p1724034002861379?thread_ts=1724033318.179369&cid=C04QC2RJJBU (검색어: 자동 집계 월 단위 기준 / 자동근무집계 월단위) |
| 5 | 이력 화면에서 현재 소속 없는 구성원 제외 의도 | Slack에 없음 | PR #3642 공유 외 설계 논의 없음 | (검색어: 근무그룹 이력 관리 조회 / 그룹 이력 퇴사자 현재 소속 / 3642) |
| 6 | 진행 중 신청 차단 문구 분리 계획 | 부분 | 문구 분리 계획 없음. 다만 2026-11-03 CS 사례로 혼선 확인(진행 건이 출근 요청). "출근/퇴근 신청 내역 탭 고도화" 과제 등록 예정. (대시보드 쪽은 2026-10-02 제외 사유를 통합/출퇴근으로 분리 완료 — KB 반영 상태) | #channeltalk 2026-11-03 https://hcgtheplus.slack.com/archives/C06ULEEM88M/p1793670910494619?thread_ts=1793668630.185329&cid=C06ULEEM88M · #sq-time 2026-10-02 |
| 7 | 어드민 직접 등록 기타근무 사용자 흐름 | 부분 | 사용자 화면 3곳에 어드민 전용 다이얼로그 + 등록 사유. 어드민 삭제가 사용자 화면에 반영 안 되던 버그 → 2026-09-09 수정(optimiz-time#1696). 전체 흐름 문서화는 남음 | #sq-time (#054) https://hcgtheplus.slack.com/archives/C04QC2RJJBU/p1772065269988409 · #cx 2026-09-09 |
| 8 | 회사 휴일 추가의 근무그룹 반영 시점 | Slack에 없음 | 관련 논의 없음 | (검색어: 회사 휴일 근무그룹 반영 추가 / 공통 휴일 그룹 재집계) |
| 9 | `TM_DD_WORK_PLAN` 일별 적용본 구분 컬럼 | 기획 영향 없음 | Slack 검색 생략 | — |
| 10 | WorkGrpSettingService vs WorkGroupSettingService 책임 | 기획 영향 없음 | Slack 검색 생략 | — |
| 11 | 어드민 hooks 패턴 / ddAggrTime 백엔드 일치성 | 기획 영향 없음 | Slack 검색 생략 | — |
| 12 | 편집 payload·DTO 필드 매핑 | 기획 영향 없음 | Slack 검색 생략 | — |
| 13 | 산정 우선순위 로직 코드 위치 | 기획 영향 없음 | Slack 검색 생략 | — |

반영: `product/admin/work/base-setting.md`·`group-setting.md`·`group-history.md`·`check-work-data.md` 검증 절(+ group-setting 라디오 표), 짝 `spec/admin/work/*` 3·4·7절.
