---
sidebar:
  order: 2
---

# 근무 현황 (출퇴근 위젯 하단)

> **메뉴** 통합홈 › 출퇴근 카드 안 '근무 현황' 펼침 영역  
> **원본** `product/_legacy/user-small-screens.md`

*원본 섹션: § U5. 근무 현황 (L167–176)*

## 위치

**통합홈 내 위젯**으로 등장 (별도 페이지 아님). `KB:product/user/home/widgets.md` § U1과 일부 중복되지만 QA에서 별도 섹션으로 다룸.

## 동작

- **근무 현황 리스트** 확인 가능
- **출근 완료 시** → 본인 상태가 **'근무중'으로 변경**
- **조직/사람 검색**으로 구성원 리스트 추가/수정/삭제
  - 본인 소속 회사 하위 조직/구성원만
  - **2025.04.17 임시 제약** (회사-조직 릴레이션 고도화 전): 소속 구성원 있는 조직만 리스팅
- **상위 조직 필터링** → 하위 조직 인원의 근무 상태도 표시
- **출근/퇴근 이후 근무 현황 자동 새로고침**

## Cross-link

- `KB:product/user/home/widgets.md` § U1 — 통합홈의 근무 현황 위젯 (모바일/웹 표시 룰)
- `KB:product/user/home/checkin-widget.md` — 출퇴근 위젯과 직접 연동 (출근/퇴근 → 근무현황 갱신)

## 관련 문서 (U5·U12·U13 공통)

### 관련 문서

- `KB:product/user/home/widgets.md` § U1 — 통합홈의 근무 현황 위젯 (U5와 중복)
- `KB:product/user/home/checkin-widget.md` — 위치 정보 생성 (U12 로그 트리거)
- `KB:product/user/attendance/member-work.md` § "요청 모아보기" — 위치 확인 3개월 룰 (U12와 연결)
- `KB:product/admin/leave/encouragement.md` § C-5 — 어드민 연차촉진 (U13의 어드민 측)
- `KB:product/admin/module-setting/overview.md` — 알림 설정 권한
