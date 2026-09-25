// ═══════════════════════════════════════════════════════════════
// /api/generate-lyrics — Paroles + prompt mélodie
//
// Deux fournisseurs, essayés dans l'ordre, le premier qui a une clé :
//   1. Mistral AI  — MISTRAL_API_KEY (offre gratuite « Experiment »
//      suffisante pour l'atelier ; société française, serveurs en UE).
//      MISTRAL_MODEL facultatif, par défaut mistral-small-latest.
//   2. OpenAI      — OPENAI_API_KEY, en secours si Mistral échoue.
//
// Sans aucune clé, la fonction répond 503 : le navigateur retombe
// alors sur Pollinations (voir MelodiaAI.lyrics dans auth.js).
// ═══════════════════════════════════════════════════════════════

const FOURNISSEURS = [
  {
    nom: 'mistral',
    cle: () => process.env.MISTRAL_API_KEY,
    url: 'https://api.mistral.ai/v1/chat/completions',
    modele: () => process.env.MISTRAL_MODEL || 'mistral-small-latest'
  },
  {
    nom: 'openai',
    cle: () => process.env.OPENAI_API_KEY,
    url: 'https://api.openai.com/v1/chat/completions',
    modele: () => 'gpt-4o'
  }
];

function consigne({ prenom, traits, metier, habitude, anecdote, style }) {
  return `Tu es un parolier français spécialisé dans les hommages funéraires respectueux et émouvants, et un directeur artistique musical.

Défunt à honorer :
- Prénom : ${prenom}
- Traits de caractère : ${traits || 'non précisé'}
- Métier / passion : ${metier || 'non précisé'}
- Habitude typique : ${habitude || 'non précisé'}
- Anecdote : ${anecdote || 'non précisé'}
- Style musical souhaité : ${style || 'Chanson française'}

Ta mission — produire un JSON strict avec exactement ces 3 clés :
{
  "title": "titre poétique court de la chanson (3-5 mots)",
  "lyrics": "2 couplets de 4 vers + 1 refrain de 4 vers, séparés par des lignes vides, avec [Couplet 1], [Refrain], [Couplet 2] en balises",
  "style_prompt": "prompt mélodie EN ANGLAIS pour un générateur musical (Suno, Mureka) : genre, voix, instruments, tempo BPM, tonalité, ambiance — 15 à 25 mots, séparés par des virgules"
}

Contraintes paroles :
- Ton respectueux, jamais pleurnichard ; images concrètes tirées de sa vraie vie, zéro cliché
- Vers chantables de 8 à 10 syllabes, rimes simples (ABAB ou AABB)
- Le prénom apparaît au moins 2 fois

Réponds UNIQUEMENT avec le JSON, sans backticks ni commentaire.`;
}

async function appeler(f, cle, prompt) {
  const r = await fetch(f.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${cle}` },
    body: JSON.stringify({
      model: f.modele(),
      temperature: 0.85,
      max_tokens: 900,
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: prompt }]
    })
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const detail = data.error?.message || data.message || data.detail || `HTTP ${r.status}`;
    throw new Error(`${f.nom} : ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`);
  }
  return { raw: data.choices?.[0]?.message?.content || '{}', usage: data.usage, model: f.modele() };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST uniquement' });

  const disponibles = FOURNISSEURS.filter((f) => f.cle());
  if (!disponibles.length) {
    return res.status(503).json({ error: 'Aucune clé IA côté serveur (MISTRAL_API_KEY ou OPENAI_API_KEY)' });
  }

  const brief = req.body || {};
  const { prenom } = brief;
  if (!prenom) return res.status(400).json({ error: 'Le prénom est requis' });
  const prompt = consigne(brief);

  const echecs = [];
  for (const f of disponibles) {
    try {
      const { raw, usage, model } = await appeler(f, f.cle(), prompt);
      let parsed;
      try { parsed = JSON.parse(raw); }
      catch { parsed = { title: `Hommage à ${prenom}`, lyrics: raw, style_prompt: '' }; }

      return res.status(200).json({
        title: parsed.title || `Hommage à ${prenom}`,
        lyrics: parsed.lyrics || '',
        style_prompt: parsed.style_prompt || '',
        provider: f.nom,
        model,
        usage
      });
    } catch (err) {
      echecs.push(err.message);
    }
  }
  return res.status(502).json({ error: 'Échec de la rédaction — ' + echecs.join(' · ') });
}
