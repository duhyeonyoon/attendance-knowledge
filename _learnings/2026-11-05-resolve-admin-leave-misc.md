# 미결 항목 해소 — admin 휴가 / 모듈 설정 / 권한 / 과거 데이터 / 연동 (2026-11-05)

기준: talenx-admin `origin/dev` ad77c4367, optimiz-time `origin/dev` b534d01df, ppfront `origin/dev` 2073a39c8. 읽기 전용(git show/grep, gh).

## 1. 휴가 (product/admin/leave ↔ spec/admin/leave)

### 해소
1. **메뉴 분리 반영**: 2026-08-20 `hcgtheplus/talenx-admin#4185`로 "휴가 지급 및 관리"가 연차 관리(`/attendance/leave/annual_management`) / 연차 외 휴가 관리(`/non_annual_management`)로 분리됨. 각 2탭(`?tab=summary|usage`), 옛 `/attendance/leave/management`는 연차 관리로 리다이렉트. 연차 촉진은 원래부터 별도 메뉴. 서브어드민 권한은 아직 하나로 묶임 → ⚠️ 배너 3쌍 제거
2. **1년 미만 연차 초과 사용 모순 해소**: "초과 사용은 정상연차 전용"(spec 공통 #12, 연차 관리 #4, 7/29 learnings §5)은 2026-09-17 이전 기준. `hcgtheplus/optimiz-time#1642` / `talenx-admin#4375` / `ppfront#11374`로 연차 제도에 "1년미만연차 초과 사용"(기본 꺼짐, 제한 없음 또는 최대 N시간) 신설. 확정 시점 도래분 기준, 사이클 총량 한도, 초과분은 사용일을 덮는 도래 생성분 중 사용종료일 최신 건에 음수 잔여. 어드민 수동등록 분류: 꺼짐 → "1년 미만 연차 부족"(등록 불가) / 켜짐+한도 내 → 그냥 등록 / 켜짐+한도 초과 → "연차 부족"(강제 등록 가능). 강제 등록도 꺼짐은 우회 안 함 (`be:pojo/leave/MonthlyAnnualDirectDeductionCalculator.evaluateNewItem`). 연차 외 휴가는 여전히 초과 사용 없음 (`CalcLeaveService` TODO)
3. **1년 미만 연차 부족분 정산**: 월차 정책(전체 보상/이월/소멸)과 같은 방식으로 청산. "연차 초과 사용분 정산 정책"은 정상연차 전용 (#1642 §3)
4. **연차 촉진 양식 없을 때**: 회사 선택 후 회사별 양식을 subType(통지서/계획서/통보서)으로 나눠 셀렉트 옵션 구성. 양식이 없으면 옵션이 비어 필수 메시지("미사용 연차 통지서 선택은 필수입니다." 등)로 막힘. 별도 "양식 없음" 안내 없음. 백엔드도 템플릿 ID 3종 필수 (`ad:helpers/attendance/leave/encouragement/leaveEncouragementValidationRules.ts`, `be:validator/encouragementadmin/AdminEncouragementValidator`). 사전 준비 = 시스템 › 양식관리, 유형 "동의서" (talenx-admin#3760)
5. **연차 촉진 고도화 반영** (#3760, #3843): 회사·귀속연도 필수, 작업 기준(분할/단일 — 1년미만연차 전용, 분할이면 2건 + 두 번째 작업명에 "(1년미만연차 추가발생의 촉진)"), 대상자 관리 모달, 촉진기간 엑셀 업로드, 상태 13종, 사용시기 통보 제외. 수정은 작업명·메모만
6. **연차 자동 생성 다이얼로그 현행화**: 퇴직자 제외/전원 퇴직 시 버튼 비활성 툴팁, 마감 구성원 포함 시 "연차 자동 생성 불가", 기생성자 덮어쓰기 안내 문구, 사용기간 밖 사용 내역 구성원 부분 생성/전원 불가 (`ManualAnlCreationDialog.tsx`). 연차 조정도 마감 구성원 포함 시 "연차 조정 불가"
7. **휴가그룹 제도 선택 방식**: 연차 제도·정산 기준 = 라디오(1개), 연차 외 = 체크박스(다수). 확정 후 툴팁 문구 "연차 제도는 최초 저장 이후 수정할 수 없습니다." / "연차 정산 기준은 최초 저장 이후 수정할 수 없습니다."
8. **휴가그룹 이력 관리 컬럼·메시지**: locale `LEAVE_GROUP_SETTING_HISTORY_MANAGEMENT`. 활성여부 필터는 없음. 365일 초과 "조회 기간은 365일 이내로 설정합니다." **정정**: 소속일수 0일은 "종료일이 미래"가 아니라 "**시작일이 미래**"인 이력. 종료일 미래/미정은 오늘까지 일수 (툴팁 문구). 근무 그룹 이력 쪽 spec에도 같은 오류가 있는지 확인 필요(담당 외)
9. **연차 외 휴가 관리 문구**: 지급 대상 툴팁은 "휴가 **유형**을 먼저 선택 후 지급대상을 선택합니다."(KB의 "휴가 종류"는 오기). 삭제/정산/정산취소 확인·오류 문구, 지급 단위 셀렉트는 "시간" 고정 비활성. 수동등록 부족 건 자동 제외 근거 = 초과 사용 미구현 ((추정) 제거)
10. **`TM_LEAVE_PAY_HISTORY_ACCESS_TIME`**: 어드민별·관리구분별 부여/지급 내역 화면 마지막 열람 시각. 권한 범위 내 지급 이력 최신 수정 시각이 더 늦으면 red dot
11. **선부여 코드 = `evmCrtMth=BF`**, `TM_ANL_CM_RULE` 죽은 코드 — 7/29 learnings 내용을 overview 본문에 반영
12. **KB↔명세서 정합성**: 11/02·7/29 learnings 중 spec에만 있던 사실(연차 제도 매핑 후에도 전체 수정 가능, 연차 외 휴가 제도 수정 잠금 항목, 휴가 설명 필수, 별도 기준(T) 비활성, 첫 회계연도 일할/월할 최소단위, 정산 기준 1일/1시간 반올림·비율/일수, 반복주기 1개월/1년, 차감 순서, CRT_YY 의미, USE_M_CNT 확정분만, 근무율 미반영, 마이너스 합산 표시, 연차 생성 실패 1순위 원인, 사용기간 반복 문의, 정산 후 재생성 IS_CLOSED)을 코드 재확인 후 product 본문에 반영

### 남은 항목 (휴가)
- 연차 자동생성 시 회계연도/입사일 기준 정확한 부여 계산 규칙
- 정산 취소 "다음 귀속연도 잔여 < 이월분 → 회수 불가" 세부 판정 위치
- 어드민 직접 등록 휴가의 사용자 화면 표시 흐름(`AdminDirectLeaveDialog`)
- 휴가그룹 임시저장/확정이 근무그룹과 백엔드까지 동일한지
- 연차 외 휴가 정산 전/후 구분 불가 문제의 화면 영향
- 연차 조정 사용시작일 검증이 프론트에만 있는 것이 의도인지
- 연차 촉진이 수동 조정값을 반영하지 않는 것이 의도인지
- 연차/연차 외 사용 현황 탭 [등록 내역] 버튼이 항상 비활성 — 오픈 계획
- 연차 외 수동 지급 "적용일" 필수 여부 (spec `Y (추정)` 유지)

## 2. 모듈 설정 / 권한 / 과거 데이터 / 연동 (product ↔ spec 9쌍)

### 해소
1. 구성원 정보: 필터 7개, 컬럼 약 21개, [항목 설정], [구성원 등록](항상 비활성), 엑셀 다운로드 사유 필수. **연차기산일 변경 시 기존 연차 재계산 없음** — 다음 자동 생성부터 반영
2. 조직 설정: 엑셀 다운로드 사유 필수, [관리자 일괄 수정]·[새 조직 추가] 항상 비활성(툴팁 "인사관리 모듈에서 설정이 가능합니다.")
3. 직책 설정 메시지: "이미 존재하는 직책입니다." / "직책명은 최대 20자까지 입력할 수 있습니다." / "직책명이 없습니다." / 구성원 있는 직책 삭제 "삭제 실패". 직책자 권한 그룹에 포함된 직책도 삭제 불가 (신규)
4. 서브어드민 '그룹 모듈' 필터 = 실제 라벨 "그룹명", 권한그룹명 목록 (코드 변수명 moduleOptions에서 온 오해)
5. 업무권한은 **5개 구분**(근무 설정 관리 / 근무 실무 관리 / 휴가 설정 관리 / 휴가 실무 관리 / 과거 데이터 관리) + 상세분류↔메뉴 매트릭스
6. 서브어드민 저장 밸리데이션 문구, 담당자 있을 때 그룹 삭제 비활성 툴팁
7. 다중회사 다중조직 제약은 **2025-12-24 해제**
8. 직책자 권한: 조직장 조건("제한없음"/"조직장만 권한 부여"), 범위("본인 조직"/"본인 + 하위조직"), 권한 항목 2개, 한 직책은 한 그룹만, 그룹 삭제 제약 없음(권한 즉시 회수)
9. 과거 데이터: OldWorkDataController 위치, 엑셀 컬럼·필수값, hard delete, 오류 행 1개라도 있으면 전체 미저장, 중복 업로드는 새 행으로 누적, 등록 회사 = 업로더 소속 회사, 사용자 화면 미노출
10. 연동: 켜기/끄기는 Kafka 토픽 `HRM_ACTIVATE_SYNC` 경유, 끄면 토큰 삭제 + 구성원 제공자만 자체관리 전환(활성 상태 유지). 벌크 재동기화 순서 직책→조직→회사→구성원

### 기획 ≠ 구현
- 연차 관리 / 연차 외 휴가 관리 서브어드민 권한 분리: 메뉴·백엔드 권한 코드는 분리됐으나 클라이언트 권한 목록(TM_JOB_AUTH) 마이그레이션 없음 → 화면엔 기존 권한 한 줄이 "연차 관리, 연차 외 휴가 관리"로 보임
- 근무 대시보드 업무권한: 코드·매핑은 있으나 시드는 로컬 데이터 파일에만
- 권한그룹 삭제 판정: 권한 기간 종료된 담당자도 "담당자 있음"으로 봄 (백엔드 TODO)

### 남은 항목
- 서브어드민 담당 범위 근무그룹 옵션 숨김 유지 여부
- 연차 관리/연차 외 휴가 관리 권한 분리 부여 일정
- 인사 모듈 [재연동] 버튼 ↔ 근무 벌크 동기화 API 매핑 (인사 코드 미확인, (추정))
- 과거 데이터 중복 업로드 누적이 의도인지


## 2026-11-05 Slack 재검토

검색 범위: Slack 전체(공개·비공개·그룹 DM) 항목당 2~4개 키워드 조합, 관련 스레드는 전체 읽음. 읽기 전용. 반영 파일: product `leave/{annual-management,encouragement,base-setting,overview,group-setting,non-annual-management}.md`, `authority/custom.md`, `module-setting/overview.md`, `old-data/work-data.md`, `etc/sync.md` + 짝 spec.

| # | 항목 | 분류 | 결론 | 근거(채널·날짜·링크) |
|---|---|---|---|---|
| 1 | 연차 조정 사용시작일 검증이 프론트에만 있음 / 기산일 사후 변경 시 조정 전체 차단 | 부분 | 백엔드는 최소 검증(종료일 이전·귀속연도 이전 불가)만, 입사일·기산일 비교는 화면에서 — 의도. 사용시작일 수정은 1년 미만 연차 행만. 기산일 변경 후 조정 봉쇄 부작용은 논의 없음 | #sq-time 2025-09-05 https://hcgtheplus.slack.com/archives/C04QC2RJJBU/p1757036982628769?thread_ts=1756881739.320469&cid=C04QC2RJJBU , 2025-09-12 https://hcgtheplus.slack.com/archives/C04QC2RJJBU/p1757651212056129?thread_ts=1756881739.320469&cid=C04QC2RJJBU |
| 2 | 연차 촉진이 수동 조정분 미반영 | 해소-의도 | 의무사용 = 자동(+이월 옵션), **조정은 모두 의무사용 외**로 확정 | #ch-plan 2025-12-03 https://hcgtheplus.slack.com/archives/C02VCP9MBQV/p1764768902674949?thread_ts=1761704202.867549&cid=C02VCP9MBQV |
| 3 | 사용 현황 [등록 내역] 항상 비활성 | 부분 | 편의 기능이라 보류 결정(2025-04), 개발 미진행(2025-08), 2026-04 사라진 버튼을 비활성으로 복구. 오픈 일정 없음 | #sq-time 2025-04-02 https://hcgtheplus.slack.com/archives/C04QC2RJJBU/p1743566452590039?thread_ts=1742969619.502569&cid=C04QC2RJJBU , 2025-08-07 https://hcgtheplus.slack.com/archives/C04QC2RJJBU/p1754549516080659?thread_ts=1754461963.427789&cid=C04QC2RJJBU , 그룹 DM 2026-04-20 https://hcgtheplus.slack.com/archives/C0972K4H86Q/p1776671463860189 |
| 4 | 연차 자동 생성 회계연도/입사일 기준 계산 규칙 | 해소-결정 | 생성 기준일(회계연도 시작일 / 연도+입사월일)에 소속된 휴가그룹 설정으로 생성. 첫 해: 입사일 기준은 0년 행 있을 때만 0년차 생성, 회계연도 기준은 0년 행 일수(없으면 15일)로 첫 회계연도 계산. 첫 회계연도만 입사일 기준 옵션 없음 | #sq-time 2025-12-15 https://hcgtheplus.slack.com/archives/C04QC2RJJBU/p1765785467045259?thread_ts=1765763493.185579&cid=C04QC2RJJBU , #channeltalk 2026-04-27 https://hcgtheplus.slack.com/archives/C06ULEEM88M/p1777255120624029?thread_ts=1777252624.509129&cid=C06ULEEM88M , #cx 2026-08-11 https://hcgtheplus.slack.com/archives/C01AVJ2CJBW/p1786429967926669?thread_ts=1786429398.644369&cid=C01AVJ2CJBW |
| 5 | 정산 취소 이월분 판정 기준 | 해소-결정 | 차년도 잔여 < 이월 일수 → 정산 취소 에러, 충분하면 차년도 이월에서 회수(기존 '이월 유지'는 수정 대상). 연차 외는 이월분 사용 시 취소 불가. 코드 반영 확인: 넘어간 이월분만큼만 차감, 차년도 2건 이상·차년도 정산 완료 시 에러 (`be:AnnualLeaveSettlementService.prepareLeaveCrtToCancel`) | #ch-plan 2025-12-04 https://hcgtheplus.slack.com/archives/C02VCP9MBQV/p1764832416057689?thread_ts=1761704202.867549&cid=C02VCP9MBQV |
| 6 | 휴가그룹 임시저장/확정이 근무그룹과 백엔드까지 동일한지 | 해소-결정 | 같은 패턴(tempSaveYn + init-save/temp-save API, 2024-08). 저장 버튼 활성 조건 차이는 2026-06 근무그룹과 동일하게 수정(#3818) | #sq-time 2024-08-05~19, 2026-06-05 https://hcgtheplus.slack.com/archives/C04QC2RJJBU/p1780643572910569?thread_ts=1780633505.503649&cid=C04QC2RJJBU , #github-talenx-admin 2026-06-08 https://hcgtheplus.slack.com/archives/C05HD5UGV4M/p1780878533638309 |
| 7 | 연차 외 휴가 정산 전/후 구분 불가 | 해소-결정 | 정산 여부는 TM_LEAVE_CRT 값 유무가 아니라 IS_CLOSED(마감 여부)로 판단. 화면은 백엔드 값 그대로, 정산 완료 시에만 값이 채워지는 게 정상 | #sq-time 2026-07-01 https://hcgtheplus.slack.com/archives/C04QC2RJJBU/p1782897504316579?thread_ts=1782883925.259899&cid=C04QC2RJJBU |
| 8 | 서브어드민 연차 관리/연차 외 권한 분리 시점 | 부분 | 메뉴 먼저 + 신·구 권한 동시 허용(DB 변경 없음) → 후속 PR에서 신규 권한·백필로 **단계 분리** 결정. 후속 일정 없음 | #sq-time 2026-08-12~19 https://hcgtheplus.slack.com/archives/C04QC2RJJBU/p1786514088608529?thread_ts=1785376034.381089&cid=C04QC2RJJBU |
| 9 | 과거 데이터 중복 업로드 누적이 의도인지 | 부분 | "근무 모듈과 무관한 단순 과거 기록, 입력값 그대로 신뢰, 필수·형식만 검증" 방침만 확인. 중복 처리 논의 없음 | #sq-time 2026-02 https://hcgtheplus.slack.com/archives/C04QC2RJJBU/p1770196802998979 , 통합 스레드 https://hcgtheplus.slack.com/archives/C04QC2RJJBU/p1770870139205759 |
| 10 | 과거 데이터 화면 사용 시점 | 해소-의도 | 도입 고객사 이전 시스템 데이터 이관(로드맵 '과거 데이터 마이그레이션'), 연차 화면 우선 | 위 #9 스레드, #ch-plan 2025-12-10 https://hcgtheplus.slack.com/archives/C02VCP9MBQV/p1765331257282209?thread_ts=1765324816.885689&cid=C02VCP9MBQV |
| 11 | 인사 [재연동] 버튼 동작 | 해소-의도 | 인사 → 근무 전체 재연동. 조직 회사코드·회사 정보까지 갱신 → 개별 이벤트 꼬임 복구 수단 | #sq-time 2026-03-06 https://hcgtheplus.slack.com/archives/C04QC2RJJBU/p1772772166245649?thread_ts=1772772000.341029&cid=C04QC2RJJBU , 2026-03-27 https://hcgtheplus.slack.com/archives/C04QC2RJJBU/p1774599175386619?thread_ts=1774488326.619989&cid=C04QC2RJJBU , 2026-08-03 https://hcgtheplus.slack.com/archives/C04QC2RJJBU/p1785744126570199?thread_ts=1785742292.546239&cid=C04QC2RJJBU |
| 12 | 서브어드민 권한그룹 삭제 — 기간 만료 담당자 | 버그·구현누락 확인 | 기획: **활성 담당자(권한기간이 현재와 교집합)**가 있을 때만 삭제 비활성, 만료 담당자는 30% 흐리게. 구현은 만료 담당자도 차단(백엔드 TODO). 수정 일정 Slack 없음 | #sq-sys 2024-07-15 https://hcgtheplus.slack.com/archives/C04V0TUNRGV/p1721051567472709?thread_ts=1721051333.063949&cid=C04V0TUNRGV , 릴리즈 노트 #070 코멘트 2026-10-27 |
| 13 | 연차촉진 서명 대상(통지서 vs 계획서) | 해소-결정 | 양식에 서명은 필수인 경우만: **연차사용계획서만 서명 O**, 미사용연차 통지서·사용시기 지정 통보서는 서명 X. 서명 필요 항목 0개면 [서명 제출] 대신 [확인] | #sq-sys 2025-06-26 https://hcgtheplus.slack.com/archives/C04V0TUNRGV/p1750929103598859?thread_ts=1750903393.871339&cid=C04V0TUNRGV , 2025-06-30 https://hcgtheplus.slack.com/archives/C04V0TUNRGV/p1751247722196289?thread_ts=1751070975.672829&cid=C04V0TUNRGV |
| 14 | 1년 미만 연차 초과 사용 결정 | 해소-결정(재확인) | 연차 제도 옵션, 시간 단위 한도/무제한, 1년 총량, 미발생분 당겨쓰기 불가, **사용일 당시 소속 휴가그룹 설정** 기준, 어드민은 해당 월 마이너스 표시 | #bizops-center 2026-09-22 https://hcgtheplus.slack.com/archives/C0AC4BH6QLB/p1790065137896459?thread_ts=1789627172.244019&cid=C0AC4BH6QLB |
| 15 | 어드민 직접 등록 휴가의 사용자 화면 표시 | 해소-의도 | 연차/연차 외 무관 '관리자 등록' 별도 모달(모바일 드로워). 내 근무·내 근무 상세·내 휴가·구성원 근무. 응답에 신청/직접등록 구분값만 추가 | #sq-time 2025-03-27 https://hcgtheplus.slack.com/archives/C04QC2RJJBU/p1743052963553049?thread_ts=1743051920.971759&cid=C04QC2RJJBU |
| 16 | 연차 외 수동 지급 '적용일' 필수 여부 | 부분 | Slack엔 "적용일 = 노출일 성격"(#sq-time 2024-03-21)만. 코드 확인: 적용일 DatePicker `disabled` → 당일 고정 → spec `Y (추정)` → `Y, 당일 고정` | `ad:NonAnnualLeavePaymentManualContent.tsx` |
| 17 | 서브어드민 담당 범위 근무그룹 옵션 숨김 | Slack에 없음 | 2024-09-05 '근무그룹 추가' 결정과 범위 내 구성원 갱신 고민(2024-09-30)만 있음. 숨김 사유 기록 없음 | #sq-time 2024-09-05, 2024-09-30 |
| 18 | 근무 대시보드 권한이 운영 권한표에 노출되는지 | 해소-결정 | 운영에는 권한 데이터 있음 → 근무 실무 관리에 '근무 대시보드' 체크 가능(스프린트 #045 2025-09-29 배포). 스테이징은 데이터 이상 | #cx 2025-11-14 https://hcgtheplus.slack.com/archives/C01AVJ2CJBW/p1763111394797919?thread_ts=1763110174.650769&cid=C01AVJ2CJBW |
| 19 | 코드 수준 TBD 6건 (`TM_LEAVE_SYSTEM` type 컬럼, `TM_LEAVE_GRP_LEAVE_SYSTEM`, `TM_LEAVE_CRT` 추적, `available-inout-info`, `LeaveApplsController` path, `TM_LEAVE_GRP_HISTORY`(추정)) | 기획 영향 없음 | Slack 검색 생략 | — |

### 남은 사람 질문
- 연차기산일을 사후 변경해 조정 화면 전체가 막히는 부작용을 허용할지 (#1)
- [등록 내역] 오픈 계획이 있는지 (#3)
- 연차 관리/연차 외 권한 분리 후속 PR 일정 (#8)
- 과거 데이터 중복 업로드를 덮어쓰기/차단할 필요가 있는지 (#9)
- 만료 담당자만 남은 권한그룹 삭제 차단 수정 시점 (#12)
- 근무그룹 담당 범위 옵션 숨김 사유·재노출 여부 (#17)
