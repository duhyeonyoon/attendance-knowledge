# 구성원 근무 일정(U9-1) 셀 렌더링 성능 — WASM 적용 가능성 검토

작성: 2026-06-29 / 발단: 두현님 질문 "셀 렌더링 버벅거림, WASM으로 완화 가능?"

## 결론

**WASM은 이 케이스에 거의 도움 안 됨.** 병목이 "무거운 수치 계산"이 아니라 **React/DOM 렌더링 + MUI emotion 런타임 스타일 + moment.js 객체 생성**에 있기 때문. WASM은 DOM을 못 건드림.

## 화면 구조 (검증됨)

- `pp:components/attendance/member_work/contents/day_schedule_tab/index.tsx` (1985줄)
- **MUIDataGrid** 사용. 컬럼 = 30분 슬롯 48개(`MAX_TIME_SLOT = 48`, 24h×2), 행 = 구성원.
- 각 셀 `renderCell` → `displayCellContent(item, slotIndex, date)` (index.tsx:963~)
- 셀 컴포넌트: `contents/TimeCell.tsx` (MUI `styled` + 인라인 `sx` 다수), `contents/TimeCellWithPopover.tsx`

## 병목 추정 (코드 근거)

1. **셀당 moment 객체 다발 생성**: `isIncludedTime30Min` / `isFirst30MinInRange` / `isLast30MinInRange` / `hasDifferentScheduleNext30Min` 가 슬롯마다 `moment(...)` 여러 번 호출 (index.tsx:809~960, 파일 내 `moment(` 21회). moment는 무겁고 immutable 아님. 48컬럼 × 가시 행마다 반복.
2. **MUI emotion 런타임 CSS-in-JS**: `TimeCell.tsx`가 셀마다 인라인 `sx`로 width/border/radius/padding 동적 계산 → 매 렌더 emotion 스타일 직렬화. 셀 수만큼 비용.
3. **DOM 노드 수**: 셀 1개가 PlanBox/PlanInfoColumn/Tooltip 등 다중 노드 + Tooltip.

→ 전부 메인 스레드의 JS 실행 + 레이아웃/페인트 비용. WASM↔JS 경계는 DOM 접근이 안 되고, 셀 단위로 경계를 넘으면 오히려 더 느림.

## 권고 방향 (WASM 아님)

- moment 제거 → 분 단위 정수(0~1439)로 슬롯 포함 여부 비교. 객체 생성 0.
- `displayCellContent` 결과를 `useMemo`로 데이터 변경 시에만 재계산 (스크롤 리렌더 시 재계산 방지).
- 인라인 `sx` → 정적 클래스/variant로 빼서 emotion 런타임 비용 절감.
- DataGrid 컬럼 가상화 확인(가로 48컬럼 전부 렌더되는지) + 행 가상화 정상 동작 확인.

## TODO (미검증)

- [ ] DataGrid가 가로(컬럼) 가상화까지 하는지 확인 — 안 하면 비가시 컬럼까지 셀 생성됨
- [ ] 실제 프로파일링(React DevTools Profiler / Performance 탭)으로 moment vs emotion vs DOM 비중 측정
