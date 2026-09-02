# ♪ Melodia Funèbre

**Premier service français de composition musicale personnalisée par IA pour cérémonies funéraires.**

> Chaque vie mérite une chanson.

Fondateur : **Maxime Charavet** · Powered by **Hyper AI Engine™**

---

## 🗂 Structure du site

```
melodia-funebre/
├── index.html          Accueil — couverture, preuve, comparatif, offres, témoignages, FAQ
├── processus.html      Chronologie en 7 étapes, les 5 questions, engagements
├── demos.html          Écoute des 3 hommages + « du brief à la chanson »
├── offres.html         Tarifs, comparatif détaillé et tunnel de commande en 6 étapes
├── agences.html        Espace B2B + simulateur de revenus partenaire
├── contact.html        Contact, urgences, formulaire
├── compte.html         Connexion / inscription (familles et agences)
├── dashboard-master.html      Console de pilotage (KPIs + Atelier IA)
├── dashboard-partenaire.html  Espace agence partenaire
├── mentions-legales.html · cgv.html · confidentialite.html
├── api/                Fonctions serverless (paroles ChatGPT, musique Suno)
├── assets/
│   ├── css/style.css      Design system v4 (sombre + sections ivoire, responsive)
│   ├── css/dashboard.css  Styles des consoles
│   ├── js/main.js         Nav, révélations, compteurs, FAQ, carrousel, modales, simulateur
│   ├── js/player.js       Lecteur audio avec spectre réel (Web Audio API)
│   ├── js/order.js        Tunnel de commande, récapitulatif vivant, brouillon sauvegardé
│   ├── js/auth.js         Comptes et sessions (localStorage ou Supabase)
│   └── js/config.js       Configuration Supabase (vide = mode démo)
├── audio/              3 démos MP3 (Maurice, Monique, Sergio)
├── scripts/check.js    Vérifie les fichiers et les liens internes
├── scripts/serve-lan.js  Serveur local accessible depuis un téléphone du réseau
├── vercel.json         Config hébergement (cache, sécurité, clean URLs)
├── robots.txt          SEO (consoles exclues de l'indexation)
├── sitemap.xml         Plan du site pour Google
└── .github/workflows/  Validation + déploiement automatique
```

## 🖥 Tester en local

**Option 1 — Complet avec fonctions API (recommandé) :**
```bash
npx vercel dev
# → http://localhost:3000  (pages + /api pour l'atelier IA)
```

**Option 2 — Pages seules (rapide) :**
```bash
npm run dev
# → http://localhost:3000  (sans les fonctions /api)
```

**Option 3 — Tester depuis un téléphone (même Wi-Fi) :**
```bash
npm run dev:lan
# → affiche l'adresse http://192.168.x.x:3000 à saisir sur le mobile
```

**Option 4 — Python (aucune installation) :**
```bash
python3 -m http.server 3000
```

**Vérifier l'intégrité avant push :**
```bash
npm run check
```

## 🚀 Mettre sur GitHub

1. Créez un repo vide sur github.com → **New repository** → nom `melodia-funebre` → **Private** → sans README
2. Puis :
```bash
bash scripts/push-github.sh https://github.com/VOTRE_USER/melodia-funebre.git
```

## ⚡ Déploiement automatique (Vercel)

