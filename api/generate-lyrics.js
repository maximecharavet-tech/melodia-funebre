// ═══════════════════════════════════════════════════════════════
// /api/generate-lyrics — Paroles + prompt mélodie via OpenAI (ChatGPT)
// Variable d'environnement requise sur Vercel : OPENAI_API_KEY
// ═══════════════════════════════════════════════════════════════

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST uniquement' });

  const key = process.env.OPENAI_API_KEY;
  if (!key) return res.status(500).json({ error: 'OPENAI_API_KEY manquante dans les variables Vercel' });

  const { prenom, traits, metier, habitude, anecdote, style } = req.body || {};
  if (!prenom) return res.status(400).json({ error: 'Le prénom est requis' });

  const prompt = `Tu es un parolier français spécialisé dans les hommages funéraires respectueux et émouvants, et un directeur artistique musical.

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
  "style_prompt": "prompt mélodie EN ANGLAIS pour un générateur musical (Suno) : genre, voix, instruments, tempo BPM, tonalité, ambiance — 15 à 25 mots, séparés par des virgules"
}

Contraintes paroles :
- Ton respectueux, jamais pleurnichard ; images concrètes tirées de sa vraie vie, zéro cliché
- Vers chantables de 8 à 10 syllabes, rimes simples (ABAB ou AABB)
- Le prénom apparaît au moins 2 fois

Réponds UNIQUEMENT avec le JSON, sans backticks ni commentaire.`;

  try {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        temperature: 0.85,
        max_tokens: 900,
        response_format: { type: 'json_object' },
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await r.json();
    if (!r.ok) {
      return res.status(r.status).json({ error: data.error?.message || 'Erreur OpenAI' });
    }

    const raw = data.choices?.[0]?.message?.content || '{}';
    let parsed;
    try { parsed = JSON.parse(raw); }
    catch { parsed = { title: `Hommage à ${prenom}`, lyrics: raw, style_prompt: '' }; }

    return res.status(200).json({
      title: parsed.title || `Hommage à ${prenom}`,
      lyrics: parsed.lyrics || '',
      style_prompt: parsed.style_prompt || '',
      model: 'gpt-4o',
      usage: data.usage
    });
  } catch (err) {
    return res.status(500).json({ error: 'Échec de la requête OpenAI : ' + err.message });
  }
}
