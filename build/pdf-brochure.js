/* ═══════════════════════════════════════════════════════════════
   MELODIA — La brochure partenaire

   Destinée à un dirigeant de pompes funèbres. Elle doit vendre, et
   elle vend : c'est un argumentaire, pas une notice.

   Une règle tient tout le document : aucun chiffre inventé. Les
   60 %, les 149 / 299 / 499 €, les 79 €, les vingt-quatre heures,
   les six heures d'urgence viennent du site et des offres réelles.
   La page de simulation repose sur une hypothèse de prise à 25 % —
   elle est affichée comme telle, en toutes lettres, parce qu'un
   dirigeant qui découvre après coup qu'un chiffre était décoratif
   ne signe jamais.

   Aucun témoignage, aucun logo de partenaire, aucun « ils nous font
   confiance » : il n'y en a pas encore. Vendre sans preuve sociale
   se fait très bien — avec de la preuve tout court.
   ═══════════════════════════════════════════════════════════════ */
const { fontes, image, SOMBRE } = require('./pdf-style.js');

const esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* ─── Les six raisons, telles qu'elles sont sur /professionnels ─── */
const RAISONS = [
  ['60 %', 'Une marge que peu de prestations vous laissent',
   'Sur chaque hommage, vous conservez 60 % du montant payé par la famille. Sur une offre Prestige à 299 €, ce sont 179,40 € nets pour votre agence, pour trois minutes de saisie.'],
  ['0 €', 'Aucun investissement, jamais',
   'Pas de stock, pas d’abonnement, pas de matériel, pas de minimum. Vous ne devez rien tant qu’une famille n’a rien commandé. Le risque est entièrement de notre côté.'],
  ['24 h', 'Livré avant la cérémonie',
   'Vingt-quatre heures après l’entretien. Six heures en urgence. Vous pouvez le promettre à une famille qui enterre après-demain sans rien risquer.'],
  ['—', 'Zéro droit SACEM',
   'Chaque œuvre est originale et cédée avec ses droits d’usage. Aucune déclaration, aucune redevance de diffusion, aucune démarche administrative pour votre agence.'],
  ['1', 'La première composition est offerte',
   'Nous composons gratuitement un hommage pour votre prochaine famille. Vous le faites écouter. Si cela touche, on continue. Sinon, vous n’avez rien perdu.'],
  ['☎', 'Vous parlez au fondateur',
   'Pas de plateforme, pas de service client. Un numéro, une personne, une réponse sous deux heures ouvrées, et les urgences traitées en priorité.']
];

/* ─── Les six étapes du partenariat ─── */
const ETAPES = [
  ['Vous créez votre compte', 'Trois minutes, aucune pièce justificative à ce stade. Le tableau de bord s’ouvre immédiatement.', '3 min'],
  ['Vous recevez le kit', 'Cette brochure, l’affiche de vitrine, un argumentaire court, et les hommages de démonstration à faire écouter en rendez-vous.', 'Immédiat'],
  ['Nous composons votre première œuvre', 'Offerte, sur la prochaine famille qui vous le demandera. Vous présentez un hommage réel, pas une promesse.', '24 h'],
  ['Vous présentez', '« Nous pouvons faire composer une chanson originale pour lui, livrée avant la cérémonie. » Puis vous faites écouter. Trente secondes.', '30 s'],
  ['Vous saisissez le brief', 'Cinq questions, trois minutes depuis votre espace. Ou vous nous passez le contact et nous menons l’entretien en votre nom.', '3 min'],
  ['Vous encaissez', 'Facture récapitulative mensuelle. Vous gardez 60 %, nous facturons les 40 %. Aucun minimum, aucun engagement de durée.', 'Mensuel']
];

