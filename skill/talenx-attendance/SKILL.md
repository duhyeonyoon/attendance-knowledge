---
name: "talenx-attendance"
description: "Talenx 서비스의 \"근무\" 도메인 — 출퇴근/휴가/근무그룹/신청서/근무마감/근무스케줄/휴가관리/연차/연동 등 — 관련된 모든 질문에 사용하세요. 한국어 키워드 \"근무\", \"휴가\", \"출퇴근\", \"근무그룹\", \"신청서\", \"근무 마감\", \"연차\", \"재택\", \"연장근무\", \"야간근무\", \"휴일근무\", \"스케줄\"이나 영어 \"attendance\", \"leave\", \"checkin\", \"clock-in\", \"work group\", \"overtime\", \"holiday work\", \"remote work\" 등이 포함된 질문이면 반드시 트리거하세요. 고객사 문의 분석, 기능 요청 검토, 코드 변경 영향도 분석, 비즈니스 룰 질의, 근무 KB·기능 명세서 작성/수정 모두 포함됩니다. ppfront / talenx-admin / optimiz-time 세 레포에 걸친 도메인이라 반드시 지식 베이스를 먼저 참조해야 합니다. 의심되면 트리거하세요."
---

# Talenx Attendance Domain

Talenx 서비스의 근무 도메인 전문 스킬. 지식 베이스 `~/Documents/attendance-knowledge/`를 활용해 정확하고 검증 가능한 답변을 만듭니다.

## 핵심 컨텍스트

- 사용자(두현님)는 **근무관리 팀** 소속
- 도메인은 **3개 레포**에 걸쳐 있음:
  - `~/Documents/ppfront` — 사용자 화면 (React 17, MUI)
  - `~/Documents/talenx-admin` — 어드민 화면 (React 18, MUI)
  - `~/Documents/optimiz/optimiz-time` — 백엔드 (Java/Spring, 패키지 `com.hcg.optimiz.time`, 테이블 prefix `TM_`)
- **PRD가 없음.** QA 체크리스트가 1차 명세 (`<repo>/.claude/qa-checklist/attendance.md`)
- 스테이징: 사용자 `https://app-tx.txstag.kr/`, 어드민 `https://ap-tx.txstag.kr/` (메뉴 이름·탭 구성은 백엔드에서 내려오므로 실제 화면이 가장 정확)

## 기능 명세 구조 (2026-11-05 재구성)

`product/`는 **실제 메뉴의 페이지 단위**로 나뉘어 있고, 폴더 구조가 메뉴 구조와 같습니다.

- `product/admin/{module-setting,authority,work,leave,old-data,etc}/<페이지>.md` — 어드민 근무관리 탭
- `product/user/{home,attendance,applications}/<페이지>.md` — 사용자 통합홈 위젯 / 근무관리 탭 / 근무 신청서
- 여러 페이지가 공유하는 내용(데이터 모델·코드 맵·공통 룰)은 같은 폴더의 `overview.md` (`admin/module-setting/overview.md`, `admin/leave/overview.md`, `user/applications/overview.md`)
- `product/_legacy/` — 재구성 전 묶음 문서 원본. 참고만 하고 수정하지 않음
- 문서 상단 인용 블록에 메뉴 경로·URL·탭, `⚠️ 실제 화면과 차이` 표시가 있으면 그 페이지는 실제 화면과 어긋난 상태
- `site/`는 이 KB를 문서 사이트(Astro Starlight)로 보여주는 폴더. 원본 `.md`를 그대로 읽으므로 KB를 고치면 사이트에도 반영됨. 상단 헤더 **KB / 명세서** 탭으로 나뉨

## 기능 명세서 (`spec/`) — KB와 1:1 짝 (2026-11-05 추가)

`spec/`은 같은 화면을 **기획·QA·CS용 기능 명세서**로 다시 쓴 문서입니다. KB(`product/`)는 개발용(코드·API·테이블 포함), 명세서는 화면 구성·기능(ID)·정책·메시지만 담습니다.

