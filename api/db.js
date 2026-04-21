// /api/db.js
// DOKITA — Proxy Supabase sécurisé
// Remplace /api/notion.js
// Utilisé par Dokita Pro pour lire/écrire les données

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-dokita-key');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // Auth
  const dokitaKey = req.headers['x-dokita-key'];
  if (dokitaKey !== process.env.DOKITA_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;
  const IS_TEST      = process.env.DOKITA_ENV !== 'prod';

  // Paramètres de la requête
  // Ex: GET /api/db?table=consultations&filter=statut=eq.en_attente&order=created_at.desc&limit=50
  // Ex: GET /api/db?table=medecins&filter=numero_ordre=eq.CI-2018-00456
  // Ex: POST /api/db?table=consultations (body = payload)
  // Ex: PATCH /api/db?table=consultations&id=uuid (body = updates)

  // table : priorité req.query, fallback req.body.table pour les POST
  const _q = req.query;
  const _bodyTable = (req.method === 'POST' && req.body && req.body.table) ? req.body.table : null;
  const table   = _q.table   || _bodyTable;
  const filter  = _q.filter;
  const filter2 = _q.filter2;
  const filter3 = _q.filter3;
  const order   = _q.order;
  const limit   = _q.limit;
  const id      = _q.id;
  const select  = _q.select;

  if (!table) {
    return res.status(400).json({ error: 'Paramètre table requis' });
  }

  // Tables autorisées
  const TABLES_AUTORISEES = [
    'consultations', 'patients', 'medecins', 'lieux_exercice',
    'examens', 'ordonnances', 'pharmacies', 'appels_offres',
    'familles', 'medicaments', 'dossier_medical',
    'etablissements', 'rendez_vous', 'disponibilites'
  ];
  if (!TABLES_AUTORISEES.includes(table)) {
    return res.status(403).json({ error: `Table non autorisée: ${table}` });
  }

  try {
    let url    = `${SUPABASE_URL}/rest/v1/${table}`;
    let params = [];

    // ── SELECT (colonnes à retourner) ──
    if (select) {
      params.push(`select=${select}`);
    }

    // ── FILTRES ──
    const TABLES_AVEC_IS_TEST = [
      'consultations', 'patients', 'medecins', 'examens',
      'ordonnances', 'pharmacies', 'appels_offres', 'familles', 'lieux_exercice', 'dossier_medical',
    'rendez_vous'
    ];

    if (filter)  params.push(filter);
    if (filter2) params.push(filter2);
    if (filter3) params.push(filter3);

    // Ajouter filtre is_test automatiquement sur les lectures GET
    // sauf si filtre explicite déjà présent
    if (req.method === 'GET' && TABLES_AVEC_IS_TEST.includes(table) && !filter?.includes('is_test')) {
      params.push(`is_test=eq.${IS_TEST}`);
    }

    // ── ORDER ──
    if (order) params.push(`order=${order}`);
    else if (req.method === 'GET') params.push('order=created_at.desc');

    // ── LIMIT ──
    if (limit) params.push(`limit=${limit}`);
    else if (req.method === 'GET') params.push('limit=500');

    // ── ID pour PATCH/DELETE ──
    if (id) params.push(`id=eq.${id}`);

    if (params.length > 0) url += '?' + params.join('&');

    // ── Headers Supabase ──
    const headers = {
      'apikey':        SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type':  'application/json'
    };

    // Retourner la représentation pour POST/PATCH
    if (req.method === 'POST')  headers['Prefer'] = 'return=representation';
    if (req.method === 'PATCH') headers['Prefer'] = 'return=representation';

    // ── Injecter is_test sur les écritures ──
    // Si POST avec body.table (format {table, data}), extraire body.data
    let body = req.body;
    if (req.method === 'POST' && body && body.table && body.data) {
      body = body.data;
    }
    if ((req.method === 'POST') && TABLES_AVEC_IS_TEST.includes(table)) {
      body = { ...body, is_test: IS_TEST };
    }

    const sbRes = await fetch(url, {
      method:  req.method,
      headers: headers,
      body:    ['POST', 'PATCH'].includes(req.method) ? JSON.stringify(body) : undefined
    });

    const data = await sbRes.json();

    if (!sbRes.ok) {
      console.error(`Supabase ${req.method} ${table} error:`, data);
      return res.status(sbRes.status).json({ error: data });
    }

    return res.status(200).json(data);

  } catch (e) {
    console.error('DB proxy error:', e);
    return res.status(500).json({ error: e.message });
  }
}