const FAQ = [
  ['Comment sommes-nous rémunérés, exactement ?',
   'Vous conservez 60 % du montant payé par la famille. Sur une offre Prestige à 299 €, votre agence garde 179,40 € et nous reverse 119,60 €. Règlement mensuel, sur facture récapitulative.'],
  ['Devons-nous avancer de l’argent ou acheter un stock ?',
   'Non. Aucun investissement, aucun stock, aucun abonnement, aucun minimum. Vous ne payez que sur les hommages effectivement commandés par vos familles.'],
  ['Qui parle à la famille ?',
   'Vous restez l’interlocuteur. Vous saisissez le brief vous-même en trois minutes, ou vous nous transmettez le contact et nous menons l’entretien de cinq minutes à votre place, en votre nom.'],
  ['Et si la famille n’est pas satisfaite ?',
   'Nous reprenons la composition à nos frais. Si elle refuse malgré tout l’œuvre, elle n’est pas facturée — et votre agence n’avance rien. Le risque commercial est intégralement de notre côté.'],
  ['Combien de temps pour démarrer ?',
   'Vingt minutes. Compte créé, kit reçu, et la première composition offerte pour que vous puissiez la présenter à une famille avant tout engagement.'],
  ['Y a-t-il une exclusivité territoriale ?',
   'Nous limitons volontairement le nombre d’agences partenaires par bassin de population, pour que le service reste un vrai facteur de différenciation. Demandez la disponibilité de votre secteur.']
];

/* ═══ LES PAGES ═══ */

function couverture() {
  return `<section class="page">
    <div class="dedans" style="padding:20mm 18mm 14mm;">
      <img src="${image('assets/img/logo-melodia-complet.jpg')}" alt="Melodia Funèbre"
           style="width:58mm;height:58mm;object-fit:contain;mix-blend-mode:screen;margin:0 auto;">
      <div style="margin-top:auto;">
        <div class="surtitre">Dossier partenaire · Pompes funèbres</div>
        <hr class="filet" style="width:34mm;margin:4mm 0 6mm;">
        <h1>Devenez<br><em>partenaire.</em></h1>
        <p class="grand" style="margin-top:7mm;max-width:120mm;">
          Offrez aux familles une œuvre musicale composée pour leur défunt,
          livrée en vingt-quatre heures, avec sa page hommage et son QR code.
          Vous présentez, nous composons, vous conservez 60 %.
        </p>
        <p style="margin-top:7mm;font-family:'Cormorant Garamond',Georgia,serif;font-size:16pt;
                  font-style:italic;color:#c9a84c;max-width:110mm;line-height:1.45;">
          « Parce que certains souvenirs méritent plus qu’un silence. »
        </p>
        <div class="pied" style="margin-top:9mm;">
          <span>melodia-funebre.fr</span>
          <span>La musique traverse le temps</span>
        </div>
      </div>
    </div>
  </section>`;
}

/* Les visuels de campagne sont des affiches achevées : elles portent
   déjà leur logo, leur titre et leur adresse. Y superposer un second
   titre donnait deux logos l'un sur l'autre et deux accroches qui se
   mangeaient. On les pose donc entières, centrées sur le noir — c'est
   ce qu'on fait d'une affiche, on l'encadre, on ne la surcharge pas. */
function planche(fichier) {
  return `<section class="page">
    <img class="fond" src="${image('assets/img/campagne/' + fichier)}" alt=""
         style="object-fit:contain;background:#040407;">
  </section>`;
}