- 경로가 **1:1 미러**: `product/admin/work/close-work-data.md` ↔ `spec/admin/work/close-work-data.md` (앞의 `product/`만 `spec/`으로). `overview.md`도 동일하게 짝
- 각 명세서 frontmatter `kb:` 가 짝 KB 경로, `sidebar.order`는 KB와 같은 값
- 템플릿·기능 ID 체계(`A-WRK-CLS-01`, `U-APL-OT-03` …)·쓰지 않는 것(코드 경로/API/테이블/클래스명)은 **`spec/README.md`** 참고
- `product/_legacy/`, `domain/`, `code/`, `_learnings/`, `operations/`는 짝 명세서 없음

## 워크플로우 (모든 질문에 적용)

### 1. 영역 식별 — index.md 먼저 읽기

`~/Documents/attendance-knowledge/index.md`를 읽으세요. 상단 **"실제 메뉴 → 문서 맵"** 표에서 질문이 어느 화면(페이지) 얘기인지 찾고 해당 문서로 가세요. QA 체크리스트 라인으로 찾을 땐 아래의 "어드민 영역 #1–16 / 사용자 영역 U1–U19" 표를 쓰세요. 여러 화면에 걸친 경우 모두 식별하세요.

### 2. 관련 문서 읽기 — 페이지 문서 우선

식별된 화면에 대해 다음을 순서대로 확인:

1. **`product/admin|user/<메뉴그룹>/<페이지>.md`** — 페이지 단위 기능 명세. 그룹 공통 내용은 같은 폴더의 `overview.md`
2. **`domain/business-rules.md`** — 핵심 비즈니스 룰
3. **`domain/glossary.md`** — 용어 + 백엔드 코드 체계 (예: `holiWorkPmitCd`, `gpsConfCd` 등)
4. **`code/repos.md`** — 3개 레포 코드 위치 매핑
5. **`code/backend-tables.md`** — DB 테이블 인벤토리
6. **`_learnings/`** — 본문에 아직 반영 안 된 최근 발견이 있을 수 있음. 관련 키워드로 grep

페이지 문서가 없거나 `⚠️ 실제 화면과 차이`가 표시된 부분이면 → `index.md`의 코드 경로를 참고해 직접 코드 탐색.

### 3. 실제 코드 확인 — 필요 시

다음 경우 반드시 실제 코드를 읽어 검증:

- 명세에 없는 구현 디테일이 필요할 때
- 명세 ↔ 실제 동작이 일치하는지 의심될 때 (**지식 베이스 자체가 outdated 가능**)
- 정확한 로직/조건 분기가 답에 필요할 때
- 영향도 분석이 필요할 때 (다른 화면/모듈 영향)

### 4. 답변 작성

다음 구조로:

- **결론** — 명확하게, 한 줄로 시작
- **근거** — 인용 파일 경로 + 라인 번호 (`pp:src/components/main/work_commute/WorkComponent.tsx:237` 형식)
- **주의사항** — 임시 동작, 특정 고객사 한정 기능, 알려진 outdated 문서 등
- **확인 필요** — 지식 베이스에 `[TBD]`로 표시된 부분이거나 모호한 부분은 명시

### 5. 학습 누적 — 새로 알게 된 건 반드시 기록

대화 중 새로 알게 된 사실은:

- **작은 정정**: 본문 직접 수정 (`product/`, `code/`, `domain/`)
- **큰 발견 / 검증 필요**: `_learnings/YYYY-MM-DD-<topic>.md` 새 파일 생성
- **이전 `[TBD]` 해소 시**: 본문 업데이트 + `[TBD]` 마킹 제거
- **KB ↔ 명세서 동기화**: 아래 "KB ↔ 명세서 동기화" 절차를 반드시 수행

이 단계를 빠뜨리면 다음 세션에서 같은 정보를 다시 알아내야 합니다. 매 답변 후 무엇이 새로웠는지 자문하세요.

