# Melodia Questionnaire — application Android (prototype)

Questionnaire famille **hors ligne** pour les conseillers funéraires partenaires, tablette et téléphone.
Capacitor 7 (MIT), HTML/CSS/JS sans framework, formulaire embarqué dans l'APK (aucune dépendance au réseau).

- Mêmes sections et **mêmes clés JSON** que la console Pro (`pro_questionnaires.donnees`) ; numérotation identique au PDF manuscrit (`documents/melodia-questionnaire-famille.pdf`).
- Règles « indispensable » reprises du noyau Rust (`melodia-pro-wasm/src/questionnaire.rs`), y compris l'accord des proches nommés.
- Mode famille par défaut (pas de prix, pas de champs internes). Appui long sur le monogramme : mode conseiller (dates, contraintes techniques, récapitulatif, file d'envoi).
- Stockage : `localStorage` de l'appareil. **Aucun appel réseau dans ce prototype** : l'envoi vers `POST /api/pro/dossiers` (action `questionnaire`) est à brancher avec la connexion conseiller.
- Polices OFL et logo officiel copiés depuis `assets/` ; icônes et écran de démarrage repris de `apps/android/`.

## Construire

```bash
npm ci
npx cap sync android
cd android && ./gradlew assembleDebug   # JDK 21 + Android SDK 35
# → android/app/build/outputs/apk/debug/app-debug.apk
```

Aperçu navigateur : `npm run apercu` puis `http://localhost:5174/?demo=1` (dossier fictif) ; `&vue=1…6`, `&vue=fin`, `&vue=recap`, `&vue=conseiller`.

## Reste à décider

Signature de publication, diffusion (APK direct ou Play Store), activation de l'envoi réel, logo de l'agence dans l'app.
