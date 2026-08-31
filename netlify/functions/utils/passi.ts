// Portale istanze — i passi che creano l'azienda, uno per volta.
//
// Creare un'istanza dura minuti: non si fa in una sola chiamata. Ogni passo
// e' indipendente, ripetibile e sa riconoscere il lavoro gia' fatto, cosi'
// un'interruzione non lascia mai un'azienda a meta'.
//
// Regola che non si tocca: nessun passo copia dati di clienti. Si copia la
// STRUTTURA della piattaforma e la CONFIGURAZIONE minima perche' funzioni.
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import { createClient } from '@supabase/supabase-js'
import { registro, registraAzione, mascheraTesto } from './portal'
import * as sb from './supabaseManagement'
import * as nl from './netlifyApi'

// ── Dove stanno lo schema e la configurazione di partenza ──────────────────
function cartellaSchema(): string {
  for (const p of [
    path.resolve(process.cwd(), 'schema'),
    path.resolve(__dirname, '../../../schema'),
    path.resolve(__dirname, '../../schema'),
  ]) {
    if (fs.existsSync(path.join(p, 'statements.json'))) return p
  }
  throw new Error('Schema non trovato: manca schema/statements.json nel pacchetto della funzione.')
}

/** Lo stampo e' arrivato nel pacchetto? Senza, non si crea niente. */
export function stampoDisponibile(): { pronto: boolean; motivo?: string } {
  try {
    const c = cartellaSchema()
    const mancanti = ['statements.json', 'configurazione.json', 'identita.json']
      .filter(f => !fs.existsSync(path.join(c, f)))
    if (mancanti.length) return { pronto: false, motivo: `Mancano ${mancanti.join(' e ')}.` }
    return { pronto: true }
  } catch (e) {
    return { pronto: false, motivo: (e as Error).message }
  }
}

let _statements: [number, string][] | null = null
export function statements(): [number, string][] {
  if (!_statements) {
    _statements = JSON.parse(fs.readFileSync(path.join(cartellaSchema(), 'statements.json'), 'utf-8'))
  }
  return _statements!
}

let _config: Record<string, Record<string, unknown>[]> | null = null
function configurazione(): Record<string, Record<string, unknown>[]> {
  if (!_config) {
    _config = JSON.parse(fs.readFileSync(path.join(cartellaSchema(), 'configurazione.json'), 'utf-8'))
  }
  return _config!
}

function enti(): Record<string, unknown>[] {
  const f = path.join(cartellaSchema(), 'enti_notificatori.json.gz')
  if (!fs.existsSync(f)) return []
  return JSON.parse(zlib.gunzipSync(fs.readFileSync(f)).toString('utf-8'))
}

// ── Identita' DR7 da NON lasciare nell'istanza di un'altra azienda ─────────
//
// L'elenco NON e' scritto qui: questo repository e' pubblico e non deve
// contenere nessun recapito reale. Viene ricavato dalla produzione da
// scripts/schema/aggiorna.py, che cerca indirizzi, numeri e partita IVA
// dentro funzioni, policy e modelli di messaggio. Un recapito nuovo aggiunto
// in produzione viene quindi ripulito da solo.
interface Identita { email: string[]; telefono: string[]; piva: string[] }

let _identita: Identita | null = null
export function identita(): Identita {
  if (!_identita) {
    const f = path.join(cartellaSchema(), 'identita.json')
    _identita = fs.existsSync(f)
      ? JSON.parse(fs.readFileSync(f, 'utf-8'))
      : { email: [], telefono: [], piva: [] }
  }
  return _identita!
}

