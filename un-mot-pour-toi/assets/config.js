/* ═══════════════════════════════════════════════════════════════
   LA CONFIGURATION

   La clé « anon » est PUBLIQUE par construction : le navigateur
   l'envoie en en-tête à chaque appel, elle est donc lisible dans le
   code de la page par quiconque l'ouvre. C'est prévu ainsi.

   Toute la protection tient ailleurs : la table « adieux » est
   fermée à ce rôle — ni lecture, ni écriture — et ne s'ouvre que
   par trois fonctions qui exigent le jeton complet. Vérifié en base
   en se faisant passer pour ce rôle : « permission denied for table
   adieux » sur la lecture comme sur l'écriture.

   Voir supabase.sql pour le détail.
   ═══════════════════════════════════════════════════════════════ */
window.MOT_CONFIG = {
  SUPABASE_URL: 'https://awvgmkoozerfggdvvubi.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3dmdta29vemVyZmdnZHZ2dWJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg1NjA1MTUsImV4cCI6MjEwNDEzNjUxNX0.FfvtgMMC7KqbANL7Zz4Ecwd9br5o7_ToDPCIZoB23sw',
  ESPACE: 'adieux'
};
