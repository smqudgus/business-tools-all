# 피알컵 가격추적 자동형

## 핵심
- `price-monitor/` 화면에서 상품과 URL을 등록합니다.
- `/api/check-prices`가 URL 가격을 확인하고 Supabase DB에 저장합니다.
- `vercel.json`의 Cron 설정으로 매일 09:00 KST에 자동 실행됩니다. (`0 0 * * *` UTC)

## 필요한 환경변수
Vercel Project Settings > Environment Variables에 추가:
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY

## Supabase
Supabase SQL Editor에서 `supabase_schema.sql` 전체 실행.

## 주의
쿠팡/네이버/스마트스토어는 봇 차단이나 JS 렌더링 때문에 가격 수집이 실패할 수 있습니다.
실패해도 기록은 남고, 실패 사유가 표시됩니다.