### 6. KB ↔ 명세서 동기화 ⭐ (한쪽을 고쳤으면 다른 쪽도)

`product/<…>.md` 또는 `spec/<…>.md` 중 **하나라도 수정·생성·삭제했다면** 같은 턴 안에 짝 문서를 맞춥니다. (`_learnings/`에만 기록하고 본문은 안 고친 경우는 해당 없음)

1. **짝 찾기**: `product/X.md` ↔ `spec/X.md` (경로의 첫 폴더만 교체). 명세서 쪽은 frontmatter `kb:`로 재확인
2. **반영 여부 판단**

   | 바뀐 쪽 | 바뀐 내용 | 짝 문서에 할 일 |
   |---|---|---|
   | KB | 화면 구성·필드·버튼·탭, 동작, 정책/룰, 화면 메시지, 제약, `[TBD]` 해소, `⚠️ 실제 화면과 차이` | 명세서 해당 절(2 화면 구성 / 3 기능 상세 / 4 정책 / 5 메시지 / 7 확인 필요) 갱신 |
   | KB | 코드 경로·API·테이블·클래스명·git 이력·데이터 모델만 | 명세서 변경 없음 (그렇다고 한 줄 보고) |
   | 명세서 | 기획 확정·정책 변경·화면 변경·확인 필요 해소 | KB 해당 절 갱신. 코드와 다를 수 있으면 코드로 검증 → 다르면 KB에 "기획 ≠ 현재 구현" 명시 + `_learnings/` 기록 |
   | 둘 다 | 페이지 추가·삭제·이동·이름 변경 | 양쪽 같은 경로로 생성·삭제·이동, `sidebar.order` 일치, `index.md` "실제 메뉴 → 문서 맵" 갱신. 새 메뉴그룹 폴더면 `site/astro.config.mjs` 사이드바의 KB 그룹과 `명세서` 그룹 양쪽에 추가 |

3. **명세서에 쓸 때 규칙** (`spec/README.md`):
   - 코드 경로·컴포넌트/함수명·API·DB 테이블 넣지 않음. 화면 라벨/메시지는 원문 그대로 따옴표
   - 새 기능은 해당 페이지 코드로 다음 번호의 기능 ID 부여. 기존 ID는 바꾸지 않고, 없어진 기능은 `(폐기 YYYY-MM-DD)` 표시
   - 검증된 사실만. 추정은 `(추정)`, 미확정은 "7. 확인 필요"
4. **보고**: 답변 끝에 `동기화: product/… ↔ spec/… (반영: 3.2 기능 표, 4 정책 #5)` 형식으로 무엇을 맞췄는지 한 줄. 반영할 게 없었다면 `동기화: 명세서 영향 없음 (코드 경로만 변경)`

사용자가 "명세서 고쳐줘"처럼 **명세서만** 요청해도 3번 규칙대로 쓰고 KB 짝을 함께 맞춥니다.

## 답변 패턴

### 패턴 A: 고객사 문의 분석 ("이 기능 왜 이렇게?", "이 케이스 어떻게?")

1. 영역 식별 → 페이지 문서 + business-rules 확인
2. 동작이 (a) 의도된 정상 동작 (b) 임시 제약 (c) 특정 고객사 한정 기능 중 어느 것인지 분류
3. 고객 응대 가능한 형태로 정리. 가능하면 "왜 이런 결정인지" 배경도 포함 (decision-log 있을 시)

### 패턴 B: 기능 요청 검토 ("X 추가 가능?")

1. 영역 식별 → 기존 페이지 문서 + business-rules
2. **기획상 충돌 검토**:
   - 기존 비즈니스 룰과 모순 없나?
   - 기존 화면 동작 깨지나?
   - 다른 영역(휴가, 근무그룹, 신청서 등)에 파급 효과?
