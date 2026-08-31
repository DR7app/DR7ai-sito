// API Netlify — creazione del sito di un'azienda, variabili d'ambiente e
// avvio della compilazione.
import { mascheraTesto } from './portal'

const BASE = 'https://api.netlify.com/api/v1'

function token(): string {
  const t = process.env.NETLIFY_API_TOKEN || ''
  if (!t) throw new Error('Manca NETLIFY_API_TOKEN: il portale non puo creare siti.')
  return t
}

async function chiama<T>(metodo: string, percorso: string, corpo?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${percorso}`, {
    method: metodo,
    headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  })
  const testo = await res.text()
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${mascheraTesto(testo).slice(0, 500)}`)
  return (testo.trim() ? JSON.parse(testo) : {}) as T
}

export interface Sito { id: string; name: string; ssl_url?: string; url?: string; admin_url?: string }

export async function siti(): Promise<Sito[]> {
  return chiama<Sito[]>('GET', '/sites')
}

export async function sitoPerNome(nome: string): Promise<Sito | null> {
  const tutti = await siti()
  return tutti.find(s => s.name === nome) || null
}

/**
 * Crea il sito dell'azienda collegato al repository del gestionale.
 * Il ramo e' sempre lo stesso: e' la stessa base di codice per tutti, sono i
 * dati a essere separati.
 */
export async function creaSito(p: {
  nome: string; accountSlug?: string; repo?: { provider: string; repoPath: string; branch: string; cmd: string; dir: string; funzioni: string }
}): Promise<Sito> {
  const corpo: Record<string, unknown> = { name: p.nome }
  if (p.repo) {
    corpo.repo = {
      provider: p.repo.provider,
      repo_path: p.repo.repoPath,
      repo_branch: p.repo.branch,
      cmd: p.repo.cmd,
      dir: p.repo.dir,
      functions_dir: p.repo.funzioni,
      private_logs: true,
    }
  }
  const percorso = p.accountSlug ? `/${p.accountSlug}/sites` : '/sites'
  return chiama<Sito>('POST', percorso, corpo)
}

/** Scrive le variabili d'ambiente del sito. I valori non tornano mai indietro. */
export async function impostaVariabili(accountId: string, siteId: string, vars: Record<string, string>): Promise<void> {
  const payload = Object.entries(vars).map(([key, value]) => ({
    key,
    scopes: ['builds', 'functions', 'runtime', 'post-processing'],
    values: [{ context: 'all', value }],
  }))
  await chiama('POST', `/accounts/${accountId}/env?site_id=${siteId}`, payload)
}

export async function account(): Promise<{ id: string; slug: string; name: string }[]> {
  return chiama('GET', '/accounts')
}

/** Avvia una compilazione: e' quella che congela le variabili nel pacchetto. */
export async function avviaBuild(siteId: string): Promise<{ id: string; state: string }> {
  return chiama('POST', `/sites/${siteId}/builds`)
}

export async function ultimoDeploy(siteId: string): Promise<{ id: string; state: string; error_message?: string } | null> {
  const d = await chiama<{ id: string; state: string; error_message?: string }[]>('GET', `/sites/${siteId}/deploys?per_page=1`)
  return d[0] || null
}
