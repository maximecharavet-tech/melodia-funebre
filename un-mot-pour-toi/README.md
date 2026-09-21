# Un mot pour toi

Au lieu de signer la carte de départ d'un collègue, chacun dépose un
message — quelques lignes, une photo, sa voix, ou une courte vidéo — et
repart avec **un QR code** à coller à la place de sa signature. La
personne qui part scanne le carré quand elle veut, des années plus tard.

C'est une application **séparée du site Melodia Funèbre**, même si son
code vit dans le même dépôt. Elle a son propre projet Vercel, sa propre
adresse, et le dossier est listé dans `.vercelignore` pour qu'elle ne
soit jamais servie sous `melodia-funebre.fr`.

---

## Les deux pages, et rien d'autre

| Adresse | Ce qu'elle fait |
|---|---|
| `/` | Le studio : on écrit, on enregistre, on repart avec son QR |
| `/a/<jeton>` | Ce que le QR ouvre : **un seul** message, celui de son auteur |

Il n'y a **pas** de page qui liste les messages. C'est délibéré : un mur
public de tous les adieux de tous les départs poserait une question de
vie privée que personne n'a tranchée. On peut l'ajouter plus tard.

## Ce qui protège quoi

La clé Supabase présente dans `assets/config.js` est **publique par
construction** — le navigateur l'envoie à chaque appel, n'importe qui
peut la lire dans le code de la page. Toute la protection est ailleurs :

- la table `adieux` est **fermée** à ce rôle, en lecture comme en
  écriture ; vérifié en se faisant passer pour lui :
  `permission denied for table adieux` des deux côtés ;
- elle ne s'ouvre que par trois fonctions `security definer`, qui
  exigent le **jeton complet de 22 caractères** et ne rendent jamais
  qu'une seule ligne ;
- le jeton est fabriqué **par la base**, pas par le navigateur : on ne
  choisit pas l'adresse de sa page, et on ne devine pas celle d'un autre ;
- la page de lecture n'affiche un fichier que s'il vient de notre propre
  espace de stockage, et insère tout texte par `textContent`.

**Ce qui n'est pas protégé, et doit être dit :** une adresse non
référencée n'est pas un secret. Qui possède le lien du studio peut
déposer un message ; qui possède un QR peut lire le message qu'il ouvre.
Pour une carte de départ entre collègues, c'est le comportement voulu.

## Les bornes

| | Limite | Pourquoi |
|---|---|---|
| Vidéo | 60 s, ~9 Mo | s'envoie encore depuis un téléphone en déplacement |
| Audio | 3 min | |
| Photo | recompressée à 1600 px | inutile de la préparer avant |
| Fichier déposé | 24 Mo | plafond fixé aussi sur l'espace Supabase |
| Texte | 2000 caractères | |

Tout est borné **pendant** l'enregistrement, avec un compte à rebours.
Un refus après coup — « votre vidéo est trop lourde, refaites-la » —
arrive toujours au pire moment : la personne a déjà dit ce qu'elle avait
à dire, et ne le redira pas deux fois pareil.

## Le QR code

Il est fabriqué ici, dans `assets/qr.js`, et non tiré d'une bibliothèque.
Un QR part à l'imprimante : une fois le papier distribué, on ne corrige
rien. Il est donc **vérifié en étant relu** :

```
node scripts/verifier-qr.mjs
```

Le script dessine dix-sept codes — dont un par version, de 1 à 10 — les
passe au décodeur d'OpenCV, et exige que chacun rende exactement le texte
de départ. C'est la seule vérification qui reproduise ce qui se passera
vraiment : quelqu'un, un téléphone, une carte imprimée.

*(Comparer la matrice à celle d'un autre encodeur ne prouverait rien :
deux encodeurs peuvent choisir des masques différents et produire deux
codes également valides.)*

## Pourquoi `vercel.json` ne contient ni `cleanUrls` ni `trailingSlash`

Les deux y étaient, et la racine répondait 404 : `cleanUrls` renvoie
`/index.html` vers `/`, `trailingSlash: false` renvoie `/` vers la chaîne
vide, et la page d'accueil se perdait entre les deux.

`cleanUrls` cassait par ailleurs les pages de QR, indépendamment :
il rend `a.html` adressable comme `/a` et **fait disparaître la forme
avec extension**, si bien que la réécriture `/a/<jeton>` → `/a.html`
visait un fichier qui n'existait plus. Chaque code scanné aurait
répondu 404.

