# 조퇴 기준 시간이 퇴근 시간 이후 에러 — 자정 넘는 고정휴게 버그 (2026-06-15)

## 증상
근무 템플릿 저장 시 500 + `"조퇴 기준 시간이 퇴근 시간 이후입니다."`
재현 케이스: 19:00 출근, 8시간 근무(익일 04:00 종료), 고정 휴게 1시간, 조퇴 기준시각 = 익일 04:00.

## 검증 위치
`be:com/hcg/optimiz/time/service/setting/rule/DdWorkPlanSettingService.java`
- 검증 호출 게이트 `:668-677`: `퇴근시간구분=FIXED` && `earlyLeaveUseYn=YES` && `workStaTimeFix=FIXED` 셋 다 참일 때만 `checkIfLeavesLaterThanWorkEnd` 실행
- `checkIfLeavesLaterThanWorkEnd` `:747-794`
- 에러 throw `:791` — `earlyLeaveStdDateTime.isAfter(workEndDateTime)` (strictly after; 같으면 통과)

## 근본 원인 — 휴게시간 day-class 미지원
휴게시간 계산 `:765-782`:
- 시작/종료 시각을 **둘 다 고정 날짜 `20200101`** 로 파싱 (`:770, 776-777`)
- 휴게 DTO `dto/setting/DdWorkPlanRestTimeSettingDto.java:32,35` 에 `restTimeStaHm`/`restTimeEndHm`만 있고 **일자구분(day-class) 필드 없음**
- `getBetween` (`TimeDateUtil.java:836-840`) = `end - sta` 그대로 → 종료<시작이면 음수
- `:779` `Double.max(getBetween, 0)` → 음수를 **0으로 클램프**

→ 휴게가 자정을 가로지르면(종료 HHmm < 시작 HHmm, 예 23:30~00:30) 그 휴게가 **0분**으로 계산됨.

## 재현 케이스 산수
`퇴근시각 = 출근 + (소정근로 + 휴게)` (`:782, 787`)
- 휴게 자정 넘김 → 휴게 0분 → 퇴근 = 19:00 + 480 + 0 = **익일 03:00**
- 조퇴기준 04:00 + 익일(+1일, `:828`) = **익일 04:00**
- `04:00 isAfter 03:00` = true → 에러
- 휴게 자정 안 넘김(00:00~01:00) → 60분 → 퇴근 익일 04:00 → `04:00 isAfter 04:00`=false → 통과

## 에러 발생 조건 (한 줄)
고정휴게 구간의 **종료 HHmm이 시작 HHmm보다 작을 때**(=자정을 가로지를 때) 해당 휴게가 0분으로 계산되어 퇴근시각이 당겨지고, 조퇴기준이 그보다 늦어져 에러.

## 회피책 / 수정 방향
- 임시: 휴게를 자정 안 넘기는 구간으로 입력(예 00:00~01:00).
- 근본: 휴게에 day-class 추가 또는 `restEnd <= restSta`면 +1일 보정.
- 동일 단일-stdYmd 패턴이 `LegacyWorkRecordWidgetService.java:1089`, `OtApplsService.java:1073` 에도 있음 → 같은 약점 점검 필요.

## TODO / 확인 필요
- 프론트(`talenx-admin` 근무 템플릿 화면)가 자정 넘는 휴게 입력을 막거나 +1일 보정하는지 미확인.
- 500으로 노출됨 — OptimizException(입력검증)이 4xx로 매핑 안 되는지 핸들러 확인.
