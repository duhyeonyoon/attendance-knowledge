# 근무그룹 상세 — 변경 안 했는데 "탭 이동/저장" 컨펌창 뜨는 false-dirty 버그

> 2026-06-19, 나이스디앤비 고객사 문의 (Slack C01AVJ2CJBW). 화면: 근무그룹 설정 > 상세 > 근무 설정 탭. "[NICE디앤비] 시차출퇴근제(09시)_2026년 이전" (레거시 마이그레이션 그룹). 스테이징 재현 안 됨.

## 증상
- 세팅을 아무것도 안 바꿨는데 탭 이동 시 `탭 이동 / 변경사항이 저장되지 않았습니다. 저장하시겠습니까?` 컨펌창이 뜸.
- 저장해도 다시 이탈하면 또 뜸 (영구적).
- 저장 버튼도 활성화돼 있음.

## 근본 원인 (프론트 dirty 판정 round-trip 비대칭)

`ad:components/attendance/work/group_setting/detail/index.tsx`
- dirty 판정 = `!isEqual(workGroupData, transformedWorkGroupData)` (L679, L736).
  - `workGroupData` = `updateWorkGroupData(raw VO)` — 백엔드 원본에 일부 기본값만 패치한 **비교 기준**.
  - `transformedWorkGroupData` = `transformWorkGroupDataFrontendToBackend(workGroupData, workSettingFormData)` — 폼상태를 백엔드 형식으로 되돌린 값. (`isSave` 미전달 → `...workGroupData` 스프레드 후 폼 필드 덮어씀)
- 즉 `raw → (B→F) → formData → (F→B) → transformed` 라운드트립이 원본과 **정확히 일치해야** dirty=false. 그런데 변환이 **idempotent하지 않음**.

### 비대칭 필드 (원본이 null/undefined일 때 변환이 기본값/형변환을 씌움)
`helpers/attendance/work/group_setting/detail/index.ts` 의 B→F / F→B:

| 필드 | B→F 기본값 | F→B 출력 | 원본이 null/undefined면 | 신뢰도 |
|------|------|------|------|------|
| `note` | `?? ""` | `\|\| ""` | null vs "" → mismatch | ★ (메모 비면 거의 항상) |
| `mobileInoutRegLimitCd` | `?? "GPS_ONLY"` | `\|\| null` | undefined vs "GPS_ONLY" → mismatch | ★ 레거시 |
| `pcInoutRegLimitCd` | `?? "GPS_ONLY"` | `\|\| null` | 동일 | ★ 레거시 |
| `hasMaxWorkLimit` | `?? false` | `?? false` | undefined vs false → mismatch | ★ 레거시 |
| `autoYmdWorkAggrYn` / `autoMmWorkAggrYn` | `?? "N"` | `\|\| null` | null vs "N" → mismatch | ★ 레거시 |
| `holiCalenList`/`workPlcList`/`otherWorkList`/`formSettingSummaryList` | `?? []` | `\|\| []` | null vs [] → mismatch | ☆ 리스트 null일 때 |
| `|| null` 계열 코드필드 다수 | `?? ""` | `\|\| null` | "" vs null → mismatch | ☆ 빈문자 저장 시 |

> `updateWorkGroupData`(L298)가 패치하는 6개 필드(`adjStdYmd`, `timeZoneId`, `workOverTimeStd`, `workForHomePmitYn`, `paidOverTimeStd`, `contractedWorkingTimeCalcStd`)는 양쪽 동일해져서 **문제 없음**. 패치 안 된 위 필드들이 범인.

## 왜 레거시 그룹만 / 스테이징 재현 안 됨
- 위 필드들은 **신규 기능 필드**(출퇴근 제한 코드, 최대근무 제한, 자동집계 등). "2026년 이전" 마이그레이션 그룹은 DB에 해당 컬럼이 null/없음.
- 로드 시 B→F가 기본값을 씌우고, 라운드트립이 원본 null과 불일치 → 편집 0건인데 dirty=true.
- 스테이징/신규 그룹은 현재 UI로 생성돼 모든 필드가 채워짐 → 라운드트립 일치 → 재현 안 됨.

