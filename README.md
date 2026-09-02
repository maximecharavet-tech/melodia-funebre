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
├── 404.html            Page d'erreur, avec liens de rattrapage
├── api/                Fonctions serverless (paroles, musique — automatisation)
├── assets/
│   ├── css/style.css      Design system v4 (sombre + sections ivoire, responsive)
│   ├── css/dashboard.css  Styles des consoles
│   ├── js/main.js         Nav, révélations, compteurs, FAQ, carrousel, modales, simulateur
│   ├── js/player.js       Lecteur audio avec spectre réel (Web Audio API)
│   ├── js/order.js        Tunnel de commande, récapitulatif vivant, brouillon sauvegardé
│   ├── js/atelier-music.js  Atelier : export vers Suno et rattachement de l'hommage
│   ├── js/auth.js         Comptes et sessions (localStorage ou Supabase)
│   └── js/config.js       Configuration Supabase (vide = mode démo)
├── audio/              3 démos MP3 (Maurice, Monique, Sergio)
├── scripts/check.js    Vérifie les fichiers et les liens internes
├── scripts/serve-lan.js  Serveur local accessible depuis un téléphone du réseau
├── vercel.json         Config hébergement (cache, sécurité, clean URLs)
├── site.webmanifest    Installation sur l'écran d'accueil (PWA)
├── favicon.ico         + jeu d'icônes dans assets/img/icons/
├── .env.example        Modèle des variables d'environnement
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

## 🚪 Le seuil d'entrée

La page d'accueil s'ouvre sur une animation : filet d'or, logo, nom de la maison, signature musicale, puis le message.

Il est pensé pour ne jamais retenir personne :

- **une seule fois par session** — un visiteur qui revient ou navigue entre les pages ne le revoit pas ;
- **franchissable au premier geste** — clic, touche (Entrée, Espace, Échap), ou simple défilement ;
- **il se referme seul** au bout de 5 secondes (3,5 s si le visiteur a demandé un mouvement réduit) ;
- **sans JavaScript, il ne s'affiche pas** — impossible de rester bloqué devant ;
- **le contenu du site est déjà dans la page** derrière lui : le seuil est un calque, pas une redirection, donc rien n'est masqué aux moteurs de recherche.

### Modifier le message

Éditez `index.html`, bloc `<p class="intro-claim">` :

```html
<p class="intro-claim">Premier site mondial dédié à la<br><em>musique personnalisée</em> pour funérailles.</p>
```

Le texte entre `<em>` s'affiche en or.

> ⚠️ **Sur l'allégation « premier site mondial »** — en France, une allégation de supériorité absolue doit pouvoir être prouvée : à défaut, elle relève de la pratique commerciale trompeuse (article L121-2 du Code de la consommation), et un concurrent comme la DGCCRF peut la contester. Formulations défendables sans démonstration : *« La première maison française dédiée à la musique personnalisée pour funérailles »*, ou *« Une maison dédiée à la musique personnalisée pour funérailles »*.

### Le retirer

Dans `index.html`, supprimez le bloc `<div class="intro" id="intro">…</div>` ainsi que le petit script `sessionStorage` de l'en-tête. Rien d'autre n'en dépend.

## 🛡 Ce qui est en place côté production

Tout est déclaré dans `vercel.json` et appliqué à chaque déploiement.

### Sécurité

| En-tête | Valeur | Rôle |
|---|---|---|
| `Strict-Transport-Security` | 2 ans, sous-domaines inclus | Force HTTPS, y compris en première visite |
| `X-Frame-Options` + `frame-ancestors 'none'` | — | Empêche l'encapsulation du site dans une iframe tierce |
| `X-Content-Type-Options` | `nosniff` | Interdit la réinterprétation des types de fichiers |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limite ce qui fuit vers les sites tiers |
| `Permissions-Policy` | caméra, micro, géoloc. refusés | Paiement autorisé pour PayPal seulement |
| `Content-Security-Policy` | `object-src 'none'`, `base-uri 'self'`, `form-action 'self'` | Ferme les vecteurs d'injection les plus courants |

> La CSP est volontairement limitée à ces directives : le site charge PayPal, Google Fonts et un service de rédaction externes, et une politique `script-src` stricte les casserait. Pour la durcir, listez ces origines et testez en `Content-Security-Policy-Report-Only` avant de basculer.

### Performance

- **Vidéo de couverture chargée sous condition.** Le fichier pèse 5,3 Mo. Il n'est chargé que sur grand écran, ou sur mobile explicitement en 4G rapide — jamais en mode économie de données ni en mouvement réduit. Sur téléphone, l'affiche du poster tient le rôle : **5,3 Mo épargnés à chaque visite mobile**.
- **Cache long** sur les images, l'audio et les icônes (un an, `immutable`), plus court sur CSS et JS avec revalidation en arrière-plan.
- **Calcul à Paris** (`regions: ["cdg1"]`) : les fonctions `/api` s'exécutent au plus près des visiteurs français.
- **`maxDuration` à 30 s** sur les fonctions, la composition musicale pouvant être lente à répondre.

### Référencement et partage

