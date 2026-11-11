---
sidebar:
  order: 2
---

# 휴가 그룹 설정

> **메뉴** 근무관리 › 휴가 › 휴가 그룹 설정  
> **URL** `/attendance/leave/group_setting`  
> **원본** `product/_legacy/leave-domain.md`

*원본 섹션: § B. 휴가그룹 설정 (어드민 #13)*

QA L874–958. **근무그룹과 패턴이 거의 동일**합니다 (`KB:product/admin/work/group-setting.md` 참고).

## 주요 동작

**메인화면**:
- 리스트 페이징 (서버 사이드)
- 최초 생성만 된 그룹은 "미확정" 태그
- **(2026-11-05 Slack 확인) 임시저장/확정은 근무그룹과 같은 패턴**: 백엔드도 임시저장 여부 플래그 + 최초 생성·임시저장 전용 API로 근무그룹과 동일하게 설계(Slack #sq-time 2024-08-05~19). 임시저장(미확정) 상태면 내용 변경이 없어도 [저장]이 활성화돼 바로 확정할 수 있음 — 2026-06 복제 기능과 함께 근무그룹과 맞춤(Slack #sq-time 2026-06-05 https://hcgtheplus.slack.com/archives/C04QC2RJJBU/p1780643572910569?thread_ts=1780633505.503649&cid=C04QC2RJJBU, `hcgtheplus/talenx-admin#3818`)
- 휴가그룹 추가 모달: 그룹명 필수 (밸리데이션) + 메모 (optional)
- 추가 후 상세 페이지로 이동

**휴가그룹 설정 탭** (= 휴가 설정 탭):
- 휴가그룹명만 입력해도 우측 휴가설정 리스트의 체크 표시 켜짐
- 3종 설정 (연차 제도 / 연차 정산 기준 / 연차 외 휴가 제도) 각각 [추가] 버튼:
  - 모달에서 선택 → 추가
  - 추가된 항목 클릭 → 상세 모달
  - X 버튼 → 항목 제거
  - **확정 후 연차 제도 X / 정산 기준 [추가] 비활성화 + 툴팁** — "연차 제도는 최초 저장 이후 수정할 수 없습니다." / "연차 정산 기준은 최초 저장 이후 수정할 수 없습니다." (확정 = `tempSaveYn === "N"`, `ad:.../leave_group_setting_tab/contents/leave_setting/index.tsx:349–352,424`). 백엔드도 연차 제도·정산 기준·회사 변경 시 BadRequest
  - ⚠️ **연차 외 휴가 제도는 확정 후에도 추가/제거 가능** (2026-11-02 검증 — 이전 KB의 "저장 항목 전부 제거 불가"는 outdated)
  - 확정 휴가그룹은 이름/메모만 추가 수정 가능. 삭제는 구성원 이력 있으면 불가(근무그룹과 동일), 항상 soft delete
  - 복제 기능 있음(2026-06): 본체 + 연차 외 휴가 매핑, "(copy)" 이름, 임시저장. 구성원은 미복제
- 선택 방식 **(2026-11-05 해소)**: ~~다른 둘은 단일?~~ → 연차 제도 · 연차 정산 기준은 **라디오(그룹당 1개)**, 연차 외 휴가 제도만 **체크박스(여러 개)** (`ad:.../leave_setting/AnnualLeaveRuleSelectDialog.tsx`, `AnnualLeaveOperationRuleSelectDialog.tsx`, `NonAnnualLeaveRuleSelectDialog.tsx`)
- 정산 기준이 하나도 없으면 선택 모달에 "연차 정산 기준이 없습니다." + [휴가 설정으로 이동]
- 사용여부가 꺼진 제도가 매핑돼 있으면 "사용 불가한 연차 제도" / "사용 불가한 연차 정산 기준" / "사용 불가한 연차 외 휴가 제도"로 표시
- 저장 동작:
  - 밸리데이션 통과 시 즉시 저장 + 모달
  - 밸리데이션 실패 시 그 위치로 스크롤
  - **최초 저장 시 자동으로 다음 탭으로 이동** (근무그룹과 동일 패턴)
  - 저장 활성 상태에서 다른 탭 클릭 → "탭 이동" 모달: "변경사항이 저장되지 않았습니다. 저장하시겠습니까?"

**구성원 설정 탭** (근무그룹과 100% 동일 패턴):
- 검색 필터: 휴가그룹 소속 기간, 키워드(성명/사번), 조직, 회사, 활성 여부
- 구성원 변경 모달 (좌측 검색 ↔ 우측 그룹 소속, >>/<</>/< 이동)
- **변경일 지정**: 초기값 = 당일. 기존 그룹 없으면 입사일과 연차기산일 중 작은 값. **마지막 근무 마감일 이전 변경 불가**
- 추가된 구성원은 리스트 상단 노란색 배경

> `KB:product/admin/work/group-setting.md` § "구성원 설정 탭" 참조 — 동일 패턴

**연차 자동 생성과의 관계**: 연차 자동 생성은 생성 기준일에 휴가그룹 소속이 없으면 전체 실패. 권장 순서 = 연차기산일 입력 → 근무그룹 배정 → 휴가그룹 배정 → 자동 생성 (`_learnings/2026-07-29-annual-leave-concept-map.md`, [연차 관리](./annual-management.md))

## 백엔드 API

`be:controller/setting/LeaveGroupSettingController` + `TimeLeaveAdminController`:

| Method | Path | 용도 |
|--------|------|------|
| GET | `/time/leave-grps` | 휴가그룹 목록 (페이징) |
| GET | `/time/leave-grps/{leaveGrpId}` | 상세 조회 |
| POST | `/time/leave-grps/init-save` ⭐ | 최초 생성 (임시저장) |
| PUT | `/time/leave-grps/{leaveGrpId}/temp-save` | 임시저장 갱신 |
| POST | `/time/leave-grps/{leaveGrpId}` | 휴가그룹+휴가제도 매핑 수정 |
| DELETE | `/time/leave-grps/{leaveGrpId}` | 삭제 |
| GET | `/time/leave-grps/annual-leave-operation-rules` | 정산 기준 목록 (그룹용) |
| GET | `/time/leave-grps/anl-crt-rules` | 연차 생성 규칙 |
| GET | `/time/leave-grps/anl-cm-rules` | 연차 보상 규칙 |
| GET | `/time/leave-grps/leave-systems` | 유효한 휴가제도 목록 |
| POST/GET | `/time/leave-grps/{leaveGrpId}/subjects` | 구성원 조회/추가 |
| POST | `/time/leave-grps/{leaveGrpId}/subjects/search` | 그룹 소속 구성원 검색 |
| POST | `/time/leave-grps/emps/search` | 구성원 검색 (변경 모달 좌측) |
| POST | `/time/leave-grps/with-mapped-leave-systems` | 휴가그룹 VO + 매핑 생성 (TimeLeaveAdminController) |
| PUT | `/time/leave-grps/{leaveGrpId}/with-mapped-leave-systems` | 수정 |
