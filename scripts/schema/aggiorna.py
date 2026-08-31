#!/usr/bin/env python3
"""Rigenera lo stampo della piattaforma a partire dalla produzione.

Legge SOLO la struttura e la configurazione: nessun dato di un cliente esce
da qui. Produce tre file in schema/ che il portale usa per creare l'istanza
di una nuova azienda.

    schema/statements.json          la struttura, istruzione per istruzione
    schema/configurazione.json      messaggi, impostazioni, centraline
    schema/enti_notificatori.json.gz elenco enti per le multe

Uso:

    export SUPABASE_ACCESS_TOKEN=sbp_...
    export SUPABASE_PROD_REF=xxxxxxxxxxxx
    python3 scripts/schema/aggiorna.py

I tre file NON stanno nel repository: contengono lo schema completo della
produzione e i modelli di messaggio con recapiti reali, e questo repository
e' pubblico. Vanno consegnati al sito in modo riservato (vedi docs/PORTALE.md).
"""
import json, gzip, io, os, sys, time, urllib.request, urllib.error
from pathlib import Path

TOKEN = os.environ.get('SUPABASE_ACCESS_TOKEN', '').strip()
PROD  = os.environ.get('SUPABASE_PROD_REF', '').strip()
DEST  = Path(__file__).resolve().parents[2] / 'schema'

if not TOKEN or not PROD:
    sys.exit('Servono SUPABASE_ACCESS_TOKEN e SUPABASE_PROD_REF.')


def query(sql, tentativi=3):
    url = f'https://api.supabase.com/v1/projects/{PROD}/database/query'
    req = urllib.request.Request(
        url, data=json.dumps({'query': sql}).encode(), method='POST',
        headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json',
                 'User-Agent': 'dr7-portale'})
    ultimo = None
    for i in range(tentativi):
        try:
            with urllib.request.urlopen(req, timeout=180) as r:
                return json.loads(r.read().decode())
        except urllib.error.HTTPError as e:
            ultimo = f'HTTP {e.code}: {e.read().decode()[:400]}'
            if e.code in (429, 500, 502, 503, 504):
                time.sleep(3 * (i + 1)); continue
            raise RuntimeError(ultimo)
        except Exception as e:
            ultimo = str(e); time.sleep(3 * (i + 1))
    raise RuntimeError(ultimo)


# ── 1. Il catalogo della produzione ────────────────────────────────────────
CATALOGO = {
 'extensions': """select e.extname, n.nspname as schema, e.extversion
   from pg_extension e join pg_namespace n on n.oid = e.extnamespace
   where e.extname <> 'plpgsql' order by 1""",
 'enums': """select t.typname, array_agg(e.enumlabel order by e.enumsortorder) as labels
   from pg_type t join pg_namespace n on n.oid = t.typnamespace
   join pg_enum e on e.enumtypid = t.oid where n.nspname = 'public' group by 1 order by 1""",
 'tables': """select c.relname as tbl, c.relrowsecurity as rls, c.relkind,
     obj_description(c.oid, 'pg_class') as comment
   from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind in ('r','p') order by 1""",
 'columns': """select c.relname as tbl, a.attnum, a.attname,
     format_type(a.atttypid, a.atttypmod) as typ, a.attnotnull as notnull,
     pg_get_expr(d.adbin, d.adrelid) as dflt, a.attidentity as identity, a.attgenerated as generated
   from pg_class c join pg_namespace n on n.oid = c.relnamespace
   join pg_attribute a on a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped
   left join pg_attrdef d on d.adrelid = c.oid and d.adnum = a.attnum
   where n.nspname = 'public' and c.relkind in ('r','p') order by c.relname, a.attnum""",
 'constraints': """select c.relname as tbl, con.conname, con.contype::text as typ,
     pg_get_constraintdef(con.oid) as def
   from pg_constraint con join pg_class c on c.oid = con.conrelid
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and con.contype in ('p','u','c','f')
   order by con.contype, c.relname, con.conname""",
 'indexes': """select i.indexname, i.indexdef, i.tablename from pg_indexes i
   where i.schemaname = 'public' and not exists (
     select 1 from pg_constraint con join pg_class ic on ic.oid = con.conindid
     where ic.relname = i.indexname) order by 1""",
 'sequences': """select sequencename, data_type::text, start_value, min_value, max_value,
     increment_by, cycle from pg_sequences where schemaname = 'public' order by 1""",
 'functions': """select p.proname, pg_get_functiondef(p.oid) as def, p.prokind::text
   from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.prokind in ('f','p')
     and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e') order by 1""",
 'views': """select c.relname as viewname, pg_get_viewdef(c.oid, true) as def, c.relkind::text
   from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind in ('v','m') order by 1""",
 'triggers': """select c.relname as tbl, t.tgname, pg_get_triggerdef(t.oid) as def
   from pg_trigger t join pg_class c on c.oid = t.tgrelid
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and not t.tgisinternal order by c.relname, t.tgname""",
 'policies': """select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
   from pg_policies where schemaname = 'public' order by tablename, policyname""",
 'grants': """select table_name, grantee, privilege_type from information_schema.role_table_grants
   where table_schema = 'public' and grantee in ('anon','authenticated','service_role','postgres')
   order by 1,2""",
 'buckets': "select id, name, public, file_size_limit, allowed_mime_types from storage.buckets order by 1",
 'storage_policies': """select policyname, tablename, permissive, roles, cmd, qual, with_check
   from pg_policies where schemaname = 'storage' order by 1""",
}

