---
sidebar:
  order: 0
---

# 모듈 설정·권한 공통 (코드 위치·권한 모델·룰)

> **원본** `product/_legacy/admin-system-entry.md`

모듈 설정(구성원 정보·조직·직책)과 권한(직책자·서브어드민) 화면에 공통으로 걸리는 코드 위치, 권한 모델, 비즈니스 룰을 모은 페이지입니다. 각 화면 상세는 사이드바의 개별 페이지를 보세요.

## 개요

근무 모듈의 **시스템 진입점** 4개 영역 통합:

| 영역 | 화면 | 역할 |
|------|------|------|
| **#1** | 연동 (인사/시스템 모듈) | 인사 ↔ 근무 모듈 데이터 동기화 |
| **#2** | 모듈 설정 (구성원/조직/직책) | 인사 데이터의 근무 모듈 표시 + 연차기산일 관리 |
| **#3** | 총괄 권한 | 어드민 도메인 접근 권한의 최상위 |
| **#4** | 권한 (직책자/서브어드민) | 운영 권한 위임 (직책자/담당자) |

이 4개 영역이 합쳐서 **"누가 무엇을 할 수 있는가"** 를 결정. 모든 다른 영역의 운영 전제.

## QA 체크리스트

- **#1 연동**: `ad-qa:L1–32` (32줄)
- **#2 모듈 설정**: `ad-qa:L34–71` (38줄)
- **#3 총괄 권한**: `ad-qa:L73–77` (5줄, 가장 짧음)
- **#4 권한**: `ad-qa:L79–180` (102줄, 가장 큼)

## 코드 위치

### Admin 프론트

```
pages/attendance/
├── module_setting/                              ← #2 모듈 설정
│   ├── organization/                            ← 조직 설정
│   ├── duty_setting/                            ← 직책 설정
│   └── member_information_management/           ← 구성원 정보
└── authority/                                   ← #4 권한
    ├── manager/                                 ← 직책자 권한 (Manager)
    └── custom/                                  ← 서브어드민 권한 (Custom)
        └── auth_group_detail/                   ← 권한그룹 상세

components/attendance/
├── module_setting/
│   ├── organization/contents/
│   ├── duty_setting/contents/
│   └── member_information_management/contents/
└── authority/                                   ← (디렉토리 추정)

config/api/attendance/
├── managerAuthorityGroup.ts                     ← 직책자 권한 그룹 API
├── workAuthorityManager.ts                      ← 권한 매니저 API
├── memberInformationManagement.ts               ← 구성원 정보 API
└── organizationSetting.ts                       ← 조직 설정 API
```

### 백엔드

```
controller/setting/
├── MemberInformationController.java             ← 구성원 정보
├── OrganizationSettingController.java           ← 조직 설정

controller/auth/
├── TimeAdminAuthGroupSettingController.java     ← 어드민 권한그룹 설정
└── TimeManagerAuthGroupController.java          ← 직책자 권한그룹

controller/syncmember/
└── SyncMemberByApiController.java               ← 인사 → 근무 구성원 동기화

controller/externalrecord/
└── SyncSecomRecordController.java               ← 세콤 출퇴근 기록 동기화 (별도)
```

## 총괄 권한 (메뉴 없음)

### § #3. 총괄 권한 (L73–77) — 매우 짧음

가장 짧은 영역 (3줄):

- **관리자 총괄 등록** → 어드민 도메인 접근 가능
- **모듈 총괄 권한자**:
  - 해당 모듈의 어드민 도메인 API 실행 권한
  - 전체 대상자 데이터 조회 가능
- **총괄 아닌 자가 어드민 도메인 API 호출 시** → **403 Access Denied**

> "총괄"이라는 용어 = 시스템 최상위 권한. 모듈별로 별개 (예: 근무관리 총괄, 휴가관리 총괄 등).

## ⭐ 권한 모델 종합

### 4단계 권한 계층

