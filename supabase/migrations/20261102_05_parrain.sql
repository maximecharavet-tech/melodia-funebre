-- ═══════════════════════════════════════════════════════════════
-- Parrain — la commande peut porter le code du lien (?parrain=).
--
-- Tant que cette migration n'est pas passée, le site NE DOIT PAS
-- écrire la colonne : melodia_capacites() renvoie orders_parrain
-- à faux, et la commande part sans ce champ. Après, le code est
-- enregistré s'il a la forme julie-serve (lettres, chiffres, tirets).
--
-- parrainages(code) renvoie un entier, rien d'autre : pas de nom,
-- pas de téléphone, pas d'adresse. Réservé aux comptes maison.
--
-- La policy d'insertion est réécrite pour conserver les bornes de
-- S2 et y ajouter le format du code. Elle remplace celle de
-- 20261102_02_s2_orders_insert.sql.
-- ═══════════════════════════════════════════════════════════════

alter table public.orders
  add column if not exists parrain text not null default '';

alter table public.orders drop constraint if exists orders_parrain_format;
alter table public.orders
  add constraint orders_parrain_format
  check (parrain = '' or parrain ~ '^[a-z0-9-]{2,40}$');

create index if not exists orders_parrain_idx
  on public.orders (parrain)
  where parrain <> '';

create or replace function public.parrainages(code text)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::integer
    from public.orders o
   where o.parrain <> ''
     and o.parrain = lower(coalesce(code, ''))
     and app.mon_role() in ('master', 'commercial', 'atelier');
$$;

revoke all on function public.parrainages(text) from public;
grant execute on function public.parrainages(text) to authenticated;

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
      and (parrain = '' or parrain ~ '^[a-z0-9-]{2,40}$')
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
