---
sidebar:
  order: 6
---

# 위치정보 제공 조회

> **메뉴** 근무관리 › 위치정보 제공 조회  
> **URL** `/attendance/location_access_logs`  
> **원본** `product/_legacy/user-small-screens.md`

*원본 섹션: § U12. 위치정보 제공 조회 (L618–634)*

## 진입 위치

- `pp:src/pages/attendance/location_access_logs/index.tsx`
- 페이지: 위치정보 제공 조회

## 코드

```
pages/attendance/location_access_logs/index.tsx
components/attendance/location_access_logs/contents/
containers/attendance/location_access_logs/
```

## 핵심 개념

**개인정보 보호 컴플라이언스 화면.** 타인이 본인의 위치를 조회한 이력을 확인할 수 있는 화면. **GDPR/개인정보보호법 대응** 성격.

## 전제 조건

> 다음 조건 모두 만족해야 로그가 쌓임:
> - **타인이 내 위치를 조회**
> - **위치 정보가 있는** 경우 (없으면 조회를 해도 로그 X)

## 로그가 쌓이는 케이스

근무지 외 출퇴근 신청 → 타인이 승인/참조로 문서 확인 시:
- **워크플로우 > 받은 문서함**
- **근무관리 > 구성원 근무 > 요청 모아보기**

→ 신청한 계정의 **위치정보 제공 조회 화면**에 로그 쌓임

## 로그가 쌓이지 않는 케이스

- 브라우저 위치 허용 거부 + 위치 정보 없음 상태로 근무지 외 출퇴근 신청 → 타인이 확인해도 **로그 안 쌓임**

## 로그 생성 시점 (2026-11-05 백엔드 확인)

`be:service/locationlog/LocHistoryLogService#saveEmpLocHistoryLog` 호출처 2곳:
1. **출/퇴근 요청 문서 열람** — 신청서 조회(`InApplsService#searchApply` / `OutApplsService#searchApply`) 시 → 받은 문서함·요청 모아보기에서 문서를 여는 것만으로 기록
2. **위치 확인(주소 조회)** — `TimeApplsService#getLocationInformation` (요청 모아보기 등의 위치 확인) 시

두 경우 모두 **`isAccessibleLocAppl()`** 일 때만 기록: 근무지외(`OUT_OF_WORK_PLC_YN = Y`) + 주소(`WORK_ADDR`) 있음 + 오늘이 위치정보 접근 가능 기간(`LOCATION_ACCESSIBLE_STA_YMD ~ END_YMD`) 안.
- **본인 조회는 기록 안 함** (`accessMemberId == ownerMemberId` 이면 return)
- 위치 거부(`gpsConfCd = D`)·주소 없음 요청은 기록 안 됨 (위 "전제 조건"과 일치)

## 위치정보 / 로그 보존 기간 (2026-11-05 백엔드 확인)

| 대상 | 보존 | 근거 |
|------|------|------|
| 출/퇴근 요청의 **위치정보(좌표·주소)** | **신청일 + 3개월**까지 접근 가능 (`LOCATION_ACCESSIBLE_END_YMD`). 만료 후 매일 새벽 배치(01시 시작)가 위치정보를 **파기(NULL 처리)** 하고 `LOCATION_INFO_DELETED_YMDHMS` 기록 | `be:service/privacycompliance/PrivacyComplianceService` (`THREE_MONTHS_FUTURE`, `expireLocationRecordsFrom`), `InApplsService:483`, `OutApplsService:486` |
| **위치정보 제공 조회 로그** (`TM_LOC_HISTORY_LOG`) | **파기 로직 없음** — insert/select만 존재 (코드상 무기한 보존) | `be:mapper/locationlog/LocHistoryLogMapper` |

→ 구성원 근무 요청 모아보기의 "**3개월 이내만 위치 확인**" = 위 위치정보 접근 기간(신청일 기준 3개월). 로그는 그 이후에도 남으므로 본 화면에서는 3개월 이전 조회 이력도 계속 조회됨. 로그가 생기는 기간 자체는 위치 접근 가능 기간(3개월)으로 한정됨.

## 화면 동작