```
[총괄 (#3)]                                 ← 어드민 도메인 접근 (모듈별 1명+)
   ↓
[직책자 권한 (#4-1)]                        ← 직책 기반 자동 부여 (그룹 단위)
   ↓
[서브어드민 권한 (#4-2)]                    ← 명시 지정 (담당자 + 범위)
   ↓
[일반 구성원]                               ← 본인 데이터만
```

### 권한 결정 흐름

1. **총괄인가?** → 어드민 전체 접근
2. **직책자인가?** → 직책그룹의 권한 (자동)
3. **서브어드민인가?** → 권한그룹의 담당자로 등록 + 권한 범위 + 권한 종류
4. **일반 구성원** → 본인 + (참여 워크플로우 기반)

### 사용자 화면 권한 분기 (이전 deep-dive와 연결)

- **U9 구성원 근무 / U10 구성원 휴가**: 직책자 권한이 있어야 타인 조회 (`KB:product/user/attendance/member-work.md`)
- **U11 근무스케줄**: 수정 권한이 있어야 역할 기준 탭 + 수정 페이지 (`KB:product/user/attendance/schedule.md`)
- **모든 어드민 화면**: 총괄 + 모듈 권한 필요

## Cross-domain 효과

| 동작 | 영향 |
|------|------|
| 인사 발령 확정 | 근무 모듈 구성원 즉시 추가/비활성 |
| 인사 모듈 연동 해제 | 근무 모듈에서 직책 자체 관리 모드로 전환 |
| 시스템 계정 비활성 | 근무 모듈 비활성 (양쪽 일관) |
| 시스템 계정 활성 + 근무 연동 중 | 근무 모듈 비활성 유지 (인사 발령으로만 활성화) |
| 직책그룹 변경 | 해당 직책 보유자의 권한 즉시 변경 |
| 서브어드민 권한그룹 담당자 추가 | 해당 담당자 어드민 접근 권한 부여 |
| 권한 종료일 도래 | 자동으로 흐리게 (운영 알림) |
| 다중회사 클라이언트 다중조직 선택 | ~~회사 단위 전체조직만 가능~~ → 2025-12-24부터 회사별 조직 선택 가능 |

## 비즈니스 룰

1. **인사 발령 우선**: 비활성→활성 시 인사 발령으로만 활성화 (연동 중)
2. **인사 연동 시 readonly**: 직책/조직 관리 불가
3. **인사 발령 없는 직책 = 근무 미연동**
4. **직책명 중복 불가, 20자 제한** (근무 자체 관리)
5. **구성원 있는 직책 삭제 불가** (직책자 권한 그룹에 포함된 직책도 삭제 불가 — `be:DutySettingService.java:225-230`)
6. **퇴직자 미조회** (조직/직책 모두)
7. **총괄 아니면 어드민 API → 403**
8. **권한그룹 삭제**: 담당자 없을 때만
9. **활성 상태 구성원만 담당자 추가 가능**
10. ~~**다중회사 클라이언트 다중조직 제약** (2025.07.08 임시)~~ → **(2025-12-24 해제, 2026-11-05 코드 확인)** 다중회사도 회사별 조직 선택 가능 (근무 데이터 기반 임시 구현, `KB:product/admin/authority/custom.md`)
11. **권한 종료일 지난 담당자 → 투명도 0.3** (운영 가시화)
12. **추가 구성원 = 담당 구성원 + 추가 구성원 양쪽 표시** (이중 분류)
13. **제외 구성원 복구 시 범위 체크** (범위 외면 단순 삭제)

## 알려진 제약 / 임시 동작