function scappa(v: string): string {
  return v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export interface DatiAzienda {
  slug: string
  ragione_sociale: string
  email_titolare: string
  telefono_titolare?: string | null
  partita_iva?: string | null
}

/** Toglie l'identita' DR7 da un testo e ci mette quella dell'azienda. */
export function riscriviTesto(testo: string, a: DatiAzienda): string {
  const id = identita()
  let out = testo
  // Prima i recapiti piu' lunghi: cosi' "333 123 4567" non viene spezzato
  // da una regola piu' corta che ne coglie solo un pezzo.
  for (const v of [...id.email].sort((x, y) => y.length - x.length)) {
    out = out.replace(new RegExp(scappa(v), 'gi'), a.email_titolare)
  }
  for (const v of [...id.telefono].sort((x, y) => y.length - x.length)) {
    out = out.replace(new RegExp(scappa(v), 'g'), a.telefono_titolare || '')
  }
  for (const v of id.piva) {
    out = out.replace(new RegExp(scappa(v), 'g'), a.partita_iva || '')
  }
  // Il nome commerciale: solo nei testi che il cliente finale legge.
  return out.replace(/\bDR7 A\.I\.?\b/g, a.ragione_sociale)
            .replace(/\bDR7\b/g, a.ragione_sociale)
}

/** Conta le menzioni DR7 rimaste in un oggetto: finiscono nel rapporto finale. */
function menzioniRimaste(v: unknown): number {
  return (JSON.stringify(v || '').match(/DR7/g) || []).length
}

// ── Utilita' ───────────────────────────────────────────────────────────────
function lit(v: string): string {
  return "'" + String(v).replace(/'/g, "''") + "'"
}

/** Inserisce righe in una tabella del progetto nuovo, a blocchi. */
async function inserisci(
  ref: string, tabella: string, righe: Record<string, unknown>[], blocco = 300
): Promise<number> {
  let fatte = 0
  for (let i = 0; i < righe.length; i += blocco) {
    const parte = righe.slice(i, i + blocco)
    const payload = lit(JSON.stringify(parte))
    await sb.esegui(ref, `
      insert into public.${tabella}
      select * from jsonb_populate_recordset(null::public.${tabella}, ${payload}::jsonb)
      on conflict do nothing;`)
    fatte += parte.length
  }
  return fatte
}

// ── Il contratto di un passo ───────────────────────────────────────────────
export interface Contesto {
  istanza: Record<string, any>
  segreti: Record<string, any>
  /** Tempo residuo prima che la funzione venga interrotta. */
  tempoResiduoMs: () => number
  nota: (msg: string) => Promise<void>
}

export interface Passo {
  chiave: string
  etichetta: string
  /** Restituisce i campi da salvare sull'istanza, piu' un messaggio. */
  esegui: (c: Contesto) => Promise<{ messaggio: string; istanza?: Record<string, unknown>; segreti?: Record<string, unknown>; dati?: Record<string, unknown> }>
}

export const PASSI: Passo[] = [
  // ── 1 ─────────────────────────────────────────────────────────────────────
  {
    chiave: 'crea_progetto',
    etichetta: 'Crea il database dell azienda',
    async esegui(c) {
      if (c.istanza.supabase_ref) {
        return { messaggio: `Database gia esistente (${c.istanza.supabase_ref}).` }
      }
      const org = process.env.SUPABASE_ORG_ID
      if (!org) throw new Error('Manca SUPABASE_ORG_ID.')

      // Se un progetto con lo stesso nome esiste gia', lo si riprende invece
      // di crearne un secondo: due database per la stessa azienda sarebbero
      // un disastro silenzioso.
      const nome = `dr7-${c.istanza.slug.toLowerCase()}`
      const esistente = (await sb.progetti()).find(p => p.name === nome)
      if (esistente) {
        const ref = esistente.id || esistente.ref!
        return {
          messaggio: `Ripreso il progetto gia esistente ${nome}.`,
          istanza: { supabase_ref: ref, supabase_url: sb.urlProgetto(ref) },
        }
      }

      const password = sb.passwordCasuale()
      const p = await sb.creaProgetto({
        nome,
        organizzazione: org,
        password,
        regione: c.istanza.supabase_regione || 'eu-west-1',
        piano: process.env.SUPABASE_PLAN || 'free',
      })
      const ref = p.id || p.ref!
      return {
        messaggio: `Database creato: ${nome} (${c.istanza.supabase_regione}).`,
        istanza: { supabase_ref: ref, supabase_url: sb.urlProgetto(ref) },
        segreti: { db_password: password },
      }
    },
  },

  // ── 2 ─────────────────────────────────────────────────────────────────────
  {
    chiave: 'attendi_progetto',
    etichetta: 'Aspetta che il database sia pronto',
    async esegui(c) {
      const ref = c.istanza.supabase_ref
      if (!ref) throw new Error('Database non ancora creato.')
      while (c.tempoResiduoMs() > 45_000) {
        if (await sb.progettoAttivo(ref)) return { messaggio: 'Database pronto.' }
        await new Promise(r => setTimeout(r, 10_000))
      }
      // Non e' un errore: il prossimo giro riprende da qui.
      throw new Error('IN_ATTESA: il database sta ancora partendo.')
    },
  },

  // ── 3 ─────────────────────────────────────────────────────────────────────
  {
    chiave: 'leggi_chiavi',
    etichetta: 'Recupera le chiavi del database',
    async esegui(c) {
      const k = await sb.chiavi(c.istanza.supabase_ref)
      return {
        messaggio: 'Chiavi recuperate e messe al sicuro.',
        segreti: { supabase_anon_key: k.anon, supabase_service_key: k.service },
      }
    },
  },

  // ── 4 ─────────────────────────────────────────────────────────────────────
  {
    chiave: 'applica_schema',
    etichetta: 'Ricrea la struttura della piattaforma',
    async esegui(c) {
      const ref = c.istanza.supabase_ref
      const a = c.istanza as DatiAzienda
      const tutte = statements()

      // Le tre funzioni/policy che hanno gli indirizzi DR7 scritti dentro
      // diventano quelle del titolare: altrimenti l'azienda comprerebbe un
      // gestionale in cui la direzione e' ancora DR7.
      const indirizziDR7 = identita().email
      const preparata = (sql: string) => {
        let s = sql
        for (const v of indirizziDR7) {
          s = s.replace(new RegExp(`'${scappa(v)}'`, 'gi'), lit(a.email_titolare.toLowerCase()))
        }
        return s
      }

      const FASI = [1,2,3,4,5,6,7,8,9,10,11,12,13]
      const NOMI: Record<number,string> = {1:'estensioni',2:'enum',3:'sequenze',4:'tabelle',5:'vincoli',
        6:'funzioni',7:'chiavi esterne',8:'indici',9:'viste',10:'trigger',11:'sicurezza',12:'permessi',13:'archivio file'}

      let ok = 0
      const falliti: { sql: string; errore: string }[] = []
      const BLOCCO = 40

      for (const fase of FASI) {
        const items = tutte.filter(([f]) => f === fase).map(([, s]) => preparata(s))
        for (let i = 0; i < items.length; i += BLOCCO) {
          if (c.tempoResiduoMs() < 60_000) {
            throw new Error(`IN_ATTESA: struttura applicata al ${Math.round(100 * ok / tutte.length)}%, si riprende al prossimo giro.`)
          }
          const batch = items.slice(i, i + BLOCCO)
          try {
            await sb.esegui(ref, batch.join(';\n') + ';')
            ok += batch.length
          } catch {
            // Il blocco e' saltato: si riprova una per una per isolare.
            for (const s of batch) {
              try { await sb.esegui(ref, s + ';'); ok++ }
              catch (e) { falliti.push({ sql: s.slice(0, 300), errore: mascheraTesto((e as Error).message).slice(0, 300) }) }
            }
          }
        }
        await c.nota(`${NOMI[fase]}: ${ok}/${tutte.length}`)
      }

      // Molti errori sono solo di ordine: tre passate di recupero.
      let restano = falliti
      for (let giro = 0; giro < 3 && restano.length; giro++) {
        const ancora: typeof restano = []
        for (const f of restano) {
          try { await sb.esegui(ref, f.sql + ';'); ok++ }
          catch (e) { ancora.push({ ...f, errore: mascheraTesto((e as Error).message).slice(0, 300) }) }
        }
        if (ancora.length === restano.length) { restano = ancora; break }
        restano = ancora
      }

      if (restano.length > tutte.length * 0.02) {
        throw new Error(`Struttura incompleta: ${restano.length} istruzioni su ${tutte.length} non applicate.`)
      }

      return {
        messaggio: `Struttura ricreata: ${ok} istruzioni su ${tutte.length}${restano.length ? `, ${restano.length} da rivedere` : ''}.`,
        istanza: { schema_istruzioni: ok, schema_versione: new Date().toISOString().slice(0, 10) },
        dati: { non_applicate: restano.slice(0, 40) },
      }
    },
  },

  // ── 5 ─────────────────────────────────────────────────────────────────────
  {
    chiave: 'configurazione_base',
    etichetta: 'Imposta la configurazione di partenza',
    async esegui(c) {
      const ref = c.istanza.supabase_ref
      const a = c.istanza as DatiAzienda
      const cfg = configurazione()
      let rimaste = 0

      // Messaggi: si riscrive solo il TESTO. message_key e label restano
      // identici, il gestionale ci instrada sopra gli invii.
      const messaggi = (cfg.system_messages || []).map(m => {
        const r = { ...m } as Record<string, unknown>
        for (const campo of ['message_body', 'email_subject', 'description']) {
          if (typeof r[campo] === 'string') r[campo] = riscriviTesto(r[campo] as string, a)
        }
        // I numeri interni DR7 non devono ricevere i messaggi dell'azienda.
        r.recipient_phones = null
        r.cron_approved = false          // nessun invio automatico prima del via
        rimaste += menzioniRimaste(r.message_body)
        return r
      })

      const impostazioni = (cfg.app_settings || []).map(s => ({
        ...s,
        value: typeof s.value === 'string' ? riscriviTesto(s.value as string, a) : s.value,
      }))

      // La Centralina resta com'e': prezzi, fasce e chiavi tecniche. I nomi
      // commerciali si cambiano dal gestionale, non a colpi di sostituzione.
      const centralina = cfg.centralina_pro_config || []
      rimaste += menzioniRimaste(centralina)

      const n1 = await inserisci(ref, 'system_messages', messaggi, 40)
      const n2 = await inserisci(ref, 'app_settings', impostazioni)
      const n3 = await inserisci(ref, 'centralina_pro_config', centralina, 2)

      // La numerazione delle fatture riparte da zero: e' un'azienda nuova.
      await sb.esegui(ref, `
        delete from public.invoice_sequences;
        insert into public.invoice_sequences (anno, ultimo_numero)
        values (extract(year from now())::int, 0)
        on conflict do nothing;`).catch(() => { /* tabella con altre colonne: si lascia vuota */ })

      return {
        messaggio: `Configurazione pronta: ${n1} messaggi, ${n2} impostazioni, ${n3} centraline.`,
        dati: { menzioni_dr7_da_rivedere: rimaste },
      }
    },
  },

  // ── 6 ─────────────────────────────────────────────────────────────────────
  {
    chiave: 'enti_notificatori',
    etichetta: 'Carica l elenco degli enti per le multe',
    async esegui(c) {
      const righe = enti()
      if (!righe.length) return { messaggio: 'Elenco enti non incluso: si potra caricare dopo.' }
      const n = await inserisci(c.istanza.supabase_ref, 'enti_notificatori', righe, 2000)
      return { messaggio: `${n} enti caricati.` }
    },
  },

  // ── 7 ─────────────────────────────────────────────────────────────────────
  {
    chiave: 'crea_titolare',
    etichetta: 'Crea l accesso del titolare',
    async esegui(c) {
      const url = c.istanza.supabase_url
      const service = c.segreti.supabase_service_key
      if (!service) throw new Error('Chiave di servizio non disponibile.')
      const admin = createClient(url, service, { auth: { persistSession: false } })
      const email = String(c.istanza.email_titolare).toLowerCase()

      // La password non viene mai scelta, mostrata ne' salvata: e' casuale e
      // resta ignota a tutti. Il titolare entra con il link di accesso che si
      // genera a richiesta dalla scheda ("Link di accesso"), che vale una
      // volta sola e non viene registrato da nessuna parte.
      const password = sb.passwordCasuale(32)

      let userId = ''
      const { data, error } = await admin.auth.admin.createUser({
        email, password, email_confirm: true,
      })
      if (error && !/already/i.test(error.message)) throw new Error(error.message)
      if (data?.user?.id) {
        userId = data.user.id
      } else {
        const { data: elenco } = await admin.auth.admin.listUsers()
        userId = elenco?.users.find(u => (u.email || '').toLowerCase() === email)?.id || ''
      }
      if (!userId) throw new Error('Utente non creato.')

      // Senza la scheda in `admins` il login riesce e il gestionale rifiuta
      // l'ingresso, senza spiegare perche'. E' il passo che non si salta.
      const { error: e2 } = await admin.from('admins').upsert({
        user_id: userId,
        email,
        name: c.istanza.ragione_sociale,
        role: 'superadmin',
        permissions: ['role:direzione', 'role:developer'],
        archived_at: null,
      }, { onConflict: 'email' })
      if (e2) throw new Error(`Scheda operatore non creata: ${e2.message}`)

      return {
        messaggio: `Accesso creato per ${email}. Genera il link dalla scheda per consegnarlo al titolare.`,
        dati: { utente: userId },
      }
    },
  },

  // ── 8 ─────────────────────────────────────────────────────────────────────
  {
    chiave: 'crea_sito',
    etichetta: 'Crea il sito dell azienda',
    async esegui(c) {
      if (c.istanza.netlify_site_id) return { messaggio: 'Sito gia esistente.' }
      const nome = `dr7-${c.istanza.slug.toLowerCase()}`
      const gia = await nl.sitoPerNome(nome)
      if (gia) {
        return { messaggio: `Ripreso il sito gia esistente ${nome}.`,
                 istanza: { netlify_site_id: gia.id, netlify_url: gia.ssl_url || gia.url } }
      }
      const repo = process.env.GESTIONALE_REPO           // es. DR7app/DR7-AI
      const conti = await nl.account()
      const slugConto = process.env.NETLIFY_ACCOUNT_SLUG || conti[0]?.slug
      const s = await nl.creaSito({
        nome,
        accountSlug: slugConto,
        repo: repo ? {
          provider: 'github', repoPath: repo,
          branch: process.env.GESTIONALE_BRANCH || 'main',
          cmd: 'npm run build', dir: 'dist', funzioni: 'netlify/functions',
        } : undefined,
      })
      return { messaggio: `Sito creato: ${s.name}.`,
               istanza: { netlify_site_id: s.id, netlify_url: s.ssl_url || s.url } }
    },
  },

  // ── 9 ─────────────────────────────────────────────────────────────────────
  {
    chiave: 'imposta_variabili',
    etichetta: 'Collega il sito al suo database',
    async esegui(c) {
      const conti = await nl.account()
      const contoId = process.env.NETLIFY_ACCOUNT_ID || conti[0]?.id
      if (!contoId) throw new Error('Account Netlify non determinato.')
      await nl.impostaVariabili(contoId, c.istanza.netlify_site_id, {
        VITE_SUPABASE_URL: c.istanza.supabase_url,
        VITE_SUPABASE_ANON_KEY: c.segreti.supabase_anon_key,
        SUPABASE_SERVICE_ROLE_KEY: c.segreti.supabase_service_key,
        // L'indirizzo e' dr7ai.com/SLUG: il pacchetto deve saperlo prima di
        // essere compilato, altrimenti cerca i suoi file nella radice.
        VITE_BASE_PATH: `/${c.istanza.slug}/`,
        VITE_AZIENDA: c.istanza.ragione_sociale,
        DEMO_MODE: 'false',
      })
      return { messaggio: 'Variabili impostate. Nessuna chiave e passata dal browser.' }
    },
  },

  // ── 10 ────────────────────────────────────────────────────────────────────
  {
    chiave: 'compila_sito',
    etichetta: 'Compila e pubblica',
    async esegui(c) {
      const b = await nl.avviaBuild(c.istanza.netlify_site_id)
      return { messaggio: 'Compilazione avviata.', dati: { build: b.id } }
    },
  },

  // ── 11 ────────────────────────────────────────────────────────────────────
  {
    chiave: 'attendi_pubblicazione',
    etichetta: 'Aspetta la pubblicazione',
    async esegui(c) {
      while (c.tempoResiduoMs() > 45_000) {
        const d = await nl.ultimoDeploy(c.istanza.netlify_site_id)
        if (d && ['ready', 'current'].includes(String(d.state))) return { messaggio: 'Sito pubblicato.' }
        if (d && String(d.state) === 'error') throw new Error(`Compilazione fallita: ${mascheraTesto(d.error_message || '')}`)
        await new Promise(r => setTimeout(r, 15_000))
      }
      throw new Error('IN_ATTESA: compilazione ancora in corso.')
    },
  },

  // ── 12 ────────────────────────────────────────────────────────────────────
  {
    chiave: 'apri_indirizzo',
    etichetta: 'Apri dr7ai.com/SLUG',
    async esegui(c) {
      // Nessun deploy da rifare: il proxy di frontiera legge il registro a
      // ogni richiesta, quindi basta che l'azienda risulti attiva.
      await registro().from('portal_instances')
        .update({ stato: 'attiva', attivata_at: new Date().toISOString() })
        .eq('id', c.istanza.id)
      return { messaggio: `Indirizzo attivo: https://dr7ai.com/${c.istanza.slug}` }
    },
  },
]

export async function registraPassi(instanceId: string): Promise<void> {
  const righe = PASSI.map((p, i) => ({
    instance_id: instanceId, ordine: i + 1, chiave: p.chiave, etichetta: p.etichetta,
  }))
  await registro().from('portal_steps').upsert(righe, { onConflict: 'instance_id,chiave' })
  await registraAzione({ azione: 'passi_preparati', instanceId, messaggio: `${righe.length} passi in coda.` })
}
