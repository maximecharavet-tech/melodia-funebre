#!/usr/bin/env python3
"""Questionnaire famille Melodia Funèbre — PDF à remplir à la main.
Mêmes sections et même numérotation que le questionnaire de la console Pro
(clés JSON de pro_questionnaires.donnees). Rendu : Chromium headless."""
import html, pathlib, subprocess

ICI = pathlib.Path(__file__).parent
TOTAL = 5
E = html.escape

TRAITS = ['généreux·se', 'drôle', 'discret·e', 'courageux·se', 'tendre', 'têtu·e', 'rieur·se', 'curieux·se', 'bricoleur·se', 'voyageur·se', 'fidèle', 'solaire']
INSTRUMENTS = ['Piano', 'Guitare', 'Violon', 'Violoncelle', 'Cordes', 'Accordéon', 'Harpe', 'Orgue', 'Flûte', 'Cornemuse', 'Saxophone', 'Batterie']
STYLES = ['Chanson française', 'Variété', 'Folk acoustique', 'Piano classique', 'Jazz doux', 'Gospel', 'Pop douce', 'Celtique', 'Bossa nova', 'Country', 'Orientale', 'Sacré / liturgique', 'Instrumental']
RITES = ['Civil ou laïque', 'Catholique', 'Protestant', 'Orthodoxe', 'Juif', 'Musulman', 'Bouddhiste', 'Hindou', 'Autre : …………']
MOMENTS = ['Entrée', 'Recueillement', 'Hommage', 'Sortie', 'Crémation', 'Inhumation', 'Après la cérémonie']
TONS = ['Lumineux', 'Recueilli', 'Nostalgique', 'Joyeux, une fête de la vie', 'Serein']

def num(n): return f'<span class="num">{n}</span>'
def req(r): return '<span class="req" title="indispensable">◆</span>' if r else ''

def q(n, label, lignes=1, aide='', r=False, cls=''):
    l = ''.join('<div class="ligne"></div>' for _ in range(lignes))
    a = f'<div class="aide">{aide}</div>' if aide else ''
    return f'<div class="q {cls}"><div class="lab">{num(n)}{label}{req(r)}</div>{a}<div class="lignes">{l}</div></div>'

def cases(n, label, opts, cols=3, r=False, aide='', cls=''):
    a = f'<div class="aide">{aide}</div>' if aide else ''
    items = ''.join(f'<span class="opt"><i class="box"></i>{o}</span>' for o in opts)
    return f'<div class="q {cls}"><div class="lab">{num(n)}{label}{req(r)}</div>{a}<div class="opts c{cols}">{items}</div></div>'

def date(n, label, heure=False, r=False):
    h = '<span class="sep">à</span><span class="cell2"></span><span class="sep">h</span><span class="cell2"></span>' if heure else ''
    return (f'<div class="q"><div class="lab">{num(n)}{label}{req(r)}</div><div class="date">'
            f'<span class="cell2"></span><span class="sep">/</span><span class="cell2"></span><span class="sep">/</span><span class="cell4"></span>{h}</div></div>')

def section(n, titre, sous=''):
    s = f'<p class="sous">{sous}</p>' if sous else ''
    return f'<div class="sec"><div class="secnum">{n}</div><div><h2>{titre}</h2>{s}</div></div>'

def page(i, corps, cover=False):
    tete = '' if cover else f'''<header class="tete"><img src="assets/monogramme.png" alt=""><span class="tt">Une vie, une <em>chanson</em></span>
      <span class="ref">Réf. dossier<span class="refbox"></span></span></header>'''
    return f'''<section class="page{' cover' if cover else ''}">{tete}<div class="corps">{corps}</div>
    <footer class="pied"><span>Melodia Funèbre · composé par Melodia Funèbre · melodia-funebre.fr</span><span class="pn">{i} / {TOTAL}</span></footer></section>'''

