# Attendance Knowledge Base

근무(Attendance) 도메인의 **제품 / 코드 / 비즈니스 룰**을 한 곳에 모은 지식 베이스입니다.
3개 레포(`ppfront`, `talenx-admin`, `optimiz-time`)에 걸쳐 있는 근무 도메인을 횡단해서 참조할 수 있도록 구성되어 있습니다.

## 구조

```
attendance-knowledge/
├── README.md          ← 이 문서
├── index.md           ← ⭐ 크로스 레퍼런스 맵 (기능 ↔ 체크리스트 ↔ 코드)
├── product/           ← 기능 명세 (PM 관점, descriptive)
│   └── *.md           ← 기능 영역별 문서
├── operations/        ← ⭐ 운영 플레이북 (prescriptive — 어떻게 세팅할지)
│   └── customer-setup-guide.md   ← 고객사 근무·휴가 세팅 가이드
├── code/              ← 아키텍처 / 코드 맵 (개발 관점)
│   ├── repos.md       ← 3개 레포 개요
│   ├── backend-tables.md      ← 백엔드 DB 테이블 인벤토리
│   └── frontend-modules.md    ← 프론트 모듈 인벤토리
├── domain/            ← 도메인 용어 / 비즈니스 룰
│   ├── glossary.md
│   └── business-rules.md
└── _learnings/        ← 대화 중 새로 알게 된 사실 누적
```

> **product/ vs operations/ 차이**:
> - **product/** = "이 화면이 무엇을 하는지" (descriptive — 기능 명세)
> - **operations/** = "고객사 요구를 받았을 때 어떻게 세팅할지" (prescriptive — 의사결정 플레이북)

## 사용법 (Claude/사람 모두)

### 고객 문의 / 코드 질문
1. **고객 질문이나 기능 요청이 들어오면** → `index.md` 먼저 확인
2. 관련 영역의 product/ 문서로 명세 확인
3. code/ 에서 구현 위치 파악 → 실제 코드 확인
4. domain/ 에서 룰/제약 충돌 여부 검토
5. 새로 알게 된 사실은 `_learnings/`에 기록 후 주기적으로 본문에 통합

### 고객사 신규 도입 / 세팅 컨설팅
1. **고객사가 자사 제도를 설명하면** → `operations/customer-setup-guide.md` 먼저 확인
2. Step 1 의사결정 흐름으로 근무제 유형 분류 (5종)
3. 유형별 세팅 레시피 따라 안내
4. 한계사항 / BizOps 확인 필요 케이스 식별
5. 상세 동작은 `product/` 의 cross-link로 확인

## 출처

- **QA 체크리스트** (가장 정확한 1차 자료)
  - 어드민: `~/Documents/talenx-admin/.claude/qa-checklist/attendance.md`
  - 사용자: `~/Documents/ppfront/.claude/qa-checklist/attendance.md`
- **실제 코드베이스**
  - `~/Documents/ppfront` (사용자 프론트, React 17)
  - `~/Documents/talenx-admin` (어드민 프론트, React 18)
  - `~/Documents/optimiz/optimiz-time` (백엔드, Java/Spring)

## 표기 규약

- `[TBD]` — 아직 미확인. 채워야 함
- `[추정]` — 추론으로 작성. 검증 필요
- `[확인]` — 코드/체크리스트로 검증됨
- 파일 참조: `repo:path/to/file.ts:LINE` 형식

## 마스터 Skill

이 지식 베이스의 진입점은 별도 Skill로 등록되어 있어 "근무" 관련 질문이 들어오면 자동으로 이 폴더를 탐색합니다. (Phase 3에서 생성)
