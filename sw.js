/* ═══════════════════════════════════════════════════════════════
   sw.js — Le travailleur de service

   CE FICHIER EST ENGENDRÉ. Ne pas l'éditer : voir build/sw-modele.js.

   POURQUOI C'EST LA PIÈCE LA PLUS DANGEREUSE DU SITE

   Un travailleur de service s'installe dans le navigateur et y reste.
   Mal écrit, il sert une version périmée du site à des gens qui n'ont
   aucun moyen de s'en rendre compte — et qui ne peuvent pas le
   désinstaller. Un prix changé, une page retirée, un correctif
   urgent : rien ne leur parvient.

   Trois règles en découlent, et elles priment sur la vitesse.

   1. LES PAGES VIENNENT TOUJOURS DU RÉSEAU D'ABORD. Le cache ne sert
      qu'en repli, quand le réseau ne répond pas. Une famille qui
      consulte sa commande doit voir l'état réel, pas celui d'hier.

   2. CERTAINES ADRESSES NE SONT JAMAIS MISES EN CACHE. Les appels à
      l'API, la base, les consoles, et surtout les pages mémoriales :
      une famille qui retire la page d'un défunt doit la voir
      disparaître tout de suite, pas au prochain vidage de cache.

   3. UNE NOUVELLE VERSION PREND LA MAIN IMMÉDIATEMENT. « skipWaiting »
      et « clients.claim » : pas d'attente que tous les onglets se
      ferment. Le prix de cette franchise est qu'une page ouverte peut
      voir ses ressources changer sous elle ; c'est un moindre mal
      devant une version figée pendant des jours.

   CE QUI EST MIS EN CACHE

   Les ressources à empreinte (style.css?v=abc123) sont immuables par
   construction : leur adresse change quand leur contenu change. Elles
   peuvent donc être servies depuis le cache sans aucun risque, et
   c'est ce qui rend le site utilisable hors ligne.

   Les fichiers audio ne sont mis en cache qu'après avoir été écoutés,
   et le cache est plafonné : préchargé, le catalogue ferait quarante
   mégaoctets sur le forfait de quelqu'un qui voulait lire une page.
   ═══════════════════════════════════════════════════════════════ */

const VERSION = '23f866f26b';
const COQUILLE = 'melodia-coquille-' + VERSION;
const ACTIFS   = 'melodia-actifs-'   + VERSION;
const SONS     = 'melodia-sons-'     + VERSION;
const SONS_MAX = 12;

/* La coquille : ce qu'il faut pour que le site s'ouvre sans réseau. */
const PRECHARGE = [
  "/",
  "/index",
  "/professionnels",
  "/offres",
  "/processus",
  "/demos",
  "/rites",
  "/contact",
  "/chanson-hommage",
  "/qr-code-memorial",
  "/musique-obseques",
  "/404",
  "/assets/img/icons/icon-192.png?v=7fe48436",
  "/assets/img/icons/icon-180.png?v=77f4ddbf",
  "/assets/css/style.css?v=4d618362",
  "/assets/img/intro-logo.jpg?v=1a9516a8",
  "/assets/img/intro-melodia.mp4?v=488159e4",
  "/assets/img/logo-melodia.jpg?v=c9f03ed0",
  "/assets/img/maxime.png?v=25ba945d",
  "/assets/img/hyper-engine.png?v=a1960bfe",
  "/assets/js/content.js?v=b3438db0",
  "/assets/js/main.js?v=72d6b7b0",
  "/assets/js/application.js?v=921dfcdc",
  "/assets/js/rappel.js?v=1840ff2c",
  "/assets/js/courrier.js?v=7feee7d2",
  "/assets/js/ornements.js?v=fd39b940",
  "/assets/js/catalogue.js?v=f173c94a",
  "/site.webmanifest",
  "/assets/img/icons/icon-192.png",
  "/assets/img/icons/icon-512.png"
];

