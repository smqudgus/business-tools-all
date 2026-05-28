const { getSupabase } = require('./_lib/supabase');

module.exports = async function handler(req,res){
  try{
    const supabase=getSupabase();

    if(req.method==='GET'){
      const {data:products,error:pErr}=await supabase.from('products').select('*').order('created_at',{ascending:true});
      if(pErr) throw pErr;
      const ids=products.map(p=>p.id);
      const safeIds=ids.length?ids:['00000000-0000-0000-0000-000000000000'];

      const {data:links,error:lErr}=await supabase.from('competitor_links').select('*').in('product_id',safeIds);
      if(lErr) throw lErr;
      const {data:history,error:hErr}=await supabase.from('price_history').select('*').in('product_id',safeIds).order('checked_at',{ascending:true});
      if(hErr) throw hErr;

      const out=products.map(p=>{
        const pLinks={};
        links.filter(l=>l.product_id===p.id).forEach(l=>pLinks[l.seller_key]=l.url);
        const pHist=history.filter(h=>h.product_id===p.id);
        const latest={};
        pHist.forEach(h=>{ if(h.price!=null) latest[h.seller_key]=h; });
        return {...p,links:pLinks,history:pHist,latest};
      });
      return res.status(200).json({products:out});
    }

    if(req.method==='POST'){
      const body=req.body||{};
      if(!body.name||!body.our_price) return res.status(400).json({error:'상품명과 우리 판매가는 필수입니다.'});
      const product={name:body.name,cost:Number(body.cost||0),our_price:Number(body.our_price||0),memo:body.memo||null};
      let productId=body.id;

      if(productId){
        const {error}=await supabase.from('products').update(product).eq('id',productId);
        if(error) throw error;
      }else{
        const {data,error}=await supabase.from('products').insert(product).select('id').single();
        if(error) throw error;
        productId=data.id;
      }

      const links=body.links||{};
      for(const [sellerKey,url] of Object.entries(links)){
        if(!['mega','big','coupang','naver'].includes(sellerKey)) continue;
        const {error}=await supabase.from('competitor_links').upsert({product_id:productId,seller_key:sellerKey,url:url||null},{onConflict:'product_id,seller_key'});
        if(error) throw error;
      }
      return res.status(200).json({ok:true,id:productId});
    }

    if(req.method==='DELETE'){
      const id=req.query.id;
      if(!id) return res.status(400).json({error:'id가 필요합니다.'});
      const {error}=await supabase.from('products').delete().eq('id',id);
      if(error) throw error;
      return res.status(200).json({ok:true});
    }

    return res.status(405).json({error:'Method not allowed'});
  }catch(err){return res.status(500).json({error:err.message||String(err)})}
};
