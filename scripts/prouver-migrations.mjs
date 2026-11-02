/**
 * Rejoue les migrations Melodia sur un Postgres local (PGlite) et
 * imprime les preuves S1 / S2 / S4. Ne touche pas au projet live.
 *
 *   npm install --prefix /tmp/pglite-melodia @electric-sql/pglite
 *   NODE_PATH=/tmp/pglite-melodia/node_modules node scripts/prouver-migrations.mjs
 */
import { readFileSync, readdirSync } from 'fs';

let PGlite;
try {
  ({ PGlite } = await import('@electric-sql/pglite'));
} catch (e) {
  ({ PGlite } = await import('/tmp/pglite-melodia/node_modules/@electric-sql/pglite/dist/index.js'));
}

const db = new PGlite();
const log = [];
function dire(t) { log.push(t); console.log(t); }

await db.exec(`
  create schema if not exists auth;
  create schema if not exists app;
  create schema if not exists storage;
  create or replace function auth.jwt() returns jsonb
    language sql stable as $$
      select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb;
    $$;
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin;
  create table public.roles (
    email text primary key,
    role text not null,
    created_at timestamptz not null default now(),
    agence text not null default ''
  );
  create table public.orders (
    id bigint generated always as identity primary key,
    ref text unique not null,
    created_at timestamptz not null default now(),
    status text not null default 'recue',
    user_email text not null default '',
    user_name text not null default '',
    agence text not null default '',
    offer text not null default '',
    price numeric,
    defunt text not null default '',
    traits text not null default '',
    metier text not null default '',
    habitude text not null default '',
    anecdote text not null default '',
    style text not null default '',
    rite text not null default '',
    texte_sacre text not null default '',
    urgence boolean not null default false,
    paid boolean not null default false,
    paypal_id text not null default '',
    audio_url text not null default '',
    audio_title text not null default '',
    music_task_id text not null default '',
    options jsonb not null default '[]'::jsonb,
    echeance timestamptz,
    assigne text not null default ''
  );
  create table public.prospects (
    siret text primary key,
    siren text not null default '',
    nom text not null default '',
    enseigne text not null default '',
    type text not null default 'funeraire',
    adresse text not null default '',
    cp text not null default '',
    ville text not null default '',
    email text not null default '',
    tel text not null default '',
    site text not null default '',
    statut text not null default 'nouveau',
    notes text not null default '',
    journal jsonb not null default '[]'::jsonb,
    relance timestamptz,
    owner text not null default '',
    owner_nom text not null default '',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );
  create table public.messages (
    id text primary key,
    fil text not null,
    expediteur text not null,
    expediteur_nom text not null default '',
    destinataire text not null,
    corps text not null,
    lu boolean not null default false,
    created_at timestamptz not null default now()
  );
  create table public.memoriaux (
    jeton text primary key,
    ref text not null default '',
    proprietaire text not null default '',
    agence text not null default '',
    actif boolean not null default false,
    nom text not null default ''
  );
  create table public.demandes (id text primary key, email text not null default '');
  create table public.publications (id text primary key, cree_par text not null default '');
  create table storage.objects (
    id bigint generated always as identity primary key,
    bucket_id text,
    name text,
    metadata jsonb
  );
  create table public.rate_limits (
    bucket text not null,
    key text not null,
    window_start bigint not null,
    count integer not null default 0,
    primary key (bucket, key, window_start)
  );
  create or replace function app.mon_email() returns text
    language sql stable security definer set search_path = public as $$
      select auth.jwt() ->> 'email' $$;
  create or replace function app.mon_role() returns text
    language sql stable security definer set search_path = public as $$
      select role from public.roles where email = auth.jwt() ->> 'email' $$;
  create or replace function app.mon_agence() returns text
    language sql stable security definer set search_path = public as $$
      select nullif(agence, '') from public.roles where email = auth.jwt() ->> 'email' $$;
  create or replace function app.est_master() returns boolean
    language sql stable security definer set search_path = public as $$
      select coalesce(app.mon_role() = 'master', false) $$;
  create or replace function app.est_maison() returns boolean
    language sql stable security definer set search_path = public as $$
      select coalesce(app.mon_role() in ('master', 'commercial'), false) $$;
  insert into public.roles (email, role) values
    ('julie@example.test', 'commercial'),
    ('fondateur@example.test', 'master');
  insert into public.orders (ref, user_name, user_email, defunt, status, paid)
    values ('MEL-PREUVE', 'Famille Test', 'famille@example.test', 'Armand', 'recue', false);
  alter table public.orders enable row level security;
  alter table public.orders force row level security;
  alter table public.prospects enable row level security;
  alter table public.prospects force row level security;
  alter table public.messages enable row level security;
  alter table public.messages force row level security;
  alter table public.memoriaux enable row level security;
  alter table public.memoriaux force row level security;
  alter table public.roles enable row level security;
  alter table public.roles force row level security;
  alter table storage.objects enable row level security;
  alter table storage.objects force row level security;
  create policy "toute famille peut commander" on public.orders
    for insert to anon, authenticated with check (true);
  create policy "chacun lit ses commandes" on public.orders
    for select to public using (
      lower(user_email) = lower(auth.jwt() ->> 'email') or app.est_maison()
    );
  create policy "la maison fait avancer les commandes" on public.orders
    for update to authenticated using (app.est_maison()) with check (app.est_maison());
  create policy "chacun depose son adieu" on storage.objects
    for insert to anon, authenticated with check (bucket_id = 'adieux');
  grant usage on schema public, app, storage, auth to anon, authenticated, service_role;
  grant select, insert, update, delete on all tables in schema public to anon, authenticated;
  grant select, insert, update, delete on storage.objects to anon, authenticated;
  grant usage on all sequences in schema public to anon, authenticated;
  grant usage on all sequences in schema storage to anon, authenticated;
  grant execute on all functions in schema app to anon, authenticated;
  grant execute on all functions in schema auth to anon, authenticated;
`);

