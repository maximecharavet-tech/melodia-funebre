# Portraits du catalogue

Chaque fiche du catalogue peut porter le portrait de la personne. Sans
portrait, le sceau doré à l'initiale reprend sa place : une fiche sans
visage reste aussi soignée que les autres, et c'est voulu — une famille
n'a pas toujours une photo qu'elle accepte de voir publiée.

## Déposer un portrait

1. Une image **carrée**, 400 × 400 px suffisent (elle s'affiche dans un
   médaillon de 44 px, 120 px sur écran dense).
2. La déposer ici, sous un nom simple : `prenom.jpg`.
3. Dans la console propriétaire → Réalisations → champ **Portrait**,
   saisir `assets/img/portraits/prenom.jpg`.

Le chemin peut aussi être un lien complet vers une image hébergée
ailleurs. Si le fichier manque ou que le chemin est faux, la fiche
retombe seule sur son sceau doré : aucune icône d'image cassée
n'apparaîtra jamais sur une fiche de deuil.

## Ce qui est attendu de l'image

Cadrage tête et épaules, centré, fond sombre uni, lumière douce.
Le site applique lui-même une désaturation légère pour que la grille
garde une même température et ne ressemble pas à un trombinoscope.

## Mention publique

Tant qu'au moins une fiche porte un portrait, le catalogue affiche
sous la grille :

> Portraits d'illustration — une famille nous confie des mots, pas
> toujours un visage.

Cette ligne est posée par `build/parts.js`, fonction `oeuvres()`. Elle
dit ce qui est : ces visages ne sont pas ceux des défunts. Si un jour
un portrait est une **vraie photographie publiée avec l'accord écrit
de la famille**, il faut reformuler ou retirer la mention pour cette
fiche — mais ne jamais présenter une image générée comme la
photographie d'une personne réelle. Le site s'adresse à des familles
en deuil : c'est la confiance qui s'y joue, et l'article L121-2 du
code de la consommation sanctionne les allégations trompeuses sur les
prestations réellement fournies.
