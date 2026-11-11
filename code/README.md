# code/ — 코드/아키텍처 맵

이 폴더는 **코드 자체를 복사하지 않습니다.** 대신 어디에 무엇이 있는지를 매핑합니다.

## 문서 목록

- `repos.md` — 3개 레포 개요 (스택, 폴더 구조, 근무 도메인 코드 위치)
- `backend-tables.md` — 백엔드 DB 테이블 인벤토리 (TM_*)
- `frontend-modules.md` — 프론트 모듈 인벤토리 [TBD: 다음 단계에 작성]
- `api-contracts.md` — API 계약 (백엔드 ↔ 프론트) [TBD]
- `routing-map.md` — URL → 페이지 매핑 [TBD]

## 코드 참조 표기

```
pp:src/components/attendance/work_info/index.tsx        ← ppfront
pp:src/components/attendance/work_info/index.tsx:42     ← 라인 포함
ad:src/pages/attendance/work/...                        ← talenx-admin
be:com/hcg/optimiz/time/...                             ← optimiz-time (Java 패키지)
TM_INOUT_REG                                            ← DB 테이블
```