Ce site a deux pages, dont une servie par réécriture. Il n'avait rien
à gagner à ces deux options, et tout à y perdre.

*(À noter : Vercel refuse toute clé inconnue dans `vercel.json` — on
n'y met donc pas de commentaire, même déguisé en clé. Les explications
vont ici.)*

## Poser la base

Le contenu de `supabase.sql` a été appliqué au projet Supabase. Pour le
rejouer ailleurs, il suffit de l'exécuter tel quel : il crée la table,
les trois fonctions, l'espace de fichiers et ses règles.

## Ce qu'il reste à décider

- **Un mur récapitulatif** — une page qui rassemble tous les messages
  pour une même personne. Pas construit : il faut d'abord dire qui a le
  droit de la voir.
- **Un code d'équipe** à l'entrée du studio, si le lien venait à fuir.
  Les fonctions sont écrites pour l'accueillir sans changer le reste.
- **La durée de vie.** Rien n'expire aujourd'hui. Si le projet Vercel ou
  le projet Supabase disparaît, **tous les QR déjà imprimés cessent de
  fonctionner** — et le papier, lui, est chez les gens.

---

## Les pages de départ (campagnes)

Une carte de départ n'est pas un message isolé : quinze personnes
signent la même carte, et celle qui part la reçoit entière. D'où
**deux adresses par personne**, et pas une seule.

| Adresse | Qui l'ouvre | Ce qu'elle montre |
|---|---|---|
| `/pour/<prénom>` | les collègues | le formulaire de dépôt, son affiche en tête |
| `/carte/<jeton>` | celle qui part | tous les messages, dans l'ordre de dépôt |
| `/a/<jeton>` | qui scanne un QR individuel | un seul message |

### Pourquoi la carte a son propre jeton secret

L'adresse de dépôt est faite pour être devinée : elle est imprimée sur
une affiche, on la tape, on la dit à voix haute. Si la carte collective
s'ouvrait par ce même mot, n'importe qui tapant `/carte/chloe` lirait
les quinze messages avant l'intéressée — et gâcherait la surprise que
toute l'affaire cherche à faire.

Le jeton de carte est donc tiré au hasard, séparé, et **ne sort jamais
de la fonction `campagne()`** que consulte la page de dépôt : ses
colonnes sont nommées une par une exprès, pour qu'un `select *` ne le
fasse pas fuiter le jour où l'on ajoute une colonne sans y penser.

### Le piège de la réécriture, qui a coûté un tour

`/pour/chloe` est une **réécriture Vercel**. Le serveur sert bien la
page avec `?p=chloe`, mais côté serveur seulement : le navigateur,
lui, reste sur `/pour/chloe` et `location.search` est **vide**. Lire
le paramètre ne suffit donc pas — il faut lire le chemin. Et
uniquement sous `/pour/`, sinon le dernier morceau de
`/un-mot-pour-toi` vaut `un-mot-pour-toi`, qui a la forme d'un slug et
ferait chercher une campagne de ce nom sur le studio générique.

### Ajouter un collègue

Rien à coder. Deux gestes :

1. Poser l'affiche dans `un-mot-pour-toi/affiches/` en deux largeurs,
   `<nom>-640.webp` et `<nom>-1024.webp` — les deux noms doivent
   exister, le `srcset` les annonce tous les deux.
2. Une ligne en base :

```sql
insert into public.campagnes (slug, nom, sous_titre, intro, affiche, affiche_alt)
values ('prenom', 'Prénom', 'son surnom', 'le texte d’accueil',
        '/un-mot-pour-toi/affiches/prenom', 'description de l’affiche')
returning slug, jeton_carte;   -- le jeton rendu ici est l'adresse de la carte
```

Le jeton de carte est tiré par `jeton_neuf()`, une fonction `volatile`.
Écrite en sous-requête, l'expression était évaluée **une seule fois**
et les deux campagnes recevaient le même jeton — ce que la contrainte
d'unicité a arrêté net, et qui serait passé inaperçu sans elle.

### Ce qui reste hors campagne

`/un-mot-pour-toi/` seul est toujours le studio générique : pas
d'affiche, « pour qui » libre, et les messages déposés là
n'apparaissent sur aucune carte collective.
