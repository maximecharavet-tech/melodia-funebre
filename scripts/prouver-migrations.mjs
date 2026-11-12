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

/* btree_gist : exigé par la contrainte d'exclusion de la migration 12. */
let btree_gist;
try { ({ btree_gist } = await import('@electric-sql/pglite/contrib/btree_gist')); }
catch (e) { ({ btree_gist } = await import('/tmp/pglite-melodia/node_modules/@electric-sql/pglite/dist/contrib/btree_gist.js')); }
const EXT = { btree_gist };
const db = new PGlite({ extensions: EXT });
const log = [];
function dire(t) { log.push(t); console.log(t); }

const AMORCE = `
  create schema if not exists auth;
  create schema if not exists app;
  create schema if not exists storage;
  create or replace function auth.uid() returns uuid
    language sql stable as $$
      select nullif(coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb ->> 'sub', '')::uuid;
    $$;
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
  create table storage.buckets (
    id text primary key,
    name text,
    public boolean default false
  );
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
  -- La migration 09 s'appuie sur les alias public.* qui existent en production.
  create or replace function public.est_master() returns boolean
    language sql stable as $$ select app.est_master() $$;
  create or replace function public.est_maison() returns boolean
    language sql stable as $$ select app.est_maison() $$;
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
  -- Comme Supabase : les tables créées ensuite reçoivent ces droits par défaut,
  -- et le service role contourne la RLS.
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
  alter role service_role bypassrls;
`;
await db.exec(AMORCE);

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

// ═══ Melodia Pro (migration 10) : RLS et colonnes réservées au service ═══
const preuves = [];
function preuve(nom, condition, detail) {
  preuves.push({ nom, ok: !!condition });
  dire((condition ? '  OK  ' : '  KO  ') + nom + (detail ? '  — ' + detail : ''));
}

dire('\n== PRO : migration 10 rejouée (idempotence) ==');
try {
  await db.exec(readFileSync('supabase/migrations/20261112_10_pro_app.sql', 'utf8'));
  preuve('migration 10 rejouée sans erreur', true);
} catch (e) { preuve('migration 10 rejouée sans erreur', false, e.message); }

const A = '11111111-1111-1111-1111-111111111111';
const B = '22222222-2222-2222-2222-222222222222';
const L = '33333333-3333-3333-3333-333333333333';
const ORG_A = 'aaaaaaaa-0000-0000-0000-000000000001';
const ORG_B = 'bbbbbbbb-0000-0000-0000-000000000002';
const DOS_A = 'dddddddd-0000-0000-0000-00000000000a';
await db.exec(`
  grant select, insert, update, delete on all tables in schema public to service_role;
  grant usage on all sequences in schema public to service_role;
  insert into public.pro_orgs (id, nom, siret, statut) values
    ('${ORG_A}', 'Agence A', '73282932000074', 'valide'),
    ('${ORG_B}', 'Agence B', '44300000000002', 'valide');
  insert into public.pro_members (org_id, user_id, email, role) values
    ('${ORG_A}', '${A}', 'a@agence-a.test', 'owner'),
    ('${ORG_B}', '${B}', 'b@agence-b.test', 'owner'),
    ('${ORG_A}', '${L}', 'l@agence-a.test', 'lecture');
  insert into public.pro_dossiers (id, org_id, reference, prenom_affiche) values
    ('${DOS_A}', '${ORG_A}', 'MF-AAAAAA', 'Jeanne'),
    ('dddddddd-0000-0000-0000-00000000000b', '${ORG_B}', 'MF-BBBBBB', 'Louis');
  insert into public.pro_qr (dossier_id, jeton) values ('${DOS_A}', '7K3M9QXT2BZZ');
  insert into public.pro_stripe_events (event_id, type) values ('evt_preuve', 'checkout.session.completed');
`);