function ouverture() {
  return `<section class="page">
    <div class="dedans">
      <div class="surtitre">Le problème que personne ne nomme</div>
      <hr class="filet" style="width:28mm;margin:4mm 0 8mm;">
      <h2>Trois agences dans votre ville.<br><em>Une seule qu’on recommande</em><br>à la sortie de la cérémonie.</h2>

      <p class="grand" style="margin-top:9mm;max-width:150mm;">
        Le cercueil, les fleurs, le corbillard, la plaque : une famille compare
        des devis qui se ressemblent. Sur ces postes-là, vous ne pouvez plus vous
        distinguer que par le prix — et c’est une guerre que personne ne gagne.
      </p>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:7mm;margin-top:10mm;">
        <div>
          <h3>Ce dont on se souvient</h3>
          <p style="margin-top:3mm;">Demandez à quelqu’un ce qu’il a retenu d’un enterrement.
          Il ne vous parlera ni du bois du cercueil ni de la qualité des compositions
          florales. Il vous parlera d’un texte, d’un silence — et presque toujours
          d’une musique.</p>
        </div>
        <div>
          <h3>Ce que vous pouvez offrir</h3>
          <p style="margin-top:3mm;">Une chanson écrite pour ce défunt-là, à partir de ce que
          sa famille raconte de lui. Son prénom, son métier, ses manies. Pas un
          morceau piocher dans un catalogue : une œuvre qui n’existait pas avant
          lui et qui restera après vous.</p>
        </div>
      </div>

      <div class="carte" style="margin-top:10mm;border-left:2px solid #c9a84c;">
        <p style="font-family:'Cormorant Garamond',Georgia,serif;font-size:17pt;line-height:1.45;color:#f4f1ea;font-style:italic;">
          « Parce que certains souvenirs méritent plus qu’un silence. »
        </p>
      </div>

      <p style="margin-top:9mm;max-width:150mm;">
        Voilà ce qui se passe ensuite : la famille fait écouter la chanson aux cousins,
        aux collègues, aux petits-enfants. Chacun demande d’où elle vient.
        Et chacun retient le nom de l’agence qui l’a rendue possible.
        <strong style="color:#f4f1ea;">C’est la seule prestation de votre catalogue
        qui continue de parler de vous des mois après la cérémonie.</strong>
      </p>

      <div class="pied"><span>Melodia Funèbre</span><span>03</span></div>
    </div>
  </section>`;
}

function gains() {
  return `<section class="page">
    <div class="dedans">
      <div class="surtitre">Ce que vous y gagnez</div>
      <hr class="filet" style="width:28mm;margin:4mm 0 7mm;">
      <h2>Six raisons, et pas une<br>qui vous demande <em>d’avancer un euro.</em></h2>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:5mm;margin-top:9mm;">
        ${RAISONS.map(([c, t, d]) => `
        <div class="carte" style="display:flex;gap:5mm;align-items:flex-start;">
          <div class="chiffre" style="min-width:17mm;">${esc(c)}</div>
          <div>
            <h3 style="font-size:12.5pt;line-height:1.25;">${esc(t)}</h3>
            <p style="margin-top:2.5mm;font-size:8.8pt;">${esc(d)}</p>
          </div>
        </div>`).join('')}
      </div>

      <p class="disc" style="margin-top:8mm;">
        Nous ne présentons pas cela comme une opportunité commerciale à saisir.
        C’est un service de plus à rendre à des familles en deuil, qui se trouve
        être aussi une source de marge.
      </p>

      <div class="pied"><span>Melodia Funèbre</span><span>04</span></div>
    </div>
  </section>`;
}

