const cheerio = require('cheerio');

function cleanNumber(raw) {
  if (!raw) return null;
  const n = Number(String(raw).replace(/[^\d]/g, ''));
  if (!Number.isFinite(n) || n < 1000 || n > 100000000) return null;
  return n;
}

function pickReasonable(prices) {
  const uniq = [...new Set(prices.map(Number))]
    .filter(n => Number.isFinite(n) && n >= 1000 && n <= 100000000)
    .sort((a, b) => a - b);
  if (!uniq.length) return null;
  return uniq[0];
}

function extractPrice(html, url = '') {
  const $ = cheerio.load(html);
  const prices = [];

  // JSON-LD Offers
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const raw = $(el).text().trim();
      if (!raw) return;
      const data = JSON.parse(raw);
      const arr = Array.isArray(data) ? data : [data];
      const walk = (obj) => {
        if (!obj || typeof obj !== 'object') return;
        if (obj.offers) walk(obj.offers);
        if (obj.price) prices.push(cleanNumber(obj.price));
        if (obj.lowPrice) prices.push(cleanNumber(obj.lowPrice));
        if (obj.highPrice) prices.push(cleanNumber(obj.highPrice));
        Object.values(obj).forEach(v => {
          if (typeof v === 'object') walk(v);
        });
      };
      arr.forEach(walk);
    } catch {}
  });

  // meta tags
  [
    'meta[property="product:price:amount"]',
    'meta[property="og:price:amount"]',
    'meta[itemprop="price"]',
    'meta[name="price"]'
  ].forEach(sel => {
    const v = $(sel).attr('content');
    if (v) prices.push(cleanNumber(v));
  });

  const bodyText = $('body').text().replace(/\s+/g, ' ');
  const htmlText = html.replace(/\s+/g, ' ');

  // Common Korean price patterns
  const patterns = [
    /(?:판매가|할인가|쿠팡판매가|즉시할인가|price|salePrice|discountPrice|discountedPrice|finalPrice|lowPrice)\D{0,60}(\d{1,3}(?:,\d{3})+|\d{4,8})/gi,
    /(\d{1,3}(?:,\d{3})+|\d{4,8})\s*원/g
  ];

  for (const pattern of patterns) {
    let m;
    while ((m = pattern.exec(bodyText)) !== null) prices.push(cleanNumber(m[1]));
    while ((m = pattern.exec(htmlText)) !== null) prices.push(cleanNumber(m[1]));
  }

  const price = pickReasonable(prices.filter(Boolean));
  if (!price) {
    return { price: null, confidence: 'fail', note: '가격 숫자를 찾지 못했습니다.' };
  }

  return { price, confidence: 'auto', note: '자동 추출' };
}

async function fetchAndExtract(url) {
  if (!url || url === '판매안함') {
    return { price: null, confidence: 'skip', note: '판매안함 또는 URL 없음' };
  }

  const res = await fetch(url, {
    headers: {
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
      'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'accept-language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
    },
    redirect: 'follow'
  });

  if (!res.ok) {
    return { price: null, confidence: 'fail', note: `HTTP ${res.status}` };
  }

  const html = await res.text();
  return extractPrice(html, url);
}

module.exports = { fetchAndExtract };