3. **코드상 구현 영향**:
   - 어떤 모듈/컴포넌트/테이블 변경 필요?
   - 마이그레이션 필요?
   - 다른 클라이언트(`PLAN`/`EXTERNAL` 그룹, `workTimeVisibleCd === DENIED` 등 커스텀 적용된 곳)에 영향?
4. 권고 형태로 정리: **가능 여부 + 필요 작업 + 리스크**

### 패턴 C: 코드 변경 영향도 ("이 코드 바꾸면?")

1. 변경 대상 모듈/함수 → `code/` 문서에서 위치 확인
2. 호출처 grep (3개 레포 모두)
3. 관련 비즈니스 룰 → 룰이 깨질 가능성
4. QA 체크리스트의 해당 시나리오 → 어떤 케이스에 영향

### 패턴 D: 도메인 용어 / 룰 질문

`domain/glossary.md`, `domain/business-rules.md`에서 직접 인용. 코드 체계(`P`/`A`/`N`, `gpsConfCd` 4가지 등)는 글로서리 참조.

## 정확성 가드레일

다음을 항상 의식하세요. 정확도가 떨어지면 이 스킬의 가치가 사라집니다.

### 추정과 사실 구분

- "코드/체크리스트로 검증된" vs "추론한" 사실을 명시. 추정엔 `(추정)` 또는 "확인 필요"로 표기
- `[TBD]` 마킹된 부분을 인용할 땐 그 사실을 알려주기

### 지식 베이스 outdated 가능성