**Méthode simple (recommandée) :**
1. [vercel.com](https://vercel.com) → **Add New → Project** → importez le repo GitHub
2. **Deploy** (aucune configuration : site statique détecté)
3. C'est tout. **Chaque `git push` sur `main` redéploie automatiquement.**

**Méthode GitHub Actions (avancée) :**
Le workflow `.github/workflows/deploy.yml` valide le HTML à chaque push et peut déployer via l'API Vercel. Pour l'activer, ajoutez 3 secrets dans GitHub → Settings → Secrets :
- `VERCEL_TOKEN` (vercel.com/account/tokens)
- `VERCEL_ORG_ID` et `VERCEL_PROJECT_ID` (fichier `.vercel/project.json` après `vercel link`)

## 🌐 Domaine melodia-funebre.fr (OVH)

Une fois déployé sur Vercel :
1. Vercel → Settings → Domains → ajouter `melodia-funebre.fr`
2. Chez OVH → Zone DNS :
   - Supprimer les anciens `A` / `AAAA` (garder MX/TXT/SPF !)
   - Ajouter `A` → `76.76.21.21` (valeur indiquée par Vercel)
   - Ajouter `CNAME www` → `cname.vercel-dns.com.`
3. Attendre la propagation (1–24 h) — vérifier sur [dnschecker.org](https://dnschecker.org)

## 💳 Activer PayPal réel

Le site est en mode **sandbox** (`client-id=sb` dans `offres.html`).
Pour la production :
1. [developer.paypal.com](https://developer.paypal.com) → mode **Live** → Create App → copier le **Client ID**
2. Dans `offres.html`, remplacer `client-id=sb` par votre Client ID
3. `git push` → redéploiement automatique

## 🎛 Console admin — pipeline IA complet

`/dashboard-master.html` — console de pilotage avec KPIs, suivi des commandes, prospection, et surtout **l'Atelier de composition** :

```
Brief famille (5 questions)
   → ① ChatGPT (gpt-4o) : titre + paroles + prompt mélodie
   → ② Suno : réalisation musicale (2 versions audio)
   → Écoute + téléchargement MP3 directement dans la console
```

*(Console exclue de l'indexation Google via robots.txt.)*

## MODE DEBUTANT (workflow actuel recommande)

Le site encaisse, VOUS composez a la main. Zero risque, qualite maximale :

1. **Le client commande** sur `/commande` : choix de l'offre -> brief 5 questions -> creation de compte -> paiement PayPal (ou "payer plus tard")
2. **La commande apparait** dans la console admin (onglet Commandes) avec tout le brief
3. **Vous composez** : onglet Atelier -> bouton "Generer paroles" -> bouton "Suno MANUEL" (tout est copie, suno.com s'ouvre, vous collez en mode Custom avec votre abonnement Suno Pro 10$/mois)
4. **Vous livrez** le MP3 par email au client, puis cliquez le bouton de statut suivant : Recue -> Brief valide -> En composition -> Livree
5. **Le client suit** chaque etape en temps reel dans son espace `/compte`

Quand le volume le justifiera, activez la **phase 2** (API Suno payante ~0,08 EUR/chanson, deja codee dans /api) pour l'automatisation totale.

## COMPTES & COMMANDES : 2 modes

| Mode | Configuration | Usage |
|---|---|---|
| **Demo locale** (defaut) | Aucune | Comptes et commandes en localStorage — parfait pour tester, mais limite au navigateur courant |
| **Production Supabase** | 5 min, gratuit | Multi-appareils, vraie base de donnees |

**Activer Supabase (production)** :
1. [supabase.com](https://supabase.com) -> New project (gratuit)
2. SQL Editor -> executer :
```sql
create table orders (
  id bigint generated by default as identity primary key,
  ref text unique not null,
  created_at timestamptz default now(),
  status text default 'recue',
  user_email text, user_name text,
  offer text, price int, defunt text,
  traits text, metier text, habitude text, anecdote text, style text,
  urgence boolean default false,
  paypal_id text, paid boolean default false
);
alter table orders enable row level security;
create policy "insert pour tous" on orders for insert with check (true);
create policy "lecture pour tous" on orders for select using (true);
create policy "update pour tous" on orders for update using (true);
```
3. Settings -> API : copier Project URL + anon public key
4. Les coller dans `assets/js/config.js` -> git push. C'est actif.

(Pour durcir plus tard : restreindre les policies par email authentifie.)

## FREE APIs integrees (mode par defaut)

Le site fonctionne **sans aucune cle API** grace a une architecture 100 % gratuite :

| Besoin | Solution | Cout | Cle requise |
|---|---|---|---|
| **Paroles + titre + prompt melodie** | [Pollinations.ai](https://pollinations.ai) (GPT via `text.pollinations.ai/openai`) | 0 EUR illimite | Aucune |
| **Musique chantee** | **Suno gratuit** - 10 chansons/jour offertes, export 1-clic (paroles + style copies -> suno.com/create s'ouvre) | 0 EUR (10/jour) | Compte Suno gratuit |

Ou ca marche :
- **Page publique `/atelier`** : les familles testent le generateur gratuitement -> argument commercial massif
- **Console admin** : bouton "Generer - GRATUIT" (Pollinations) puis "Suno GRATUIT - copier + ouvrir"

Aucune API de musique **chantee** n'est reellement gratuite en illimite - le combo Pollinations (texte illimite) + Suno web (10 titres/jour) est le seul pipeline 0 EUR complet. Au-dela de 10 chansons/jour, passez a l'API payante ci-dessous (~0,08 EUR/chanson, deja codee).

## 🔑 Configuration des API payantes (option automatisation totale) (obligatoire pour l'atelier)

Les clés ne sont **jamais dans le code** : elles vivent dans les variables d'environnement Vercel, utilisées par les fonctions serverless du dossier `/api`.

Sur **vercel.com → votre projet → Settings → Environment Variables**, ajoutez :

| Variable | Valeur | Où l'obtenir |
|---|---|---|
| `OPENAI_API_KEY` | `sk-...` | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) (≈ 0,01 €/chanson en gpt-4o) |
| `SUNO_API_URL` | `https://api.sunoapi.org` | Voir section Musique ci-dessous |
| `SUNO_API_KEY` | votre clé | Idem |

Puis **Redeploy**. En local : `npx vercel dev` (lance le site + les fonctions API sur localhost:3000). Le simple `python3 -m http.server` sert les pages mais **pas** les fonctions `/api`.

## 🎵 Choix du service musical : Suno et alternatives

Suno n'expose pas d'API publique directe — on passe par un service compatible. Les endpoints du projet (`/api/generate-music`, `/api/music-status`) suivent le format le plus répandu et fonctionnent tel quel avec :

| Service | Type | Qualité voix FR | Prix indicatif | Verdict |
|---|---|---|---|---|
| **sunoapi.org** | API Suno tierce (recommandé) | ★★★★★ (moteur Suno V4.5) | ~0,08 $/chanson | ✅ **Le choix par défaut** — même qualité que Suno.com, API stable |
| **PiAPI** (piapi.ai) | API Suno/Udio tierce | ★★★★★ | ~0,10 $/chanson | ✅ Bonne alternative, aussi compatible Udio |
| **suno-api self-hosted** (github.com/gcui-art/suno-api) | Proxy de votre compte Suno 10 $/mois | ★★★★★ | inclus dans l'abo Suno | ✅ Le moins cher si volume élevé, mais maintenance à votre charge |
| **ElevenLabs Music** | API **officielle** | ★★★★ | ~0,50 $/min | ✅ Plan B sérieux : contrat commercial clair, entreprise établie — adaptez juste l'endpoint |
| **Mureka AI** | API officielle | ★★★ (accent en FR) | ~0,05 $/chanson | ⚠ Correct mais français moins naturel |
| **Udio** | Pas d'API officielle | ★★★★★ | 10 $/mois manuel | ⚠ Excellent mais workflow manuel uniquement |
| **Stable Audio** | API officielle | Instrumental seulement | — | ❌ Pas de voix chantée : inadapté |

**Ma recommandation** : démarrez avec **sunoapi.org** (qualité Suno, zéro maintenance, ~0,08 $/chanson → marge intacte). Si un jour vous voulez un contrat 100 % officiel pour rassurer des grands comptes, basculez sur **ElevenLabs Music** — seule la fonction `/api/generate-music.js` sera à adapter (~20 lignes).

---

© 2026 Melodia Funèbre — Fondateur : Maxime Charavet
