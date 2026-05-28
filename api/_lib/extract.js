const cheerio = require('cheerio');

function cleanNumber(raw){
  if(!raw) return null;
  const n=Number(String(raw).replace(/[^\d]/g,''));
  if(!Number.isFinite(n)||n<1000||n>100000000) return null;
  return n;
}

function normalizeCandidates(candidates){
  return [...new Set(candidates.map(Number))]
    .filter(n=>Number.isFinite(n)&&n>=1000&&n<=100000000)
    .sort((a,b)=>a-b);
}

function choosePrice(candidates, product={}){
  const arr=normalizeCandidates(candidates);
  if(!arr.length) return null;

  const cost=Number(product.cost||0);
  const our=Number(product.our_price||0);

  const min=cost>0?Math.floor(cost*0.95):1000;
  const max=our>0?Math.ceil(our*1.5):100000000;

  const filtered=arr.filter(n=>n>=min&&n<=max);
  if(!filtered.length) return null;

  if(our>0){
    return filtered.slice().sort((a,b)=>Math.abs(a-our)-Math.abs(b-our))[0];
  }
  return filtered[0];
}

function extractPrice(html,url='',product={}){
  const $=cheerio.load(html);
  const candidates=[];
  const totalCandidates=[];

  $('script[type="application/ld+json"]').each((_,el)=>{
    try{
      const raw=$(el).text().trim();
      if(!raw) return;
      const data=JSON.parse(raw);
      const arr=Array.isArray(data)?data:[data];
      const walk=(obj)=>{
        if(!obj||typeof obj!=='object') return;
        if(obj.offers) walk(obj.offers);
        if(obj.price) candidates.push(cleanNumber(obj.price));
        if(obj.lowPrice) candidates.push(cleanNumber(obj.lowPrice));
        Object.values(obj).forEach(v=>{if(typeof v==='object') walk(v)});
      };
      arr.forEach(walk);
    }catch{}
  });

  ['meta[property="product:price:amount"]','meta[property="og:price:amount"]','meta[itemprop="price"]','meta[name="price"]'].forEach(sel=>{
    const v=$(sel).attr('content');
    if(v) candidates.push(cleanNumber(v));
  });

  const bodyText=$('body').text().replace(/\s+/g,' ');
  const htmlText=html.replace(/\s+/g,' ');

  // 모든 판매처 공통 기준: 총 합계 금액/합계 금액/결제 금액이 HTML에 있으면 이 값을 최우선으로 사용
  const totalPatterns=[
    /(?:총\s*합계\s*금액|총합계금액|합계\s*금액|합계금액|총\s*결제\s*금액|결제\s*예정\s*금액)\D{0,120}(\d{1,3}(?:,\d{3})+|\d{4,8})\s*원/gi,
    /(?:total\s*price|total\s*amount|pay\s*amount)\D{0,120}(\d{1,3}(?:,\d{3})+|\d{4,8})/gi
  ];

  for(const pattern of totalPatterns){
    let m;
    while((m=pattern.exec(bodyText))!==null) totalCandidates.push(cleanNumber(m[1]));
    while((m=pattern.exec(htmlText))!==null) totalCandidates.push(cleanNumber(m[1]));
  }

  const totalPrice=choosePrice(totalCandidates.filter(Boolean),product);
  if(totalPrice){
    return {price:totalPrice,confidence:'auto-total',note:'총 합계 금액/결제 금액 기준 자동 추출'};
  }

  const strong=/(?:판매가|할인가|쿠팡판매가|즉시할인가|상품금액|구매가|price|salePrice|discountPrice|discountedPrice|finalPrice|lowPrice)\D{0,80}(\d{1,3}(?:,\d{3})+|\d{4,8})/gi;
  let m;
  while((m=strong.exec(bodyText))!==null) candidates.push(cleanNumber(m[1]));
  while((m=strong.exec(htmlText))!==null) candidates.push(cleanNumber(m[1]));

  const weak=/(\d{1,3}(?:,\d{3})+|\d{4,8})\s*원/g;
  while((m=weak.exec(bodyText))!==null) candidates.push(cleanNumber(m[1]));

  const price=choosePrice(candidates.filter(Boolean),product);

  if(!price){
    const cost=Number(product.cost||0);
    const our=Number(product.our_price||0);
    const min=cost>0?Math.floor(cost*0.95):1000;
    const max=our>0?Math.ceil(our*1.5):100000000;
    return {price:null,confidence:'fail',note:`정상 범위 가격을 찾지 못했습니다. 허용범위 ${min.toLocaleString('ko-KR')}~${max.toLocaleString('ko-KR')}원`};
  }

  return {price,confidence:'auto',note:'자동 추출'};
}

async function fetchAndExtract(url,product={}){
  if(!url||url==='판매안함') return {price:null,confidence:'skip',note:'판매안함 또는 URL 없음'};
  const res=await fetch(url,{headers:{
    'user-agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
    'accept':'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'accept-language':'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
  },redirect:'follow'});
  if(!res.ok) return {price:null,confidence:'fail',note:`HTTP ${res.status}`};
  const html=await res.text();
  return extractPrice(html,url,product);
}

module.exports={fetchAndExtract,extractPrice};
