const { getSupabase } = require('./_lib/supabase');
const { fetchAndExtract } = require('./_lib/extract');

module.exports = async function handler(req, res) {
  try {
    const supabase = getSupabase();
    const productId = req.query.productId;

    let query = supabase.from('products').select('*').order('created_at', { ascending: true });
    if (productId) query = query.eq('id', productId);
    const { data: products, error: pErr } = await query;
    if (pErr) throw pErr;

    const ids = products.map(p => p.id);
    const { data: links, error: lErr } = await supabase
      .from('competitor_links')
      .select('*')
      .in('product_id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000']);
    if (lErr) throw lErr;

    const results = [];
    for (const product of products) {
      const pLinks = links.filter(l => l.product_id === product.id);
      for (const link of pLinks) {
        if (!link.url || link.url === '판매안함') {
          results.push({ product: product.name, seller: link.seller_key, ok: false, note: '판매안함' });
          continue;
        }

        try {
          const extracted = await fetchAndExtract(link.url);
          const row = {
            product_id: product.id,
            seller_key: link.seller_key,
            url: link.url,
            price: extracted.price,
            confidence: extracted.confidence,
            note: extracted.note
          };
          const { error } = await supabase.from('price_history').insert(row);
          if (error) throw error;
          results.push({ product: product.name, seller: link.seller_key, ok: !!extracted.price, price: extracted.price, note: extracted.note });
        } catch (e) {
          await supabase.from('price_history').insert({
            product_id: product.id,
            seller_key: link.seller_key,
            url: link.url,
            price: null,
            confidence: 'fail',
            note: e.message || String(e)
          });
          results.push({ product: product.name, seller: link.seller_key, ok: false, note: e.message || String(e) });
        }
      }
    }

    return res.status(200).json({
      ok: true,
      successCount: results.filter(r => r.ok).length,
      failCount: results.filter(r => !r.ok).length,
      results
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || String(err) });
  }
};
