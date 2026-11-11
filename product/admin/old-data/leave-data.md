---
sidebar:
  order: 2
---

# 과거 휴가 데이터 관리

> **메뉴** 근무관리 › 과거 데이터 관리 › 과거 휴가 데이터 관리  
> **URL** `/attendance/old_data_management/leave_data`  
> **원본** `product/_legacy/admin-old-data.md`

과거 근무 데이터 관리와 필터·조회·업로드·삭제·권한 패턴이 거의 같습니다. 공통 명세는 [과거 근무 데이터 관리](./work-data.md)를 보세요.

## § 차이점

거의 동일한데 미세한 차이:

| 항목 | 과거 근무 (#15) | 과거 휴가 (#16) |
|------|------|------|
| 기본 필터 | 이번달 **연월** | 올해 **연도** |
| 메시지 | "조회용 과거 **근무** 데이터" | "조회용 과거 **휴가** 데이터" |
| 컴포넌트 | `OldWorkData*` | `OldLeaveData*` |
| API | `oldWorkDataManagement.ts` | `oldLeaveDataManagement.ts` |
| VO | `OldWorkDataVo` | `OldLeaveDataVo` |
| 백엔드 컨트롤러 | `OldWorkDataController` | `OldLeaveDataController` |
| 추가 필터 | — | 휴가 유형 |
| 데이터 단위 | 구성원 × 연도/월 | 구성원 × 휴가 유형 × 귀속연도(사용기간) |

**공유**: `UploadOldDataResponseDto` (업로드 결과 공통 DTO)

## 과거 휴가 엑셀 양식 (2026-11-05 확인)

`ad:src/hooks/attendance/old_data_management/leave_data/useOldLeaveDataExcelUpload.tsx`, `ad:src/locales/ko/attendance.json` `OLD_LEAVE_DATA_MANAGEMENT`

| 그룹 | 컬럼 |
|------|------|
| 기본 | 사번 · 이름 · 회사 · 조직 · 직급 · 입사일 · 연차기산일 |
| 휴가 정보 | 휴가 유형 · 귀속연도 · 사용 시작일 · 사용 종료일 |
| 부여 정보 | 부여 · 자동 · 조정 · 부여-이월 (각 일/시간) |
| 사용 정보 | 사용 · 의무 사용 · 의무 사용외 (각 일/시간) |
| 잔여 정보 | 잔여 (일/시간) |
| 정산 결과 | 소멸 · 보상 · 정산-이월 (각 일/시간) |
| 기타 | 메모 |

- 필수: 사번 · 이름 · 회사명 · 휴가 유형 · 귀속연도 · 사용 시작일 · 사용 종료일
- 형식: 귀속연도 YYYY, 날짜(입사일·연차기산일·사용 시작/종료일) YYYYMMDD, 숫자 소수점 4자리까지
- 오류 메시지: "사번은 필수 입력 항목입니다." · "휴가유형명은 필수 입력 항목입니다." · "귀속연도 형식이 올바르지 않습니다. (YYYY)" · "날짜 형식이 올바르지 않습니다. (YYYYMMDD)." · "숫자 형식이 올바르지 않습니다. (소수점 아래 4자리까지 허용)." 등, "{행}행: {메시지}" 형식
- 업로드·삭제·중복·권한 동작은 과거 근무와 동일 (오류 1건이라도 있으면 전체 미저장, hard delete, 중복 체크 없음, 등록자 소속 회사 기준 격리, 어드민 전용) — [과거 근무 데이터 관리](./work-data.md)
