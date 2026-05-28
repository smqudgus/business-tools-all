-- 기존에 잘못 저장된 가격 기록 삭제용 SQL v5
-- 배송비 3,000원, 무료배송 기준금액 50,000원처럼 상품 가격이 아닌 기록 제거
-- Supabase > SQL Editor 에서 실행하세요.

delete from price_history ph
using products p
where ph.product_id = p.id
  and ph.price is not null
  and (
    ph.price < (p.cost * 0.95)
    or ph.price > (p.our_price * 1.5)
  );

-- 혹시 남아있는 50,000원 기록만 한 번 더 제거
delete from price_history
where price = 50000;
