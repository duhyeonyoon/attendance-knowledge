# PR 브리핑 플레이북

> **트리거**: 사용자가 `<PR브리핑> : <GitHub PR 링크>` 형태로 던지면 이 플레이북을 따른다.
> 예: `<PR브리핑> : https://github.com/hcgtheplus/talenx-admin/pull/3993`

두현님(근무관리 팀)이 PR 리뷰를 시작하기 전에, PR의 작업 맥락·내용·리스크·테스트 시나리오를 **항목화된 브리핑**으로 정리해 주는 절차다.

> ⛔ **GitHub MCP / GitHub 커넥터를 절대 시도하지 말 것.** 대상 레포(hcgtheplus/*)는 조직 SSO로 막혀 있어 MCP는 항상 404가 난다. PR 메타는 **처음부터 Claude in Chrome**으로만 접근한다. MCP를 먼저 찔러보고 폴백하지 말 것 — 시간 낭비다. 코드 diff는 로컬 git만 쓴다.

---

## 0. 폴더 자동 연결

브리핑 시작 시 아래 폴더가 연결돼 있지 않으면 `request_cowork_directory`로 자동 요청한다 (이미 연결돼 있으면 생략):

- `~/Documents/talenx-admin` — 어드민 프론트
- `~/Documents/attendance-knowledge` — 지식 베이스 (이 문서 포함)
- `~/Documents/optimiz` — 백엔드 모노레포 (optimiz-time 등)
- `~/Documents/ppfront` — 사용자 프론트 (필요 시)

---

## 1. 수집 절차 (순서대로)

### (1) PR 메타 + 본문 링크 — Claude in Chrome (MCP 금지)
- ⛔ GitHub MCP / 커넥터 / web_fetch 시도 금지. 곧바로 Chrome으로 간다.
- `navigate`로 PR 페이지 열고 `get_page_text`로 제목/작성자/리뷰어/브랜치/규모/승인 상태 파악.
- `javascript_tool`로 본문 앵커의 href를 추출한다 (Slack·Figma·백엔드 PR·Notion 링크). 링크 텍스트만으론 부족하니 반드시 href를 뽑을 것.
- 이유: private 레포 + 조직 SSO라 MCP는 404, web_fetch는 빈 결과. Chrome은 로그인 세션이라 열림.

### (2) Slack 작업 스레드 — slack_read_thread
- 본문에서 뽑은 Slack permalink에서 `channel_id`와 `message_ts`를 파싱한다.
  - 예: `.../archives/C04QC2RJJBU/p1782883719432669` → channel `C04QC2RJJBU`, ts `1782883719.432669` (마지막 6자리 앞에 소수점).
- 스레드 전체를 읽어 **의사결정 배경**을 파악한다 (특히: 왜 이 상태/기능이 들어갔거나 빠졌는지, 중간점검 결정, 별도 과제로 넘어간 것).
- 이 배경이 diff만으론 안 나오는 핵심이다. 반드시 반영한다.

### (3) 코드 diff — 로컬 git (Chrome/커넥터 불필요)
- PR URL에서 레포 식별 (talenx-admin / optimiz-time 등).
- 해당 레포는 이미 클론돼 있으므로 로컬에서:
  - `BASE=$(git merge-base origin/<base> origin/<head>)`
  - `git diff --stat $BASE origin/<head>` 로 파일 목록.
  - 핵심 파일(공용 함수·연결부·신규 컴포넌트)만 `git diff`/`git show`로 확인.
- **주의**: 샌드박스 git은 네트워크 fetch 불가. 원격 브랜치가 로컬에 없으면 사용자에게 `git fetch` 요청. 브랜치는 전환하지 말고 diff만 본다 (작업공간 보호).

### (4) 도메인 맥락 — KB
- `index.md`에서 영역 식별 → 해당 `product/*.md` + `domain/business-rules.md` 확인.
- 근무 신청 내역 관리 영역이면 `product/admin/work/appl-management.md`.

---

## 2. 출력 포맷 (이 구조·순서 고정)

문체 규칙: 모든 설명형 문장은 **`~습니다` / `~입니다`** 단순 명료체. 항목화 필수. **코드 관련 설명은 각 섹션 내에서 후순위**로 배치.

```
## 📋 PR 브리핑 — #<번호>

### 1. 브랜치
- <repo>: `<브랜치명>` (PR #<번호>)   ← 프론트/백엔드 각각. base 브랜치 표기.

### 2. PR 메타
- 작업자: <작성자>
- 리뷰어: <리뷰어들>

### 3. 작업 설명  (PR 본문 + Slack 스레드 종합)
- 기능·비즈니스 관점 항목 먼저.
- 의사결정 배경은 하위 불릿으로 (스레드 근거).
- (코드) 표시로 코드 관련 항목은 맨 뒤에.

### 4. 리뷰 포인트
**① 예상되는 위험한 코드**
- 실제로 깨질 수 있는 부분. 공용 함수 변경·광범위 영향 등.
**② 위험하진 않지만 냄새가 나는 부분**
- 죽은 코드/주석 잔존, 중복 복제 구조 등.
**③ 개선돼서 좋은 부분**
- 타입 명확화, 버그 동반 수정 등.

### 5. 테스트 시나리오
- 무엇을 확인해야 하는지 항목화. 회귀·E2E 포함.

### 🔗 레퍼런스
- Slack 스레드 / Figma / 백엔드 PR / Notion 명세 등 (있는 것만).
```

## 3. 원칙
- 직감으로 쓰지 않는다. PR 본문·스레드·코드·KB로 검증된 내용만 쓴다.
- 브랜치는 전환하지 않는다 (diff만). 서버 재시작은 이 플레이북 범위 밖 (사용자가 직접).
- 새로 알게 된 도메인 사실은 KB에 누적한다 (SKILL 5단계).