function calcul(offres) {
  const prestige = offres.find(o => /prestige/i.test(o.name)) || { price: 299 };
  const marge = Math.round(prestige.price * 0.6 * 100) / 100;
  const lignes = [30, 60, 120, 240].map(obseques => {
    const prises = Math.round(obseques * 0.25);
    return [obseques, prises, Math.round(prises * marge), Math.round(prises * marge * 12 / 12)];
  });

  return `<section class="page">
    <div class="dedans">
      <div class="surtitre">Le calcul, sans habillage</div>
      <hr class="filet" style="width:28mm;margin:4mm 0 7mm;">
      <h2>Ce que cela pèse <em>sur une année.</em></h2>

      <p style="margin-top:6mm;max-width:150mm;">
        Une seule hypothèse, et elle est discutable : une famille sur quatre accepte
        quand on le lui propose bien. Remplacez-la par la vôtre, le tableau se recalcule
        dans votre tête en trois secondes — c’est une multiplication, pas un modèle financier.
      </p>

      <table style="width:100%;margin-top:8mm;border-collapse:collapse;">
        <thead>
          <tr>
            ${['Obsèques par an', 'Hommages (1 sur 4)', 'Marge annuelle', 'Par mois'].map((h, i) => `
            <th style="text-align:${i ? 'right' : 'left'};padding:3mm 2mm;border-bottom:1px solid rgba(201,168,76,.34);
                       font-family:'Jetbrains Mono',monospace;font-size:6.8pt;letter-spacing:.18em;
                       text-transform:uppercase;color:#c9a84c;font-weight:400;">${h}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${lignes.map(([o, p, an]) => `
          <tr>
            <td style="padding:4mm 2mm;border-bottom:1px solid rgba(255,255,255,.06);font-size:10pt;color:#c4bba6;">${o}</td>
            <td style="padding:4mm 2mm;border-bottom:1px solid rgba(255,255,255,.06);font-size:10pt;color:#c4bba6;text-align:right;">${p}</td>
            <td class="montant" style="padding:4mm 2mm;border-bottom:1px solid rgba(255,255,255,.06);text-align:right;
                       font-family:'Cormorant Garamond',Georgia,serif;font-size:17pt;color:#c9a84c;">${an.toLocaleString('fr-FR')} €</td>
            <td style="padding:4mm 2mm;border-bottom:1px solid rgba(255,255,255,.06);font-size:10pt;color:#c4bba6;text-align:right;">${Math.round(an / 12).toLocaleString('fr-FR')} €</td>
          </tr>`).join('')}
        </tbody>
      </table>

      <p class="disc" style="margin-top:5mm;">
        Base de calcul : offre Prestige à ${prestige.price} €, marge agence de 60 %, soit ${marge.toLocaleString('fr-FR')} € nets par hommage.
        Taux de prise retenu : 25 %. Estimation indicative, qui ne constitue pas un engagement contractuel.
      </p>

      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:5mm;margin-top:10mm;">
        ${offres.map(o => `
        <div class="carte" style="text-align:center;${/prestige/i.test(o.name) ? 'border-color:rgba(201,168,76,.55);' : ''}">
          <div class="surtitre" style="font-size:6.4pt;">${esc(o.name)}</div>
          <div class="chiffre" style="margin-top:3mm;">${o.price} €</div>
          <p style="margin-top:2mm;font-size:8pt;">dont <strong style="color:#f4f1ea;">${Math.round(o.price * 0.6)} €</strong> pour vous</p>
        </div>`).join('')}
      </div>

      <p style="margin-top:auto;padding-top:8mm;max-width:150mm;">
        Et l’on ne compte ici ni les options — version longue, langue étrangère,
        livraison en six heures — ni la plaque à QR code à 79 €, que beaucoup de familles
        ajoutent une fois qu’elles ont entendu l’œuvre.
      </p>

      <div class="pied"><span>Melodia Funèbre</span><span>05</span></div>
    </div>
  </section>`;
}

function marche() {
  return `<section class="page">
    <div class="dedans">
      <div class="surtitre">Le partenariat</div>
      <hr class="filet" style="width:28mm;margin:4mm 0 7mm;">
      <h2>Vingt minutes <em>pour démarrer.</em></h2>

      <ol style="margin-top:9mm;display:grid;gap:5mm;">
        ${ETAPES.map(([t, d, q], i) => `
        <li style="display:grid;grid-template-columns:12mm 1fr 22mm;gap:5mm;align-items:start;
                   padding-bottom:5mm;border-bottom:1px solid rgba(255,255,255,.07);">
          <span style="font-family:'Cormorant Garamond',Georgia,serif;font-size:22pt;color:#c9a84c;line-height:.9;">${i + 1}</span>
          <div>
            <h3 style="font-size:12.5pt;">${esc(t)}</h3>
            <p style="margin-top:2mm;font-size:8.8pt;">${esc(d)}</p>
          </div>
          <span style="font-family:'Jetbrains Mono',monospace;font-size:6.8pt;letter-spacing:.14em;
                       text-transform:uppercase;color:#8e8878;text-align:right;padding-top:2mm;">${esc(q)}</span>
        </li>`).join('')}
      </ol>

      <div class="pied"><span>Melodia Funèbre</span><span>07</span></div>
    </div>
  </section>`;
}

