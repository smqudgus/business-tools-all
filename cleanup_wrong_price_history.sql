-- 기존에 잘못 저장된 가격 기록 삭제용 SQL
-- 예: 입고가 71,720원 상품에서 배송비 3,000원이 가격으로 저장된 기록 제거
-- Supabase > SQL Editor 에서 실행하세요.

delete from price_history ph
using products p
where ph.product_id = p.id
  and ph.price is not null
  and (
    ph.price < (p.cost * 0.5)
    or ph.price > (p.our_price * 3)
  );
