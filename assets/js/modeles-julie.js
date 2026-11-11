/* ═══════════════════════════════════════════════════════════════
   Bibliothèque Julie — 7 courriels professionnels, prêts à envoyer.
   Source unique : le navigateur (window.MELODIA_MODELES_JULIE) et
   le serveur (require) lisent le même texte.
   ═══════════════════════════════════════════════════════════════ */
(function (root, factory) {
  var data = factory();
  if (typeof module === 'object' && module.exports) module.exports = data;
  else root.MELODIA_MODELES_JULIE = data;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  var SIG = {
    nom: 'Julie Serve',
    role: 'Directrice marketing & commerciale',
    email: 'julie@melodia-funebre.fr',
    photo: '/assets/img/equipe/julie-serve.jpg'
  };

  return {
    signature: SIG,
    modeles: [
      {
        id: "pf-premier-contact",
        categorie: "julie",
        nom: "Premier contact",
        quand: "Premier message à une agence. Le matin, sans relance.",
        visuel: "/assets/img/campagne/affiche-partenaire.jpg",
        visuelAlt: "Affiche Melodia : devenir partenaire",
        pied: "prospection",
        signatureFixe: SIG,
        bouton: { texte: "Voir le partenariat", url: "https://melodia-funebre.fr/professionnels?parrain=julie-serve" },
        objet: "Une chanson pour les familles de {agence}",
        objetNu: "Une chanson originale pour vos familles",
        titre: "Vous proposez, nous composons",
        texte: "Bonjour{civilite},\n\n{accroche}\n\nJe suis Julie Serve, de Melodia Funèbre. Je vous écris pour {agence}{ville_rel}, sans rien vous demander dans l’instant.\n\nAux obsèques, la musique n’a presque jamais connu le défunt. Nous composons, pour chaque personne, une chanson originale à partir de ce que la famille raconte. Elle est livrée en vingt-quatre heures, diffusable pendant la cérémonie, sans droit SACEM, et conservée par la famille — avec une page hommage et son QR code.\n\nPour {agence} :\n\n· vous conservez 60 % du montant, soit 179 € nets sur une offre Prestige à 299 €\n· aucun investissement, aucun stock, aucune charge technique\n· la première composition est offerte, pour que vous jugiez devant une famille\n\nLa brochure professionnelle est jointe à ce courriel. Vous pouvez aussi la consulter ici :\n{lien_brochure}\n\nSeriez-vous disponible quelques minutes cette semaine ?"
      },
      {
        id: "pf-relance-j4",
        categorie: "julie",
        nom: "Relance J+4",
        quand: "Quatre jours après le premier message, s’il est resté sans réponse.",
        visuel: "/assets/img/campagne/ce-que-les-mots.webp",
        visuelAlt: "Visuel Melodia : ce que les mots ne disent pas toujours",
        pied: "prospection",
        signatureFixe: SIG,
        bouton: { texte: "Écouter un exemple", url: "https://melodia-funebre.fr/demos?parrain=julie-serve" },
        objet: "Je me permets de revenir — {agence}",
        objetNu: "Je me permets de revenir vers vous",
        titre: "Un mot, sans insister",
        texte: "Bonjour{civilite},\n\nJe vous avais écrit au sujet d’un hommage musical original pour les familles de {agence}{ville_rel}. Je me permets de revenir une fois, calmement.\n\nSi le moment n’est pas le bon, vous n’avez rien à faire. Si vous voulez seulement entendre de quoi il s’agit, le catalogue est public : ce sont des exemples, pas des commandes en cours.\n\nLa première composition reste offerte, dans les mêmes conditions. La brochure est jointe à ce courriel :\n{lien_brochure}\n\nJe reste disponible si un échange court vous est utile."
      },
      {
        id: "pf-relance-j10",
        categorie: "julie",
        nom: "Relance J+10",
        quand: "Dix jours après le premier contact. Dernière relance, puis on s’arrête.",
        visuel: "/assets/img/campagne/poignee-de-main.webp",
        visuelAlt: "Visuel Melodia : une poignée de main",
        pied: "prospection",
        signatureFixe: SIG,
        bouton: { texte: "Proposer un échange", url: "https://melodia-funebre.fr/contact?parrain=julie-serve" },
        objet: "Dernier message — {agence}",
        objetNu: "Dernier message, puis je m’arrête",
        titre: "Je vous laisse le choix",
        texte: "Bonjour{civilite},\n\nC’est mon dernier message à ce sujet, pour {agence}{ville_rel}. Après celui-ci, je ne reviendrai pas, sauf si vous me le demandez.\n\nSi un échange de quelques minutes vous est utile, je suis disponible. Si cela ne vous concerne pas, répondez simplement STOP : votre adresse est retirée, et je n’insiste pas.\n\nLa brochure reste à votre disposition :\n{lien_brochure}"
      },
      {
        id: "pf-apres-appel",
        categorie: "julie",
        nom: "Après un appel",
        quand: "Juste après un échange téléphonique ou un rendez-vous.",
        visuel: "/assets/img/campagne/adieux-en-musique.jpg",
        visuelAlt: "Des adieux en musique — Melodia Funèbre",
        pied: "prospection",
        signatureFixe: SIG,
        bouton: { texte: "Écouter le catalogue", url: "https://melodia-funebre.fr/demos?parrain=julie-serve" },
        objet: "Suite à notre échange — {agence}",
        objetNu: "Suite à notre échange",
        titre: "Pour reprendre posément",
        texte: "Bonjour{civilite},\n\nMerci pour le temps que vous m’avez accordé, pour {agence}{ville_rel}. Comme promis, voici de quoi reprendre posément.\n\n· Une œuvre originale, composée à partir du récit de la famille\n· Livrée en vingt-quatre heures, pour la cérémonie\n· Une page hommage et son QR code, conservés par la famille\n· Soixante pour cent reversés à l’agence, aucune démarche SACEM\n· La première composition offerte, pour juger sur pièce\n\nLa brochure professionnelle est jointe à ce courriel :\n{lien_brochure}\n\nJe reste disponible pour toute question."
      },
      {
        id: "pf-partenariat",
        categorie: "julie",
        nom: "Offre partenariat",
        quand: "Quand l’agence veut les conditions, en clair.",
        visuel: "/assets/img/campagne/affiche-partenaire.jpg",
        visuelAlt: "Affiche Melodia : devenir partenaire",
        pied: "prospection",
        signatureFixe: SIG,
        bouton: { texte: "Lire les conditions", url: "https://melodia-funebre.fr/professionnels?parrain=julie-serve" },
        objet: "Le partenariat, en clair — {agence}",
        objetNu: "Le partenariat Melodia, en clair",
        titre: "Ce que vous conservez, et ce que vous n’avez pas à faire",
        texte: "Bonjour{civilite},\n\nVoici les conditions, pour {agence}{ville_rel}, sans autre chiffre que ceux publiés sur le site.\n\n· Vous conservez 60 % du montant payé par la famille, soit 179 € nets sur une offre Prestige à 299 €.\n· Aucun investissement, aucun stock, aucun minimum, aucun engagement de durée.\n· Aucune démarche SACEM : l’œuvre est originale, et les droits d’usage sont cédés.\n· La première composition est offerte, pour que vous la présentiez à une famille avant de décider.\n· Le délai annoncé est de vingt-quatre heures. La famille reçoit l’œuvre, une page hommage et son QR code.\n\nVous présentez. Nous composons. Le détail est aussi dans la brochure jointe :\n{lien_brochure}"
      },
      {
        id: "pf-brochure",
        categorie: "julie",
        nom: "Brochure et conditions",
        quand: "Pour envoyer la brochure et les tarifs, sans autre demande.",
        visuel: "/assets/img/campagne/affiche-partenaire.jpg",
        visuelAlt: "Affiche Melodia : devenir partenaire",
        pied: "prospection",
        signatureFixe: SIG,
        bouton: { texte: "Ouvrir la brochure", url: "https://melodia-funebre.fr/documents/melodia-brochure-professionnels.pdf" },
        objet: "Brochure et conditions — {agence}",
        objetNu: "Brochure professionnelle Melodia Funèbre",
        titre: "Tout est dans la pièce jointe",
        texte: "Bonjour{civilite},\n\nComme convenu, je vous adresse la brochure professionnelle de Melodia Funèbre, pour {agence}{ville_rel}.\n\nVous y trouverez le déroulé (cinq minutes d’entretien, livraison en vingt-quatre heures), ce que la famille reçoit (l’œuvre, la page hommage, le QR code), et votre rémunération : 60 % du montant, soit 179 € nets sur une offre Prestige, sans investissement.\n\nLa brochure est jointe à ce courriel. Vous pouvez aussi la consulter ici :\n{lien_brochure}\n\nJe reste à votre disposition pour en parler, ou pour préparer une première composition offerte."
      },
      {
        id: "pf-merci",
        categorie: "julie",
        nom: "Remerciement",
        quand: "Après un accord, une première composition, ou un bel échange.",
        visuel: "/assets/img/campagne/emotion-eternelle.webp",
        visuelAlt: "Visuel Melodia : une émotion qui demeure",
        pied: "prospection",
        signatureFixe: SIG,
        bouton: { texte: "Accéder à l’espace partenaires", url: "https://melodia-funebre.fr/professionnels?parrain=julie-serve" },
        objet: "Merci — {agence}",
        objetNu: "Merci pour votre confiance",
        titre: "Merci de nous faire confiance",
        texte: "Bonjour{civilite},\n\nMerci, pour {agence}{ville_rel}, de nous faire confiance. C’est un honneur d’accompagner vos familles à un moment où chaque détail compte.\n\nDès qu’une famille vous le demandera, vous n’avez qu’à nous transmettre quelques mots sur le défunt. Nous composons, vous présentez, et l’œuvre est livrée en vingt-quatre heures.\n\nJe reste votre interlocutrice, pour cette première composition comme pour la suite.\n\nAvec égard."
      }
    ]
  };
});
