const fs = require('fs');
const path = require('path');
const S = __dirname;
module.exports = {
  file: 'compte.html',
  title: 'Mon compte — Espace client et partenaire | Melodia Funèbre',
  desc: "Connectez-vous à votre espace Melodia Funèbre pour suivre vos commandes, ou créez un compte partenaire si vous êtes une agence de pompes funèbres.",
  noindex: true,
  sticky: false,
  scripts: ['assets/js/config.js', 'assets/js/auth.js'],
  body: fs.readFileSync(path.join(S, 'compte-main.html'), 'utf8'),
  inline: fs.readFileSync(path.join(S, 'compte-script.html'), 'utf8')
};