print(f'Lettura della struttura da {PROD}')
S = {}
for nome, sql in CATALOGO.items():
    S[nome] = query(sql)
    print(f'  · {nome:18s} {len(S[nome])}')


# ── 2. Dal catalogo alle istruzioni ────────────────────────────────────────
def qi(n): return '"' + str(n).replace('"', '""') + '"'
def lit(v): return "'" + str(v).replace("'", "''") + "'"

def elenco(v):
    if v is None: return []
    if isinstance(v, list): return v
    s = str(v).strip()
    if s.startswith('{') and s.endswith('}'):
        return [x.strip().strip('"') for x in s[1:-1].split(',') if x.strip()]
    return [s]

st = []
for e in S['extensions']:
    st.append((1, f"create extension if not exists {qi(e['extname'])} with schema {qi(e['schema'])}"))
for t in S['enums']:
    st.append((2, f"create type public.{qi(t['typname'])} as enum ({', '.join(lit(l) for l in elenco(t['labels']))})"))
for s in S['sequences']:
    st.append((3, f"create sequence if not exists public.{qi(s['sequencename'])} as {s['data_type']} "
                  f"increment by {s['increment_by']} minvalue {s['min_value']} maxvalue {s['max_value']} "
                  f"start with {s['start_value']}{' cycle' if s['cycle'] else ''}"))

colonne = {}
for c in S['columns']:
    colonne.setdefault(c['tbl'], []).append(c)
for t in S['tables']:
    parti = []
    for c in colonne.get(t['tbl'], []):
        p = f"  {qi(c['attname'])} {c['typ']}"
        if c.get('generated') == 's':
            p += f" generated always as ({c['dflt']}) stored"
        else:
            if c.get('identity') in ('a', 'd'):
                p += f" generated {'always' if c['identity'] == 'a' else 'by default'} as identity"
            elif c.get('dflt'):
                p += f" default {c['dflt']}"
            if c['notnull']: p += ' not null'
        parti.append(p)
    if not parti: continue
    st.append((4, f"create table if not exists public.{qi(t['tbl'])} (\n" + ',\n'.join(parti) + "\n)"))
    if t.get('comment'):
        st.append((4, f"comment on table public.{qi(t['tbl'])} is {lit(t['comment'])}"))

for c in S['constraints']:
    if c['typ'] in ('p', 'u', 'c'):
        st.append((5, f"alter table public.{qi(c['tbl'])} add constraint {qi(c['conname'])} {c['def']}"))
for f in S['functions']:
    st.append((6, f['def'].rstrip().rstrip(';')))
for c in S['constraints']:
    if c['typ'] == 'f':
        st.append((7, f"alter table public.{qi(c['tbl'])} add constraint {qi(c['conname'])} {c['def']}"))
for i in S['indexes']:
    st.append((8, i['indexdef']))
for v in S['views']:
    kw = 'create materialized view' if v['relkind'] == 'm' else 'create or replace view'
    st.append((9, f"{kw} public.{qi(v['viewname'])} as\n{v['def'].rstrip().rstrip(';')}"))
for t in S['triggers']:
    st.append((10, t['def'].rstrip().rstrip(';')))
for t in S['tables']:
    if t['rls']:
        st.append((11, f"alter table public.{qi(t['tbl'])} enable row level security"))

