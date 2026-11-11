---
title: 기능 명세서 안내
sidebar:
  order: 0
  label: 명세서 안내
---

> **대상 독자** 기획·QA·CS·신규 입사자 — 코드를 보지 않고 "이 화면이 무엇을, 어떤 규칙으로 하는지"를 알아야 하는 사람

`spec/`은 근무 도메인의 **기능 명세서**입니다. KB(`product/`)가 코드 위치·API·테이블까지 담은 *개발용 지식 베이스*라면, 명세서는 같은 화면을 **화면 구성 · 기능 · 정책 · 메시지** 관점으로만 다시 정리한 문서입니다.

## KB ↔ 명세서 1:1 매핑

명세서 파일 경로는 KB 페이지 문서 경로와 **정확히 같은 구조**를 씁니다. 앞의 `product/`만 `spec/`으로 바뀝니다.

| KB (개발용) | 명세서 (기획·QA용) |
|---|---|
| `product/admin/work/close-work-data.md` | `spec/admin/work/close-work-data.md` |
| `product/user/home/checkin-widget.md` | `spec/user/home/checkin-widget.md` |
| `product/<admin\|user>/<메뉴그룹>/overview.md` | `spec/<admin\|user>/<메뉴그룹>/overview.md` (메뉴그룹 공통 정책) |

각 명세서 frontmatter의 `kb:` 필드가 짝이 되는 KB 문서를 가리킵니다. `product/_legacy/`, `domain/`, `code/`, `_learnings/`는 명세서 짝이 없습니다 (명세서에 반영할 내용이 생기면 해당 페이지 명세서를 고칩니다).

## 동기화 규칙

KB와 명세서는 **같은 사실을 두 관점으로** 적은 것이므로 한쪽이 바뀌면 다른 쪽도 맞춥니다.

| 바뀐 쪽 | 바뀐 내용 | 다른 쪽에 할 일 |
|---|---|---|
| KB | 화면 구성·필드·버튼·탭, 동작, 정책/룰, 메시지, 제약, `[TBD]` 해소 | 명세서의 해당 절 갱신 |
| KB | 코드 경로, API, 테이블, 클래스명, git 이력만 변경 | 명세서 변경 없음 |
| 명세서 | 기획 확정·정책 변경·화면 변경·확인 필요 해소 | KB 해당 절 갱신 (필요하면 코드로 검증 후 `_learnings/`에 기록) |
| 둘 다 | 새 페이지 추가 / 삭제 / 이동 | 양쪽 같은 경로로 생성·삭제·이동 + `index.md` 메뉴 맵 갱신 |

명세서에 적는 사실은 **KB나 코드로 검증된 것만** 적습니다. 추정은 `(추정)`, 미확정은 "확인 필요" 절로 보냅니다.

## 문서 템플릿

```markdown
---
title: <화면 이름>
sidebar:
  order: <KB 문서와 같은 값>
kb: product/<admin|user>/<메뉴그룹>/<파일>.md
---

> **메뉴** 근무관리 › 근무 › 근무 마감
> **URL** `/attendance/work/close_work_data`
> **사용자** 어드민(근무 담당자)

## 1. 개요
이 화면의 목적 2~4문장. 누가, 언제, 왜 쓰는지.

## 2. 화면 구성
| 영역 / 탭 | 구성 요소 | 설명 |
|---|---|---|

## 3. 기능 상세
### 3.1 <기능 이름>
| ID | 기능 | 상세 동작 | 조건 · 예외 |
|---|---|---|---|
| A-WRK-CLS-01 | 일괄 마감 | ... | ... |

입력 항목이 있으면 표로: | 항목 | 필수 | 형식/기본값 | 설명 |

## 4. 정책 · 비즈니스 룰
1. ...

## 5. 메시지 · 예외 처리
| 상황 | 화면 메시지 / 처리 |
|---|---|

## 6. 연관 기능
- [근무 그룹 설정](../work/group-setting.md) — 어떤 관계인지

## 7. 확인 필요
- (KB의 [TBD] 중 기획 관점에서 의미 있는 것)
```

**쓰지 않는 것**: 코드 경로, 컴포넌트·클래스·함수명, API 엔드포인트, DB 테이블/컬럼, git 커밋. 사용자가 화면에서 보는 코드값(예: 근무 상태 라벨)은 화면 표기 그대로 적습니다.

## 기능 ID 체계

`<A|U>-<메뉴그룹>-<페이지>-<2자리 번호>` — A=어드민, U=사용자.

| 폴더 | 페이지 코드 |
|---|---|
| admin/module-setting | `A-MOD-COM`(공통) · `A-MOD-MEM` 구성원 정보 · `A-MOD-ORG` 조직 설정 · `A-MOD-DUT` 직책 설정 |
| admin/authority | `A-AUT-MGR` 직책자 권한 · `A-AUT-CUS` 서브어드민 권한 |
| admin/work | `A-WRK-SET` 근무 설정 · `A-WRK-GRP` 근무 그룹 설정 · `A-WRK-GHI` 근무 그룹 이력 · `A-WRK-DAT` 근무 데이터 관리 · `A-WRK-APL` 근무 신청 내역 관리 · `A-WRK-CLS` 근무 마감 · `A-WRK-DSH` 근무 대시보드 · `A-WRK-PSC` 개인 근무 스케줄 |
| admin/leave | `A-LV-COM`(공통) · `A-LV-SET` 휴가 설정 · `A-LV-GRP` 휴가 그룹 설정 · `A-LV-GHI` 휴가 그룹 이력 · `A-LV-ANL` 연차 관리 · `A-LV-NAN` 연차 외 휴가 관리 · `A-LV-ENC` 연차 촉진 |
| admin/old-data | `A-OLD-WRK` 과거 근무 데이터 · `A-OLD-LV` 과거 휴가 데이터 |
| admin/etc | `A-ETC-SYN` 연동 |
| user/home | `U-HOME-CHK` 출퇴근 위젯 · `U-HOME-STS` 근무 현황 · `U-HOME-SUM` 근무 요약 · `U-HOME-WDG` 기타 위젯 |
| user/attendance | `U-ATT-MYW` 내 근무 · `U-ATT-MYL` 내 휴가 · `U-ATT-MBW` 구성원 근무 · `U-ATT-MBL` 구성원 휴가 · `U-ATT-SCH` 근무스케줄 · `U-ATT-LOC` 위치정보 제공 조회 · `U-ATT-ENC` 연차촉진 |
| user/applications | `U-APL-COM`(공통) · `U-APL-HOL` 휴일근무(사전) · `U-APL-HPS` 휴일근무(사후) · `U-APL-OT` 연장/야간(사전) · `U-APL-OTP` 연장/야간(사후) · `U-APL-RMT` 재택 · `U-APL-ETC` 기타근무 · `U-APL-CMP` 대체근무 · `U-APL-PLN` 근무계획 변경 · `U-APL-WPE` 근무계획 수립 · `U-APL-REG` 통합 근무내역 변경 · `U-APL-INO` 출퇴근 내역 변경 |

기능 ID는 한 번 붙이면 바꾸지 않습니다. 기능이 없어지면 행을 지우지 말고 `(폐기 YYYY-MM-DD)`로 표시합니다.