다음 케이스는 실제로 발견된 outdated 사례:
- 자정 cutoff: QA 체크리스트엔 "5시" 적혀있지만 실제는 동적 계산 (계획출근시각-3hr / 6hr)
- 일부 임시 제약: "회사-조직 관계 관리 추가되면 해제 예정" 같은 표시 (→ 2025-12-24 실제 해제됨)
- 근무 대시보드 "누락 건만 보기" 오늘 이후 비활성 조건: QA엔 있지만 2026-10-22 제거 (talenx-admin#4581)
- 휴가 1년 미만 연차 초과 사용: 2026-09-17부터 연차 제도 옵션으로 가능 (이전 문서의 "정상연차 전용"은 옛 기준)
- 2026-11-05 스테이징 확인 → 같은 날 코드로 문서 반영 완료: 근무 신청 내역 관리 10탭, 개인 근무 스케줄 관리 선택적 근로 스케줄 탭, 휴가 메뉴 3분리

→ 핵심 룰 답변 시 백엔드 코드(`be:com/hcg/optimiz/time/`) 직접 확인 권장

### 미결·기획 의도 질문은 Slack까지 확인 (2026-11-05 피드백)

"의도인가요?", "[TBD]", "확인 필요"를 해소하거나 사람에게 질문으로 넘기기 **전에 반드시 Slack을 검색**하세요. 코드는 현재 동작만 알려줄 뿐 의도는 Slack(#sq-time 개발, #bizops-center 결정사항, #ch-plan 기획, #cx·#channeltalk·#ch-sc 고객 응대)에 있습니다.
- 항목마다 키워드 2~3조합으로 검색 → 관련 스레드는 `slack_read_thread`로 끝까지 읽기 (요약만 보고 결론 내지 말 것 — 스레드 제목이 다른 화면 얘기일 수 있음)
- 결정이 번복됐으면 최신 결정을 따르고 번복 사실도 기록
- KB에는 `Slack #채널 YYYY-MM-DD (퍼머링크)`로 출처, 명세서에는 링크·이름 없이 "기획 확인 YYYY-MM-DD"
- Slack 검색 결과가 없으면 "(Slack 검색: 관련 논의 없음)"을 남기고 나서 질문으로 넘김
- Slack은 읽기만 (전송·리액션 금지)

### 3개 레포 모두 봐야 정확

같은 비즈니스 룰이 프론트와 백엔드 양쪽에 구현된 경우 **반드시 양쪽 확인**. 예: 자정 cutoff는 프론트(`checkNextDayAndBeforeAggrTime`, 정적 값)와 백엔드(`ValidWorkDayResolver`, 동적)가 어긋났던 사례 — 2026-05-18 ppfront#11005로 프론트 판정 제거, 지금은 백엔드 단일 판정. 또 이름이 비슷한 flag 혼동 주의: `hasModifiedWorkRecord`(승인된 변경 신청 존재) ≠ `hasAdminModifiedWork`(어드민 직접 수정).

- 사용자 화면 동작 → `ppfront`
- 어드민 화면 동작 → `talenx-admin`
- 비즈니스 룰 / API 동작 → `optimiz-time`

### 타입 정의는 grep으로 정확한 위치 추적

처음 보는 타입(`WorkStatus`, `IN_LOC_CONF_CD_1`, `StdDdClass` 등)은 정의 위치를 확인하세요. 정의 파일 경로 예시:
- `pp:src/@types/customTypes/attendance/unionType.d.ts`
- `pp:src/@types/customTypes/attendance/memberWork.d.ts`

타입 정의 주석에 핵심 의미가 들어있는 경우가 많습니다.

## 새 페이지 deep-dive 시 (문서가 없거나 outdated인 화면 작업)

다음 순서를 따르세요:

1. `index.md`에서 화면의 메뉴 위치와 QA 체크리스트 라인 범위 확인
2. 해당 라인 읽기 (`Read` with offset/limit — 체크리스트가 매우 큼, 한 번에 다 읽지 말 것)
3. `index.md`의 코드 경로 따라가며 컴포넌트/모듈/API 확인
4. **타입 정의 grep** — 잊지 말기
5. **프론트 ↔ 백엔드 동일 룰 양쪽 확인**
6. `product/admin|user/<메뉴그룹>/<페이지>.md` 작성 (구조는 `product/README.md` 템플릿, 기존 `product/user/home/checkin-widget.md` 패턴 따름). 상단에 `sidebar.order`(메뉴 순서) frontmatter와 메뉴/URL/탭 인용 블록을 둠. 여러 페이지가 공유하는 내용은 그 폴더의 `overview.md`에
7. `index.md` 상단 "실제 메뉴 → 문서 맵" 표와 영역 표 갱신
7-1. **짝 명세서 `spec/<같은 경로>.md` 작성/갱신** (`spec/README.md` 템플릿, frontmatter `kb:`·`sidebar.order`)
8. `domain/glossary.md` 신규 용어 / 백엔드 코드 추가
9. `_learnings/` 새 발견 기록 + 두현님 답 필요한 항목 명시

## 답변 시 출처 표기 형식

- 지식 베이스 문서: `attendance-knowledge/product/user/home/checkin-widget.md` 또는 단축 `KB:product/user/home/checkin-widget.md`
- 기능 명세서: `KB:spec/user/home/checkin-widget.md` (+ 기능 ID `U-HOME-CHK-03`)
- ppfront 코드: `pp:src/components/main/work_commute/WorkComponent.tsx:237`
- talenx-admin: `ad:src/pages/attendance/work/personal_work_template_management/`
- optimiz-time: `be:com/hcg/optimiz/time/common/util/validworkday/ValidWorkDayResolver`
- DB 테이블: `TM_INOUT_REG`
- QA 체크리스트: `pp-qa:L69-154` 또는 `ad-qa:L317-546`

이 형식으로 인용하면 두현님이 검증 / 확장하기 편합니다.

## 모를 때 / 확신 없을 때

거짓말하지 마세요. 다음 중 하나로:

- "지식 베이스에 아직 정리되지 않은 화면입니다. 직접 코드 탐색이 필요해요. 진행할까요?"
- "이 부분은 `[TBD]`로 마킹돼 있어요. 추정으로는 X 같지만 확실하지 않습니다."
- "프론트와 백엔드 구현이 일치하는지 확인 필요. 검증하시겠어요?"

답변 후 새로 알게 된 게 있다면 반드시 5단계(학습 누적)를 수행하세요.