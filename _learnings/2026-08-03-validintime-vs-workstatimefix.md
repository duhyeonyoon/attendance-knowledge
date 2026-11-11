# 출근 인정 시각(validInTime)과 출근시간 고정여부(workStaTimeFix)의 관계

> 발단: NICE씨엠에스(오일오님) 문의 — "템플릿 09:00~18:00 + '자유롭게 출근' + 출근인정시각 09:00일 때
> 08:50에 타각해도 09:00 출근으로 반영되는가? '정해진 시각에 출근' + 인정시각과 동일한가?"
> Slack: C06ULEEM88M / thread_ts 1785477993.449119

## 결론

**확정 근무시간 산정 관점에서는 두 옵션이 동일하게 동작한다.** 출근인정시각 로직은
`validInTimeUseYn` / `validInTime` / `validInTimeStdDdClass` 세 값만 참조하며,
`workStaTimeFix`(F=정해진 시각 / S=자유롭게)를 전혀 보지 않는다.

## 필드

| 필드 | 의미 |
|------|------|
| `workStaTimeFix` | `F` = 정해진 시각에 출근(고정), `S` = 자유롭게 출근 |
| `validInTimeUseYn` | 출근 인정 시각 사용 여부 (Y/N) |
| `validInTime` | 출근 인정 시각 (HHmm) |
| `validInTimeStdDdClass` | 기준일 구분 (BSD/NXD/BFD) |

## 백엔드 동작 (be:common/workcalc/WorkTimeCalcService)

- `L135-157` — `validInTimeUseYn === 'Y'` 일 때만 `validInLocalDateTime` 세팅.
  **workStaTimeFix 조건 없음.**
- `L2400-2425` — 실제 출근시각 < 인정시각이면 `[실제 출근시각 ~ 인정시각]` 구간을
  `NOT_WORK_TYPE.EARLY_IN`(조기출근 비근무)으로 근무용/급여용 양쪽에 추가.
  → **타각 기록 자체는 08:50 그대로 남고, 인정 근무시간에서만 10분이 빠진다.**
- `L706-708` — 법정휴게 계산용 기본근무 시작시각도 인정시각으로 끌어올림.
- `L3042-3044` — 승인 연장근무 구간 시작시각도 인정시각으로 보정.
- 인정시각 **이후** 타각이면 위 분기가 모두 안 걸리므로 실제 타각 시각 그대로 인정. OK

## 사용자 화면 (pp) — 출근인정시각 노출 지점 3곳

모두 **인정시각 "이전"에 타각한 경우에만** 노출된다. 인정시각 이후 타각이면 아무 표시도 없음.

1. **출퇴근 위젯 — `pp:components/main/work_commute/contents/TimeTable.tsx:121-160`**
   "출근시간" 라벨 옆 느낌표 아이콘(회색 #C4C7D4) → 클릭 시 모달
   "출근인정 시각 (HH:mm)부터 근무 시간으로 인정합니다."
   (`pp:locales/ko/attendance.json:177` `PERSONAL_WORK.timeTable.goToWorkTimeDescription`)
   조건: `validInTimeUseYn === "Y"` && `inYmdhms < validInTime`(BFD면 -1일 보정)
2. **출/퇴근 요청 모달 — `pp:components/main/work_commute/contents/ClockInOutRequestDialog.tsx:843-858`**
   출근시각을 인정시각 이전으로 입력 시 warning 문구
   (`IN_OUT_REG.validation.acknowledgedCheckInTime`). 제출을 막는 blocking은 아님.
3. **통합홈 근무 요약 정보 — `pp:components/attendance/work_info/contents/Content.tsx:1253`**
   일자별 리스트에서 툴팁 "출근 인정 시각 HH:mm"
   (`pp:locales/ko/attendance.json:443` `WORK_INFO.validInTimeTooltip`)

출근시간 표시 자체는 세 곳 모두 **실제 타각 시각**.
- 예외: `workTimeVisibleCd === "DENIED"` 고객사는 근무내역 변경 신청서에서 첫 출근시간이
  인정시각으로 보정되어 표시됨 (`pp:workflow/shared/template_drawer/contents/RegEdit.tsx:435,455-487`).

## 두 옵션이 "완전히" 동일하진 않은 지점 (신규 발견)

### 1. 예상 퇴근시간에는 인정시각 보정이 없음

`be:WorkTimeCalcService#makeExpectOutTime L3163-3210`
- `F`(정해진 시각) → 기준 = **계획 출근시각**
- `S`(자유롭게)   → 기준 = **실제 출근시각** (`L3184-3187`)
- 이 함수에는 `validInLocalDateTime` 참조가 **전혀 없음.**

→ 자유출근 + 인정시각 09:00 + 08:50 타각이면 **예상 퇴근시간이 10분 당겨져(예: 17:50) 보인다.**
   위젯은 같은 화면에서 "출근인정 시각 09:00부터 근무 시간으로 인정합니다" 안내를 띄우면서
   예상 퇴근시간은 08:50 기준으로 계산해 보여주는 **자기모순 상태**가 된다. (UX 이슈)
   확정 근무시간(09:00 기준)과 사용자 화면 예상 퇴근시간이 어긋나는 케이스.
   고정출근(F)은 계획 기준이라 이 어긋남이 없음. → **두 옵션의 실질적 차이는 여기서만 발생.**

### 1-b. 인정시각 "이후" 타각 케이스에서도 두 옵션의 답이 갈린다

예) 템플릿 09:00~18:00 / 소정 8h / 휴게 자동(8h→60분) / 인정시각 09:00 / **09:10 타각**

