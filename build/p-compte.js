const fs = require('fs');
const path = require('path');
const S = __dirname;
module.exports = {
  file: 'compte.html',
  title: 'Mon compte — Espace client et partenaire | Melodia Funèbre',
  desc: "Connectez-vous à votre espace Melodia Funèbre pour suivre vos commandes, ou créez un compte partenaire si vous êtes une agence de pompes funèbres.",
  noindex: true,
  sticky: false,
  scripts: ['assets/js/config.js', 'assets/js/auth.js', 'assets/js/accueil-connexion.js'],
  body: fs.readFileSync(path.join(S, 'compte-main.html'), 'utf8'),
  /* L'adresse du film porte son empreinte : remplacer la vidéo suffit
     à ce que le navigateur la retélécharge, sans purge de cache. */
  inline: '<script>window.MELODIA_ACCUEIL_FILM = ' +
          JSON.stringify(require('./gen.js').versionne('assets/img/connexion.mp4')) +
          ';</script>\n' + fs.readFileSync(path.join(S, 'compte-script.html'), 'utf8')
};