async function commeMembre(sub, email, sql) {
  await db.exec('set role authenticated');
  const claims = JSON.stringify({ sub, email }).replace(/'/g, "''");
  await db.exec(`select set_config('request.jwt.claims', '${claims}', false)`);
  try { const x = await db.query(sql); return { ok: true, rows: x.rows, n: x.affectedRows }; }
  catch (e) { return { ok: false, erreur: e.message }; }
  finally { await db.exec('reset role'); }
}

dire('== PRO : cloisonnement des agences ==');
r = await commeMembre(A, 'a@agence-a.test', 'select reference from public.pro_dossiers order by 1');
preuve('agence A ne voit que ses dossiers', r.ok && r.rows.length === 1 && r.rows[0].reference === 'MF-AAAAAA', JSON.stringify(r.rows || r.erreur));
r = await commeMembre(B, 'b@agence-b.test', `select count(*)::int as n from public.pro_dossiers where org_id = '${ORG_A}'`);
preuve('agence B ne voit aucun dossier de A', r.ok && r.rows[0].n === 0);
r = await commeMembre(B, 'b@agence-b.test', `update public.pro_dossiers set titre = 'pirate' where id = '${DOS_A}'`);
preuve('agence B ne peut pas retoucher un dossier de A', r.ok ? r.n === 0 : true, r.ok ? r.n + ' ligne(s)' : r.erreur);
r = await commeMembre(B, 'b@agence-b.test', 'select count(*)::int as n from public.pro_qr');
preuve('agence B ne voit pas le QR de A', r.ok && r.rows[0].n === 0);

dire('== PRO : colonnes réservées au service ==');
r = await commeMembre(A, 'a@agence-a.test', `update public.pro_dossiers set paid = true where id = '${DOS_A}'`);
preuve('un membre ne peut pas passer paid = true', !r.ok, r.erreur);
r = await commeMembre(A, 'a@agence-a.test', `update public.pro_dossiers set status = 'paye' where id = '${DOS_A}'`);
preuve('un membre ne peut pas changer le statut', !r.ok, r.erreur);
r = await commeMembre(A, 'a@agence-a.test', `update public.pro_dossiers set audio_url = 'x' where id = '${DOS_A}'`);
preuve('un membre ne peut pas poser audio_url', !r.ok, r.erreur);
r = await commeMembre(A, 'a@agence-a.test', `insert into public.pro_dossiers (org_id, reference, status, paid) values ('${ORG_A}', 'MF-PIRATE', 'paye', true)`);
preuve('un membre ne peut pas créer un dossier déjà payé', !r.ok, r.erreur);
r = await commeMembre(A, 'a@agence-a.test', `update public.pro_dossiers set titre = 'Pour Jeanne' where id = '${DOS_A}'`);
preuve('un membre peut retoucher le titre de son dossier', r.ok && r.n === 1, r.ok ? '' : r.erreur);
r = await commeMembre(A, 'a@agence-a.test', 'update public.pro_qr set actif = true');
preuve('un membre ne peut pas publier le mémorial directement', !r.ok, r.erreur);
r = await commeMembre(L, 'l@agence-a.test', `insert into public.pro_dossiers (org_id, reference) values ('${ORG_A}', 'MF-LECTUR')`);
preuve('un membre en lecture seule ne crée pas de dossier', !r.ok, r.erreur);
r = await commeMembre(A, 'a@agence-a.test', 'select count(*)::int as n from public.pro_stripe_events');
preuve('aucun membre ne lit les événements Stripe', r.ok && r.rows[0].n === 0);
await db.exec(`insert into public.pro_jobs (dossier_id, type, version, derniere_erreur) values ('${DOS_A}', 'musique', 1, 'detail interne du fournisseur')`);
r = await commeMembre(A, 'a@agence-a.test', 'select count(*)::int as n from public.pro_jobs');
preuve('une agence ne lit pas la file de travaux (détails internes, marque blanche)', r.ok && r.rows[0].n === 0);
r = await commeMembre(A, 'a@agence-a.test', 'select count(*)::int as n from public.pro_settings');
preuve('une agence ne lit pas les réglages maison', r.ok && r.rows[0].n === 0);
r = await commeMembre(A, 'a@agence-a.test', "select public.pro_compter_scan('7K3M9QXT2BZZ')");
preuve('le compteur de scans n’est pas appelable par un membre', !r.ok, r.erreur);

dire('== PRO : service role ==');
await db.exec('set role service_role');
try {
  const s1 = await db.query(`update public.pro_dossiers set status = 'paye', paid = true where id = '${DOS_A}'`);
  preuve('le service role encaisse (paid = true)', s1.affectedRows === 1);
} catch (e) { preuve('le service role encaisse (paid = true)', false, e.message); }
finally { await db.exec('reset role'); }

r = await db.query(`select cle, valeur from public.pro_settings where cle in ('essai_par_org', 'essai_duree_s', 'plafond_jour_cents') order by cle`);
preuve('réglages : essai 1 / 150 s décidés, plafond TBD (NULL)',
  JSON.stringify(r.rows) === JSON.stringify([{ cle: 'essai_duree_s', valeur: '150' }, { cle: 'essai_par_org', valeur: '1' }, { cle: 'plafond_jour_cents', valeur: null }]),
  JSON.stringify(r.rows));
r = await db.query('select count(*)::int as n from public.pro_offers where price_cents is not null');
preuve('aucun tarif agence inventé (price_cents NULL)', r.rows[0].n === 0);
r = await db.query("select count(*)::int as n from pg_tables where schemaname = 'public' and tablename like 'pro\\_%' and not rowsecurity");
preuve('RLS activée sur toutes les tables pro_*', r.rows[0].n === 0, r.rows[0].n + ' table(s) sans RLS');

// ═══ Migration 11 : base « comme la production » ═══
// La production n'a PAS les alias public.est_master() / public.est_maison()
// (c'est ce qui a fait échouer 09 le 11/11/2026). On rejoue donc tout sur
// une base neuve sans ces alias : 09 doit échouer, 11 doit passer.
dire('\n== CONSOLE V2 : base sans alias public.est_* (comme la production) ==');
const prod = new PGlite({ extensions: EXT });
const AMORCE_PROD = AMORCE.replace(/create or replace function public\.est_\w+\(\)[^;]*?\$\$[^$]*\$\$;/g, '');
preuve('amorce de production : alias public.est_* retirés', !/public\.est_/.test(AMORCE_PROD));
await prod.exec(AMORCE_PROD);
await prod.exec(`insert into public.roles (email, role) values ('agence@example.test', 'partner')`);
for (const f of fichiers.filter((x) => !/_09_|_11_/.test(x))) await prod.exec(readFileSync('supabase/migrations/' + f, 'utf8'));
try {
  await prod.exec('begin;\n' + readFileSync('supabase/migrations/20261111_09_console_v2.sql', 'utf8') + '\ncommit;');
  preuve('09 échoue comme en production (public.est_master absent)', false, 'elle est passée');
} catch (e) {
  await prod.exec('rollback');
  preuve('09 échoue comme en production (public.est_master absent)', /est_master|est_maison/.test(e.message), e.message);
}
let t = await prod.query("select count(*)::int as n from information_schema.tables where table_schema = 'public' and table_name in ('sequences','taches','objectifs_jour','sequence_inscriptions')");
preuve('après l’échec de 09, schéma inchangé (rollback)', t.rows[0].n === 0, t.rows[0].n + ' table(s)');
const M11 = readFileSync('supabase/migrations/20261113_11_console_v2_app.sql', 'utf8');
preuve('11 ne cite aucun helper public.est_* hors commentaires', !/^[^-\n]*public\.est_/m.test(M11));
for (const passe of ['appliquée', 'rejouée (idempotence)']) {
  try { await prod.exec(M11); preuve('11 ' + passe + ' sans erreur', true); }
  catch (e) { preuve('11 ' + passe + ' sans erreur', false, e.message); }
}
async function prodComme(email, sql) {
  await prod.exec('set role authenticated');
  await prod.exec(`select set_config('request.jwt.claims', '${JSON.stringify({ email })}', false)`);
  try { const q = await prod.query(sql); return { ok: true, rows: q.rows, n: q.affectedRows }; }
  catch (e) { return { ok: false, erreur: e.message }; }
  finally { await prod.exec('reset role'); }
}
t = await prodComme('julie@example.test', "insert into public.sequences (owner, nom) values ('julie@example.test', 'Relance douce')");
preuve('le commercial crée sa séquence', t.ok, t.erreur);
t = await prodComme('julie@example.test', "insert into public.taches (owner, prospect_siret) values ('julie@example.test', '123')");
preuve('le commercial crée sa tâche', t.ok, t.erreur);
t = await prodComme('julie@example.test', "insert into public.sequences (owner, nom) values ('autre@example.test', 'x')");
preuve('le commercial ne crée rien au nom d’un autre', !t.ok);
t = await prodComme('agence@example.test', "insert into public.sequences (owner, nom) values ('agence@example.test', 'x')");
preuve('un partenaire ne crée pas de séquence', !t.ok);
t = await prodComme('fondateur@example.test', "insert into public.sequences (owner, nom) values ('julie@example.test', 'Pour Julie')");
preuve('le fondateur crée une séquence pour un commercial', t.ok, t.erreur);
t = await prodComme('agence@example.test', 'select count(*)::int as n from public.sequences');
preuve('un partenaire ne lit aucune séquence', t.ok && t.rows[0].n === 0);
t = await prodComme('fondateur@example.test', 'select count(*)::int as n from public.sequences');
preuve('le fondateur lit toutes les séquences', t.ok && t.rows[0].n === 2, JSON.stringify(t.rows || t.erreur));
t = await prod.query('select public.melodia_capacites() as c');
preuve('melodia_capacites().console_v2 = true', t.rows[0].c && t.rows[0].c.console_v2 === true, JSON.stringify(t.rows[0].c));
t = await prodComme('julie@example.test', 'select count(*)::int as n from public.orders');
preuve('S1 tient toujours : le commercial ne lit pas les commandes', t.ok && t.rows[0].n === 0);

// ═══ Migration 12 : un même courriel ne part pas deux fois en 60 jours ═══
dire('\n== ENVOIS : fenêtre de 60 jours (migration 12) ==');
const M12 = readFileSync('supabase/migrations/20261114_12_envois_idempotence.sql', 'utf8');
try { await db.exec(M12); preuve('12 rejouée (idempotence) sans erreur', true); }
catch (e) { preuve('12 rejouée (idempotence) sans erreur', false, e.message); }
const T0 = '2026-11-12T10:00:00Z';
const JOURS = (n) => `'${T0}'::timestamptz - interval '${n} days'`;
const meta = (dest, modele = 'pf-contact') => ({ collaborateur: 'julie@example.test', mode: 'envoi', destinataire: dest, modele, sujet: 's' });
async function reserver(cle, dest, maintenant, modele) {
  const l = Object.assign({ cle_idempotence: cle }, meta(dest, modele));
  const q = await db.query('select public.reserver_envois($1::jsonb, $2::timestamptz) as r', [JSON.stringify([l]), maintenant]);
  return q.rows[0].r[0];
}
await db.exec('delete from public.envois_prospect');
let x = await reserver('foo@bar.com|m:pf-contact', 'foo@bar.com', T0);
preuve('1re réservation : prise (statut reserve)', x.ok === true && x.id > 0, JSON.stringify(x));
x = await reserver('foo@bar.com|m:pf-contact', 'Foo@Bar.com', T0);
preuve('2e tentative immédiate : bloquée, avec précédent et renvoi à +60 j',
  x.ok === false && x.deja === 'reserve' && new Date(x.renvoi) - new Date(x.precedent) === 60 * 86400000, JSON.stringify(x));
await db.exec("update public.envois_prospect set statut = 'envoye' where cle_idempotence = 'foo@bar.com|m:pf-contact'");
const plus = (n, s = 0) => new Date(Date.parse(T0) + n * 86400000 + s * 1000).toISOString();
x = await reserver('foo@bar.com|m:pf-contact', 'foo@bar.com', plus(59));
preuve('précédent il y a 59 jours : bloqué', x.ok === false && x.deja === 'envoye', JSON.stringify(x));
x = await reserver('foo@bar.com|m:pf-contact', 'foo@bar.com', plus(60, -1));
preuve('précédent il y a 60 jours moins 1 s : encore bloqué', x.ok === false);
x = await reserver('foo@bar.com|m:pf-contact', 'foo@bar.com', plus(60));
preuve('précédent il y a exactement 60 jours : autorisé (nouvelle ligne)', x.ok === true, JSON.stringify(x));
r = await db.query("select count(*)::int as n from public.envois_prospect where cle_idempotence = 'foo@bar.com|m:pf-contact'");
preuve('l’historique n’est pas réécrit : deux lignes pour la clé', r.rows[0].n === 2);
x = await reserver('foo@bar.com|m:pf-contact', 'foo@bar.com', plus(60, 5));
preuve('la nouvelle fenêtre bloque à son tour', x.ok === false);
x = await reserver('foo@bar.com|m:pf-contact#e1', 'foo@bar.com', T0);
preuve('une autre étape du même modèle est permise', x.ok === true);
x = await reserver('foo@bar.com|m:pf-relance', 'foo@bar.com', T0, 'pf-relance');
preuve('un autre modèle, même destinataire : permis', x.ok === true);
x = await reserver('autre@bar.com|m:pf-contact', 'autre@bar.com', T0);
preuve('un autre destinataire, même modèle : permis', x.ok === true);
// echec : libère
await db.exec("update public.envois_prospect set statut = 'echec' where cle_idempotence = 'autre@bar.com|m:pf-contact'");
x = await reserver('autre@bar.com|m:pf-contact', 'autre@bar.com', T0);
preuve('statut echec : nouvel essai immédiat', x.ok === true, JSON.stringify(x));
await db.exec("update public.envois_prospect set statut = 'incertain' where cle_idempotence = 'autre@bar.com|m:pf-contact' and statut = 'reserve'");
x = await reserver('autre@bar.com|m:pf-contact', 'autre@bar.com', plus(30));
preuve('statut incertain : bloque pendant la fenêtre', x.ok === false && x.deja === 'incertain', JSON.stringify(x));
// concurrence : 20 appels simultanés (file de PGlite : chacun sa transaction)
await db.exec('delete from public.envois_prospect');
const lots = await Promise.all(Array.from({ length: 20 }, () => reserver('conc@bar.com|m:pf-contact', 'conc@bar.com', T0)));
preuve('20 réservations simultanées dans la fenêtre : une seule gagne', lots.filter((y) => y.ok).length === 1 && lots.filter((y) => !y.ok).length === 19);
const lots2 = await Promise.all(Array.from({ length: 20 }, () => reserver('conc@bar.com|m:pf-contact', 'conc@bar.com', plus(61))));
preuve('20 réservations simultanées après expiration : une seule nouvelle', lots2.filter((y) => y.ok).length === 1);
// contrainte d'exclusion : un INSERT direct qui contourne la fonction est refusé
const direct = (dest, jours, st) => db.exec(`insert into public.envois_prospect (collaborateur, destinataire, modele, statut, cle_idempotence, envoye_le)
  values ('j', '${dest}', 'm', '${st || 'envoye'}', '${dest}|m:m', ${JOURS(jours)})`);
await direct('dir@x.fr', 10);
try { await direct('dir@x.fr', 5); preuve('INSERT direct dans la fenêtre : refusé par la contrainte d’exclusion', false, 'accepté'); }
catch (e) { preuve('INSERT direct dans la fenêtre : refusé par la contrainte d’exclusion', /exclusion|conflicting/i.test(e.message), e.message); }
try { await direct('dir@x.fr', 80); preuve('INSERT direct 70 jours plus tôt (hors fenêtre) : permis', true); }
catch (e) { preuve('INSERT direct 70 jours plus tôt (hors fenêtre) : permis', false, e.message); }
try { await direct('dir@x.fr', 5, 'echec'); preuve('une ligne echec ne bloque pas (hors contrainte)', true); }
catch (e) { preuve('une ligne echec ne bloque pas (hors contrainte)', false, e.message); }
try { await db.exec(`insert into public.envois_prospect (collaborateur, destinataire, modele, statut, cle_idempotence) values ('a','b','m','envoye','Dir@X.fr|m:m')`); preuve('une clé non normalisée (majuscules) est refusée', false, 'acceptée'); }
catch (e) { preuve('une clé non normalisée (majuscules) est refusée', /minuscules|check/i.test(e.message), e.message); }
await db.exec(`insert into public.envois_prospect (collaborateur, destinataire, modele, statut) values ('j','foo@bar.com','m','envoye'),('j','foo@bar.com','m','envoye')`);
preuve('les envois de test (clé NULL) restent répétables', true);
r = await db.query("select bloque_jusqua - envoye_le as d from public.envois_prospect where cle_idempotence = 'dir@x.fr|m:m' limit 1");
preuve('le trigger pose bloque_jusqua = envoye_le + 60 jours', r.rows[0] && /^(60 days|1440:00:00)/.test(String(r.rows[0].d)), JSON.stringify(r.rows[0]));
try { await db.exec("insert into public.envois_prospect (collaborateur, destinataire, statut) values ('a','b','n-importe-quoi')"); preuve('statut inconnu refusé', false); }
catch (e) { preuve('statut inconnu refusé', true); }
r = await db.query("select has_function_privilege('anon', 'public.reserver_envois(jsonb, timestamptz)', 'execute') as a, has_function_privilege('service_role', 'public.reserver_envois(jsonb, timestamptz)', 'execute') as s");
preuve('reserver_envois : anon ne peut pas l’appeler, service_role oui', r.rows[0].a === false && r.rows[0].s === true, JSON.stringify(r.rows[0]));
const ligne = (cle, dest, st) => `insert into public.envois_prospect (collaborateur, destinataire, modele, statut, cle_idempotence)
  values ('julie@example.test', '${dest}', 'pf-contact', '${st || 'reserve'}', ${cle ? "'" + cle + "'" : 'null'})`;
// Reprise de l'existant : deux anciens envois identiques → une seule clé.
const M12b = new PGlite({ extensions: EXT });
await M12b.exec(AMORCE);
for (const f of fichiers.filter((x) => /_0[0-8]_|_10_/.test(x))) await M12b.exec(readFileSync('supabase/migrations/' + f, 'utf8'));
await M12b.exec(`insert into public.envois_prospect (collaborateur, destinataire, modele, sujet, mode, envoye_le) values
  ('j','Dup@X.fr','pf-contact','a','envoi', now() - interval '20 days'),('j','dup@x.fr','pf-contact','a','envoi', now() - interval '10 days'),
  ('j','t@x.fr','','Objet  Libre','envoi', now() - interval '5 days'),('j','t@x.fr','pf-contact','a','test', now() - interval '5 days'),
  ('j','vieux@x.fr','pf-contact','a','envoi', now() - interval '90 days')`);
try { await M12b.exec(M12); preuve('12 sur un journal existant avec doublons historiques : passe', true); }
catch (e) { preuve('12 sur un journal existant avec doublons historiques : passe', false, e.message); }
r = await M12b.query("select count(*)::int as n, count(cle_idempotence)::int as k from public.envois_prospect");
preuve('reprise : doublons conservés, seule la ligne la plus récente des 60 derniers jours porte la clé', r.rows[0].n === 5 && r.rows[0].k === 2, JSON.stringify(r.rows[0]));
r = await M12b.query("select count(*)::int as n from public.envois_prospect where destinataire = 'vieux@x.fr' and cle_idempotence is not null");
preuve('reprise : un envoi de 90 jours ne bloque plus rien', r.rows[0].n === 0);
r = await M12b.query("select cle_idempotence, envoye_le > now() - interval '11 days' as recent from public.envois_prospect where cle_idempotence like 'dup@x.fr%'");
preuve('reprise : c’est le plus récent des doublons qui bloque', r.rows.length === 1 && r.rows[0].recent === true, JSON.stringify(r.rows));
r = await M12b.query("select cle_idempotence from public.envois_prospect where cle_idempotence like 't@x.fr%'");
preuve('reprise : objet normalisé comme en JS (minuscules, espaces simples)', r.rows[0] && r.rows[0].cle_idempotence === 't@x.fr|o:objet libre', JSON.stringify(r.rows));
try { await M12b.exec(M12); preuve('12 rejouée sur le journal repris : passe encore', true); }
catch (e) { preuve('12 rejouée sur le journal repris : passe encore', false, e.message); }

const ko = preuves.filter((p) => !p.ok).length;
dire(`\nPRO : ${preuves.length - ko} / ${preuves.length} preuves`);
console.log('\n---FIN---');
if (ko) process.exitCode = 1;
