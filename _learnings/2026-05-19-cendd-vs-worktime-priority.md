# 2026-05-19 — cenDdWorkTime vs workTimeCd 우선순위 (단축근무 운영)

## 발견

휴가 차감 시 "일소정근로시간"이 어디서 오는지 — 단일 값이 아니라 **우선순위 룰**.

`be:common/util/CenDdWorkTimeUtil.java:121–142` `resolveWorkMinutes()` 주석:
> "일계획 > 소정근로 > 근무그룹 > 표준근로 > 기본값(480) 순으로 일 근무 시간을 분 단위로 반환"

`be:service/leaveuse/UseLeaveService.java:1117–1120`:
```java
// 계약일근무시간 (하루 최대 차감은 계약일근무시간만큼) :
// 템플릿 하루 근무시간 -> 근무그룹 표준근로시간 -> 기본 8시간 순서로 적용
Integer workGrpCenDdWorkTime = CenDdWorkTimeUtil.getIntOrDefault(workGrpVo);
Integer cenDdWorkTime = ddWorkPlanVo.getWorkTimeCd() == null
    ? workGrpCenDdWorkTime
    : ddWorkPlanVo.getWorkTimeCd();
```

## 운영 의미 — 단축근무(예: 육아기 단축, 8h→3h)

**올바른 길** (다른 운영자 가이드 & 코드 모두 일치):
1. **근무그룹 그대로** 두고 → **3시간짜리 근무 템플릿 신규 생성**
2. 대상자의 개인 근무계획에 그 템플릿 적용 (직접 적용 / 본인 신청 / 곧 배포될 어드민 개인 스케줄 변경 기능)
3. 그 날부터 자동으로 휴가 1일 = 180분으로 환산됨
4. **휴가그룹 처리**:
   - 사용 시간대 = **자율** → 별도 세팅 X (위 우선순위 룰이 자동 적용)
   - 사용 시간대 = **고정** (종일=8h 박혀있음) → 별도 휴가그룹 + 자율/종일=3h 고정 휴가제도 신설

**과거 내 답변(틀린/무거운 길)**: 근무그룹 자체 분리 + cenDdWorkTime 변경. cenDdWorkTime은 그룹 단위라 1명 단축을 위해 그룹을 쪼개는 건 과한 처리.

## 왜 헷갈렸나

1. `DirectLeaveCalcDto.java:986–989`는 `workGroupMemberHistoryDto.cenDdWorkTime`을 직접 환산에 사용 → 이걸 보고 cenDdWorkTime만 보면 된다고 착각
2. `WorkGroupMemberHistoryDto.java:16` 주석 "계약일근무시간(**표준근로시간**)" — 표준근로시간과 동일시되는 표현이라 일계획(소정근로시간)과의 분리를 놓침

**교훈**: 같은 비즈니스 룰이라도 호출 경로별로 다른 분기/소스를 쓸 수 있음. 메인 경로(UseLeaveService) 확인 필수.

## 예외 — DirectLeaveCalcDto 경로

`DirectLeaveCalcDto` 경로는 일계획 룩업 없이 `workGroupMemberHistoryDto.cenDdWorkTime`을 곧장 분모로 사용 (`return minutes / cenDdWorkTime`). 어드민 직접 휴가 등록 / 휴가 지급 후 환산 등의 경로에서 사용되는 것으로 추정.

→ **검증 필요**: 어드민 측 휴가 사용/지급 결과 표시가 근무그룹값만 보는지, 사용자측 차감 결과와 다를 수 있는지. 다를 수 있으면 운영 혼란 발생 가능.

## KB 반영

- `product/admin/leave/overview.md` § "휴가 일수 계산 공식" — 우선순위 명시 + 단축근무 레시피 + 자율/고정 분기 추가
- `product/admin/leave/overview.md` § "비즈니스 룰 #9" — 일계획 우선 룰 명시
- `operations/customer-setup-guide.md` — 단축근무 레시피 추가 필요 (TODO)

## 검증 / [TBD]

- [ ] `DirectLeaveCalcDto` 경로가 정확히 어떤 화면 / 액션에서 사용되는지
- [ ] `UseLeaveService` 메인 경로 vs `DirectLeaveCalcDto` 결과가 같은 케이스에서 동일한 값을 반환하는지 (단축근무 인원 기준)
- [ ] 어드민이 8시간 그룹 안에서 3시간 템플릿을 운영할 때 다른 화면(연차 보유현황 등)에서 시간↔일 환산이 일관되게 표시되는지
- [ ] 근무그룹의 cenDdWorkTime이 휴가 환산 외에 어디서 더 사용되는지 (`최대 차감 제한`은 확인됨 — UseLeaveService.java:1515 `workGrpCenDdWorkTime`)
