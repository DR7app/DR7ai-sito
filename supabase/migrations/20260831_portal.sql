-- ═══════════════════════════════════════════════════════════════════════════
-- DR7 AI — PORTALE ISTANZE (31/08/2026)
--
-- Registro delle aziende a cui viene consegnata una copia del gestionale.
-- Vive nel progetto Supabase del PORTALE, non in quello di produzione:
-- qui non entra mai un dato di un cliente finale.
--
-- Ogni azienda venduta ha:
--   · il suo progetto Supabase (dati isolati),
--   · il suo sito Netlify (build proprio, variabili proprie),
--   · un indirizzo dr7ai.com/NOME servito dal proxy di frontiera.
--
-- Da eseguire a mano nel SQL editor del progetto portale.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Chi puo' usare il portale ──────────────────────────────────────────────
-- Nessuna email in duro nel codice: l'elenco sta qui.
CREATE TABLE IF NOT EXISTS public.portal_admins (
  email       TEXT PRIMARY KEY,
  nome        TEXT,
  attivo      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.portal_puo_operare()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.portal_admins p
     WHERE p.attivo
       AND p.email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

COMMENT ON FUNCTION public.portal_puo_operare() IS
  'Portale istanze: vero solo per un indirizzo attivo in portal_admins.';

-- ── 1. Le aziende ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.portal_instances (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- il pezzo di indirizzo: dr7ai.com/RENTCAGLIARI
  slug               TEXT NOT NULL UNIQUE
                     CHECK (slug ~ '^[A-Z0-9][A-Z0-9-]{1,30}[A-Z0-9]$'),
  ragione_sociale    TEXT NOT NULL,
  email_titolare     TEXT NOT NULL,
  telefono_titolare  TEXT,
  partita_iva        TEXT,
  citta              TEXT,
  note               TEXT,

  stato              TEXT NOT NULL DEFAULT 'da_creare'
                     CHECK (stato IN ('da_creare','in_creazione','attiva','sospesa','errore','archiviata')),

  -- risorse create dal portale (nessuna chiave segreta qui dentro)
  supabase_ref       TEXT,
  supabase_url       TEXT,
  supabase_regione   TEXT NOT NULL DEFAULT 'eu-west-1',
  netlify_site_id    TEXT,
  netlify_url        TEXT,

  -- versione dello schema applicato: serve a sapere chi e' rimasto indietro
  schema_versione    TEXT,
  schema_istruzioni  INTEGER,

  creata_da          TEXT,
  attivata_at        TIMESTAMPTZ,
  sospesa_motivo     TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS portal_instances_stato_idx ON public.portal_instances (stato, created_at DESC);

-- ── 2. Le chiavi delle istanze ─────────────────────────────────────────────
-- Tabella separata, MAI leggibile dal browser: nessuna policy di SELECT.
-- Solo il service role (le funzioni del portale) la vede.
CREATE TABLE IF NOT EXISTS public.portal_instance_secrets (
  instance_id        UUID PRIMARY KEY REFERENCES public.portal_instances(id) ON DELETE CASCADE,
  supabase_anon_key  TEXT,
  supabase_service_key TEXT,
  db_password        TEXT,
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 3. I passi della creazione ─────────────────────────────────────────────
-- Creare un'istanza dura minuti: si procede a passi, ognuno ripetibile senza
-- rifare quello che ha gia' funzionato.
CREATE TABLE IF NOT EXISTS public.portal_steps (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id   UUID NOT NULL REFERENCES public.portal_instances(id) ON DELETE CASCADE,
  ordine        INTEGER NOT NULL,
  chiave        TEXT NOT NULL,
  etichetta     TEXT NOT NULL,
  stato         TEXT NOT NULL DEFAULT 'in_attesa'
                CHECK (stato IN ('in_attesa','in_corso','riuscito','fallito','saltato')),
  tentativi     INTEGER NOT NULL DEFAULT 0,
  messaggio     TEXT,
  errore        TEXT,
  dati          JSONB NOT NULL DEFAULT '{}'::jsonb,
  iniziato_at   TIMESTAMPTZ,
  finito_at     TIMESTAMPTZ,
  durata_ms     INTEGER,
  UNIQUE (instance_id, chiave)
);
CREATE INDEX IF NOT EXISTS portal_steps_istanza_idx ON public.portal_steps (instance_id, ordine);

-- ── 4. Audit ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.portal_audit (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quando        TIMESTAMPTZ NOT NULL DEFAULT now(),
  attore        TEXT,
  automatico    BOOLEAN NOT NULL DEFAULT false,
  azione        TEXT NOT NULL,
  instance_id   UUID REFERENCES public.portal_instances(id) ON DELETE SET NULL,
  slug          TEXT,
  esito         TEXT NOT NULL DEFAULT 'ok',
  messaggio     TEXT,
  parametri     JSONB NOT NULL DEFAULT '{}'::jsonb,   -- gia' sanificato
  durata_ms     INTEGER
);
CREATE INDEX IF NOT EXISTS portal_audit_quando_idx ON public.portal_audit (quando DESC);

-- ── RLS ────────────────────────────────────────────────────────────────────
-- Lettura per chi e' in portal_admins. Nessuna scrittura dal browser: ogni
-- modifica passa dalle funzioni del portale, che registrano l'audit.
-- portal_instance_secrets non ha NESSUNA policy: irraggiungibile dal browser.
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['portal_admins','portal_instances','portal_steps','portal_audit'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_sel', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (public.portal_puo_operare())',
      t || '_sel', t);
  END LOOP;
END $$;

ALTER TABLE public.portal_instance_secrets ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.portal_instance_secrets IS
  'Chiavi delle istanze vendute. Nessuna policy: leggibile solo dal service role.';

-- ── Verifica ───────────────────────────────────────────────────────────────
SELECT table_name FROM information_schema.tables
 WHERE table_schema = 'public' AND table_name LIKE 'portal_%'
 ORDER BY table_name;
