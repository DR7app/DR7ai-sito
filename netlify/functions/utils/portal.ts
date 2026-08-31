// Portale istanze DR7 AI — fondamenta condivise.
//
// Tre cose: chi puo' operare, come si scrive nell'audit, e come si nasconde
// qualunque credenziale prima che finisca in un database o in un log.
import type { HandlerEvent, HandlerResponse } from '@netlify/functions'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export const PORTAL_URL = process.env.PORTAL_SUPABASE_URL || ''
const PORTAL_SERVICE = process.env.PORTAL_SUPABASE_SERVICE_ROLE_KEY || ''

/** Client del registro. Service role: le policy non lo riguardano. */
export function registro(): SupabaseClient {
  if (!PORTAL_URL || !PORTAL_SERVICE) {
    throw new Error('Registro non configurato: mancano PORTAL_SUPABASE_URL o PORTAL_SUPABASE_SERVICE_ROLE_KEY.')
  }
  return createClient(PORTAL_URL, PORTAL_SERVICE, { auth: { persistSession: false } })
}

/** Il registro e' raggiungibile? Serve a mostrare "migrazione da eseguire". */
export async function registroPronto(): Promise<{ pronto: boolean; motivo?: string }> {
  try {
    const { error } = await registro().from('portal_instances').select('id').limit(1)
    if (error) return { pronto: false, motivo: error.message }
    return { pronto: true }
  } catch (e) {
    return { pronto: false, motivo: (e as Error).message }
  }
}

// ── Intestazioni ───────────────────────────────────────────────────────────
export function intestazioni(origin?: string): Record<string, string> {
  const consentite = [
    'https://dr7ai.com', 'https://www.dr7ai.com',
    'http://localhost:5173', 'http://localhost:8888',
  ]
  const o = origin && consentite.includes(origin) ? origin : 'https://dr7ai.com'
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': o,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Cache-Control': 'no-store',
  }
}

export function risposta(statusCode: number, corpo: unknown, origin?: string): HandlerResponse {
  return { statusCode, headers: intestazioni(origin), body: JSON.stringify(corpo) }
}

// ── Chi sta chiamando ──────────────────────────────────────────────────────
export interface Operatore { email: string }

/**
 * Verifica il token dell'utente e che il suo indirizzo sia in portal_admins.
 * Due controlli distinti: essere autenticati non basta per creare un'azienda.
 */
export async function operatore(event: HandlerEvent): Promise<
  { ok: true; op: Operatore } | { ok: false; risposta: HandlerResponse }
> {
  const origin = event.headers.origin || event.headers.Origin
  const raw = event.headers.authorization || event.headers.Authorization || ''
  const token = raw.startsWith('Bearer ') ? raw.slice(7) : ''
  if (!token) {
    return { ok: false, risposta: risposta(401, { error: 'Accesso richiesto.' }, origin) }
  }

  const anon = process.env.PORTAL_SUPABASE_ANON_KEY || ''
  if (!PORTAL_URL || !anon) {
    return { ok: false, risposta: risposta(500, { error: 'Portale non configurato.' }, origin) }
  }

  const cliente = createClient(PORTAL_URL, anon, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
  const { data, error } = await cliente.auth.getUser(token)
  const email = (data?.user?.email || '').toLowerCase()
  if (error || !email) {
    return { ok: false, risposta: risposta(401, { error: 'Sessione non valida.' }, origin) }
  }

  const { data: riga } = await registro()
    .from('portal_admins').select('email').eq('email', email).eq('attivo', true).maybeSingle()
  if (!riga) {
    return { ok: false, risposta: risposta(403, { error: 'Questo indirizzo non e abilitato al portale.' }, origin) }
  }

  return { ok: true, op: { email } }
}

// ── Sanificazione ──────────────────────────────────────────────────────────
// Stessa regola del System Control: niente credenziali nel database, mai.
const CAMPI_SENSIBILI = /(key|token|secret|password|passwd|pwd|authorization|bearer|apikey|api_key|service_role|credential)/i
const VALORI_SENSIBILI: RegExp[] = [
  /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/,        // JWT
  /sbp_[A-Za-z0-9]{20,}/,                              // token Supabase
  /(ghp|gho|ghs|github_pat)_[A-Za-z0-9_]{20,}/,        // token GitHub
  /nfp_[A-Za-z0-9]{20,}/,                              // token Netlify
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
]

export function mascheraTesto(txt: string): string {
  if (!txt) return txt
  let out = String(txt)
  for (const r of VALORI_SENSIBILI) out = out.replace(new RegExp(r.source, 'g'), '[nascosto]')
  return out
}

export function sanifica(v: unknown, profondita = 0): unknown {
  if (profondita > 6) return '[troppo profondo]'
  if (v === null || v === undefined) return v
  if (typeof v === 'string') return mascheraTesto(v)
  if (typeof v !== 'object') return v
  if (Array.isArray(v)) return v.slice(0, 50).map(x => sanifica(x, profondita + 1))
  const out: Record<string, unknown> = {}
  for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
    out[k] = CAMPI_SENSIBILI.test(k) ? '[nascosto]' : sanifica(val, profondita + 1)
  }
  return out
}

/** Mostra solo la coda di una chiave, quel tanto che basta a riconoscerla. */
export function impronta(valore?: string | null): string {
  if (!valore) return 'assente'
  const s = String(valore)
  return s.length <= 8 ? '••••' : `••••${s.slice(-4)}`
}

// ── Audit ──────────────────────────────────────────────────────────────────
export async function registraAzione(a: {
  azione: string
  attore?: string | null
  automatico?: boolean
  instanceId?: string | null
  slug?: string | null
  esito?: 'ok' | 'errore'
  messaggio?: string
  parametri?: Record<string, unknown>
  durataMs?: number
}): Promise<void> {
  try {
    await registro().from('portal_audit').insert({
      azione: a.azione,
      attore: a.attore || null,
      automatico: !!a.automatico,
      instance_id: a.instanceId || null,
      slug: a.slug || null,
      esito: a.esito || 'ok',
      messaggio: a.messaggio ? mascheraTesto(a.messaggio).slice(0, 2000) : null,
      parametri: sanifica(a.parametri || {}) as Record<string, unknown>,
      durata_ms: a.durataMs ?? null,
    })
  } catch {
    // Un audit che fallisce non deve far fallire l'operazione.
  }
}

// ── Nome dell'azienda -> pezzo di indirizzo ────────────────────────────────
/** "Rent Cagliari S.r.l." -> "RENTCAGLIARI". Solo lettere, cifre e trattini. */
export function slugDaNome(nome: string): string {
  return (nome || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/\b(S\.?R\.?L\.?|S\.?P\.?A\.?|S\.?N\.?C\.?|S\.?A\.?S\.?|SOCIETA)\b/g, '')
    .replace(/[^A-Z0-9]+/g, '')
    .slice(0, 32)
}

export const SLUG_RISERVATI = new Set([
  'API', 'PORTALE', 'PORTAL', 'ADMIN', 'ASSETS', 'STATIC', 'PUBLIC', 'DOCS',
  'LOGIN', 'DEMO', 'PLATFORM', 'WWW', 'APP', 'NETLIFY', 'FAVICON', 'ROBOTS',
])
