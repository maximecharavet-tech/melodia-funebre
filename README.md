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
├── api/                Fonctions serverless (paroles, musique Mureka)
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

## 🎵 Composition musicale — API Mureka

La composition se déclenche depuis **Console maître → Atelier de composition → « Composer la musique »**. La clé reste côté serveur : elle ne descend jamais dans le navigateur.

Mureka ([mureka.ai](https://www.mureka.ai/), SkyworkAI) a été retenu parce qu'il expose une **API publique avec clé** — ce que Suno ne propose pas.

### Configurer

1. Créez un compte sur [platform.mureka.ai](https://platform.mureka.ai/) → onglet **API Keys** → générer une clé
2. Vercel → Settings → **Environment Variables**, puis redéployer :

| Variable | Obligatoire | Valeur |
|---|---|---|
| `MUREKA_API_KEY` | oui | la clé du tableau de bord Mureka |
| `MUREKA_API_URL` | non | `https://api.mureka.ai` par défaut |
| `MUREKA_MODEL` | non | `auto` par défaut |

Tant que `MUREKA_API_KEY` n'est pas renseignée, l'atelier le dit en clair, désactive le bouton et laisse l'**export manuel** vers mureka.ai opérationnel. Rien ne casse.

### Le circuit

```
Atelier → paroles + direction musicale
   → POST /api/generate-music   → POST api.mureka.ai/v1/song/generate      → id de tâche
   → GET  /api/music-status     → GET  api.mureka.ai/v1/song/query/{id}    → toutes les 5 s
   → versions rendues : écoute, téléchargement, « Attacher » à la commande
```

- **Direction musicale** : Mureka ne prend pas de champs séparés pour la voix ou les exclusions. `/api/generate-music` compose une description unique à partir du style, du choix de voix et des styles à éviter — par exemple `french chanson, acoustic, male vocal, avoid: heavy drums`.
- **Instrumental** : la case à cocher bascule sur `/v1/instrumental/generate`, sans paroles.
- **Suivi en direct** : préparation → file d'attente → écriture → terminé, avec le temps écoulé.
- **Reprise** : si vous fermez l'onglet pendant la composition, l'atelier reprend le suivi à la réouverture (jusqu'à une heure).
- **Échecs** : refus de modération, échec de génération, dépassement de délai ou clé invalide sont remontés en clair et interrompent le suivi.
- **Attacher** enregistre l'œuvre sur la commande (`audio_url`, `audio_title`, `music_task_id`) : elle devient lisible depuis la fiche, en console maître comme dans l'espace de l'agence.

> Les liens audio expirent au bout de quelques semaines. Téléchargez le fichier retenu et archivez-le.

### Vérifier l'état

`/api/music-config` indique si la composition automatique est branchée, sans jamais exposer la clé (seule une empreinte du type `mk-…99` est renvoyée). La vue **Système** de la console affiche cet état.

### Changer de fournisseur

Le code ne suppose rien au-delà du contrat Mureka v1. Les noms de champs audio sont normalisés de façon large (`mp3_url`, `url`, `audio_url`, `flac_url`), et les statuts terminaux sont reconnus par famille. Pour une passerelle compatible, seule `MUREKA_API_URL` change.

## 🎛 Console admin — pipeline IA complet

`/dashboard-master.html` — console de pilotage avec KPIs, suivi des commandes, prospection, et surtout **l'Atelier de composition** :

```
Brief famille (5 questions)
   → ① Rédaction : titre + paroles + direction musicale
   → ② Mureka : réalisation musicale (plusieurs versions audio)
   → Écoute, téléchargement et rattachement à la commande, dans la console
```

*(Console exclue de l'indexation Google via robots.txt.)*

## MODE DEBUTANT (workflow actuel recommande)

Le site encaisse, VOUS composez a la main. Zero risque, qualite maximale :

1. **Le client commande** sur `/commande` : choix de l'offre -> brief 5 questions -> creation de compte -> paiement PayPal (ou "payer plus tard")
2. **La commande apparait** dans la console admin (onglet Commandes) avec tout le brief
3. **Vous composez** : onglet Atelier -> "Ecrire les paroles" -> "Composer la musique" (API Mureka, 30 a 120 s, plusieurs versions a ecouter puis a attacher a la commande). Sans cle Mureka configuree, le bouton "Export manuel" copie tout et ouvre mureka.ai.
4. **Vous livrez** le MP3 par email au client, puis cliquez le bouton de statut suivant : Recue -> Brief valide -> En composition -> Livree
5. **Le client suit** chaque etape en temps reel dans son espace `/compte`

La composition est automatique des que `MUREKA_API_KEY` est renseignee. Sans elle, tout le reste du workflow fonctionne et seule la realisation musicale se fait a la main.

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
  paypal_id text, paid boolean default false,
  audio_url text, audio_title text, music_task_id text
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
| **Musique chantee** | **API Mureka** - composition automatique depuis l'atelier, plusieurs versions par titre | selon l'offre Mureka | `MUREKA_API_KEY` |

La redaction des paroles ne coute rien et ne demande aucune cle. Seule la realisation musicale est facturee, par Mureka, a la composition.

## 🔑 Configuration des API payantes (option automatisation totale) (obligatoire pour l'atelier)

Les clés ne sont **jamais dans le code** : elles vivent dans les variables d'environnement Vercel, utilisées par les fonctions serverless du dossier `/api`.

Sur **vercel.com → votre projet → Settings → Environment Variables**, ajoutez :

| Variable | Valeur | Où l'obtenir |
|---|---|---|
| `OPENAI_API_KEY` | `sk-...` | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) (≈ 0,01 €/chanson en gpt-4o) |
| `MUREKA_API_KEY` | votre clé | [platform.mureka.ai](https://platform.mureka.ai/) → onglet API Keys |
| `MUREKA_API_URL` | `https://api.mureka.ai` | Facultatif — valeur par défaut |
| `MUREKA_MODEL` | `auto` | Facultatif — valeur par défaut |

Puis **Redeploy**. En local : `npx vercel dev` (lance le site + les fonctions API sur localhost:3000). Le simple `python3 -m http.server` sert les pages mais **pas** les fonctions `/api`.

## 🎵 Pourquoi Mureka, et les alternatives

Le critère décisif a été l'existence d'une **API publique avec clé**, condition d'une composition automatique depuis la console.

| Service | API publique | Voix chantée | Verdict |
|---|---|---|---|
| **Mureka** (mureka.ai) | ✅ officielle, clé en libre-service | ✅ | ✅ **Le choix retenu** — API documentée, tarif à la composition |
| **ElevenLabs Music** | ✅ officielle | ✅ | ✅ Plan B sérieux : entreprise établie, contrat commercial clair |
| **Suno** | ❌ aucune API officielle | ✅ | ⚠ Passerelles tierces uniquement, sans engagement du fournisseur |
| **Udio** | ❌ | ✅ | ⚠ Excellent, mais workflow manuel uniquement |
| **Stable Audio** | ✅ | ❌ instrumental seul | ❌ Inadapté à un hommage chanté |

**À vérifier lors de vos premiers essais** : la prononciation du français, et notamment celle du prénom du défunt — c'est le point le plus sensible pour un hommage. Si le rendu ne convient pas, la direction musicale (« Style ») est le levier principal ; ElevenLabs Music reste le repli, seule la fonction `api/generate-music.js` étant à adapter.

---

© 2026 Melodia Funèbre — Fondateur : Maxime Charavet
