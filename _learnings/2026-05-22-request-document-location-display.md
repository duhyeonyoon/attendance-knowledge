# 2026-05-22 — 출퇴근 요청 결재 문서의 "출근위치/퇴근위치" 표시 분기

## 발견 요약

사용자 화면에서 근무지 외 출퇴근 요청(`applTypeCd === '1201'` 출근 / `'1202'` 퇴근)의 결재 문서를 열면 "출근위치" 또는 "퇴근위치" 라인이 나오는데, 표시되는 텍스트는 **총 4가지**다.

## 4가지 표시 케이스

| # | 화면 텍스트 | 발생 조건 (백엔드 InApplSmrDto/OutApplSmrDto 기준) | i18n 키 |
|---|------|------|------|
| 1 | 실제 주소 (예: "서울시 강남구 …") | `outOfWorkPlcYn='Y'` + `workAddr` 채워짐 + `locExpiredYn='N'` (3개월 보존 기간 내) | `bizSaveMap.workAddr` 그대로 |
| 2 | "위치 확인 가능 기간(3개월)이 지났습니다." | 주소는 저장됐지만 보존 기간 만료 (`locExpiredYn='Y'`) | `IN_OUT_REG.locationCheckExpired` |
| 3 | "위치 제공 거부" | 주소 없음 + `gpsConfCd='D'` (DECLINED, 위치 권한 거부) → `gpsDeclinedYn='Y'` | `IN_OUT_REG.locationDenied` |
| 4 | "위치 확인 불가" | 주소 없음 + `gpsConfCd` 있고 'D' 아님 (보통 `'U'` UNKNOWN) → `gpsDeclinedYn='N'` | `IN_OUT_REG.locationUnavailable` |

라인 자체가 안 보이는 케이스: 근무지 외 출근이지만 `workAddr`도 없고 `gpsConfCd`도 빔 → `locExpiredYn`/`gpsDeclinedYn` 둘 다 미세팅 → 위치 라인 렌더 X (Request.tsx `:206`의 `(hasLocationData || hasUnknownLocationData)` 가드).

## 프론트 분기 코드 (`pp:src/components/workflow/shared/approval_drawer/contents/Request.tsx`)

```
:96-102
  hasLocationData          = !!bizSaveMap.locExpiredYn
  hasUnknownLocationData   = !!bizSaveMap.gpsDeclinedYn
  locationValidPeriod      = hasLocationData
                           && applTypeCd in ('1201','1202')
                           && locExpiredYn === 'N'

:236-292
  hasLocationData       → locationValidPeriod ? workAddr : t('IN_OUT_REG.locationCheckExpired')
  hasUnknownLocationData → gpsDeclinedYn === 'Y'
                            ? t('IN_OUT_REG.locationDenied')   // "위치 제공 거부"
                            : t('IN_OUT_REG.locationUnavailable') // "위치 확인 불가"
```

마우스 오버 시 데스크톱에선 툴팁으로 같은 텍스트 노출 (`MUITooltip`).

## 백엔드 결정 로직 (`be:dto/appls/InApplSmrDto.java:140-149`, OutApplSmrDto 동일 패턴)

```java
if (isOutOfWorkPlc) {  // 근무지 외 출근/퇴근일 때만
  if (!StringUtil.isEmpty(workAddr)) {
    locExpireYmd = inApplDto.getLocationAccessibleEndYmd();  // 케이스 1/2 경로
  } else {
    if (!StringUtil.isEmpty(gpsConfCd)) {
      boolean isDeclined = StringUtil.equals(gpsConfCd, IN_LOC_CONF_CD_1.DECLINED.value());
      gpsDeclinedYn = isDeclined ? ENUM_YN.YES.value() : ENUM_YN.NO.value();
      // Y → 케이스 3, N → 케이스 4
    }
  }
}
```

> `locExpireYmd`(백엔드)와 `locExpiredYn`(프론트가 보는 필드)의 정확한 매핑 위치 [TBD]. 프론트는 'Y'/'N' boolean 플래그를 받아 쓰므로 백엔드 어딘가에서 `LocationAccessibleEndYmd`와 현재일자 비교 후 Y/N 산출하는 단계가 있을 것.

## `gpsConfCd` 코드 체계 (KB `domain/glossary.md`)

- `C` (CONFIRM) — 등록 근무지 내. 근무지 외 출근 분기 미해당
- `O` (OUT OF LOCATION) — 근무지 외 + 위치 확보됨 → 케이스 1/2
- `D` (DECLINED) — 위치 권한 거부 → 케이스 3
- `U` (UNKNOWN) — 위치 측위 실패 (신호 약함, 실내·지하, 디바이스 미지원, timeout 등) → 케이스 4

## 비즈니스 룰 정리

1. **3개월 보존 기간** — 주소 저장 후 3개월 지나면 결재 문서에서도 주소 텍스트 대신 만료 안내로 변경 (`LOCATION_ACCESSIBLE_END_YMD` 기준)
2. **"위치 제공 거부" vs "위치 확인 불가" 구분** — 사용자 행동(권한 거부)과 환경 실패(측위 불가)를 명시적으로 구분해서 노출. 결재자가 사유를 짐작할 수 있도록 함
3. **이 4분기는 결재 문서 본문**(Request.tsx)에만 적용. **어드민 출퇴근내역 화면**(`startWorkAddr`/`endWorkAddr`)은 토글 OFF면 주소 자체가 안 보이고, ON이면 주소 또는 dash만 표시 — 거부/불가 구분 없음.

## KB 업데이트 항목

- [ ] `product/user/home/checkin-widget.md` § GPS 검증에 결재 문서 측 4분기 표시 룰 추가 (현재는 위젯 측 `gpsConfCd` 산출까지만 정리)
- [ ] `product/user/applications/overview.md` 또는 신규 `product/appl-inout-request.md`에 출퇴근 요청서(1201/1202) 본문 표시 규칙 정리
- [ ] `domain/glossary.md`의 `gpsConfCd` 항목에 화면 표시 매핑 추가

## 출처

- `pp:src/components/workflow/shared/approval_drawer/contents/Request.tsx:96-296`
- `pp:src/locales/ko/workflow.json:487-535` (`IN_OUT_REG.*`)
- `be:dto/appls/InApplSmrDto.java:140-149`
- `be:dto/appls/OutApplSmrDto.java:141-150` (대칭 구현)
- KB `domain/glossary.md` gpsConfCd
