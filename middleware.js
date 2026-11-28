/* Les consoles ne sont plus servies au public.
   Sans le témoin « melodia_console », posé à la connexion par
   assets/js/auth.js et retiré à la déconnexion, la requête reçoit
   une 404. Les robots et un simple chargement de l'adresse ne voient
   donc plus le code des consoles.

   Ce n'est pas une authentification serveur : le jeton reste dans le
   navigateur. C'est une porte qui ferme l'adresse à qui n'est pas
   passé par la page de connexion. Après un déploiement, ouvrir
   /compte une fois suffit à reposer le témoin si une session existe
   déjà sur l'appareil.

   On lit l'en-tête Cookie à la main : l'objet « request.cookies »
   n'existe que dans Next.js, et le faisait échouer ici (500).
   Pour laisser passer, on renvoie l'en-tête interne « x-middleware-next »,
   celui qu'utilise la fonction next() de Vercel. */

export const config = {
  matcher: [
    '/dashboard-master',
    '/dashboard-master.html',
    '/dashboard-commercial',
    '/dashboard-commercial.html',
    '/dashboard-partenaire',
    '/dashboard-partenaire.html',
  ],
};

export default function middleware(request) {
  const brut = request.headers.get('cookie') || '';
  if (/(?:^|;\s*)melodia_console=1(?:;|$)/.test(brut)) {
    return new Response(null, { headers: { 'x-middleware-next': '1' } });
  }
  return new Response('Not Found', {
    status: 404,
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'x-robots-tag': 'noindex, nofollow, noarchive',
      'cache-control': 'no-store',
    },
  });
}
