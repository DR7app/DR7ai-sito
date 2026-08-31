// Portale — accesso e chiamate.
//
// La chiave usata qui e' la chiave PUBBLICA del progetto portale: da sola non
// apre niente. Chi puo' davvero operare lo decide il server, controllando
// l'indirizzo in portal_admins a ogni chiamata.
import { createClient } from '@supabase/supabase-js'

const URL = import.meta.env.VITE_PORTAL_SUPABASE_URL as string | undefined
const ANON = import.meta.env.VITE_PORTAL_SUPABASE_ANON_KEY as string | undefined

export const configurato = Boolean(URL && ANON)

export const supabase = configurato
  ? createClient(URL!, ANON!)
  : null

const BASE = '/.netlify/functions'

export async function chiama<T = any>(
  funzione: string,
  opzioni: { metodo?: string; corpo?: unknown; query?: Record<string, string> } = {},
): Promise<T> {
  if (!supabase) throw new Error('Portale non configurato.')
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token
  if (!token) throw new Error('Sessione scaduta: rientra.')

  const q = opzioni.query ? '?' + new URLSearchParams(opzioni.query).toString() : ''
  const res = await fetch(`${BASE}/${funzione}${q}`, {
    method: opzioni.metodo || 'GET',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: opzioni.corpo === undefined ? undefined : JSON.stringify(opzioni.corpo),
  })
  const testo = await res.text()
  const dati = testo.trim() ? JSON.parse(testo) : {}
  if (!res.ok) throw new Error(dati.error || `Errore ${res.status}`)
  return dati as T
}

// ── Tipi ───────────────────────────────────────────────────────────────────
export type StatoIstanza = 'da_creare' | 'in_creazione' | 'attiva' | 'sospesa' | 'errore' | 'archiviata'

export interface Istanza {
  id: string
  slug: string
  ragione_sociale: string
  email_titolare: string
  telefono_titolare?: string | null
  partita_iva?: string | null
  citta?: string | null
  note?: string | null
  stato: StatoIstanza
  supabase_ref?: string | null
  supabase_url?: string | null
  supabase_regione?: string
  netlify_site_id?: string | null
  netlify_url?: string | null
  schema_istruzioni?: number | null
  schema_versione?: string | null
  creata_da?: string | null
  created_at: string
  attivata_at?: string | null
  sospesa_motivo?: string | null
}

export interface Passo {
  chiave: string
  etichetta: string
  ordine: number
  stato: 'in_attesa' | 'in_corso' | 'riuscito' | 'fallito' | 'saltato'
  tentativi: number
  messaggio?: string | null
  errore?: string | null
  dati?: Record<string, unknown>
  durata_ms?: number | null
}

export interface RigaAudit {
  id: string
  quando: string
  attore?: string | null
  automatico: boolean
  azione: string
  esito: string
  messaggio?: string | null
  durata_ms?: number | null
}

// ── Formati europei: 24 ore, giorno/mese/anno ──────────────────────────────
export function quando(iso?: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('it-IT', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  })
}

export function durata(ms?: number | null): string {
  if (!ms && ms !== 0) return ''
  if (ms < 1000) return `${ms} ms`
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)} s`
  return `${Math.floor(ms / 60_000)} min ${Math.round((ms % 60_000) / 1000)} s`
}
