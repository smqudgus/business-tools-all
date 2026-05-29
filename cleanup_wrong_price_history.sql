-- v15 잘못 저장된 가격 기록 삭제용 SQL
-- 아임요 배 베이스 빅커피 6,000원 오수집 기록 제거

delete from price_history ph
using products p
where ph.product_id = p.id
  and p.name like '%아임요%'
  and ph.seller_key = 'big'
  and ph.price = 6000;

-- 배송비/무료배송 기준금액 등 대표 오수집 제거
delete from price_history
where price in (3000, 50000, 8950);
