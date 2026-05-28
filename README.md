# business-tools-all-auto-price-monitor-v2

수정 내용:
- 배송비 3,000원 같은 잘못된 가격 제외
- 입고가의 50% 미만, 우리 판매가의 3배 초과 가격은 실패 처리
- 쿠팡/네이버 자동수집 실패 시 수동 가격 보정 가능
- 수동 입력도 price_history에 저장

- v2.1: 상품명 검색 input 디자인 정렬 수정


## v3 수정 내용
- 기존 DB에 이미 저장된 잘못된 가격(예: 메가커피 3,000원)을 화면 최신가에서 제외합니다.
- `api/products.js`에서 입고가의 50% 미만 / 우리 판매가의 3배 초과 가격을 표시하지 않도록 필터링합니다.
- `cleanup_wrong_price_history.sql`을 추가했습니다. Supabase SQL Editor에서 실행하면 기존 잘못된 기록을 삭제합니다.
