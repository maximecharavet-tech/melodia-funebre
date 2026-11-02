-- ═══════════════════════════════════════════════════════════════
-- S2 — Une famille peut commander. Personne d'anonyme ne peut
-- se déclarer payé, déposer une œuvre, ni s'assigner la commande.
--
-- La colonne assigne est NOT NULL DEFAULT '' sur le live : le
-- contrôle porte sur la chaîne vide, pas sur NULL.
--
-- Le fondateur (app.est_maison()) garde une insertion libre, pour
-- une saisie faite depuis la maison. Tout le reste — anonyme ou
-- compte famille — est borné.
--
-- Preuve :
--   insert ... paid = true          → refusé
--   insert ... status = 'recue', paid = false, audio vide,
--              assigne = ''         → accepté
--
-- Ne pas rejouer CE fichier après 20261102_05_parrain.sql :
-- la migration parrain réécrit la même policy en y ajoutant
-- le format du code. Rejouer celle-ci retirerait ce contrôle.
-- ═══════════════════════════════════════════════════════════════

drop policy if exists "toute famille peut commander" on public.orders;
create policy "toute famille peut commander" on public.orders
  for insert to anon, authenticated
  with check (
    app.est_maison()
    or (
      status = 'recue'
      and paid = false
      and coalesce(audio_url, '') = ''
      and coalesce(audio_title, '') = ''
      and coalesce(music_task_id, '') = ''
      and coalesce(assigne, '') = ''
      and coalesce(paypal_id, '') = ''
      and char_length(coalesce(ref, '')) between 4 and 40
      and char_length(coalesce(user_email, '')) <= 200
      and char_length(coalesce(user_name, '')) <= 200
      and char_length(coalesce(agence, '')) <= 200
      and char_length(coalesce(offer, '')) <= 80
      and char_length(coalesce(defunt, '')) <= 160
      and char_length(coalesce(traits, '')) <= 500
      and char_length(coalesce(metier, '')) <= 200
      and char_length(coalesce(habitude, '')) <= 500
      and char_length(coalesce(anecdote, '')) <= 8000
      and char_length(coalesce(style, '')) <= 200
      and char_length(coalesce(rite, '')) <= 120
      and char_length(coalesce(texte_sacre, '')) <= 8000
      and (
        options is null
        or (jsonb_typeof(options) = 'array' and jsonb_array_length(options) <= 20)
      )
    )
  );
