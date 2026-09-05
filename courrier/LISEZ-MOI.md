# Le courrier de Melodia — mise en service

Tout ce qui part du site passe par **Resend**. Ce document décrit ce
qu'il reste à faire de votre côté : trois pages chez Resend, huit
enregistrements chez OVH, cinq variables chez Vercel.

Tant que rien n'est configuré, le site fonctionne : les fonctions
répondent `503 NOT_CONFIGURED`, le formulaire de rappel retombe sur la
messagerie du visiteur, et la console de prospection sur un `mailto:`.
Rien n'est perdu en silence — mais **la famille, elle, ne reçoit rien**.

---

## 1. Pourquoi deux domaines d'envoi et non un seul

C'est la décision structurante, et elle se prend maintenant : revenir
en arrière plus tard coûte des semaines de réputation.

| Sous-domaine | Ce qui en part | Si sa réputation s'abîme |
|---|---|---|
| `envoi.melodia-funebre.fr` | accusés de commande, brief, livraison, factures, notifications internes | une famille ne reçoit pas l'hommage de son père |
| `contact.melodia-funebre.fr` | démarchage à froid des pompes funèbres, diocèses, mosquées | une agence de plus ne lit pas votre présentation |

La prospection à froid génère mécaniquement des signalements « courrier
indésirable ». Ces signalements dégradent la réputation du domaine
expéditeur. Si les deux flux partent du même domaine, un gérant d'agence
agacé peut faire tomber en indésirables le courriel de livraison d'une
famille endeuillée — et vous ne le saurez jamais, parce qu'un courriel
classé en spam ne renvoie aucune erreur.

Le domaine racine `melodia-funebre.fr` n'envoie rien. Il ne sert qu'à
recevoir. Sa réputation reste intacte quoi qu'il arrive aux deux autres.

---

## 2. Chez Resend

### 2.1 Ajouter les deux domaines

Resend → **Domains** → *Add Domain*, deux fois :

1. `envoi.melodia-funebre.fr` — région **EU (Ireland)**
2. `contact.melodia-funebre.fr` — région **EU (Ireland)**

Choisissez bien la région européenne : les données transitent alors par
un serveur situé dans l'Union, ce qui est plus simple à assumer dans la
politique de confidentialité que des serveurs américains.

Resend affiche pour chaque domaine une liste d'enregistrements DNS.
**Gardez les deux onglets ouverts**, vous en avez besoin à l'étape 3.

### 2.2 Créer la clé d'API

Resend → **API Keys** → *Create API Key*