- ~~**다중회사 클라이언트 다중조직 선택 제약**~~ → 2025-12-24 해제 (회사-조직 관계는 구성원 정보의 회사코드 기준 임시 산출)
- **근무그룹 다중 선택 옵션 가려짐** (코드에 주석으로만 존재, 2026-11-05에도 동일 — 숨김 사유 미확정. 2026-11-05 Slack 검색: 2024-09 '근무그룹 추가' 결정 기록만 있고 숨김 논의 없음)
- **연차 관리 / 연차 외 휴가 관리 서브어드민 권한 미분리** — (2026-11-05 Slack 확인: 메뉴 먼저, 권한은 후속 작업으로 단계 분리하기로 결정, 일정 미정) 메뉴는 2026-08 분리됐으나 권한은 "연차 관리, 연차 외 휴가 관리" 한 항목 (`KB:product/admin/authority/custom.md` § 카드 3)

## 검증 / [TBD]

- [x] ~~`MemberInformationController` / `OrganizationSettingController` 정확한 API~~ → **(2026-11-05 해소)** 구성원: `POST /time/v2/members/search`, `POST /time/v2/members/excel-download/search`, `PATCH /time/members`(연차기산일, 총괄 전용) (`be:controller/setting/MemberInformationController.java:34-60`) / 조직: `/time/organizations`, `/time/organizations/{id}`, `/time/organizations/excel-download` (`ad:src/config/api/attendance/organizationSetting.ts`)
- [x] ~~`TimeAdminAuthGroupSettingController` vs `TimeManagerAuthGroupController` 책임 구분~~ → **(2026-11-05 해소)** 전자 = 서브어드민(담당자) 권한그룹·담당자·업무권한(`JOB_AUTH_TM.ADMIN_JOB_AUTH`), 후자 = 직책자 권한(직책그룹, `MEMBER_MANAGEMENT`/`IND_SCHEDULE_MANAGE` YN 컬럼)
- [x] ~~`SyncMemberByApiController` 의 정확한 동작~~ → **(2026-11-05 해소)** `POST /time/sync-member/bulk`, `/time/sync-member/company/bulk` — 인사 → 근무 벌크 동기화(직책 → 조직 → 회사 → 구성원 순, 연동 데이터에 없는 조직은 비활성). `KB:product/admin/etc/sync.md`
- [x] ~~인사 ↔ 근무 연동 토글 변경 endpoint~~ → **(2026-11-05 해소)** API가 아니라 Kafka 토픽 `HRM_ACTIVATE_SYNC` 수신 (`be:service/syncmember/HrmSyncMemberEventListener.activateSyncHrmMemberListener:124-170`). `KB:product/admin/etc/sync.md`
- [x] ~~"회사-조직 관계 관리" 추가 일정 (다중조직 제약 해제 시점)~~ → 2025-12-24 임시 해제 (위 룰 10)
- [x] ~~권한 4종의 정확한 권한 매트릭스~~ → **(2026-11-05 해소)** 5개 구분 × 메뉴 단위 상세 분류 표: `KB:product/admin/authority/custom.md` § 카드 3

## 두현님께 질문 (선택)

1. **근무그룹 담당 범위 옵션이 가려진 이유** (특정 고객사 사정인지, 기획상 폐기인지 — 코드 주석상 미결론) — (2026-11-05 Slack 검색: 관련 논의 없음)
2. **연차 관리 / 연차 외 휴가 관리 서브어드민 권한 분리** 시점 (백엔드 코드·메뉴 매핑은 있으나 권한 항목 시드 없음) — (2026-11-05 Slack 부분 확인: 후속 작업으로 미룬다는 결정만 있고 일정 없음, Slack #sq-time 2026-08-19)

## 관련 문서

- `KB:product/user/attendance/member-work.md` — 직책자 권한이 사용자 화면에 미치는 영향 (구성원 근무/휴가)
- `KB:product/user/attendance/schedule.md` — 수정 권한 분기
- `KB:product/admin/work/group-setting.md` — 근무그룹 (구성원 매핑)
- `KB:product/admin/leave/overview.md` — 휴가그룹 (구성원 매핑)
- `KB:product/admin/work/check-work-data.md` — 근무 데이터 조회 (총괄/매니저 권한 필요)
- `KB:domain/business-rules.md` § 11 인사 ↔ 근무 모듈 연동
