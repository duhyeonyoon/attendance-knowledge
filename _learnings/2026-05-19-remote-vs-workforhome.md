# 2026-05-19 — 재택근무(workForHome) vs 원격근무(rmtWork) 정리

## 결론

**제품 개념은 "재택근무" 하나만 살아있음.** "원격근무"는 옛 모델의 코드 잔재.

## 현행 vs Legacy 매핑

| 항목 | workForHome (현행) | rmtWork (legacy) |
|------|------|------|
| 패키지 | `com.hcg.optimiz.time.*` | 대부분 `timeold.*` |
| Controller | `WorkForHomeApplsController`, `WorkForHomeCancelApplsController` | 없음 |
| Service | `WorkForHomeApplsService`, `WorkForHomeCancelApplsService` | `timeold.service.work.RmtWorkLocService` (위치 CRUD만) |
| Mapper | `WorkForHomeMapper`, `WorkForHomeCancelMapper` | `timeold.mapper.work.RmtWorkLocMapper` |
| 신청 VO | `WorkForHomeApplVo`, `WorkForHomeCancelApplVo`, `~DtlVo` | `RmtWorkApplVo`, `RmtWorkApplDtlVo`, `RmtWorkLocVo` (현행 패키지에 있지만 **ApplsService/Controller 없음 = 워크플로우 미연결**) |
| 그룹 단위 허용 | `WorkGrpVo.workForHomePmitYn` | 없음 |
| 어드민 UI | 근무그룹 > 출근지 관리 > 재택근무 허용 | 없음 |
| 사용자 신청서 | `pp:components/workflow/.../RemoteWork.tsx` (파일명 무관, 백엔드는 workForHome) | 없음 |
| QA 체크리스트 | U17 묶음 (재택) | 없음 |

## 흥미로운 모순들 (정리해두면 좋음)

1. **파일명과 백엔드 도메인이 어긋남**: `RemoteWork.tsx`라는 컴포넌트가 workForHome API를 호출. 신규 개발자/AI가 헷갈리는 1순위 포인트
2. **현행 패키지에 dead VO 잔존**: `com.hcg.optimiz.time.vo.RmtWorkApplVo` 등은 timeold 아닌 현행 패키지에 있는데 ApplsService가 없음 → 사용처 추적 후 제거 검토 필요
3. **현행 DTO 이름에 "Remote" 잔재**: `MemberDailyRemoteWorkPlan`, `RecordRemoteWorkInfoDto` 등 현행 DTO에 "Remote" 이름. 실제로는 workForHome 데이터를 담는 것으로 추정 (네이밍 비일관)

## 추정 히스토리

1. 초기: "원격근무(rmtWork)" 개념으로 출발 — 별도 위치(`RmtWorkLoc`) 기반
2. 어느 시점: 컨셉을 "재택근무(workForHome)"로 재정의 (그룹 단위 허용 + 신청서 워크플로우 풀세트)
3. 코드는 마이그레이션 — Apps/Controller/Service는 새로 만들고 RmtWork 신청은 폐기
4. 잔재: timeold 패키지 + 현행 패키지 일부 dead VO + 컴포넌트/DTO 명명에 "Remote" 산재

## 권고 (정리 ROI 검토)

- **단기**: 컴포넌트 파일명 정리 (`RemoteWork.tsx` → `WorkForHome.tsx`) — 비용 적고 혼동 큼
- **중기**: 현행 패키지의 dead VO (`com.hcg.optimiz.time.vo.RmtWork*` 3개) 사용처 grep → 미사용이면 제거
- **장기**: timeold 패키지의 `RmtWorkLocService` / `RmtWorkLocMapper` 의존성 분석 후 폐기 또는 통합

## 검증 / [TBD]

- [ ] `MemberDailyRemoteWorkPlan`, `RecordRemoteWorkInfoDto` 가 정확히 workForHome 데이터를 담는지 확인 (네이밍 단순 잔재인지)
- [ ] 현행 패키지 `RmtWork*` VO 3개 사용처 — 사용 시 의미가 무엇인지
- [ ] timeold `RmtWorkLocService` 실제 호출처가 남아있는지