- **필터**: 년 / 월 셀렉트 (각각 "전체" 포함). 월만 고르고 년을 "전체"로 두면 서버 에러 "조회년도를 선택합니다." (`LocHistoryLogService#getLocHistoryLog`). 선택지 = 로그가 있는 년/월 목록 (`/time/location-log/select-years-list`, `select-months-list`)
- 테이블 페이지네이션. 0건이면 "위치정보 조회가 없습니다."
- **테이블 컬럼** (그룹 헤더 "사실 확인자료", `pp:src/components/attendance/location_access_logs/contents/LocationAccessLogsTable.tsx`):
  | 컬럼 | 값 |
  |------|------|
  | 사번 | 조회한 사람 사번 |
  | 제공 받은자 | 조회한 사람 이름 |
  | 위치정보 취득경로 | 위치 **수집 시점** 신청자 기기 OS (신청서 저장 시 User-Agent) |
  | 주소정보 취득경로 | 고정 "Google" |
  | 제공 서비스 | 고정 "위치기반 출퇴근 기록 서비스" |
  | 제공방법 | 고정 "서비스 내 조회" |
  | 이용제공일시 | 조회(제공) 일시 |
- 위치정보 취득경로는 예전엔 **조회 시점** Request 기준으로 저장되던 버그가 있었고(Slack #sq-time 2026-10-20), 현재는 신청서에 저장된 수집 시점 값을 복사 (`saveEmpLocHistoryLog` 주석)
- 고객 응대 근거: 관리자 위치정보 조회 시 본인 로그인 비밀번호 재확인, 조회 이력은 저장되어 대상 구성원이 사용자 화면에서 확인 가능 (Slack #cx 2026-11-04)

## Cross-domain

- `KB:product/user/home/checkin-widget.md` — 위치 정보 생성 (`gpsConfCd`, 하버사인 GPS 검증)
- `KB:product/user/attendance/member-work.md` § "요청 모아보기" — **3개월 이내만 위치 확인** 룰 = 위치정보 접근 기간(신청일+3개월). 로그 자체는 파기 없음 (위 § 보존 기간)
- 위치 조회 = 본 화면 로그 + 매니저 화면 위치 확인 (양쪽)

## 비즈니스 룰

1. **로그 트리거 조건**: (타인 조회) + (위치 정보 있음) 둘 다
2. **위치 정보 없는 경우 로그 X**: 방문 자체를 기록 안 함 (조회 시도 자체는 로그 안 됨)
3. **셀렉트 필터 + 페이지네이션** (표준 패턴)

## [TBD]
- [ ] 조회 로그를 무기한 보존하는 것이 기획 의도인지 (위치정보법상 사실 확인자료 보존 기간 정책 확인 필요) — 코드상 파기 배치 없음
  - **(2026-11-05 Slack 검색 — 부분)** 법적 요구는 **하한**만 확인됨: '26년 위치정보사업자 정기 실태점검(2차 자료제출)에서 "위치정보 이용·제공사실 확인자료는 전자적으로 **6개월 이상** 자동기록 보존", 필수 컬럼 = 이용자 식별값·취득경로(Window/MAC OS X/Android/iOS)·제공받는 자·이용·제공일시, **로그 안에 실제 위치(좌표 등) 포함 금지**(법 제2조제5호) — Slack #sq-time 2026-06-22 (https://hcgtheplus.slack.com/archives/C04QC2RJJBU/p1782120302639539?thread_ts=1782116967.818109&cid=C04QC2RJJBU). 이 화면의 취득경로 컬럼과 2026-10-20 수집 시점 값 저장 수정(PR #1758)이 이 점검 대응. 접근권한 부여·말소 기록은 별도로 5년 보관 요구. **상한(파기 시점)에 대한 결정은 Slack에 없음** → 무기한 보존은 하한을 충족하는 현 상태일 뿐 의도된 정책인지는 여전히 미확정
  - 고객 안내 문구: "위치정보 조회 이력은 저장되며, 조회 대상 구성원도 사용자화면에서 조회 이력을 확인할 수 있습니다." (#cx 2026-11-04)

**(2026-11-05 해소)**
- ✅ API — `GET /time/location-log/emp-loc-history-log`, `select-years-list`, `select-months-list` (`be:controller/locationlog/LocHistoryLogController`)
- ✅ 보존 기간 — 위치정보 3개월 후 파기 / 조회 로그는 파기 없음
- ✅ 기록되는 조회 행위 — 문서 열람 + 위치 확인 둘 다 (타인·접근 가능 기간 내)
