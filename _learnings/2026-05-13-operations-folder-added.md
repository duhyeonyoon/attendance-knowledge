# 2026-05-13 — operations/ 폴더 신설 + 고객사 세팅 가이드 통합

두현님이 내부 문서 "talenx 근무·휴가 세팅 가이드"를 공유. KB에 새로운 차원 추가.

## 변경 사항

- 신규 폴더: `operations/`
- 신규 문서: `operations/customer-setup-guide.md` (KB cross-link 통합 버전)
- README.md 업데이트 (operations/ 추가, product vs operations 차이 설명)
- 마스터 SKILL.md 업데이트 (질문 유형별 우선 참조 분기 추가)
- index.md 상단에 operations 안내
- 핵심 product 문서들에 operations cross-link 추가 (admin-work-group, admin-work-setting, leave-domain)

## 인사이트: KB의 두 차원

```
product/      = "이 화면이 무엇을 하는지" (descriptive)
operations/   = "고객사 요구를 받았을 때 어떻게 세팅할지" (prescriptive)
```

같은 도메인이지만 사용 목적이 완전히 다름. **product는 사후 분석용, operations는 사전 의사결정용**.

## 가이드의 핵심 가치

1. **5가지 근무제 유형 분류** — 고정 / 시차 / 선택적·탄력적 / 간주 / 교대
2. **유형별 세팅 레시피** (근무 템플릿 + 근무그룹 + 그룹스케줄)
3. **실제 고객사 케이스** (TXR 유연근무제, TXR CS팀 교대근무) — gold value
4. **한계사항 명시** (근무그룹 변경 불가, 휴일 매년 수동 등록 등)
5. **BizOps 확인 필요 케이스** (단독 답변 X, 검토 후 회신)
6. **결재선 기본 가이드**

## product 문서 보강 효과

가이드의 한계사항/임시 동작이 product 문서들의 [TBD]를 일부 해소:
- "휴일 매년 반복 설정 기능 개발 중" → admin-work-setting의 한 줄짜리 정보 보강
- "IP 기반 출퇴근 제한 개발 중" → user-checkin-widget의 GPS 외 옵션 명확화
- "타임존 변경 기능 개발 중" → admin-work-group의 timeZoneId 필드 사용 여부 확인
- "고정 연장시간 자동 차감 기능 없음" → 새로운 한계 정보 추가

## 향후 운영

- 새로운 고객사 케이스 등장 시 → `operations/customer-cases/` 같은 서브 폴더에 누적 가능
- BizOps 확인 케이스가 해소되면 → 가이드 업데이트
- product 문서와 operations 문서 cross-link 양방향 유지

## 작업 패턴

이전 deep-dive 패턴과 다른 점:
- **분석/탐색 작업이 거의 없음** — 두현님이 이미 정제된 자료 제공
- **통합/링크 작업 중심** — KB 다른 문서들과 정합성 맞추기
- **차원 추가** — product/operations/code/domain의 역할 분담 명확화

## 메타 인사이트: 사용자 제공 자료의 가치

deep-dive로 35개 영역 모두 정리했지만, 이 한 문서가 추가되니 **운영 관점**이 들어옴. **유저 제공 자료를 적극 흡수**하는 게 KB 품질 향상의 빠른 길.
