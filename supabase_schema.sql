-- Supabase SQL Editor에서 이 파일 전체를 복사해서 실행하세요.
-- 이미 테이블이 있으면 중복 생성하지 않습니다.

create extension if not exists "pgcrypto";

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  cost numeric default 0,
  our_price numeric not null,
  memo text,
  created_at timestamptz default now()
);

create table if not exists competitor_links (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  seller_key text not null check (seller_key in ('mega','big','coupang','naver')),
  url text,
  created_at timestamptz default now(),
  unique(product_id, seller_key)
);

create table if not exists price_history (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  seller_key text not null check (seller_key in ('mega','big','coupang','naver')),
  url text,
  price numeric,
  confidence text default 'auto',
  note text,
  checked_at timestamptz default now()
);

create index if not exists idx_price_history_product_date on price_history(product_id, checked_at);
create index if not exists idx_competitor_links_product on competitor_links(product_id);

-- 첫 테스트 상품: 로투스 스프레드 벌크 8kg
insert into products (id, name, cost, our_price, memo)
values (
  '11111111-1111-1111-1111-111111111111',
  '토핑/잼류/로투스/스프레드 벌크/8㎏',
  71720,
  82000,
  '첫 자동 모니터링 테스트 상품'
)
on conflict (id) do update set
  name = excluded.name,
  cost = excluded.cost,
  our_price = excluded.our_price,
  memo = excluded.memo;

insert into competitor_links (product_id, seller_key, url) values
('11111111-1111-1111-1111-111111111111', 'mega', 'https://www.megacoffee.co.kr/goods/goods_view.php?goodsNo=1000012714'),
('11111111-1111-1111-1111-111111111111', 'big', '판매안함'),
('11111111-1111-1111-1111-111111111111', 'coupang', 'https://www.coupang.com/vp/products/8402173157?itemId=23034520647&vendorItemId=88013844640&q=%EC%8A%A4%ED%94%84%EB%A0%88%EB%93%9C+8&searchId=323a4dea6926174&sourceType=search&itemsCount=60&searchRank=0&rank=0&traceId=mpp1tv38'),
('11111111-1111-1111-1111-111111111111', 'naver', 'https://smartstore.naver.com/gourmeton/products/5436990439')
on conflict (product_id, seller_key) do update set url = excluded.url;