def policy(p, schema):
    ruoli = ', '.join(qi(r) for r in elenco(p['roles'])) or 'public'
    s = (f"create policy {qi(p['policyname'])} on {schema}.{qi(p['tablename'])} "
         f"as {'permissive' if str(p['permissive']).lower().startswith('p') else 'restrictive'} "
         f"for {p['cmd'].lower()} to {ruoli}")
    if p.get('qual'): s += f"\n  using ({p['qual']})"
    if p.get('with_check'): s += f"\n  with check ({p['with_check']})"
    return s

for p in S['policies']:
    st.append((11, policy(p, 'public')))

per_chiave = {}
for g in S['grants']:
    per_chiave.setdefault((g['grantee'], g['table_name']), set()).add(g['privilege_type'])
for (chi, tbl), privs in sorted(per_chiave.items()):
    st.append((12, f"grant {', '.join(sorted(privs))} on public.{qi(tbl)} to {qi(chi)}"))

for b in S['buckets']:
    mimes = 'null'
    if b.get('allowed_mime_types'):
        mimes = 'array[' + ', '.join(lit(m) for m in elenco(b['allowed_mime_types'])) + ']'
    st.append((13, f"insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) "
                   f"values ({lit(b['id'])}, {lit(b['name'])}, {str(bool(b['public'])).lower()}, "
                   f"{b['file_size_limit'] or 'null'}, {mimes}) on conflict (id) do nothing"))
for p in S['storage_policies']:
    st.append((13, policy(p, 'storage')))

DEST.mkdir(exist_ok=True)
json.dump(st, io.open(DEST / 'statements.json', 'w', encoding='utf-8'), ensure_ascii=False)
print(f'\nstatements.json  {len(st)} istruzioni')


# ── 3. La configurazione di partenza ───────────────────────────────────────
def righe(tab, chiave, blocco=2000):
    n = query(f"select count(*)::int n from public.{tab}")[0]['n']
    out, off = [], 0
    while off < n:
        j = query(f"""select coalesce(jsonb_agg(t), '[]'::jsonb)::text as j from (
                        select * from public.{tab} order by {chiave} limit {blocco} offset {off}) t""")[0]['j']
        parte = json.loads(j)
        if not parte: break
        out += parte; off += blocco
    return out

cfg = {t: righe(t, k) for t, k in
       [('system_messages', 'id'), ('app_settings', 'key'), ('centralina_pro_config', 'id')]}
json.dump(cfg, io.open(DEST / 'configurazione.json', 'w', encoding='utf-8'), ensure_ascii=False)
for t in cfg: print(f'configurazione   {t:24s} {len(cfg[t])}')

enti = righe('enti_notificatori', 'id')
with gzip.open(DEST / 'enti_notificatori.json.gz', 'wt', encoding='utf-8') as f:
    json.dump(enti, f, ensure_ascii=False)
print(f'enti_notificatori {len(enti)}')


# ── 4. L'identita' da NON lasciare a un'altra azienda ──────────────────────
# Indirizzi, numeri e partita IVA di DR7 si trovano dentro le funzioni, le
# policy e i modelli di messaggio. Vengono cercati qui, non scritti a mano:
# cosi' un recapito nuovo aggiunto in produzione viene ripulito da solo, e il
# repository (pubblico) non contiene nessun recapito reale.
import re

testo = json.dumps(st, ensure_ascii=False) + json.dumps(cfg, ensure_ascii=False)

FINTI = re.compile(r'(esempio|example|azienda\.it|ente\.it|email\.com|@pec\.it$|nome@|test@|demo@)', re.I)

email = sorted({m.lower() for m in re.findall(r'[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}', testo)
                if not FINTI.search(m)})
telefoni = sorted({m for m in re.findall(r'(?<![0-9])3[0-9]{8,9}(?![0-9])', testo)})
# I numeri scritti a gruppi ("333 123 4567", "+39 333.123.4567").
spaziati = sorted({m.strip() for m in re.findall(r'(?:\+39[\s.]?)?3\d{2}[\s.]\d{3}[\s.]\d{3,4}', testo)})
piva = sorted({m for m in re.findall(r'(?<![0-9])\d{11}(?![0-9])', testo) if m != '00000000000'})

identita = {'email': email, 'telefono': telefoni + spaziati, 'piva': piva}
json.dump(identita, io.open(DEST / 'identita.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(f'identita         {len(email)} indirizzi, {len(identita["telefono"])} numeri, {len(piva)} partite IVA')

print('\nFatto. I quattro file NON vanno commessi: vedi docs/PORTALE.md.')
