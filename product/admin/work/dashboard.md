---
sidebar:
  order: 7
---

# 근무 대시보드 (어드민)

> **메뉴** 근무관리 › 근무 › 근무 대시보드  
> **URL** `/attendance/work/dashboard`  
> **원본** `product/_legacy/user-home-and-dashboards.md`

## 코드 위치

### talenx-admin 근무 대시보드 (#10)

```
pages/attendance/work/dashboard/                            ← 페이지
components/attendance/work/dashboard/
├── index.tsx
└── contents/
    ├── DashboardFilter.tsx                                 ← 필터 (조회 날짜 · 구성원 · 회사 · 조직 · 누락 건만 보기)
    ├── DailyWorkStatusList.tsx                             ← 목록 + 알림 발송
    └── TableFilterContextProvider.tsx
containers/attendance/work/dashboard/
hooks/attendance/work/dashboard/                            ← useFilterOptions / useControlTableFilter / useFoldFilter
config/api/attendance/dashboard.ts                          ← API 클라이언트
```

백엔드: `be:controller/workdashboard/WorkDashboardAdminController.java` → `service/workdashboard/WorkDashboardAdminService.java` (권한 `@Secured({WORK_DASHBOARD, TALENX_TIME_ADMIN})`)

**별도 dashboard 시스템들** (어드민 #10과 무관):
- `components/system/dashboard/` — 시스템 대시보드
- `components/performance/appraisal/settings/group/dashboard/` — 인사평가 대시보드

*원본 섹션: § #10. 근무 대시보드 (어드민)*

QA L754–767. 어드민이 **특정 일자(기본 오늘) 자사 구성원들의 근무 상태를 한눈에** 보는 화면. 화면 안내 문구: "구성원의 일별 근무 현황을 모니터링하고 관리합니다." (2026-10-22 hcgtheplus/talenx-admin#4581에서 문구 변경)

## 화면 구성

- 화면 접속 시 **오늘 날짜 + 어드민 유저가 속한 회사 구성원** 정보 표시
- 테이블 컬럼 (2026-11-05 `ad:.../DailyWorkStatusList.tsx:279-904` 확인, 순서대로):

| 컬럼 | 표시 내용 |
|---|---|
| (체크박스) | 알림 발송 대상 선택 — 활성 조건은 아래 |
| **구성원** | 프로필 이미지 + 이름 (좌측 고정) |
| **사번** | (좌측 고정) |
| **회사** · **조직** | — |
| **근무계획** | 해당 일자 근무계획명 |
| **최종 누락 여부** | 누락이면 "누락", 아니면 "-". 툴팁: "출근 또는 퇴근 기록이 누락된 경우 '누락'으로 표시됩니다." / "단, 종일 기타근무 또는 휴가가 승인되었거나, 기타근무와 휴가 시간을 합산하여 소정근로시간 이상인 경우는 누락으로 표시되지 않습니다." |
| **근무시간** | 툴팁: "출근부터 퇴근까지의 총 시간에서 휴게시간과 자리비움 시간 등 근무 외 시간을 제외합니다." / "출근 인정 시각이 설정되어 있다면 해당 기준으로 계산됩니다." |
| **출근** | 최초 출근 시각 HH:mm + 지각 시 "(N시간 N분 지각)". 출근 요청이 진행 중이면 "요청중" |
| **퇴근** | 최종 퇴근 시각 HH:mm + 조퇴 시 "(… 조퇴)". 퇴근 요청 진행 중이면 "요청중" |
| **휴가** | `HH:mm ~ HH:mm` 목록(쉼표 구분), 상태에 따라 " (요청중)" / " (취소중)" 덧붙임 |
| **기타근무** | 휴가와 같은 형식 |
| **재택** | 요청중 / 취소중 / 승인완료 |
| **근무 내역 변경** | 진행 중인 근무내역 변경 신청이 있으면 "요청중", 없으면 "-" |
| **활성 여부** | 활성 / 비활성 |
| **알림** | "발송" 버튼 / "발송 완료" |

> ~~근무내역 변경 컬럼 = 근무내역 변경 신청서 상태 표시 추정~~ → **(2026-11-05 해소)** 진행 중인 (통합 근무내역 / 출퇴근 내역) 변경 신청이 있으면 **"요청중"**, 없으면 "-". 승인완료 등 다른 상태는 표시하지 않음 (`DailyWorkStatusList.tsx:738-759`).

## 필터

- **조회 날짜** (필수, 단일 일자, 기본 오늘) — 기간 선택 불가
- **구성원** · **회사**(기본 = 로그인 사용자 회사) · **조직**
- **누락 건만 보기** 체크박스 — 누락 데이터만 조회
- [조회] / [필터 재설정] 버튼 (2026-10-22 hcgtheplus/talenx-admin#4582로 구성원 검색 입력 → 셀렉터, 조회 버튼 추가)

> ~~오늘 포함 이후 날짜 선택 시 "누락 건만 보기" disabled~~ → **(2026-10-22 변경, 2026-11-05 확인)** hcgtheplus/talenx-admin#4581 "디자인 공통화 - 대시보드 페이지 디자인 통일"에서 **오늘 이후 날짜에도 체크 가능**하도록 수정, 날짜를 바꿔도 체크 상태 유지. QA 체크리스트(L754–767)는 이전 동작 기준.

## 근무 누락 알림 (가장 특화 기능)

**전제**: 사전에 시스템 > 알림 설정에서 **"근무 누락 알림 (어드민 수동 발송)"** 허용 (QA 기준)

**발송 방법 2가지**:
- 행의 **알림** 컬럼 "발송" 버튼 (1명)
- 체크박스로 여러 명 선택 → 상단 **[알림 발송]** 버튼

**활성 조건** (체크박스·발송 버튼 모두, `isRowSelectable`, `:941-946`):
- 근무 누락 상태 (`isMissing`)
- 발송 완료 상태가 아님 (`!hasSentNotification`)
- 진행 중인 근무내역 변경 신청 없음 (`workRegChangeApplInfos == null`)
- **활성 구성원** (`isActive`) — 비활성 구성원은 발송 불가 (QA 누락 조건)
- 누락인데 변경 신청이 있으면 "발송" 버튼에 툴팁: "통합 근무내역 변경 또는 출퇴근 내역 변경 요청건이 존재하여 알림을 발송할 수 없습니다."

**확인 창** "근무 누락 알림 발송": "**{이름 | 이름 외 N명}**에게 회사 메일로 근무 누락 알림을 발송합니다. 알림은 설정한 웹·앱 알림, 팝업 방식으로 발송하며 시스템 > 알림설정에서 변경 할 수 있습니다."

**결과**:
- 성공: 스낵바 "알림 발송을 완료하였습니다."
- 실패: 얼럿 "요청 실패 에러가 발생했습니다." + 서버 메시지 또는 "알림 발송이 실패했습니다."
- 백엔드는 **오늘 이전 날짜만 발송 허용** — 오늘/미래면 "누락 알림 발송은 오늘 이전 날짜만 가능합니다." (`be:service/workdashboard/WorkDashboardAdminService.java:498-522`). 오늘 날짜는 누락 판정 대상이 아니라 화면상 발송 대상이 생기지 않는 것이 일반적 (추정)

**알림 발송 제외 모달** (발송 중 상태가 바뀐 구성원):
- 서버가 발송 직전 대상자 기록을 다시 조회해 제외 대상을 응답 (`excludedMembers`)
- 제목 "알림 발송 제외"
- 본문: "아래 표시된 구성원들은 알림 발송 도중 통합 근무내역 변경 요청, 출퇴근 내역 변경 요청 또는 근무 누락 상태 변경이 발생하여 알림 발송에서 제외하였습니다." / "아래 구성원 제외, 알림 발송을 정상적으로 완료하였으며 새로고침 후 해당 구성원들을 다시 확인해주시기 바랍니다."
- 목록 제목 "알림 발송 제외 구성원" — 구성원별 제외 사유: "통합 근무내역 변경 요청" / "출퇴근 내역 변경 요청" / "근무 누락 상태 변경" (`DailyWorkStatusList.tsx:68-73, 121-215`)
- 테스트 방법: 발송 버튼 클릭 → 확인 창이 뜬 상태에서 사용자 화면에서 변경 신청 → 확인 버튼

## 백엔드 API

`ad:src/config/api/attendance/dashboard.ts`:

| Method | Path | 용도 |
|--------|------|------|
| POST | `/time/admin/dashboard/daily-work-status/search` | 일별 근무 현황 조회 (대시보드 메인 테이블, 서버 페이징) |
| POST | `/time/admin/dashboard/members-missing-status/send-notification` | 근무 누락 알림 발송 (`memberIds[]` + `stdYmd`) → 응답 `excludedMembers` |