# ─── Page 1 : couverture ───
p1 = f'''
<div class="bandeau"><img src="assets/visuel-2-sunset.jpg" alt=""></div>
<img class="lockup" src="assets/lockup-officiel.png" alt="Melodia Funèbre">
<p class="surtitre">Questionnaire à remplir par la famille</p>
<h1>Une vie, une <em>chanson</em></h1>
<div class="filet"><span></span>◆<span></span></div>
<p class="intro">Ces quelques pages nous aident à composer une chanson qui ressemble à la personne que vous avez aimée.
Prenez le temps qu’il vous faut, seul ou à plusieurs. Écrivez comme vous parlez : quelques mots suffisent, et vous pouvez laisser une question vide.
Seules les questions marquées d’un <span class="req">◆</span> nous sont indispensables pour commencer.</p>
<div class="retour">
  <div class="etape"><b>1</b><span>Remplissez les pages, au stylo, en lettres lisibles.</span></div>
  <div class="etape"><b>2</b><span>Rendez-le à votre conseiller funéraire, ou envoyez-le scanné ou photographié à <strong>contact@melodia-funebre.fr</strong>.</span></div>
  <div class="etape"><b>3</b><span>Nous composons. Votre conseiller vous tient informés jusqu’à l’écoute.</span></div>
</div>
<div class="bas">
  <div class="cadre tampon"><div class="cadre-t">Votre conseiller funéraire</div><div class="tampon-zone">Cachet de l’agence</div>
    <div class="mini"><span>Conseiller</span><i></i></div><div class="mini"><span>Téléphone</span><i></i></div></div>
  <div class="cadre refcadre"><div class="cadre-t">Réservé à l’agence</div>
    <div class="lab small">N° de dossier</div><div class="cells">{''.join('<i></i>' for _ in range(10))}</div>
    <div class="lab small">{num('4.4')}Cérémonie le</div>
    <div class="date sm"><span class="cell2"></span><span class="sep">/</span><span class="cell2"></span><span class="sep">/</span><span class="cell4"></span><span class="sep">à</span><span class="cell2"></span><span class="sep">h</span><span class="cell2"></span></div>
    <div class="lab small">{num('4.5')}Chanson attendue au plus tard le<span class="req">◆</span></div>
    <div class="date sm"><span class="cell2"></span><span class="sep">/</span><span class="cell2"></span><span class="sep">/</span><span class="cell4"></span><span class="sep">à</span><span class="cell2"></span><span class="sep">h</span><span class="cell2"></span></div>
    <div class="mini"><span>Remis à la famille le</span><i></i></div>
    <div class="qr"><img src="assets/qr-demos.svg" alt=""><span>Écouter des compositions de la maison<br><em>melodia-funebre.fr/demos</em></span></div>
  </div>
</div>'''

# ─── Page 2 : La personne + Sa vie (début) ───
p2 = (section(1, 'La personne', 'Comment l’appeliez-vous ? Ce qui permet de la nommer juste, et de la chanter juste.')
 + '<div class="deux">' + q('1.1', 'Prénom d’usage', r=True, aide='Le prénom par lequel on l’appelait.') + q('1.2', 'Nom de famille', aide='&nbsp;') + '</div>'
 + '<div class="deux">' + q('1.3', 'Surnom affectueux', aide='Celui qu’employaient les proches.') + q('1.4', 'Prononciation du prénom', aide='Écrit comme il se dit : « Siobhan » → « Chivonne ».') + '</div>'
 + cases('1.5', 'Pour accorder les paroles, on dit', ['il', 'elle', 'iel'], cols=3, r=True, cls='inline')
 + '<div class="deux">' + date('1.6', 'Date de naissance') + date('1.7', 'Date du décès') + '</div>'
 + q('1.8', 'Les lieux de sa vie', 2, aide='Une ville, un village, une maison, un pays.')
 + '<div class="deux">' + q('1.9', 'Langue(s) parlée(s)', aide='Celle du cœur, et les autres.') + q('1.10', 'Un refrain dans une autre langue ?', aide='Par exemple : en breton, en italien.') + '</div>'
 + section(2, 'Sa vie', 'Ce qui la rendait unique : son métier, son caractère, ses habitudes.')
 + '<div class="deux">' + q('2.1', 'Métier', r=True, aide='Ou sa passion, si elle disait mieux qui elle était.') + q('2.2', 'Passion', aide='&nbsp;') + '</div>'
 + cases('2.3', 'Trois traits de caractère', TRAITS, cols=4, r=True, aide='Cochez-en trois, ou écrivez les vôtres juste en dessous.')
 + q('2.3 b', 'Avec vos mots', 1, cls='suite'))

# ─── Page 3 : Sa vie (suite) ───
p3 = (section(2, 'Sa vie <em class="suitetitre">(suite)</em>', 'Les souvenirs qu’on raconte encore. C’est d’eux que naît le texte.')
 + q('2.4', 'Une habitude qui lui ressemblait', 2)
 + q('2.5', 'Une anecdote', 7, aide='Le souvenir qu’on raconte encore en famille, avec ses détails : un lieu, une saison, un geste.', cls='grand')
 + q('2.6', 'Une phrase qu’elle ou il répétait', 1)
 + q('2.7', 'Ce qu’elle ou il aimait', 2, aide='Un plat, un lieu, une saison, une équipe, un animal, une chanson…')
 + q('2.8', 'Proches à nommer dans la chanson', 2, aide='Prénoms et lien de parenté. Ne les nommez qu’avec leur accord.')
 + '<div class="q caseseule"><span class="opt"><i class="box"></i>Les proches nommés ont donné leur accord.</span></div>'
 + q('2.9', 'Sujets à éviter', 2, aide='La maladie, un conflit, un mot qui blesse : rien de ce qui est écrit ici ne sera abordé.'))

