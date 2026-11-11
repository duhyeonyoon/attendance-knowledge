---
sidebar:
  order: 1
---

# 연동 (인사 / 시스템 모듈)

> **메뉴** 근무관리 메뉴 외 — 인사관리·시스템 쪽에서 근무 모듈로 들어오는 연동  
> **원본** `product/_legacy/admin-system-entry.md`

*원본 섹션: § #1. 연동 (L1–32)*

## 인사 모듈 ↔ 근무 모듈 (L3–15)

**참고**: 근무관리 > 구성원 정보에서 근무모듈 구성원 데이터 확인 가능

### 전체 연동 설정 (인사 데이터 연동 설정 > 근무관리)

| 동작 | 효과 |
|------|------|
| **연동 → 연동 안함** 변경 | 근무모듈의 구성원과 연동 해제 |
| **연동 안함 → 연동** 변경 | '연동 구성원'이 근무모듈 구성원과 연동 |
| **재연동 버튼** 클릭 | 수동으로 근무모듈 연동 이벤트 발생 |

### 연동 켜기/끄기 처리 (2026-11-05 코드 확인)

인사 모듈의 연동 설정 변경은 API가 아니라 **Kafka 토픽 `HRM_ACTIVATE_SYNC`** 로 근무에 전달됨 (`be:service/syncmember/HrmSyncMemberEventListener.activateSyncHrmMemberListener:124-170`)

- **연동 → 켜기 (`isActive=true`)**: 시스템 모듈에 연동용 인증 토큰 발급 요청 → 토큰 수신(`SYSTEM_GENERATE_TOKEN`) 시 토큰 보관 + 구성원 제공자를 인사모듈(`TALENX_HRM`)로 변경 → 인사모듈에 연동 활성화 이벤트 발행
- **연동 → 끄기 (`isActive=false`)**: 보관 토큰 삭제 + 구성원 제공자를 자체관리(`SELF_MANAGEMENT`)로 변경. **(2026-11-05 해소) 구성원의 활성/비활성 상태는 건드리지 않음** — 끄는 순간의 상태 그대로 유지되고, 이후 근무 모듈 자체 관리로 전환
- 화면의 "연동 구분: talenx 인사관리 / 마지막 연동 일자" 안내와 조직·직책 readonly 여부는 이 구성원 제공자 값으로 분기

### 재연동 = 인사 → 근무 벌크 동기화

- 근무 측 수신 API: `POST /time/sync-member/bulk`, `POST /time/sync-member/company/bulk`(회사별) (`be:controller/syncmember/SyncMemberByApiController.java:30-47`, 서비스 `SyncMemberWithBulkDataService`)
  - ~~[재연동] 버튼이 이 API를 부르는 것은 인사 모듈 코드 미확인 **(추정)**~~ → **(2026-11-05 Slack 확인)** 인사 [재연동](근무관리 탭) = 인사 → 근무 **전체 재연동**. 재연동 시 조직의 회사코드·회사 정보까지 다시 반영되므로, 회사코드 변경 후 사번 변경 이벤트가 실패하는 경우 등도 전체 재연동으로 복구 — Slack #sq-time 2026-03-06 (https://hcgtheplus.slack.com/archives/C04QC2RJJBU/p1772772166245649?thread_ts=1772772000.341029&cid=C04QC2RJJBU), 2026-03-27 (https://hcgtheplus.slack.com/archives/C04QC2RJJBU/p1774599175386619?thread_ts=1774488326.619989&cid=C04QC2RJJBU), 2026-08-03 (https://hcgtheplus.slack.com/archives/C04QC2RJJBU/p1785744126570199?thread_ts=1785742292.546239&cid=C04QC2RJJBU). 인사 쪽 호출 코드 자체는 미확인
  - 현재 인증 미적용으로 개방된 상태(FIXME, 시스템 스쿼드 작업 선행 필요)
- **(2026-11-05 해소) 다시 동기화되는 데이터** (`SyncMemberWithBulkDataService.bulkSyncMemberFromTalenxHrm`): 참조 데이터 먼저 → 구성원 순
  1. 직책
  2. 조직 — 트리 재구성 후 변경분만 갱신, **이번 연동 데이터에 없는 조직은 비활성 처리**
  3. 회사
  4. 구성원 — 메인 발령을 제외한 소속 정보(겸직 등)를 모두 지우고 다시 적재, 신규 구성원 추가. 기존 겸직 만료 처리 로직은 TODO

### 실시간 연동 (연동 중일 때)

**인사모듈 인사발령 확정 시**:
- 발령 내용이 근무모듈에 즉시 반영
- **휴직/퇴직** → 근무모듈 비활성
- **입사발령** → 근무모듈 구성원 추가

## 시스템 모듈 (시스템 > 계정관리) (L17–32)

사용자 계정 상태 변경의 근무모듈 영향:

| 변경 | 인사 ↔ 근무 연동 중 | 연동 X |
|------|------|------|
| **활성 → 비활성** | 근무모듈 비활성 + 모듈별 상태 비활성 | 동일 |
| **비활성 → 활성** | **근무모듈 활성 상태 변경 안 됨** (인사 발령으로만 활성화) | 근무모듈 활성 + 모듈별 상태 활성 |

> ⚠️ 중요한 비대칭: 비활성→활성 시 연동 중이면 **인사 발령이 우선**. 근무 모듈에서 임의로 활성 불가.

## 백엔드

- `be:controller/syncmember/SyncMemberByApiController.java` — API 기반 구성원 동기화
- `be:controller/externalrecord/SyncSecomRecordController.java` — **세콤 출퇴근 기록 동기화** (`validWorkCd === "EXTERNAL"` 그룹용, `KB:product/admin/work/group-setting.md`)
