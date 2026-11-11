# 2026-05-15 — 신규 영역 deep-dive (근무/휴가 그룹 이력 + 배포 이슈)

QA 체크리스트가 1261줄 → 1318줄로 업데이트됨. 신규 추가된 3영역 deep-dive.

## 신규 3영역 분류

| 영역 | 처리 |
|------|------|
| 근무 그룹 이력 관리 (L552) | ✅ Deep-dive 완료 (`product/admin/work/group-history.md` § 근무) |
| 휴가 그룹 이력 관리 (L981) | ✅ Deep-dive 완료 (`product/admin/work/group-history.md` § 휴가) |
| **배포 이슈 리스트 (L1309)** | 📌 **deep-dive 대상 아님** — 운영팀 이슈 트래킹 placeholder. 부록으로만 처리 |

## 큰 발견

### 1. 두 영역 완전 대칭 패턴
근무 측 / 휴가 측 코드가 완전 미러:
- `pages/attendance/{work,leave}/group_setting_history_management/`
- `components/attendance/{work,leave}/group_setting_history_management/`
- `controller/{workadmin,leaveadmin}/{Work,Leave}GroupHistoryController`
- `service/.../{Work,Leave}GroupHistoryQueryService`

→ 묶음 문서 1개로 효율적 정리.

### 2. QueryService 패턴
서비스 명명이 `*QueryService` — **읽기 전용 조회**. 이력은 시스템이 자동 누적, 어드민은 조회만.
- 다른 영역의 `*Service` (CRUD 가능)와 명확히 구분
- 향후 다른 영역에서 비슷한 명명 발견 시 인지

### 3. 필터 = "이력 기준" (현재 소속 X)
일반 화면(`KB:product/admin/work/check-work-data.md` 등)은 보통 "현재 소속" 기준 필터인데, 이력 화면은 **이력 row 자체** 기준 필터.
- 예: 작년에 그룹 X에 있던 구성원 → 그룹 X 필터 시 노출 (현재 Y로 옮겼어도)

### 4. 미래 이력 소속일수 = 0일
미리 입력한 변경 예정 row는 소속일수 0일 표시. **예정 vs 실 발생** 구분.

### 5. 이전 deep-dive에서 발견했던 화면
어드민 #6 근무그룹 deep-dive 시 `group_setting_history_management/` 페이지 존재만 확인하고 [TBD]였음. 이번에 QA 정식 추가 + 백엔드 컨트롤러 발견으로 **deep-dive 가능 영역으로 격상**.

### 6. 이전 [TBD] 부분 해소
`KB:product/admin/work/group-setting.md`에서 미해소였던 "이력 화면의 정확한 용도" → 본 deep-dive에서 풀림.

## 작업 패턴 적용

- ✅ **대칭 패턴 발견 시 묶음 문서**: 신청서 묶음 / 휴가그룹 vs 근무그룹 패턴과 동일
- ✅ **읽기 전용 영역**은 endpoint 단순 (search + excel만) — 일반 영역의 `CONST_APPLY_ACTION` 8개와 차이
- ✅ **QA가 placeholder/메모인 경우** deep-dive 대상에서 제외 (배포 이슈)

## 후속 [TBD]

- `TM_LEAVE_GRP_HISTORY` 정확한 테이블 이름
- `LeaveGroupHistoryDto` 정확한 필드 (work과 미세 차이)
- 이력 자동 기록 트리거 위치 (구성원 변경 저장 시점의 백엔드 코드)

## index.md 갱신 처리

기존 영역들 라인 번호가 밀렸음 (신규 3영역 추가로):
- 근무 데이터 관리: L548 → L562
- 근무 마감: L731 → L745
- 휴가지급 및 관리: L960 → L991
- 과거 근무 데이터 관리: L1247 → L1278

전수 갱신은 시간 비용 큼. **index.md 상단에 갱신 메모만 추가**, 정확한 라인 필요 시 직접 grep 권장.

## 진행 상태

| 영역 | 상태 |
|------|------|
| **사용자 (19개)** | ✅ 모두 완료 |
| **어드민 (16개 + 신규 2개 = 18개)** | ✅ 모두 완료 |
| **전체 37개 영역** | **✅ 100% 완료** |
| 배포 이슈 리스트 | 📌 (대상 아님, 부록 처리) |

## 다음 후보

- 기존 영역의 **변경 사항 점검** — 영역 헤더는 그대로지만 내부 룰이 추가됐을 가능성 (아직 확인 안 함)
- `https://ap-tx.txstag.kr/` staging 환경 **실측 검증** (Claude in Chrome 활용)
- 다른 임시 동작 / 향후 변경 추적
