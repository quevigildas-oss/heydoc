// api/relevance.js — Proxy Vercel sécurisé pour Relevance AI
// Clé dans variable d'environnement Vercel : RELEVANCE_KEY
// Format : "PROJECT_ID:API_KEY"

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-dokita-key');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Vérifier le token Dokita
  const dokitaToken = req.headers['x-dokita-key'];
  if (!dokitaToken || dokitaToken !== process.env.DOKITA_SECRET) {
    return res.status(401).json({ error: 'Non autorisé' });
  }

  const RELEVANCE_KEY = process.env.RELEVANCE_KEY;
  if (!RELEVANCE_KEY) return res.status(500).json({ error: 'RELEVANCE_KEY non configurée' });

  const RG = 'd7b62b';
  const RA = '7d26fda3-fe2d-405c-8aed-645df10baa12';
  const TURL = `https://api-${RG}.stack.tryrelevance.com/latest/agents/trigger`;

  try {
    const { message, conversation_id } = req.body;
    if (!message) return res.status(400).json({ error: 'message requis' });

    const body = { message, agent_id: RA };
    if (conversation_id) body.conversation_id = conversation_id;

    const response = await fetch(TURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': RELEVANCE_KEY
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data.message || data.detail || 'Erreur Relevance AI' });
    }

    return res.status(200).json(data);

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
