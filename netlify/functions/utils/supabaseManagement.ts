// API Management di Supabase — creazione del progetto di un'azienda e
// applicazione dello schema.
//
// Il token vive solo qui, lato server, preso dalle variabili d'ambiente.
// Non viene mai restituito a una pagina ne' scritto in un log.
import { mascheraTesto } from './portal'

const BASE = 'https://api.supabase.com/v1'

function token(): string {
  const t = process.env.SUPABASE_ACCESS_TOKEN || ''
  if (!t) throw new Error('Manca SUPABASE_ACCESS_TOKEN: il portale non puo creare progetti.')
  return t
}

async function chiama<T>(metodo: string, percorso: string, corpo?: unknown, tentativi = 3): Promise<T> {
  let ultimo = ''
  for (let i = 0; i < tentativi; i++) {
    const res = await fetch(`${BASE}${percorso}`, {
      method: metodo,
      headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
    })
    const testo = await res.text()
    if (res.ok) return (testo.trim() ? JSON.parse(testo) : {}) as T
    ultimo = `HTTP ${res.status} — ${mascheraTesto(testo).slice(0, 500)}`
    // Solo gli errori temporanei si ritentano: un 400 non migliora insistendo.
    if (![429, 500, 502, 503, 504].includes(res.status)) break
    await new Promise(r => setTimeout(r, 2000 * (i + 1)))
  }
  throw new Error(ultimo)
}

export interface Organizzazione { id: string; name: string }
export interface Progetto {
  id: string; ref?: string; name: string; region: string; status: string
  database?: { host: string; version: string }
}

export async function organizzazioni(): Promise<Organizzazione[]> {
  return chiama<Organizzazione[]>('GET', '/organizations')
}

export async function progetti(): Promise<Progetto[]> {
  return chiama<Progetto[]>('GET', '/projects')
}

export async function creaProgetto(p: {
  nome: string; organizzazione: string; password: string; regione: string; piano?: string
}): Promise<Progetto> {
  return chiama<Progetto>('POST', '/projects', {
    name: p.nome,
    organization_id: p.organizzazione,
    db_pass: p.password,
    region: p.regione,
    plan: p.piano || 'free',
  })
}

export async function progetto(ref: string): Promise<Progetto> {
  return chiama<Progetto>('GET', `/projects/${ref}`)
}

/** Il progetto e' pronto a ricevere lo schema? */
export async function progettoAttivo(ref: string): Promise<boolean> {
  try {
    const p = await progetto(ref)
    return String(p.status).toUpperCase() === 'ACTIVE_HEALTHY'
  } catch {
    return false
  }
}

export interface ChiaviProgetto { anon: string; service: string }

export async function chiavi(ref: string): Promise<ChiaviProgetto> {
  const elenco = await chiama<{ name: string; api_key: string }[]>('GET', `/projects/${ref}/api-keys`)
  const trova = (n: string) => elenco.find(k => k.name === n)?.api_key || ''
  const anon = trova('anon')
  const service = trova('service_role')
  if (!anon || !service) throw new Error('Chiavi del progetto non ancora disponibili.')
  return { anon, service }
}

/** Esegue SQL sul progetto. Usato solo per applicare lo schema, mai dati. */
export async function esegui(ref: string, sql: string): Promise<unknown> {
  return chiama('POST', `/projects/${ref}/database/query`, { query: sql }, 3)
}

export function urlProgetto(ref: string): string {
  return `https://${ref}.supabase.co`
}

/** Password del database: casuale, mai scelta a mano, mai mostrata. */
export function passwordCasuale(lunghezza = 32): string {
  const alfabeto = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
  const buf = new Uint32Array(lunghezza)
  crypto.getRandomValues(buf)
  return Array.from(buf, n => alfabeto[n % alfabeto.length]).join('')
}
