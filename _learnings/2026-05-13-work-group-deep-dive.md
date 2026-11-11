# 2026-05-13 — 근무그룹 설정 deep-dive 학습 노트

product/admin/work/group-setting.md 작성 후 정리.

## 본문 통합 완료 ✅

- WorkGrpVo 60+ 필드를 카테고리 8개로 정리 (기본/정산/집계/허용/집계코드/야간/위치/제한/기타)
- 백엔드 API 25개 엔드포인트 매핑 (`/time/work-grps/*`)
- Admin 프론트 디렉토리 트리 (3 탭, work_setting_tab의 8개 섹션)
- 9개 시스템 코드 (`WORK_TYPE_1`, `OT_PMIT_CD_1`, `HOLI_WORK_PMIT_CD_1` 등) glossary 추가
- 임시저장 → 확정 워크플로우 + 확정 후 잠금 룰
- 사용자 화면 영향 표 (cross-domain) — 그룹 설정 변경이 출퇴근 위젯에 미치는 영향 정리

## 큰 발견 / 의외 사항

### 1. 그룹별 야간 시간 커스터마이징 가능성
WorkGrpVo에 `nightStaHm`, `nightEndHm` 필드가 별도 존재. QA에서는 22~06시 "법정 기준 고정"으로 설명되지만, **VO 레벨에서는 그룹별 다른 야간 시간 설정 가능해 보임**. 실제 사용 여부 확인 필요.

### 2. confirm-save 엔드포인트 메소드명 불일치
```java
@PostMapping(value = "/time/work-grps/{workGrpId}/confirm-save")
public ResponseEntity<WorkGrpSettingDto> tempSaveWorkGrp(...)
```
Path는 `confirm-save`인데 메소드명은 `tempSaveWorkGrp`. 코드 정리 또는 의미 확인 필요.

### 3. 두 종류의 WorkGroupSettingService
- `service/setting/WorkGroupSettingService` (메인)
- `service/setting/rule/WorkGrpSettingService` (rule 하위)

이름이 비슷한데 책임 분리가 어떻게 됐는지 [TBD]

### 4. 클라이언트 → 그룹 상속 체계
- 휴일/출근지/기타근무 항목은 **클라이언트 레벨**에서 정의 → 그룹이 사용 여부만 토글
- 클라이언트 레벨 변경 시 이미 사용 중인 그룹들에 어떻게 전파되는지 (즉시 / 다음 저장 시 / 캐시?) [TBD]

### 5. 근무계획 변경 신청서만 설정 가능 (2026.03.06)
"근무 신청서 관리" 섹션은 현재 근무계획 변경 신청서 설정만 가능. 다른 신청서 설정은 미구현.

## 작업 패턴 강화

지난번 출퇴근 위젯 deep-dive 때 잡은 패턴이 잘 작동:
1. ✅ 타입/VO 정의는 처음부터 읽음 (`WorkGrpVo.java` 250줄 전체)
2. ✅ 3개 레포 모두 확인 (admin 화면 + 백엔드 + ppfront 영향)
3. ✅ QA에 outdated/임시 표시 있는 것 명시 ("개발 전", "2026.03.06 기준" 등)
4. ✅ Cross-domain 영향 표 (이번에 새로 추가한 패턴 — 좋음)

## 후속 [TBD]

- `confirm-save` 엔드포인트 정확한 동작
- `nightStaHm`/`nightEndHm` 그룹별 커스터마이징 실제 사용 여부
- `TM_WORK_GRP_CHG_APPL` 정확한 용도 (구성원 그룹 변경? 그룹 룰 변경?)
- 두 `WorkGroupSettingService` 책임 구분
- 클라이언트 → 그룹 상속 변경 전파 메커니즘
- 어드민 hooks 추가 탐색 (현재 1개만 노출됨)
- 근무그룹 복제 시 복사 범위
- 근무 신청서 관리에서 다른 신청서들 설정 추가 일정

## 두현님 답변 받으면 좋을 것

(2차 검수 후 정리)

1. ✅ ~~`confirm-save` 메소드명~~ → 역사적 잔재 (의도된 게 아님). 본문 업데이트 완료
2. ✅ ~~야간 시간 커스터마이징~~ → 어드민 화면 없음 → 22~06 고정. 본문 업데이트 완료
3. ⏸️ 근무 신청서 관리 로드맵 — 두현님이 의도 파악 어려워하셨음. 드롭
4. ✅ ~~`TM_WORK_GRP_CHG_APPL` 용도~~ → 근무계획 변경/대체근무 신청서에서 사용. 본문 업데이트 완료
5. **신규**: 근무그룹 변경 이력 관리 화면(`group_setting_history_management/`)이 별도 존재 — QA 체크리스트엔 없음. 별도 영역으로 신규 product 문서 작성 후보

## 검증 패턴 강화 (이번에 추가된 것)

지난번 제 패턴(타입 정의 grep, 3-레포 확인, cross-domain 영향)에 더해:

- **Swagger annotation 도 봐야 함**: `@Operation(summary=..., description=...)` 가 메소드명보다 정확한 의도를 담고 있는 경우 있음
- **테이블 이름만 보고 용도 추측 금지**: `TM_WORK_GRP_CHG_APPL`은 이름상 "근무그룹 변경 신청"이지만 실제로는 근무계획/대체근무 신청서에서 사용. 사용처 grep 필수
- **어드민 화면 누락 가능성**: QA 체크리스트가 모든 화면을 커버하지 않음 (`group_setting_history_management/` 케이스). `pages/attendance/` 디렉토리 트리도 함께 확인