const fichiers = readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql')).sort();
for (const f of fichiers) {
  dire('— migration ' + f);
  await db.exec(readFileSync('supabase/migrations/' + f, 'utf8'));
}

async function enTantQue(role, email, sql) {
  await db.exec(`set role ${role}`);
  await db.exec(`select set_config('request.jwt.claims', '{"email":"${email}"}', false)`);
  try {
    const r = await db.query(sql);
    return { ok: true, rows: r.rows, n: r.affectedRows };
  } catch (e) {
    return { ok: false, erreur: e.message };
  } finally {
    await db.exec('reset role');
  }
}

dire('\n== S1 commercial : select orders ==');
let r = await enTantQue('authenticated', 'julie@example.test', 'select count(*)::int as n from public.orders');
dire(JSON.stringify(r));

dire('== S1 commercial : update orders ==');
r = await enTantQue('authenticated', 'julie@example.test', "update public.orders set status = 'livree'");
dire(JSON.stringify(r));

dire('== S1 master : select orders ==');
r = await enTantQue('authenticated', 'fondateur@example.test', 'select count(*)::int as n from public.orders');
dire(JSON.stringify(r));

dire('== S2 anon paid=true ==');
r = await enTantQue('anon', '', `insert into public.orders (ref, status, paid, user_email) values ('MEL-PAYE', 'recue', true, 'x@y.z')`);
dire(JSON.stringify(r));

dire('== S2 anon commande valide ==');
r = await enTantQue('anon', '', `insert into public.orders (ref, status, paid, user_email, user_name, defunt, offer) values ('MEL-OK', 'recue', false, 'famille@example.test', 'Camille', 'Louis', 'Essentiel')`);
dire(JSON.stringify(r));

dire('== S4 anon insert storage ==');
r = await enTantQue('anon', '', `insert into storage.objects (bucket_id, name) values ('adieux', 'libre/photo.jpg')`);
dire(JSON.stringify(r));

dire('== S4 authentifié préfixe invalide ==');
r = await enTantQue('authenticated', 'julie@example.test', `insert into storage.objects (bucket_id, name) values ('adieux', 'libre/photo.jpg')`);
dire(JSON.stringify(r));

dire('== B1 colonnes prospects ==');
await db.exec('reset role');
r = await db.query(`select column_name from information_schema.columns where table_name = 'prospects' and column_name in ('relance_le','oppose','dirigeant','departement') order by 1`);
dire(JSON.stringify(r.rows));

dire('== capacites ==');
r = await db.query('select public.melodia_capacites() as c');
dire(JSON.stringify(r.rows));

console.log('\n---FIN---');
