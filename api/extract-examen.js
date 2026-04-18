// /api/extract-examen.js
// DOKITA — Extraction automatique résultats examens par Claude Vision
// Reçoit une image ou PDF base64 → Claude extrait les valeurs → JSON structuré
// V1.0 — 2026-04-18

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-dokita-key');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Auth
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

  // Vérifier que le type est supporté par Claude Vision
  const supportedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
  if (!supportedTypes.includes(mime_type)) {
    return res.status(400).json({ error: 'Format non supporté. Utilisez JPG, PNG ou PDF.' });
  }

  try {
    // Construire le contenu selon le type
    const mediaType = mime_type === 'application/pdf' ? 'application/pdf' : mime_type;

    const contentBlock = mime_type === 'application/pdf'
      ? {
          type: 'document',
          source: { type: 'base64', media_type: 'application/pdf', data: base64 }
        }
      : {
          type: 'image',
          source: { type: 'base64', media_type: mime_type, data: base64 }
        };

    const prompt = `Tu es un médecin biologiste expert en interprétation de résultats d'examens médicaux en Afrique subsaharienne.

Analyse ce document médical (résultat de laboratoire ou examen).
${nom_examen ? `Examen attendu : ${nom_examen}` : ''}
${patient_context ? `Contexte patient : ${patient_context}` : ''}

INSTRUCTIONS :
1. Extrais TOUTES les valeurs présentes dans le document
2. Pour chaque valeur, indique si elle est normale, basse ou élevée selon les normes standard
3. Donne une interprétation clinique synthétique
4. Signale IMMÉDIATEMENT toute valeur critique nécessitant une attention urgente

Réponds UNIQUEMENT avec le JSON suivant (sans markdown, sans texte avant ou après) :

{
  "type_examen": "nom de l'examen détecté (ex: NFS, Glycémie, Bilan hépatique...)",
  "date_examen": "date du prélèvement si visible, sinon null",
  "laboratoire": "nom du laboratoire si visible, sinon null",
  "valeurs": [
    {
      "parametre": "nom du paramètre (ex: Hémoglobine)",
      "valeur": "valeur numérique",
      "unite": "unité (ex: g/dL)",
      "norme": "norme indiquée sur le document si présente",
      "statut": "normal | bas | eleve | critique",
      "interpretation": "interprétation courte en 1 phrase"
    }
  ],
  "interpretation_globale": "synthèse clinique en 2-3 phrases pour le médecin",
  "alertes": ["liste des valeurs critiques ou anomalies importantes — vide si aucune"],
  "recommandations": "recommandations cliniques pour le médecin prescripteur",
  "confiance": "haute | moyenne | faible selon la qualité du document"
}

Si le document n'est pas un résultat d'examen médical lisible, retourne :
{"erreur": "Document illisible ou non reconnu comme résultat d'examen médical"}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5-20251101',
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
      throw new Error(`Claude API error: ${response.status} — ${err.slice(0, 200)}`);
    }

    const data = await response.json();
    const rawText = data.content?.[0]?.text || '';

    // Parser le JSON retourné par Claude
    let result;
    try {
      const clean = rawText.replace(/```json|```/g, '').trim();
      result = JSON.parse(clean);
    } catch (e) {
      // Si Claude n'a pas retourné du JSON valide
      return res.status(200).json({
        erreur: 'Extraction incomplète',
        raw: rawText.slice(0, 500)
      });
    }

    return res.status(200).json(result);

  } catch (e) {
    console.error('extract-examen error:', e.message);
    return res.status(500).json({ error: e.message });
  }
}
