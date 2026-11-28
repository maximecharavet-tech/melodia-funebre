/* Les consoles ne sont plus servies au public.
   Sans le témoin « melodia_console », posé à la connexion par
   assets/js/auth.js et retiré à la déconnexion, la requête reçoit
   une 404. Les robots et un simple chargement de l'adresse ne voient
   donc plus le code des consoles.

   Ce n'est pas une authentification serveur : le jeton reste dans le
   navigateur. C'est une porte qui ferme l'adresse à qui n'est pas
   passé par la page de connexion. Après un déploiement, ouvrir
   /compte une fois suffit à reposer le témoin si une session existe
   déjà sur l'appareil. */

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
  const temoin = request.cookies.get('melodia_console');
  if (temoin && temoin.value) return;
  return new Response('Not Found', {
    status: 404,
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'x-robots-tag': 'noindex, nofollow, noarchive',
      'cache-control': 'no-store',
    },
  });
}