## 왜 "저장해도 또 뜸"
- 확정 그룹(`tempSaveYn==="N"`)은 그룹명/메모/근무시간노출 외 **필드 변경 잠금** (confirm-save). 그래서 저장해도 null 필드들이 백엔드에 안 채워짐 → 재조회 시 여전히 null → 또 dirty.
- `disabledSave = (isEqual && tempSaveYn==="N") \|\| isSubmitting` → falsely dirty면 저장 버튼도 계속 활성.

## 발생 가능성 결론
- **2026년 이전 마이그레이션된 확정 근무그룹 = 발생 가능성 높음 (사실상 상시).** 신규 그룹 = 거의 없음.
- 데이터 손상/실손실 버그는 아님. 단지 dirty 오판정 → 불필요 컨펌창 + 저장버튼 오활성.

## 확정 후 잠기는 필드 ∩ 비대칭 필드 = 영구 유발 후보 (2026-06-19 추가 조사)

확정(`tempSaveYn="N"`) 시 `isDisableOnConfirmed`가 근무설정 탭 거의 전 컴포넌트에 전파돼 **근무그룹명/메모/근무시간노출 외 전부 disabled**. 기타설정(집계) 탭은 `tempSaveYn` 무관하게 항상 disabled(조회전용). 따라서 "저장해도 못 고치는 + 라운드트립 비대칭 + 레거시 null 가능" 교집합:

| 필드값(코드) | UI 명칭 | 비대칭 메커니즘 | 잠금 | 가능성 |
|------|------|------|------|------|
| `autoYmdWorkAggrYn` | 기타 설정 > 집계 설정 > **일별 근무 집계** | B→F `?? "N"` / F→B `\|\| null` → raw null이면 `"N"≠null`. VO nullable String(L67) | 항상 잠금(조회전용) | ★★★ |
| `autoMmWorkAggrYn` | 기타 설정 > 집계 설정 > **월별 근무 집계** | 동일. VO nullable String(L76) | 항상 잠금 | ★★★ |
| `holiCalenList`/`workPlcList`/`otherWorkList`/`formSettingSummaryList` | 휴일/출근지/기타근무/신청서 리스트 | B→F `?? []` / F→B `\|\| []` → raw null이면 `[]≠null` | 확정 잠금 | ★ (보통 채워져 있고, staging도 보유한데 재현 안 됨 → 낮음) |
| `workGrpNm` | 근무그룹명 | F→B `?.trim()` → 원본에 앞뒤 공백 있으면 trim돼서 불일치 | 편집가능 | ☆ 엣지 |

**제외(중요 정정)**:
- `hasMaxWorkLimit`(최대 근무시간 제한): 백엔드 VO가 **primitive `boolean`**(`be:WorkGrpVo.java:193`) → 항상 `false` 직렬화, null 불가 → `isEqual(false,false)` 일치 → **범인 아님**. (`hasOvertimeLimit`도 primitive boolean, 동일) `maxWorkLimitUnitCd`/`maxWorkLimitMinutes`는 B→F 기본값이 `null` → 일치.
- `mobileInoutRegLimitCd`/`pcInoutRegLimitCd`(출근지): 두현님 로컬에서 막 추가한 신규 필드 → 고객 운영 데이터엔 미적용 → 제외.
- `note`(메모): null vs "" 비대칭이나 **편집 가능** → 저장으로 해소 → 영구 원인 아님.
- `workForHomePmitYn`/`adjStdYmd`/`timeZoneId`/`workOverTimeStd`/`paidOverTimeStd`/`contractedWorkingTimeCalcStd`: `updateWorkGroupData`(L298)가 로드시 기본값 패치 → 양쪽 일치 → 제외.