- Balises Open Graph et Twitter sur chaque page, avec une **image de partage 1200 × 630** dédiée (`assets/img/og-melodia.jpg`) au lieu d'un logo carré.
- URL canoniques, `sitemap.xml`, `robots.txt` excluant les consoles.
- Données structurées JSON-LD : `LocalBusiness`, `Service` avec les trois offres, `FAQPage`.
- Redirections en place pour les anciens liens : `/admin`, `/commande`, `/tarifs`, `/ecouter`.
- **Page 404** sur mesure, avec les liens de rattrapage vers les pages principales.

### Installation sur téléphone

`site.webmanifest` rend le site installable sur l'écran d'accueil (Android et iOS) : icônes 192/512 et icône *maskable*, couleur de thème, et trois raccourcis directs — Commander, Écouter, Espace agences.

### Mesure d'audience

Les scripts Vercel **Analytics** et **Speed Insights** sont inclus. Ils restent inertes tant que vous n'activez pas ces fonctionnalités dans le tableau de bord Vercel (onglets Analytics et Speed Insights du projet). Aucun cookie, aucune bannière de consentement nécessaire.

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

## 🎵 La composition musicale

### Aujourd'hui : Suno, en manuel

C'est le circuit en service. Il ne demande aucune clé, aucune configuration, et fonctionne dès maintenant avec votre abonnement Suno.

Depuis **Console maître → Commandes → « Composer »** sur une commande :

1. **Écrire les paroles** — le bouton de gauche rédige titre, paroles et direction musicale à partir du brief. Relisez et corrigez : c'est votre texte.
2. **« Copier le brief et ouvrir Suno »** — titre, style et paroles partent dans le presse-papiers, Suno s'ouvre. Sur place : **Create** → onglet **Custom** → collez les paroles dans *Lyrics* et le style dans *Style of Music*.
3. **Rattacher l'hommage terminé** — revenez dans l'atelier et collez le lien de la chanson. Dans Suno : **⋯ → Share → Copy link**. Un lien direct vers un `.mp3` fonctionne aussi, et devient alors écoutable dans la fiche.
4. **Avancer le statut** — Reçue → Brief validé → En composition → Livrée. La famille suit chaque étape depuis son espace.

L'hommage rattaché apparaît ensuite dans la fiche de commande, en console maître comme dans l'espace de l'agence.

> Téléchargez toujours le MP3 depuis Suno et archivez-le : les liens de partage ne sont pas éternels.

### Demain : l'automatisation

Le circuit automatique est **déjà écrit et testé**. Il se réveille tout seul le jour où une clé est renseignée : un second bloc apparaît alors dans l'atelier, et compose sans quitter la console.

L'implémentation actuelle vise **Mureka** ([platform.mureka.ai](https://platform.mureka.ai/)), retenu parce qu'il expose une API publique avec clé — ce que Suno ne propose pas.

| Variable | Obligatoire | Valeur |
|---|---|---|
| `MUREKA_API_KEY` | oui | la clé du tableau de bord Mureka |
| `MUREKA_API_URL` | non | `https://api.mureka.ai` par défaut |
| `MUREKA_MODEL` | non | `auto` par défaut |

À renseigner dans Vercel → Settings → Environment Variables, puis **Redeploy**. Rien d'autre à changer : l'atelier bascule de lui-même.

Le circuit : `POST /api/generate-music` → identifiant de tâche → `GET /api/music-status` interrogé toutes les 5 s → versions à écouter, télécharger et attacher. Les échecs (modération, génération, clé invalide) sont remontés en clair et interrompent le suivi. Une composition survit à un rechargement de page.

Pour changer de fournisseur, seuls les deux fichiers `api/generate-music.js` et `api/music-status.js` sont concernés — les noms de champs audio y sont normalisés de façon large, et les statuts reconnus par famille.

### Vérifier le mode en cours

`/api/music-config` indique si une clé est présente, sans jamais l'exposer. La vue **Système** de la console affiche le mode actif.

## 🎛 Console admin — pipeline IA complet

`/dashboard-master.html` — console de pilotage avec KPIs, suivi des commandes, prospection, et surtout **l'Atelier de composition** :

```
Brief famille (5 questions)
   → ① Rédaction : titre + paroles + direction musicale
   → ② Suno : réalisation musicale, avec votre abonnement
   → ③ Rattachement du lien à la commande, dans la console
```

*(Console exclue de l'indexation Google via robots.txt.)*

## MODE DEBUTANT (workflow actuel recommande)

Le site encaisse, VOUS composez a la main. Zero risque, qualite maximale :

1. **Le client commande** sur `/commande` : choix de l'offre -> brief 5 questions -> creation de compte -> paiement PayPal (ou "payer plus tard")
2. **La commande apparait** dans la console admin (onglet Commandes) avec tout le brief
3. **Vous composez** : onglet Atelier -> "Ecrire les paroles" -> "Copier le brief et ouvrir Suno" -> vous composez dans Suno avec votre abonnement -> vous revenez coller le lien et cliquez "Attacher a la commande".
4. **Vous livrez** le MP3 par email au client, puis cliquez le bouton de statut suivant : Recue -> Brief valide -> En composition -> Livree
5. **Le client suit** chaque etape en temps reel dans son espace `/compte`

La realisation musicale se fait a la main dans Suno. Tout le reste - commande, brief, paroles, suivi, facturation - est automatise. La composition passera en automatique le jour ou une cle API sera renseignee, sans autre changement.

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
| **Musique chantee** | **Suno**, en manuel depuis l'atelier (export en un clic, puis rattachement du lien) | votre abonnement Suno | Aucune |

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
