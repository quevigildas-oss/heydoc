// /api/extract-examen.js
// DOKITA — Extraction automatique resultats examens par Claude Vision
// V1.2 — 2026-07-09 : FIX modèle retiré du service (claude-sonnet-4-20250514 → erreur
//        API not_found). Remplacé par claude-sonnet-4-6 (génération stable, vision).
//        ⚠️ Ne pas migrer vers Sonnet 5 sans revue : il rejette les paramètres de
//        sampling non par défaut (sans impact ici, mais règle générale du projet).
// V1.1 — Fix module.exports

const handler = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-dokita-key');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const dokitaKey = req.headers['x-dokita-key'];
  if (dokitaKey !== process.env.DOKITA_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { base64, mime_type, nom_examen, patient_context } = req.body;

  if (!base64 || !mime_type) {
    return res.status(400).json({ error: 'base64 et mime_type requis' });
  }

  const CLAUDE_KEY = process.env.ANTHROPIC_KEY;
  if (!CLAUDE_KEY) return res.status(500).json({ error: 'ANTHROPIC_KEY manquante' });

  const supportedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
  if (!supportedTypes.includes(mime_type)) {
    return res.status(400).json({ error: 'Format non supporte. Utilisez JPG, PNG ou PDF.' });
  }

  try {
    const contentBlock = mime_type === 'application/pdf'
      ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } }
      : { type: 'image',    source: { type: 'base64', media_type: mime_type, data: base64 } };

    const prompt = 'Tu es un medecin biologiste expert en interpretation de resultats d\'examens medicaux en Afrique subsaharienne.\n\n'
      + 'Analyse ce document medical (resultat de laboratoire ou examen).\n'
      + (nom_examen ? 'Examen attendu : ' + nom_examen + '\n' : '')
      + (patient_context ? 'Contexte patient : ' + patient_context + '\n' : '')
      + '\nINSTRUCTIONS :\n'
      + '1. Extrais TOUTES les valeurs presentes dans le document\n'
      + '2. Pour chaque valeur, indique si elle est normale, basse ou elevee selon les normes standard\n'
      + '3. Donne une interpretation clinique synthetique\n'
      + '4. Signale IMMEDIATEMENT toute valeur critique necessitant une attention urgente\n\n'
      + 'Reponds UNIQUEMENT avec le JSON suivant (sans markdown, sans texte avant ou apres) :\n\n'
      + '{\n'
      + '  "type_examen": "nom de l\'examen detecte",\n'
      + '  "date_examen": "date du prelevement si visible, sinon null",\n'
      + '  "laboratoire": "nom du laboratoire si visible, sinon null",\n'
      + '  "valeurs": [\n'
      + '    {\n'
      + '      "parametre": "nom du parametre",\n'
      + '      "valeur": "valeur numerique",\n'
      + '      "unite": "unite",\n'
      + '      "norme": "norme indiquee sur le document si presente",\n'
      + '      "statut": "normal | bas | eleve | critique",\n'
      + '      "interpretation": "interpretation courte en 1 phrase"\n'
      + '    }\n'
      + '  ],\n'
      + '  "interpretation_globale": "synthese clinique en 2-3 phrases pour le medecin",\n'
      + '  "alertes": ["liste des valeurs critiques"],\n'
      + '  "recommandations": "recommandations cliniques pour le medecin prescripteur",\n'
      + '  "confiance": "haute | moyenne | faible selon la qualite du document"\n'
      + '}\n\n'
      + 'Si le document n\'est pas un resultat d\'examen medical lisible, retourne :\n'
      + '{"erreur": "Document illisible ou non reconnu comme resultat d\'examen medical"}';

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         CLAUDE_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model:      'claude-sonnet-4-6', // V1.2 — ex claude-sonnet-4-20250514 (retiré)
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: [
              contentBlock,
              { type: 'text', text: prompt }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error('Claude API error: ' + response.status + ' - ' + err.slice(0, 200));
    }

    const data    = await response.json();
    const rawText = (data.content && data.content[0] && data.content[0].text) || '';

    let result;
    try {
      const clean = rawText.replace(/```json|```/g, '').trim();
      result = JSON.parse(clean);
    } catch (e) {
      return res.status(200).json({ erreur: 'Extraction incomplete', raw: rawText.slice(0, 500) });
    }

    return res.status(200).json(result);

  } catch (e) {
    console.error('extract-examen error:', e.message);
    return res.status(500).json({ error: e.message });
  }
};

module.exports = handler;
