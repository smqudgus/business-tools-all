const { getSupabase } = require('./_lib/supabase');

module.exports = async function handler(req,res){
  try{
    if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
    const supabase=getSupabase();
    const body=req.body||{};
    const product_id=body.product_id;
    const seller_key=body.seller_key;
    const price=body.price===''||body.price==null?null:Number(body.price);
    const checked_at=body.checked_at?new Date(body.checked_at).toISOString():new Date().toISOString();

    if(!product_id) return res.status(400).json({error:'product_id가 필요합니다.'});
    if(!['mega','big','coupang','naver'].includes(seller_key)) return res.status(400).json({error:'seller_key가 올바르지 않습니다.'});
    if(!Number.isFinite(price)||price<=0) return res.status(400).json({error:'가격을 숫자로 입력해주세요.'});

    const {data:link}=await supabase.from('competitor_links').select('url').eq('product_id',product_id).eq('seller_key',seller_key).maybeSingle();
    const {error}=await supabase.from('price_history').insert({product_id,seller_key,url:link?.url||null,price,confidence:'manual',note:'수동 입력',checked_at});
    if(error) throw error;
    return res.status(200).json({ok:true});
  }catch(err){return res.status(500).json({error:err.message||String(err)})}
};
