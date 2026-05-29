const { fetchAndExtract } = require('./_lib/extract');

module.exports = async function handler(req, res) {
  try {
    const url = req.query.url;
    const cost = Number(req.query.cost || 0);
    const our_price = Number(req.query.our_price || 0);
    if (!url) return res.status(400).json({ ok:false, error:'url query is required' });
    const result = await fetchAndExtract(url, { cost, our_price });
    return res.status(200).json({ ok:true, url, result });
  } catch (e) {
    return res.status(200).json({ ok:false, error: String(e && e.message ? e.message : e) });
  }
};