**가장 유력 (1순위)**: `autoYmdWorkAggrYn` / `autoMmWorkAggrYn`. 비어있지 않은 기본값("N")을 씌우는 nullable String이면서, 기타설정은 조회전용 영구 잠금. 신규 그룹은 "N"으로 생성되나 "2026년 이전" 마이그레이션 그룹은 null일 개연성 높음 → "staging 정상 / 레거시 재현" 증상과 일치.
**확정 방법**: Network `getWorkGroupDetail` 응답 `workGrpVo` JSON에서 `autoYmdWorkAggrYn`/`autoMmWorkAggrYn`(및 리스트들)이 null인지 확인하면 끝.

## 변경 이력 / 버그 도입 시점 (git, 2026-06-19 조사)

**백엔드 (집계 필드)**: 최근 변경 흔적 사실상 없음.
- `autoYmdWorkAggrYn`/`autoMmWorkAggrYn` = nullable `String`(WorkGrpVo L67/L76), 2024 admin 리뉴얼 이후 안정적.
- 생성 디폴트 상존: `be:WorkGrpSettingService.java:280` `setAutoYmdWorkAggrYn("Y")`, `:286` `setAutoMmWorkAggrYn("N")` → **신규 그룹은 항상 채워짐**.
- INSERT 조건부(`<if autoYmdWorkAggrYn!=null...>`) → null이면 컬럼 생략, DB 디폴트 의존. 2024-06-19 `0de06b1e2` "YN필드 if null 처리"는 구 mapper(timeold) 대상.
- 최근 WorkGrpVo 커밋(2026-06-05 PC/모바일, 2026-04-16 최대근무)은 **집계와 무관**.
- → 레거시 null은 마이그레이션/구버전 생성분에서 유래. 백엔드가 집계를 최근에 바꿔서 생긴 게 아님.

