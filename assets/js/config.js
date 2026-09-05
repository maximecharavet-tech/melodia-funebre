/* ═══ CONFIGURATION MELODIA ═══
   Mode démo (par défaut) : laissez vide — comptes, commandes et
   prospection restent dans le navigateur (localStorage).

   Mode production : créez un projet gratuit sur supabase.com, puis
   Settings → API, et reportez les deux valeurs ci-dessous.

   La clé « anon » est publique par construction : elle est lisible
   dans le code source de la page, et c'est prévu ainsi. Toute la
   protection des données repose donc sur les règles Row Level
   Security de la base. Elles sont dans supabase/schema.sql, à passer
   AVANT de renseigner ces deux lignes. Sans elles, les commandes —
   qui contiennent le nom, l'adresse et le téléphone de familles en
   deuil, ainsi que le prénom et l'histoire du défunt — seraient
   lisibles par n'importe qui. */
window.MELODIA_CONFIG = {
  SUPABASE_URL: 'https://awvgmkoozerfggdvvubi.supabase.co',
  /* Clé « anon public ». Elle est publique par construction : le code
     l'envoie en en-tête depuis le navigateur, elle est donc lisible
     dans le source de la page. C'est prévu ainsi — la protection des
     données tient au Row Level Security, posé le 5 septembre 2026 et
     vérifié : quatre tables verrouillées, onze règles. */
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3dmdta29vemVyZmdnZHZ2dWJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg1NjA1MTUsImV4cCI6MjEwNDEzNjUxNX0.FfvtgMMC7KqbANL7Zz4Ecwd9br5o7_ToDPCIZoB23sw'
};
