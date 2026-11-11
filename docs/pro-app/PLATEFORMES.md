# Plateformes — ce qui est prêt, ce qui reste à décider

Décision n° 5 (11/11/2026) : les stores viennent **à la toute fin**. Rien n'est
publié, aucun compte n'est ouvert, aucun frais engagé par cette PR. Les
montants ci-dessous sont les tarifs publics des plateformes tels qu'on les
connaît ; **à revérifier par Maxime au moment de l'achat**.

## 1. PWA (prête)

- `/pro` s'installe depuis Chrome, Edge, Safari (« Sur l'écran d'accueil »).
- Manifeste `pro.webmanifest` : `start_url: /pro`, `display: standalone`, `orientation: any`, couleurs `#040407`.
- Travailleur de service commun (`sw.js`, engendré par `build/sw-modele.js`) : la console est servie **réseau d'abord** (jamais figée), les appels `/api` ne sont jamais mis en cache, la version change avec les fichiers de la console.
- Hors ligne : les questionnaires commencés restent dans IndexedDB ; les sauvegardes partent au retour du réseau.
- Coût : aucun.

## 2. Android — Capacitor 7 (préparé)

Dossier `apps/android/`. L'application ouvre `https://melodia-funebre.fr/pro` (toujours à jour) ; `www/` ne contient qu'une page d'attente et une page hors ligne.

Fait :
- projet natif généré (`npx cap add android`), `npx cap sync android` passe ;
- identifiant `fr.melodiafunebre.pro`, nom « Melodia Pro », téléphone et tablette ;
- icônes adaptatives (premier plan + fond `#040407`) et écrans de lancement aux couleurs de la maison, dérivés du logo officiel (`scripts/pro-icones-apps.mjs`) ;
- **App Links** : `/m/*` (un QR scanné) et `/pro`, `/pro/*` s'ouvrent dans l'application si elle est installée (`android:autoVerify="true"`) ;
- `/.well-known/assetlinks.json` publié avec une **empreinte à compléter** ;
- sauvegarde Android désactivée (`allowBackup="false"`) : aucune donnée de dossier ne part dans une sauvegarde cloud.

Pas fait (outillage absent sur ce poste : ni JDK ni SDK Android) : la compilation de l'APK. Pour la faire :

```sh
cd apps/android
npm install
npx cap sync android
cd android && ./gradlew assembleDebug        # APK de test : app/build/outputs/apk/debug/
```

Partage, impression et appareil photo : l'impression et le partage passent par la WebView (boîte d'impression Android, `navigator.share`). Le plugin caméra Capacitor n'est **pas** ajouté : aucun écran n'en a besoin aujourd'hui (le logo de l'agence se choisit dans la galerie via le sélecteur de fichiers). À ajouter le jour où une photo se prend depuis la console (`@capacitor/camera`, MIT).

Actions de Maxime :
1. Créer le compte développeur Google Play (frais d'inscription **unique**, de l'ordre de 25 USD).
2. Générer la clé de signature de l'application (ou laisser Google la gérer avec « Play App Signing »), puis copier l'empreinte **SHA-256** du certificat dans `.well-known/assetlinks.json` à la place de `EMPREINTE_SHA256_DU_CERTIFICAT_A_COMPLETER_PAR_MAXIME`.
3. Fiche du store : textes, captures (`docs/pro-app/captures/`), visuels `store-bg-phone` / `store-bg-tablet` définitifs, politique de confidentialité (déjà en ligne : `/confidentialite`).

## 3. Windows — Tauri 2 (préparé)

Dossier `apps/desktop/src-tauri/`. La fenêtre ouvre la console en ligne ; deux gestes natifs s'ajoutent :
- **enregistrer** un export (SVG pour le graveur, PDF, PNG, CSV) dans le dossier choisi (boîte « Enregistrer sous ») ;
- **imprimer** un PDF directement sur l'imprimante par défaut.

La console distante n'a accès qu'à ces deux commandes et à la boîte d'enregistrement (capacité `console-pro`, limitée à `https://melodia-funebre.fr/*`). Noms de fichiers filtrés (pas de chemin, extensions `svg pdf png csv`), taille bornée.

`cargo check` et `cargo test` passent (conteneur Linux, voir le rapport). Construction de l'installateur sur un poste Windows :

```sh
cargo install tauri-cli --version "^2"
cd apps/desktop/src-tauri && cargo tauri build      # .msi et .exe (NSIS)
```

Mises à jour automatiques : préparées, **désactivées** (fonction cargo `updater`, absente par défaut). Pour les activer : `cargo tauri signer generate`, publier la clé publique dans `plugins.updater.pubkey` de `tauri.conf.json`, un point d'accès des versions, puis construire avec `--features updater`.

Actions de Maxime :
1. Certificat de signature de code Windows (sans lui, SmartScreen avertit à l'installation). Deux voies : certificat OV/EV auprès d'une autorité (de l'ordre de quelques centaines d'euros par an) ou Azure Trusted Signing (abonnement mensuel modeste). Renseigner ensuite `bundle.windows.certificateThumbprint`.
2. Éventuellement, publication sur le Microsoft Store (compte développeur, frais d'inscription unique pour un particulier).

## 4. iOS (plus tard)

Non commencé, volontairement. Le même projet Capacitor accepte `npx cap add ios` sur un Mac avec Xcode. Il faudra un compte Apple Developer (abonnement **annuel**, de l'ordre de 99 USD), et soigner la conformité « application qui apporte plus qu'un site » (règle 4.2 de l'App Store).

## Récapitulatif des coûts à valider

| Poste | Nature | Ordre de grandeur public | Décision |
|---|---|---|---|
| Google Play | frais unique | ~25 USD | Maxime |
| Apple Developer | annuel | ~99 USD | plus tard |
| Signature de code Windows | annuel ou mensuel | de quelques dizaines à quelques centaines d'euros | Maxime |
| Microsoft Store | facultatif | frais d'inscription unique | facultatif |
| PWA | — | 0 | prête |
