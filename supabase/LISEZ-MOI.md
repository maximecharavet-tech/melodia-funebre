# Supabase — état : ACTIF

Le projet `awvgmkoozerfggdvvubi` (région eu-west-1, Irlande) est en
service depuis le 5 septembre 2026. Tables, règles de sécurité,
dossier de stockage et rôle du fondateur sont posés et vérifiés. Le
site est branché dessus.

Le compte du fondateur (`contact@melodia-funebre.fr`) existe, son
adresse est confirmée et le rôle `master` lui est attribué. Il n'y a
plus rien à créer.

**Changez son mot de passe dès votre première connexion.** Le mot de
passe initial a transité par une conversation : Supabase →
Authentication → Users → la ligne du compte → **Reset password**, ou
depuis le site par « Mot de passe oublié ». Un mot de passe qui a été
écrit ailleurs qu'entre vos mains n'est plus un secret.

Le raccourci `mastermax07` ne fonctionne plus en production — il était
écrit en clair dans un fichier public, et son mot de passe était
identique à son identifiant. Il ne subsiste qu'en mode démo.

Ce qui suit décrit comment tout cela a été monté, et sert de référence
si le projet devait être recréé.

---

## Activer Supabase

Sans Supabase, le site fonctionne : comptes, commandes et prospection
vivent dans le navigateur de chaque poste. C'est suffisant pour
présenter le service, mais rien n'est partagé ni conservé — une
commande passée sur un téléphone n'existe pas sur l'ordinateur du
bureau, et vider le cache efface tout.

Supabase donne une vraie base partagée, des comptes véritables et le
stockage des œuvres livrées. Comptez vingt minutes.

## 1. Créer le projet

1. [supabase.com](https://supabase.com) → **New project**.
2. Région : **Europe (Paris)** ou **Frankfurt** — les données de
   familles françaises n'ont pas de raison de traverser l'Atlantique,
   et cela vous évite d'avoir à le justifier au titre du RGPD.
3. Notez le mot de passe de la base : il ne sera plus affiché.

## 2. Créer les tables et les règles de sécurité

Supabase → **SQL Editor** → **New query** → collez tout le contenu de
`supabase/schema.sql` → **Run**.

Le script est rejouable : le relancer ne casse rien.

Il crée quatre tables (`roles`, `orders`, `collaborateurs`,
`prospects`), le dossier de stockage `hommages`, et surtout les règles
Row Level Security. **Cette étape n'est pas facultative** : voir plus
bas.

## 3. Brancher le site

Supabase → **Settings → API**. Reportez les deux valeurs dans
`assets/js/config.js` :

```js
window.MELODIA_CONFIG = {
  SUPABASE_URL: 'https://xxxxxxxx.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOi...'
};
```

Puis publiez. Le site bascule tout seul : le mode démo s'efface dès
que les deux valeurs sont renseignées.

## 4. Créer votre compte de fondateur

1. Supabase → **Authentication → Users** → **Add user** →
   `contact@melodia-funebre.fr` et un mot de passe.
2. Supabase → **SQL Editor**, puis :

```sql
insert into public.roles (email, role)
  values ('contact@melodia-funebre.fr', 'master')
  on conflict (email) do update set role = 'master';
```

Tant que cette ligne n'est pas passée, **aucun compte n'est
« master »** — pas même le vôtre. C'est délibéré : un oubli doit
fermer les portes, pas les ouvrir.

Pour un collaborateur commercial, la même ligne avec
`'commercial'` au lieu de `'master'`.

## 4 bis. Contrôler que la sécurité est bien en place

Avant de mettre les clés dans le site, passez cette requête dans le
**SQL Editor**. Elle vérifie que le verrou est posé sur les quatre
tables et compte les règles :

```sql
select c.relname                                   as table,
       case when c.relrowsecurity then 'OUI' else '*** NON ***' end as rls_actif,
       (select count(*) from pg_policies p
         where p.schemaname = 'public' and p.tablename = c.relname) as regles
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('roles','orders','collaborateurs','prospects')
order by c.relname;
```

Le résultat attendu :

| table | rls_actif | regles |
|---|---|---|
| collaborateurs | OUI | 2 |
| orders | OUI | 4 |
| prospects | OUI | 4 |
| roles | OUI | 1 |

**Si une seule ligne affiche `*** NON ***`, ne renseignez pas les clés
dans le site.** Relancez d'abord le script : une table sans RLS est
lisible par quiconque possède la clé publique, c'est-à-dire par tout
le monde.

Et pour le stockage :

```sql
select policyname from pg_policies
where schemaname = 'storage' and tablename = 'objects';
```

Quatre règles doivent apparaître (écoute, dépôt, remplacement,
retrait).

## 5. Vérifier

- Connectez-vous sur `/compte` avec le compte créé.
- La console du fondateur doit s'ouvrir et afficher les commandes.
- Passez une commande de test depuis `/offres` : elle doit apparaître
  dans la console, et dans Supabase → Table Editor → `orders`.
- Déposez un MP3 sur une commande : il doit arriver dans
  Storage → `hommages`.

---

## Pourquoi les règles de sécurité comptent autant

La clé « anon » que vous collez dans `config.js` est **publique**.
N'importe qui peut la lire en affichant le code source de la page.
C'est le fonctionnement normal de Supabase — mais cela veut dire que
**toute la protection repose sur le Row Level Security**.

Sans les règles du script, la table `orders` serait lisible par
quiconque. Elle contient :

- le nom, l'adresse électronique et le téléphone de familles en deuil ;
- le prénom du défunt, ses traits de caractère, son métier, ses
  habitudes, les anecdotes confiées par sa famille.

Ce sont exactement les données que votre politique de confidentialité
s'engage à protéger, et leur divulgation serait une violation au sens
du RGPD, à notifier à la CNIL sous 72 heures.

### Un piège que le script évite

Supabase laisse le navigateur choisir librement son `user_metadata` au
moment de l'inscription. Un compte créé directement contre l'API avec
`role: 'master'` obtiendrait donc ce rôle — et si les règles s'y
fiaient, la lecture de toutes les commandes avec.

Le script ne s'y fie pas. Le rôle est lu dans la table `roles`, que
seule la console Supabase peut écrire : le navigateur peut la lire
pour sa propre ligne, jamais y écrire. Le site a été repris en
conséquence — il relit le rôle réel à la connexion plutôt que de
croire ce que le jeton raconte.

### Ce qui reste ouvert, et pourquoi

L'insertion dans `orders` est autorisée sans compte : une famille
commande sans s'inscrire, c'est le principe même. C'est la même
exposition que n'importe quel formulaire public. Si des commandes
indésirables apparaissaient, il faudrait faire passer l'écriture par
une fonction serverless plutôt que par le navigateur — dites-le-moi
le cas échéant.

## Revenir en arrière

Videz les deux valeurs de `config.js` et republiez : le site repasse
en mode démo. Les données restent dans Supabase, intactes.