| 세팅 | 예상 퇴근시간 |
|------|------|
| `F` 정해진 시각에 출근 | **18:00** (계획 출근시각 09:00 + 9h) |
| `S` 자유롭게 출근 | **18:10** (실제 타각 09:10 + 9h) |

- 인정시각(09:00)보다 늦게 찍었으므로 인정시각 보정 분기는 애초에 안 걸린다.
- 즉 18:10의 근거는 "출근인정시각으로부터"가 **아니라** "실제 타각으로부터"다.
  (2026-08-03 Slack 답변 초안에 이 부분이 잘못 기재됨 — 지적 후 정정)
- 연장근무 시작시각은 근무그룹 `workOverAggrCd`에 따라 또 갈림:
  `MINUS_NOT_WORKING`(소정근로 후, 기본값) → F/S 모두 실제 타각 기준 18:10 /
  `PLANTIME`·`NON_PLANTIME` → F는 계획퇴근 18:00, S는 18:10.

### 2. 급여용 연장근무 시작시각에는 인정시각을 넘기지 않음

`be:WorkTimeCalcService#makeExpendStaTime L3274-3288`
- 근무용: `resolveExpendStartInfo(..., dto.getValidInLocalDateTime(), ...)`
- 급여용: `resolveExpendStartInfo(..., null, ...)`  ← **validIn을 null로 전달**

→ 실제 출근시각 기반 집계(`MINUS_NOT_WORKING`, `SETTLE`, 자유출근 + `PLANTIME`/`NON_PLANTIME`)에서
   근무용 연장 시작시각과 급여용 연장 시작시각이 인정시각 보정만큼 어긋난다.
   **[확인 필요]** 의도된 설계인지 버그인지 미확인.

### 3. 템플릿 저장 밸리데이션이 자유출근에선 스킵됨

`ad:components/attendance/shared/work_template/WorkTemplateEditor.tsx:672-710`
- "출근 인정 시각 > 고정 출근 시간" 체크는 `isValidString(workStaHm)` 조건부.
- 자유출근(S)은 `workStaHm`이 비어 있어 이 체크가 안 걸림 → 인정시각을 아무 값으로나 저장 가능.
- "인정시각 > 지각기준시각" 체크(`lateStdTime`)는 자유출근에서도 동작.
- 선택적 근로제(`isSelectiveWork`) 근무그룹은 지각/조퇴/출근인정시각 자체가 설정 불가
  (`WorkTemplateEditor.tsx:323, 394-397`).

## KB 반영

- `domain/business-rules.md` § 6 — "workStaTimeFix와 무관" 한 줄 추가 필요
- `product/admin/work/base-setting.md` § 4 밸리데이션 — "고정 출근 시간 있을 때만 체크" 단서 추가 필요