function plaque() {
  /* La photo de plaque est un portrait 1100×1525. Elle occupait
     d'abord une colonne étroite pleine hauteur : le recadrage
     mangeait alors « MELODIA-FUNEBRE.FR » et coupait la devise en
     plein mot. On la pose donc à son propre format, sans rogner ce
     qui y est écrit. */
  return `<section class="page">
    <div class="dedans">
      <div class="surtitre">Ce que vos voisins n’ont pas</div>
      <hr class="filet" style="width:28mm;margin:4mm 0 7mm;">
      <h2>La musique ne s’arrête pas<br><em>au jour de la cérémonie.</em></h2>

      <div style="display:grid;grid-template-columns:84mm 1fr;gap:9mm;margin-top:9mm;align-items:start;">
        <img src="${image('assets/img/plaque-qr-1100.jpg')}" alt="Plaque gravée avec son QR code"
             style="width:84mm;height:116mm;object-fit:cover;object-position:50% 22%;border:1px solid rgba(201,168,76,.25);">
        <div>
          <p>
            Chaque hommage reçoit sa page de souvenir, à l’adresse discrète, et un QR code
            à faire graver sur la plaque, le monument ou le faire-part. Qui le scanne
            entend l’œuvre, lit les mots de la famille et voit ses photos.
          </p>
          <p style="margin-top:4mm;">
            Un petit-enfant qui passera au cimetière dans quinze ans sortira son téléphone
            et entendra la chanson de son grand-père. Aucune autre prestation funéraire
            ne fait cela.
          </p>
          <div class="carte" style="margin-top:6mm;">
            <div class="surtitre" style="font-size:6.4pt;">L’option</div>
            <div class="chiffre" style="margin-top:2mm;">79 €</div>
            <p style="margin-top:2mm;font-size:8.6pt;">La page, le QR code, le fichier vectoriel
            pour le marbrier et le visuel de plaque prêt à graver. Même marge que sur un hommage.</p>
          </div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:9mm;margin-top:9mm;">
        <div>
          <h3>La famille garde la main</h3>
          <p style="margin-top:3mm;font-size:8.8pt;">Elle publie la page, elle la retire, elle y ajoute
          jusqu’à cinq photos et les paroles. Tant qu’elle ne l’a pas publiée, le code répond
          exactement comme un code qui n’existerait pas — personne ne peut deviner que la page existe.</p>
        </div>
        <div>
          <h3>Et le marbrier ?</h3>
          <p style="margin-top:3mm;font-size:8.8pt;">Il reçoit un fichier vectoriel en millimètres,
          qu’il met à la taille de la plaque sans perdre un dixième de netteté. Le code est encodé
          au niveau de correction le plus élevé : il se lit encore avec un tiers de sa surface abîmée.</p>
        </div>
      </div>

      <div class="pied"><span>Melodia Funèbre</span><span>08</span></div>
    </div>
  </section>`;
}

function questions() {
  return `<section class="page">
    <div class="dedans">
      <div class="surtitre">Ce qu’on nous demande toujours</div>
      <hr class="filet" style="width:28mm;margin:4mm 0 7mm;">
      <h2>Les questions <em>avant de dire oui.</em></h2>

      <div style="margin-top:8mm;display:grid;gap:5mm;">
        ${FAQ.map(([q, r]) => `
        <div style="padding-bottom:5mm;border-bottom:1px solid rgba(255,255,255,.07);">
          <h3 style="font-size:12pt;color:#c9a84c;">${esc(q)}</h3>
          <p style="margin-top:2.5mm;font-size:8.8pt;">${esc(r)}</p>
        </div>`).join('')}
      </div>

      <div class="pied"><span>Melodia Funèbre</span><span>09</span></div>
    </div>
  </section>`;
}

