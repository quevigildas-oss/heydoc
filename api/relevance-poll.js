// api/relevance-poll.js — Proxy Vercel pour polling Relevance AI
// Clé dans variable d'environnement Vercel : RELEVANCE_KEY

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-dokita-key');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // Vérifier le token Dokita
  const dokitaToken = req.headers['x-dokita-key'];
  if (!dokitaToken || dokitaToken !== process.env.DOKITA_SECRET) {
    return res.status(401).json({ error: 'Non autorisé' });
  }

  const RELEVANCE_KEY = process.env.RELEVANCE_KEY;
  if (!RELEVANCE_KEY) return res.status(500).json({ error: 'RELEVANCE_KEY non configurée' });

  const RG = 'd7b62b';
  const { sid, jid } = req.query;
  if (!sid || !jid) return res.status(400).json({ error: 'sid et jid requis' });

  try {
    const url = `https://api-${RG}.stack.tryrelevance.com/latest/studios/${sid}/async_poll/${jid}`;
    const response = await fetch(url, {
      headers: { 'Authorization': RELEVANCE_KEY }
    });

    const data = await response.json();
    return res.status(response.status).json(data);

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
