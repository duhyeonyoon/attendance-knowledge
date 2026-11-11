---
sidebar:
  order: 3
---

# 휴가 그룹 이력 관리

> **메뉴** 근무관리 › 휴가 › 휴가 그룹 이력 관리  
> **URL** `/attendance/leave/group_setting_history_management`

근무 그룹 이력 관리와 코드·API·UX가 **완전히 대칭**입니다(work ↔ leave 단어만 다름). 상세 명세는 [근무 그룹 이력 관리](../work/group-history.md)를 보세요.

## 휴가 쪽 고유 정보

- QA: `ad-qa:L981–989`
- 프론트: `ad:src/pages/attendance/leave/group_setting_history_management/` + `ad:src/components/.../leave/group_setting_history_management/`
- 백엔드: `LeaveGroupHistoryController` + `LeaveGroupHistoryQueryService`, DTO `LeaveGroupHistoryDto`
- API: `POST /time/leave-group-histories/search`, `POST /time/leave-group-histories/excel-download/search`
- 테이블: `TM_LEAVE_GRP_HISTORY` (추정)

## 화면 구성 (2026-11-05 locale 확인, `ad:src/locales/ko/attendance.json` `LEAVE_GROUP_SETTING_HISTORY_MANAGEMENT`)

- 제목 "휴가그룹 이력 관리"
- 필터: 기간 선택(필수 — "기간을 선택해주세요.") · 구성원 · 회사 · 조직 · "휴가그룹(이력 기준) 선택" + [조회] [필터 재설정]
- 조회 기간 365일 초과 시: "조회 기간은 365일 이내로 설정합니다."
- 컬럼
  - **기본 정보**: 사번 · 이름 · 회사 · 조직 · 직급 · 퇴사 여부(퇴사/재직) · 활성 여부(활성/비활성) · 현재 휴가 그룹 · 입사일 · 연차기산일
  - **소속 이력 정보**: 휴가 그룹 · 소속 시작일 · 소속 종료일 · 소속 일수
  - 근무 쪽 "근무제 유형"에 해당하는 컬럼은 없음
- 툴팁
  - 소속 종료일: "마지막 소속 이력의 종료일은 9999.12.31로 표시됩니다."
  - 소속 일수: "소속 일수는 오늘 날짜 기준으로 계산됩니다. 종료일이 확정되지 않았거나 미래 날짜인 경우에도 오늘까지의 일수로 표시되며, 시작일이 미래인 이력은 0일로 표시됩니다."
- 엑셀 다운로드: "휴가그룹 이력 관리 엑셀 다운로드" (파일명 `휴가그룹이력관리_…`)
