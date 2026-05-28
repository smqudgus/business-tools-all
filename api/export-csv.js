const { getSupabase } = require('./_lib/supabase');
function csvCell(v){return `"${String(v??'').replace(/"/g,'""')}"`}
module.exports=async function handler(req,res){
  try{
    const supabase=getSupabase();
    const {data,error}=await supabase.from('price_history').select('checked_at,seller_key,price,confidence,note,url,products(name,cost,our_price)').order('checked_at',{ascending:true});
    if(error) throw error;
    const rows=[['날짜','상품명','입고가','우리판매가','판매처','수집가격','상태','비고','URL']];
    for(const r of data) rows.push([r.checked_at,r.products?.name,r.products?.cost,r.products?.our_price,r.seller_key,r.price??'',r.confidence,r.note,r.url]);
    const csv='\ufeff'+rows.map(row=>row.map(csvCell).join(',')).join('\n');
    res.setHeader('Content-Type','text/csv; charset=utf-8');
    res.setHeader('Content-Disposition','attachment; filename="prcup-price-history.csv"');
    return res.status(200).send(csv);
  }catch(err){return res.status(500).json({error:err.message||String(err)})}
};
