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
  SUPABASE_ANON_KEY: ''  // Settings → API → « anon public » — PAS « service_role »
};