/* Jamais de cache. Les consoles et l'espace des familles montrent des
   données qui changent ; les pages mémoriales peuvent être retirées
   d'un instant à l'autre par la famille. */
const JAMAIS = /\/(api|rest|auth)\/|supabase\.co|\/m\/|hommage\.html|dashboard-|espace\.html|compte\.html|config\.js/;

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(COQUILLE);
    /* Un fichier absent ne doit pas faire échouer toute l'installation :
       sans ce filet, une seule adresse changée laisse l'application
       sans travailleur de service, et personne ne le voit. */
    await Promise.all(PRECHARGE.map((u) => c.add(u).catch(() => {})));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const noms = await caches.keys();
    await Promise.all(noms.map((n) => {
      if (n === COQUILLE || n === ACTIFS || n === SONS) return null;
      return caches.delete(n);   /* les versions précédentes s'en vont */
    }));
    await self.clients.claim();
  })());
});

/* Le cache des sons est plafonné : on évacue les plus anciens. */
async function bornerSons() {
  const c = await caches.open(SONS);
  const clefs = await c.keys();
  for (let i = 0; i < clefs.length - SONS_MAX; i++) await c.delete(clefs[i]);
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  /* On ne se mêle pas de ce qui vient d'ailleurs, hors polices. */
  if (url.origin !== location.origin && !/fonts\.(googleapis|gstatic)\.com/.test(url.hostname)) return;
  if (JAMAIS.test(url.pathname + url.search)) return;

  /* ─── Les pages : réseau d'abord, cache en repli ─── */
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      try {
        const rep = await fetch(req);
        const c = await caches.open(COQUILLE);
        c.put(req, rep.clone());
        return rep;
      } catch (err) {
        const c = await caches.open(COQUILLE);
        return (await c.match(req)) || (await c.match('/index.html')) ||
          new Response(
            '<!doctype html><html lang=fr><meta charset=utf-8>' +
            '<title>Hors ligne — Melodia Funèbre</title>' +
            '<style>body{background:#040407;color:#c4bba6;font-family:system-ui,sans-serif;' +
            'display:grid;place-items:center;min-height:100vh;margin:0;padding:2rem;text-align:center;line-height:1.7}' +
            'a{color:#c9a84c}</style>' +
            '<div><p style="font-size:1.2rem;color:#f2efe8">Vous êtes hors ligne.</p>' +
            '<p>Les pages déjà consultées restent disponibles.<br>' +
            'Reconnectez-vous pour le reste.</p>' +
            '<p><a href="/">Revenir à l\'accueil</a></p></div>',
            { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: 503 });
      }
    })());
    return;
  }

  /* ─── Les sons : après écoute seulement, et plafonnés ─── */
  if (/\.(mp3|m4a|ogg|wav)$/i.test(url.pathname)) {
    e.respondWith((async () => {
      const c = await caches.open(SONS);
      const garde = await c.match(req);
      if (garde) return garde;
      const rep = await fetch(req);
      /* Une réponse partielle (206) ne se met pas en cache : c'est un
         morceau de fichier, pas le fichier. */
      if (rep.ok && rep.status === 200) { c.put(req, rep.clone()); bornerSons(); }
      return rep;
    })());
    return;
  }

  /* ─── Les ressources à empreinte : cache d'abord ───
     Leur adresse change quand leur contenu change : les servir depuis
     le cache ne peut pas donner une version périmée. */
  e.respondWith((async () => {
    const c = await caches.open(ACTIFS);
    const garde = await c.match(req);
    if (garde) return garde;
    try {
      const rep = await fetch(req);
      if (rep.ok) c.put(req, rep.clone());
      return rep;
    } catch (err) {
      return garde || Response.error();
    }
  })());
});

/* La page peut demander au nouveau travailleur de prendre la main tout
   de suite, plutôt qu'au prochain chargement. */
self.addEventListener('message', (e) => {
  if (e.data === 'prendre-la-main') self.skipWaiting();
});
