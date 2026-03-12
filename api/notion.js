// api/notion.js — Proxy Notion sécurisé
// La clé est dans les variables d'environnement Vercel, jamais dans le code

export default async function handler(req, res) {
  // Autoriser les appels depuis l'app
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const NOTION_KEY = process.env.NOTION_KEY;
  if (!NOTION_KEY) { res.status(500).json({ error: 'NOTION_KEY non configurée' }); return; }

  // Extraire le chemin Notion depuis la query
  // ex: /api/notion?path=/databases/xxx/query
  const notionPath = req.query.path;
  if (!notionPath) { res.status(400).json({ error: 'path manquant' }); return; }

  try {
    const notionRes = await fetch('https://api.notion.com/v1' + notionPath, {
      method: req.method === 'GET' ? 'GET' : req.method,
      headers: {
        'Authorization': 'Bearer ' + NOTION_KEY,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: ['POST', 'PATCH'].includes(req.method) ? JSON.stringify(req.body) : undefined
    });

    const data = await notionRes.json();
    res.status(notionRes.status).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
