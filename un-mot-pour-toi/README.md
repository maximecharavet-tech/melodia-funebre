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
