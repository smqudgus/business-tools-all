-- 기존에 잘못 저장된 가격 기록 삭제용 SQL v9
-- 배송비/무료배송 기준금액/옵션 단가로 잘못 저장된 기록 제거
-- Supabase > SQL Editor 에서 실행하세요.

delete from price_history ph
using products p
where ph.product_id = p.id
  and ph.price is not null
  and (
    ph.price < (p.cost * 0.95)
    or ph.price > (p.our_price * 1.5)
  );

-- 이미 생긴 대표 오수집 기록 제거
delete from price_history
where price in (3000, 50000, 8950);