**프론트 (talenx-admin) — 마지막 변경 / 버그 도입 시점**:
- 집계 필드 변환 라인(`?? "N"` / `\|\| null`) in transform helper: **2026-04-06 `9a58ed189`(#3447)** 도입 후 미변경.
- ⭐ **dirty 라운드트립(`transformedWorkGroupData`) + `isEqual(workGroupData, ...)` 비교: 2026-04-16 `5e0c994ce` (#3505 "근무그룹 > 최대 근무시간 제한 설정 추가", dhahn)** 에서 도입. = **false-dirty가 가능해진 시점.** 최대근무 필드 자체는 범인 아니지만(primitive boolean), 그 PR이 라운드트립 비교를 같이 넣으면서 기존 집계-null 비대칭이 표면화됨.
- 기타설정(집계, 항상 disabled) 컴포넌트: 2026-04-06 이후 미변경.
- helper/detail 파일 최신 터치는 2026-06-12 `c7130c2d0`/`054fd8e92`(두현, **출근지** 작업)지만 집계/isEqual 코어와 무관 — 출근지(`mobile/pcInoutRegLimitCd`) 비대칭은 이때 새로 들어온 것(아직 고객 운영 미반영).

**요약**: 버그 메커니즘(isEqual 라운드트립) = **2026-04-16 #3505** 도입. 집계 비대칭 코드 = 2026-04-06부터 잠복. 백엔드 집계 로직은 최근 무변경.

## ⚠️ 정정 + 수동 DB 조작 각도 (2026-06-19 추가)

**집계 필드(autoYmd/autoMm)는 NOT NULL이라 null 불가 → 1순위에서 강등.**
- `be:db/modifyLog/20240603163000_alter_yn_column_is_notnull.sql`: null/''→'N' 일괄 UPDATE(L67-68) 후 `MODIFY COLUMN ... DEFAULT 'N' NOT NULL`(L189-190). init DDL도 `DEFAULT 'N'`.
- 마이그레이션 적용된 DB에선 `autoYmd/autoMm`가 'N'/'Y'만 가능 → 라운드트립 일치 → **false-dirty 유발 못 함** (해당 DB가 마이그레이션 누락이 아닌 한).

**수동 DB 조작이 유력 원인일 수 있음.** 서비스 계층(생성/저장)은 항상 디폴트·정규화를 넣지만, **raw SQL은 이를 우회**. 특히 라운드트립 비대칭의 두 형태:
1. **빈 문자열('') 저장**: `|| null` 계열 nullable String 필드(`validWorkCd`, `inoutRecordOption`, `otPmitCd`, `workType`, `adjPmitWorkTimeCd`, `companyCode`, `mmAggr*Cd` 등)는 → B→F `?? ""`가 ''를 유지 → F→B `|| null`이 ''→null → **baseline '' ≠ transformed null → 영구 dirty**. (DB가 **null이면 안전**, **''이면 깨짐** — 수동 insert가 흔히 '' 사용)
2. **예상 밖 값 / 누락 컬럼**: 서비스가 늘 채우는 필드를 수동 insert가 빼먹어 null/''로 남김.

→ "스테이징(=UI 생성, 정규화됨) 정상 / 고객 레거시(=수동 셋업) 재현" 패턴과 정확히 부합.

**확정 = 그 행 직접 보기**: `SELECT * FROM TM_WORK_GRP WHERE WORK_GRP_ID=...` 로 각 컬럼이 ''(빈문자) 또는 예상 밖 값인지 확인하거나, `getWorkGroupDetail` 응답 JSON을 `transformedWorkGroupData`와 diff. ''로 들어간 nullable String 컬럼이 곧 범인.

## ✅ 확정 원인 (2026-06-19, 실제 NICE디앤비 응답 분석)

대상 그룹 `9AAB459D91C74CC9AC9E9745A7D7D78C`의 실제 `getWorkGroupDetail` 응답을 round-trip 적용 → **유일한 불일치 필드 = `inoutRecordOption = ""`**.

```
baseline: inoutRecordOption = ""
B→F (helper L34):  "" ?? ""   → ""
F→B (helper L165): "" || null → null
isEqual("", null) = false → dirty=true (영구)
```

- 시나리오 A(빈 문자열 + `|| null`) 정확히 적중. `validWorkCd="PLAN"` 그룹이라 출퇴근 기록 옵션이 비어있는데, null이 아니라 `''`로 저장돼 있었음(수동 셋업/구버전 생성 흔적).
- `inoutRecordOption`은 근무시간관리 영역 → 확정(`tempSaveYn="N"`) 잠금 → 사용자 수정·confirm-save 모두 미반영 → "저장해도 또 뜸" 설명됨.
- 나머지 null/"" 필드는 전부 일치 검증됨(`note=""`는 F→B가 `|| ""`라 안전, `mmAggr*=null`은 null↔null, 집계 "Y"/"N" 채워짐, 리스트 deep-equal 일치).
- 주의: 응답에 `mobileInoutRegLimitCd`/`pcInoutRegLimitCd` 키 부재(백엔드 미배포). 두현 로컬 프론트엔 변환 추가돼 있어 로컬선 이 둘도 `undefined vs "GPS_ONLY"` 추가 불일치 발생. 고객(운영) 프론트엔 미적용 → 운영 실제 원인은 `inoutRecordOption` 단일.

**데이터 보정**: `UPDATE TM_WORK_GRP SET INOUT_RECORD_OPTION=NULL WHERE WORK_GRP_ID=... AND INOUT_RECORD_OPTION=''` → null이면 양쪽 null 일치로 해소. 동일 증상 타 그룹도 `''` 일괄 점검 권장.

## 수정 방향 (제안)
1. (권장) dirty 비교를 **raw VO ↔ transformed 라운드트립** 대신 **초기 formData 스냅샷 ↔ 현재 formData** 비교로 변경. 정규화 비대칭 원천 제거.
2. 또는 비교 직전 양쪽에 **동일 정규화** 적용(같은 함수로 normalize 후 isEqual).
3. 단기 완화: 비교 대상 필드 화이트리스트(사용자가 실제 만지는 필드)만 비교.

## 출처
- Slack: https://hcgtheplus.slack.com/archives/C01AVJ2CJBW/p1781852151116469
- `ad:components/attendance/work/group_setting/detail/index.tsx` (L298 updateWorkGroupData, L651 transformed memo, L679/L736 isEqual)
- `ad:helpers/attendance/work/group_setting/detail/index.ts` (B→F L11, F→B L113)
