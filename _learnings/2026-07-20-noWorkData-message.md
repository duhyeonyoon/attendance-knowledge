# '근무 데이터가 없습니다' 메시지 조건 (2026-07-20)

## 결론

`PERSONAL_WORK.noWorkData` ("근무 데이터가 없습니다. 담당자에게 문의해주십시오.")는
**내 근무(PersonalWork) 페이지 전체를 감싼 react-error-boundary의 fallback**이다.
"데이터 없음" 상태를 명시적으로 체크해서 띄우는 메시지가 아니라,
페이지 렌더 중 **catch 안 된 JS 에러가 발생하면** 나오는 캐치올 화면.

## 근거

- 문구 정의: `pp:src/locales/ko/attendance.json:118` (`ATTENDANCE.PERSONAL_WORK.noWorkData`)
- 유일한 사용처: `pp:src/components/attendance/personal_work/index.tsx:147-157` — `<ErrorBoundary fallback={...noWorkData...}>`가 페이지 전체(MyWorkCalendar + WorkCommuteWidget + WorkSummaryWidget)를 감쌈
- ppfront 전체에서 noWorkData 사용처는 이 1곳뿐 (grep 검증)

## 주의

- React Query 전역 설정(`pp:src/App.jsx:42-49`)에 `throwOnError`/`useErrorBoundary` 없음 →
  **API 실패만으로는 이 화면이 뜨지 않음** (query error는 data=undefined로 조용히 처리됨).
  즉 이 메시지 = 렌더 로직 어딘가에서 TypeError 등 런타임 예외.
- 실제 원인 파악은 브라우저 콘솔 에러 / 재현 데이터 필요. 후보: 캘린더 셀 렌더 로직(`pp:src/lib/attendance/personalWork.ts` 3000줄+), 출퇴근 위젯, 근무 요약 위젯의 예상 밖 데이터 형태.
- ko 문구는 "문의해주십시오"(json 기준). CS에서 "문의해주세요"로 인용돼도 같은 메시지.