# ─── Page 4 : La musique + La cérémonie ───
instr = ''.join(f'<tr><td>{i}</td><td><i class="box"></i></td><td><i class="box"></i></td></tr>' for i in INSTRUMENTS[:6])
instr2 = ''.join(f'<tr><td>{i}</td><td><i class="box"></i></td><td><i class="box"></i></td></tr>' for i in INSTRUMENTS[6:])
thead = '<tr><th></th><th>Souhaité</th><th>À éviter</th></tr>'
energie = ''.join(f'<span class="cran"><i class="rond"></i></span>' for _ in range(5))
p4 = (section(3, 'La musique', 'Pour comprendre l’ambiance qu’elle ou il aurait aimée.')
 + cases('3.1', 'Style musical<span class="aide-in">— un seul choix de préférence</span>', STYLES, cols=5, r=True, cls='serre')
 + q('3.2', 'Artistes qu’elle ou il aimait', 1, aide='Pour l’ambiance seulement : aucun artiste n’est imité ni nommé dans la composition.')
 + f'<div class="deux mid"><div class="q"><div class="lab">{num("3.3")}Énergie</div><div class="echelle"><span class="bout">Lente, intime</span>{energie}<span class="bout">Élan, lumière</span></div></div>'
 + cases('3.4', 'Voix', ['Voix d’homme', 'Voix de femme', 'Chœur', 'Instrumental'], cols=2, r=True) + '</div>'
 + f'<div class="q"><div class="lab">{num("3.5")}Instruments<span class="aide-in">— à cocher dans une colonne ou l’autre</span></div><div class="instr"><table>{thead}{instr}</table><table>{thead}{instr2}</table></div></div>'
 + cases('3.6', 'Durée', ['Environ 2 min 30', 'Environ 3 min 30', 'Environ 4 min 30'], cols=3, cls='inline')
 + section(4, 'La cérémonie', 'Pour que la chanson trouve sa place le jour venu.')
 + cases('4.1', 'Rite', RITES, cols=5, cls='serre')
 + q('4.2', 'Texte à intégrer (prière, poème, verset)', 2)
 + cases('4.3', 'Moment de diffusion', MOMENTS, cols=4)

 + '<p class="note-agence">La date de la cérémonie (4.4) et la date de remise (4.5) sont notées par votre conseiller en première page.</p>')

# ─── Page 5 : Le message + Consentements + signature ───
p5 = (section(5, 'Le message', 'Ce que la chanson doit dire, et à qui.')
 + cases('5.1', 'Le ton', TONS, cols=3, r=True)
 + '<div class="deux">' + q('5.2', 'Un mot ou une phrase pour le refrain', 1) + q('5.3', 'Un titre, si vous en avez un', 1) + '</div>'
 + cases('5.4', 'À qui parle la chanson ?', ['À elle ou à lui (tu)', 'D’elle ou de lui (il, elle)', 'La famille, d’une seule voix (nous)'], cols=3)
 + section(6, 'Vos accords')
 + '<p class="rgpd">Les informations de ce questionnaire servent uniquement à composer la chanson et à vous la remettre. Elles sont conservées le temps nécessaire, jamais revendues, et vous pouvez demander leur effacement à tout moment (melodia-funebre.fr/confidentialite). Les numéros de téléphone, adresses ou e-mails écrits dans vos réponses ne sont jamais transmis à la composition.</p>'
 + '<div class="q"><div class="lab ligne-case">' + num('6.1') + '<i class="box"></i>J’ai été informé(e) de l’usage de ces données et je l’accepte.<span class="req">◆</span></div></div>'
 + cases('6.2', 'Souhaitez-vous relire les paroles avant la composition ?', ['Oui, nous souhaitons les relire', 'Non, notre conseiller s’en charge'], cols=2, r=True)
 + '<div class="q"><div class="lab ligne-case">' + num('6.3') + '<i class="box"></i>Une photo pourra figurer sur la page mémorial (droit à l’image accordé).</div></div>'
 + cases('6.4', 'Page mémorial en ligne', ['Lien privé (recommandé)', 'Protégée par un code', 'Publique', 'Pas de page'], cols=4, r=True, aide='La page n’est jamais indexée par les moteurs de recherche.')
 + '''<div class="signature"><div class="sig-champs">
      <div class="mini"><span>Rempli par (nom, prénom)</span><i></i></div>
      <div class="mini"><span>Lien avec la personne</span><i></i></div>
      <div class="mini"><span>Fait le</span><i></i></div></div>
    <div class="sig-zone">Signature</div></div>'''
 + '''<div class="agence"><div class="cadre-t">Réservé à l’agence</div><div class="deux">
      <div class="mini"><span>4.6 Contraintes techniques du lieu</span><i></i></div><div class="mini"><span>Saisi dans l’app le · par</span><i></i></div></div></div>'''
 + '<p class="merci">Merci. Ce que vous nous confiez est entre de bonnes mains.</p>')

CSS = (ICI / 'style.css').read_text()
doc = f'''<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Questionnaire famille — Melodia Funèbre</title><style>{CSS}</style></head><body>
{page(1, p1, cover=True)}{page(2, p2)}{page(3, p3)}{page(4, p4)}{page(5, p5)}</body></html>'''
(ICI / 'questionnaire.html').write_text(doc)
out = ICI.parent / 'questionnaire-melodia.pdf'
subprocess.run(['google-chrome', '--headless=new', '--no-sandbox', '--disable-gpu', '--no-pdf-header-footer',
                f'--print-to-pdf={out}', '--virtual-time-budget=4000', (ICI / 'questionnaire.html').as_uri()], check=True,
               stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
print(out)