function affiche() {
  return `<section class="page">
    <div class="dedans">
      <div class="surtitre">La planche précédente</div>
      <hr class="filet" style="width:28mm;margin:4mm 0 7mm;">
      <h2>Votre affiche <em>de vitrine.</em></h2>
      <p style="margin-top:7mm;max-width:150mm;">
        Imprimez-la, posez-la en vitrine ou dans le bureau où vous recevez les familles.
        Elle fait la moitié du travail : ce sont souvent les familles qui posent la question
        les premières, et une question posée vaut mieux qu’une proposition faite.
      </p>
      <p style="margin-top:4mm;max-width:150mm;">
        Vous la recevez en haute définition depuis votre espace partenaire, avec les trois
        autres visuels de campagne de ce dossier.
      </p>

      <div class="carte" style="margin-top:10mm;">
        <h3>Une phrase suffit, en rendez-vous</h3>
        <p style="margin-top:3mm;font-family:'Cormorant Garamond',Georgia,serif;font-size:15pt;
                  line-height:1.5;color:#f4f1ea;font-style:italic;">
          « Nous pouvons faire composer une chanson originale pour lui,
          à partir de ce que vous m’avez raconté. Livrée avant la cérémonie.
          Voulez-vous en écouter une ? »
        </p>
        <p style="margin-top:4mm;font-size:8.6pt;">
          Puis vous lancez un hommage, et vous vous taisez. Trente secondes d’écoute
          décident plus sûrement que dix minutes d’explication.
        </p>
      </div>

      <div class="pied"><span>Melodia Funèbre</span><span>11</span></div>
    </div>
  </section>`;
}

function fin(mail) {
  return `<section class="page">
    <div class="dedans">
      <div style="margin-top:auto;">
        <div class="surtitre">Commencer</div>
        <hr class="filet" style="width:28mm;margin:4mm 0 6mm;">
        <h2 style="font-size:30pt;">La première composition<br><em>est offerte.</em></h2>

        <p class="grand" style="margin-top:7mm;max-width:135mm;">
          Nous écrivons un hommage pour votre prochaine famille, sans contrepartie
          et sans engagement. Vous le faites écouter. Vous jugez sur l’œuvre,
          pas sur cette brochure.
        </p>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6mm;margin-top:9mm;max-width:150mm;">
          <div class="carte">
            <div class="surtitre" style="font-size:6.4pt;">Demander une démonstration</div>
            <p style="margin-top:3mm;font-family:'Jetbrains Mono',monospace;font-size:8.4pt;color:#f4f1ea;">
              melodia-funebre.fr/professionnels</p>
          </div>
          <div class="carte">
            <div class="surtitre" style="font-size:6.4pt;">Écrire au fondateur</div>
            <p style="margin-top:3mm;font-family:'Jetbrains Mono',monospace;font-size:8.4pt;color:#f4f1ea;">
              ${esc(mail)}</p>
          </div>
        </div>

        <p style="margin-top:8mm;font-family:'Cormorant Garamond',Georgia,serif;font-size:15pt;
                  font-style:italic;color:#c9a84c;">Maxime Charavet, fondateur</p>

        <div class="pied" style="margin-top:8mm;">
          <span>melodia-funebre.fr</span>
          <span>La vie en musique, pour toujours</span>
        </div>
      </div>
    </div>
  </section>`;
}

/* ═══ LE DOCUMENT ═══ */
function html(donnees) {
  const offres = (donnees.offres || []).map(o => ({ name: o.name, price: Number(o.price) }));
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
<title>Melodia Funèbre — Dossier partenaire</title>
<style>${fontes()}${SOMBRE}</style></head><body>
${couverture()}
${planche('certaines-melodies.jpg')}
${ouverture()}
${gains()}
${calcul(offres)}
${planche('adieux-en-musique.jpg')}
${marche()}
${plaque()}
${questions()}
${planche('souvenirs-ukulele.jpg')}
${planche('affiche-partenaire.jpg')}
${affiche()}
${fin(donnees.mail)}
</body></html>`;
}

module.exports = { html, fichier: 'melodia-brochure-partenaire.pdf' };
