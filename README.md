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
├── dashboard-commercial.html  Console de prospection des collaborateurs
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
│   ├── js/livraison.js      Dépôt du MP3 et courriel de livraison
│   ├── js/rappel.js         Demande de rappel, en place du téléphone
│   ├── js/commercial.js     Console commerciale : annuaire, fiches, courriels
│   ├── js/content.js        Applique le contenu éditable sur les pages
│   ├── js/proprietaire.js   Mode propriétaire : édition du site, clients, publication
│   ├── js/auth.js         Comptes et sessions (localStorage ou Supabase)
│   └── js/config.js       Configuration Supabase (vide = mode démo)
├── audio/              3 démos MP3 (Maurice, Monique, Sergio)
├── assets/data/content.json  Contenu éditable depuis le mode propriétaire
├── build/              Générateur des pages (npm run build)
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

### Modifier le message, ou retirer le seuil

Depuis la console : **Mode propriétaire → Réglages**. Le message accepte le HTML simple (`<br>` pour un retour à la ligne, `<em>…</em>` pour l'or), et une case permet de désactiver le seuil entièrement.

Le message par défaut, lui, est dans `build/p-index.js`.

> ⚠️ **Sur l'allégation « premier site mondial »** — en France, une allégation de supériorité absolue doit pouvoir être prouvée : à défaut, elle relève de la pratique commerciale trompeuse (article L121-2 du Code de la consommation), et un concurrent comme la DGCCRF peut la contester. Formulations défendables sans démonstration : *« La première maison française dédiée à la musique personnalisée pour funérailles »*, ou *« Une maison dédiée à la musique personnalisée pour funérailles »*.

## ☎ Le rappel à la place du téléphone

Le numéro n'est plus affiché nulle part sur le site. Chaque bouton d'appel est devenu **« Être rappelé »** : la famille laisse son nom, son numéro, le meilleur moment, et coche l'urgence si la cérémonie approche.

Vous restez maître de qui vous rappelez, et une demande urgente vous est signalée comme telle.

### Recevoir les demandes

Sans configuration, la demande ouvre la messagerie du visiteur avec un message pré-rempli : rien n'est perdu, mais il faut qu'il clique une fois de plus. Pour recevoir directement les demandes **et les commandes** dans votre boîte :

1. Créez un compte sur [resend.com](https://resend.com) (offre gratuite : 3 000 courriels par mois)
2. Vérifiez votre domaine, puis créez une clé d'API
3. Vercel → Settings → Environment Variables :

| Variable | Exemple |
|---|---|
| `RESEND_API_KEY` | `re_…` |
| `LEAD_TO` | `contact@melodia-funebre.fr` |
| `LEAD_FROM` | `Melodia <notifications@melodia-funebre.fr>` |

4. **Redeploy**

> ⚠️ **À faire en priorité.** Sans cela, une commande passée sur le site est enregistrée dans le navigateur du client et **vous ne la voyez jamais**. C'est le trou le plus coûteux du dispositif actuel.

## ◎ Console commerciale et collaborateurs

**Console maître → Console commerciale**, ou directement `/dashboard-commercial.html`.

### Trouver les pompes funèbres

L'onglet **Rechercher** interroge l'annuaire public des entreprises de l'État (base SIRENE de l'INSEE), filtré sur le code NAF **9603Z — Services funéraires**. Aucune clé, aucun abonnement : ce sont des données ouvertes.

Vous cherchez par département, éventuellement par nom ou ville, et vous ajoutez les agences à votre portefeuille — une par une, ou toute la page.

> L'annuaire public ne publie **ni téléphone ni email**. Le collaborateur les complète sur la fiche au fil de sa recherche : site de l'agence, page Contact, annuaires professionnels.

### Travailler les fiches

Chaque fiche porte l'email, le téléphone, l'interlocuteur, des notes libres et un statut :

`À contacter` → `Contacté` → `Relancé` → `Intéressé` → `Démo offerte` → `Partenaire`, ou `Sans suite`.

Trois modèles de courriel sont prêts, personnalisés avec le nom de l'agence, la ville et l'interlocuteur : **premier contact**, **relance**, **composition offerte**. Ils s'ouvrent dans la messagerie du collaborateur — l'envoi part donc de sa propre adresse, ce qui vaut mieux pour la délivrabilité. **Le statut avance tout seul** à l'envoi.

Le tableau de bord affiche le pipeline, le taux de conversion et une estimation du chiffre mensuel que le réseau représente.

> **Cadre légal.** La prospection entre professionnels est autorisée en France sans accord préalable, à trois conditions : le message concerne leur activité, votre identité est claire, et un moyen de refuser figure dans le message. Les trois modèles comportent la ligne de refus. Une agence qui répond « STOP » doit être passée en *Sans suite* immédiatement et ne plus jamais être recontactée.

### Créer un collaborateur

**Mode propriétaire → Collaborateurs.** Nom, email, mot de passe, secteur. Vous lui transmettez ses identifiants ; il se connecte sur `/compte` et arrive directement sur sa console.

Le tableau de l'équipe affiche, pour chacun : fiches suivies, agences contactées, partenaires signés. Vous pouvez ouvrir la console commerciale vous-même : en tant que fondateur, vous voyez **toutes** les fiches, avec un filtre par collaborateur.

Un compte désactivé ne peut plus ouvrir de session.

> ⚠️ **En base locale, les comptes créés n'existent que dans votre navigateur** — un collaborateur ne pourra pas se connecter depuis sa propre machine. C'est le second motif d'activer Supabase, avec le partage des commandes.

### Tables Supabase à créer

```sql
create table collaborateurs (
  id text primary key,
  nom text, email text unique not null,
  role text default 'commercial',
  secteur text, tel text,
  actif boolean default true,
  created_at timestamptz default now()
);

create table prospects (
  siret text primary key,
  siren text, nom text, enseigne text,
  adresse text, cp text, ville text, departement text,
  dirigeant text, effectif text, creation text,
  email text, tel text,
  statut text default 'nouveau',
  notes text,
  owner text, owner_nom text,
  dernier_contact timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

## ✎ Mode propriétaire

**Console maître → Mode propriétaire.** La main sur le contenu du site sans ouvrir une ligne de code.

### Ce qui est éditable

| Onglet | Ce que vous changez | Où ça apparaît |
|---|---|---|
| **Musiques** | Les hommages d'exemple : titre, personne, style, fichier audio, récit, brief de départ | Lecteur de l'accueil et page Écouter |
| **Tarifs** | Prix, intitulés, phrase de présentation, étiquette, liste des prestations | Accueil et page Offres |
| **Témoignages** | Texte, signature, nombre d'étoiles | Carrousel de l'accueil |
| **Questions** | Questions et réponses | Accueil, et résultats enrichis Google |
| **Réglages** | Téléphone, email, message du seuil d'entrée | Toutes les pages |
| **Clients** | Créer une commande à la main, consulter les clients | Onglet Commandes |
| **Publication** | Aperçu, téléchargement, sauvegarde | — |

Chaque entrée se réordonne (↑ ↓), se masque sans être supprimée (◉ / ◌) et se supprime.

### Comment ça marche

Le site lit `assets/data/content.json`. La console édite ce fichier :

1. **Vous modifiez** — chaque frappe est enregistrée dans un brouillon local. Rien n'est visible du public à ce stade, et l'en-tête indique le nombre de blocs non publiés.
2. **Vous vérifiez** — *Publication → Voir l'aperçu sur le site* applique votre brouillon sur le vrai site, pour vous seul et sur cet appareil. Un bandeau jaune le rappelle en permanence.
3. **Vous publiez** — *Télécharger content.json*, puis sur GitHub : ouvrez `assets/data/content.json`, cliquez sur le crayon, remplacez tout, *Commit changes*. Le site se redéploie seul.

Le bouton *Restaurer une sauvegarde* réimporte un fichier téléchargé précédemment : c'est votre filet de sécurité.

### Ajouter une musique d'exemple

1. Déposez le MP3 dans le dossier `audio/` du dépôt (GitHub → dossier `audio` → *Add file* → *Upload files*).
2. Console → Mode propriétaire → Musiques → **Ajouter**.
3. Renseignez le titre, la personne, le style, et dans *Fichier audio* : `audio/le-nom-du-fichier.mp3`.
4. Aperçu, puis publication.

Un lien complet vers un MP3 hébergé ailleurs fonctionne aussi.

### Si rien ne s'affiche

La couche de contenu ne casse jamais le site : si `content.json` est absent, illisible ou vide, le HTML d'origine reste affiché. Une entrée sans fichier audio est simplement ignorée par le lecteur.

## 🏗 Générer les pages

Les pages HTML sont **produites** à partir de `build/` : une seule navigation, un seul pied de page, un seul en-tête pour tout le site.

```bash
npm run build
```

La commande reprend au passage le contenu publié dans `assets/data/content.json`, pour que le HTML servi corresponde à ce qui est en ligne — meilleur pour le référencement.

> Modifier directement un fichier `.html` fonctionne, mais la prochaine génération écrasera la retouche. Le bon endroit est `build/`.

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
3. **Déposer le MP3** — téléchargez la chanson depuis Suno, puis glissez le fichier dans la zone de dépôt de l'atelier. Un lien de partage reste accepté, dans le repli *Ou rattacher un lien*.
4. **Livrer la famille** — l'étape 3 compose le courriel, que vous relisez avant de l'envoyer.
5. **Avancer le statut** — Reçue → Brief validé → En composition → Livrée. La famille suit chaque étape depuis son espace.

L'hommage rattaché apparaît ensuite dans la fiche de commande, en console maître comme dans l'espace de l'agence.

> Téléchargez toujours le MP3 depuis Suno et archivez-le : les liens de partage ne sont pas éternels.

### Déposer le MP3 et livrer la famille

Une fois la chanson téléchargée depuis Suno, **glissez le MP3 dans la zone de dépôt** de l'atelier. Plus besoin de coller un lien — le champ reste disponible, replié, pour les cas où vous préférez un lien.

Le dépôt fonctionne dans deux modes, choisis automatiquement :

| Mode | Condition | Ce que reçoit la famille |
|---|---|---|
| **Lien permanent** | Supabase configuré | Un lien à ouvrir depuis n'importe quel appareil, sans pièce jointe lourde |
| **Sur l'appareil** | Aucune configuration | Le fichier reste dans ce navigateur ; vous le joignez au courriel |

Dans les deux cas, l'étape 3 de l'atelier **compose le courriel de livraison** : destinataire, objet, message rappelant les droits d'usage et la possibilité de reprise, référence de commande. Le texte est modifiable avant envoi, et le bouton ouvre votre messagerie pré-remplie.

> Le fichier est envoyé **directement du navigateur au stockage**, sans passer par une fonction serveur : la limite de 4,5 Mo des fonctions Vercel ne s'applique donc pas. Plafond retenu : 40 Mo.

### Activer le lien permanent (Supabase Storage)

Trois minutes, et vos clients n'ont plus de pièce jointe à recevoir.

1. [supabase.com](https://supabase.com) → votre projet → **Storage** → **New bucket**
2. Nom : `hommages` — cochez **Public bucket**
3. **SQL Editor**, exécutez :

```sql
create policy "depot hommages" on storage.objects
  for insert to anon with check (bucket_id = 'hommages');
```

4. Renseignez `SUPABASE_URL` et `SUPABASE_ANON_KEY` dans `assets/js/config.js`

> ⚠️ Cette règle autorise l'envoi avec la clé publique du projet, donc techniquement par quiconque la lit dans le code du site. C'est acceptable pour démarrer ; dès que vous aurez activé l'authentification Supabase, remplacez `to anon` par `to authenticated` pour réserver le dépôt aux comptes connectés.

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