- Nom : `melodia-production`
- Permission : **Sending access** (et non *Full access* : la clé vit
  chez Vercel, elle n'a aucune raison de pouvoir supprimer un domaine)
- Domain : *All domains*

La clé s'affiche **une seule fois**. Copiez-la tout de suite ; elle
commence par `re_`.

> Ne la collez jamais dans un fichier du dépôt : GitHub est public.
> Elle ne va que dans Vercel, à l'étape 4.

---

## 3. Chez OVH — la zone DNS

OVH → **Noms de domaine** → `melodia-funebre.fr` → onglet **Zone DNS**.

Attention à la façon dont OVH nomme les champs : dans la colonne
« sous-domaine », **on n'écrit jamais `melodia-funebre.fr`**. On écrit
seulement ce qui est devant. Resend, lui, affiche le nom complet. Il
faut donc retirer `.melodia-funebre.fr` de ce que Resend vous montre.

| Resend affiche | Vous saisissez chez OVH |
|---|---|
| `send.envoi.melodia-funebre.fr` | `send.envoi` |
| `resend._domainkey.envoi.melodia-funebre.fr` | `resend._domainkey.envoi` |

### 3.1 Les enregistrements à créer

Pour **chacun** des deux domaines, Resend donne trois enregistrements.
Les valeurs exactes sont dans votre écran Resend — celles ci-dessous
sont la forme, pas le contenu.

**Domaine d'envoi (`envoi`)**

| Type | Sous-domaine | Valeur | Priorité |
|---|---|---|---|
| MX | `send.envoi` | `feedback-smtp.eu-west-1.amazonses.com.` | 10 |
| TXT | `send.envoi` | `v=spf1 include:amazonses.com ~all` | — |
| TXT | `resend._domainkey.envoi` | `p=MIGfMA0GCSq…` (longue clé publique) | — |

**Domaine de prospection (`contact`)** — les trois mêmes, avec `contact`
au lieu de `envoi`, et **une clé DKIM différente** : ne recopiez pas
celle du premier domaine, elle ne validera pas.

### 3.2 Les deux pièges d'OVH

- **Le point final.** Dans une valeur MX, OVH exige le point terminal :
  `feedback-smtp.eu-west-1.amazonses.com.` — sans lui, OVH ajoute
  silencieusement `.melodia-funebre.fr` à la fin et l'enregistrement ne
  vaut rien.
- **La clé DKIM coupée.** La valeur `p=…` fait plus de 250 caractères.
  Certains formulaires OVH la tronquent au collage. Après validation,
  rouvrez l'enregistrement et vérifiez que la fin correspond bien à ce
  qu'affiche Resend.

### 3.3 Ne touchez pas à

- l'enregistrement **A** de l'apex (`216.198.79.1`) — c'est Vercel ;
- le **CNAME `www`** — c'est Vercel aussi ;
- le **TXT SPF de l'apex**, s'il existe : il concerne votre messagerie
  OVH, pas Resend, et les deux cohabitent sans se gêner.

### 3.4 Vérifier

Retournez sur Resend → Domains → *Verify DNS Records*. La propagation
OVH prend de quelques minutes à deux heures. Les trois lignes doivent
passer au vert pour chaque domaine.

---

## 4. Chez Vercel

Project → **Settings** → **Environment Variables**. Cochez les trois
environnements (Production, Preview, Development) pour chacune.

| Variable | Valeur | Rôle |
|---|---|---|
| `RESEND_API_KEY` | `re_…` | la clé de l'étape 2.2 |
| `COURRIER_FROM` | `Melodia Funèbre <bonjour@envoi.melodia-funebre.fr>` | expéditeur des courriels aux familles |
| `PROSPECT_FROM` | `Melodia Funèbre <contact@contact.melodia-funebre.fr>` | expéditeur du démarchage |
| `LEAD_TO` | `contact@melodia-funebre.fr` | votre boîte : notifications et copies |
| `SITE_URL` | `https://melodia-funebre.fr` | pour le logo et les liens des courriels |

`LEAD_TO` accepte plusieurs adresses séparées par des virgules.

`LEAD_FROM`, si elle existe encore, sert de secours quand `COURRIER_FROM`
ou `PROSPECT_FROM` manquent. Une fois les deux renseignées, elle ne sert
plus à rien : vous pouvez la supprimer.

**Un redéploiement est obligatoire** — Vercel n'injecte les variables
qu'à la construction. Deployments → le dernier → *Redeploy*.

---

## 5. Ce qui part, et quand

### Vers la famille — `/api/famille`

| Modèle | Déclencheur | Contenu |
|---|---|---|
| `confirmation` | commande enregistrée | référence, ce qui se passe ensuite, rappel que le délai court après l'entretien |
| `rappel` | demande de rappel déposée | accusé, délai d'appel annoncé |
| `brief` | statut → *Brief validé* | l'entretien a eu lieu, la composition commence |
| `composition` | statut → *En composition* | l'écriture est en cours, rien n'est attendu d'elle |
| `livraison` | statut → *Livrée* | lien d'écoute, conseil de téléchargement, révision comprise |

Le navigateur ne transmet **jamais de texte** : il choisit un modèle et
fournit des données (prénom, référence). Le message est écrit côté
serveur. C'est ce qui rend le point d'entrée inoffensif s'il est
détourné : au pire, un abuseur expédie un accusé de réception Melodia.

Le courriel de livraison part aussi en copie invisible à `LEAD_TO` :
vous gardez la trace de ce qui a été livré, et quand.

### Vers la maison — `/api/lead`

Rappel, commande, message de contact, réponse de prospection.
Répondre au courriel joint directement la famille.

### Vers les agences — `/api/prospect-mail`

Démarchage depuis la console commerciale. Part de `PROSPECT_FROM`,
porte la mention d'opposition « STOP » exigée par la CNIL, réponse
adressée au collaborateur, copie invisible à la maison.

---

## 6. Vérifier que tout marche

Dans cet ordre, sur le site en production :

1. **Demande de rappel** avec votre propre adresse. Vous devez recevoir
   *deux* courriels : la notification (vers `LEAD_TO`) et l'accusé
   (vers l'adresse saisie).
2. **Commande d'essai** avec votre adresse. Même chose, plus la
   référence dans l'accusé.
3. **Console maître** → cette commande → *Brief validé*, puis
   *En composition*, puis *Livrée*. Trois courriels de plus. Le bandeau
   en bas de l'écran vous dit à chaque fois si l'envoi est parti.
4. Si le bandeau annonce un échec, la cause est en console du
   navigateur (F12 → Console, ligne `[courrier]`). Les deux causes
   fréquentes : `NOT_CONFIGURED` (variable manquante chez Vercel) et
   `SEND_FAILED` avec un motif Resend (domaine non vérifié).

---

## 7. Ce qui reste à construire

Le relevé complet des vingt-et-un envois figure dans le document
d'architecture. Les cinq courriels famille, la notification maison et
la prospection sont écrits. Manquent, par ordre de coût de l'absence :

- **la facture** — obligation comptable, aujourd'hui aucune trace
  n'est remise au client ;
- **la relance d'entretien** — une commande dont la famille ne décroche
  pas reste bloquée sans que personne ne s'en aperçoive ;
- **le mot d'après-cérémonie** — à J+7, sobre, sans relance commerciale ;
- **la réinitialisation de mot de passe** — un compte perdu est
  aujourd'hui un compte perdu ;
- **l'alerte de commande dormante** — vers vous, quand une commande
  n'a pas bougé depuis 24 h.

---

## 8. Points juridiques

- **Prospection B2B** : l'opposition doit être possible dans chaque
  message. La mention « STOP » y est. Une adresse qui répond STOP doit
  être retirée **immédiatement et définitivement** — c'est manuel
  aujourd'hui, dans la console commerciale.
- **Courriels transactionnels** : ils n'ont pas à porter de lien de
  désinscription. Proposer « STOP » à une famille qui attend l'hommage
  de son père serait déplacé, et juridiquement inutile : ces messages
  exécutent le contrat.
- **Données du défunt** : prénom, traits, métier, anecdotes ne quittent
  pas la maison. Ni vers une agence, ni vers un prestataire, ni dans un
  courriel qui n'est pas destiné à la famille.
- **Conservation** : Resend garde une copie des messages envoyés.
  Mentionnez-le dans la politique de confidentialité, avec la région
  (Irlande) et la durée.
