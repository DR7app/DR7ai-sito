// dr7ai.com/NOMEAZIENDA — il proxy di frontiera.
//
// Ogni azienda ha il SUO sito e il SUO database. Qui non si mescola niente:
// si guarda la prima parte dell'indirizzo, si cerca l'azienda nel registro e
// si inoltra la richiesta al suo sito, togliendo il prefisso.
//
//   dr7ai.com/RENTCAGLIARI/assets/app.js  ->  sito-rentcagliari/assets/app.js
//
// Aggiungere un'azienda NON richiede di ripubblicare dr7ai.com: il registro
// viene riletto da solo. Se il nome non e' nel registro, la richiesta prosegue
// verso il sito vetrina come se questo proxy non esistesse.
import type { Context } from '@netlify/edge-functions'

// Prime parti dell'indirizzo che appartengono al sito vetrina.
const RISERVATI = new Set([
  '', 'assets', 'static', 'public', 'api', 'portale', 'portal', 'admin',
  'docs', 'login', 'favicon.ico', 'robots.txt', 'sitemap.xml', 'og-image.png',
  'dr7-logo.png', 'dr7-logo-full.png', 'dashboard.png', 'index.html',
])

interface Azienda { slug: string; netlify_url: string | null; stato: string }

let cache: { quando: number; aziende: Map<string, Azienda> } | null = null
const DURATA_CACHE_MS = 60_000

async function registro(): Promise<Map<string, Azienda>> {
  if (cache && Date.now() - cache.quando < DURATA_CACHE_MS) return cache.aziende

  const url = Deno.env.get('PORTAL_SUPABASE_URL')
  const chiave = Deno.env.get('PORTAL_SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !chiave) return new Map()

  try {
    const res = await fetch(
      `${url}/rest/v1/portal_instances?select=slug,netlify_url,stato&stato=in.(attiva,sospesa)`,
      { headers: { apikey: chiave, Authorization: `Bearer ${chiave}` } },
    )
    if (!res.ok) return cache?.aziende ?? new Map()
    const righe = (await res.json()) as Azienda[]
    const mappa = new Map<string, Azienda>()
    for (const r of righe) mappa.set(r.slug.toUpperCase(), r)
    cache = { quando: Date.now(), aziende: mappa }
    return mappa
  } catch {
    // Se il registro non risponde si tiene l'ultima copia buona: un'azienda
    // gia' aperta non deve chiudere perche' il portale ha avuto un singhiozzo.
    return cache?.aziende ?? new Map()
  }
}

function paginaSospesa(nome: string): Response {
  return new Response(
    `<!doctype html><html lang="it"><head><meta charset="utf-8">
     <meta name="viewport" content="width=device-width, initial-scale=1">
     <title>${nome} — servizio momentaneamente sospeso</title>
     <style>
       :root { color-scheme: dark }
       body { margin:0; min-height:100vh; display:grid; place-items:center;
              background:#0a0a0a; color:#e8e8e8;
              font:400 16px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif }
       .c { max-width:32rem; padding:2.5rem; text-align:center }
       h1 { font-size:1.35rem; font-weight:600; margin:0 0 .75rem }
       p { color:#a0a0a0; margin:0 }
     </style></head><body><div class="c">
     <h1>Servizio momentaneamente sospeso</h1>
     <p>L'accesso a questa piattaforma e temporaneamente non disponibile.
        I dati dell'azienda non sono stati modificati. Per informazioni, contattare l'assistenza.</p>
     </div></body></html>`,
    { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } },
  )
}

export default async function proxy(request: Request, context: Context): Promise<Response | void> {
  const url = new URL(request.url)
  const pezzi = url.pathname.split('/').filter(Boolean)
  const primo = (pezzi[0] || '').toLowerCase()

  if (!pezzi.length || RISERVATI.has(primo) || primo.startsWith('.')) return

  const aziende = await registro()
  const azienda = aziende.get(pezzi[0].toUpperCase())
  if (!azienda) return                      // non e' un'azienda: prosegue alla vetrina

  if (azienda.stato === 'sospesa') return paginaSospesa(pezzi[0])
  if (!azienda.netlify_url) return

  // Si toglie il prefisso: il sito dell'azienda vive alla sua radice.
  const resto = '/' + pezzi.slice(1).join('/')
  const destinazione = new URL(resto + url.search, azienda.netlify_url)

  const intestazioni = new Headers(request.headers)
  intestazioni.set('host', destinazione.host)
  intestazioni.set('X-Forwarded-Host', url.host)
  intestazioni.set('X-DR7-Azienda', azienda.slug)

  const risposta = await fetch(destinazione.toString(), {
    method: request.method,
    headers: intestazioni,
    body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
    redirect: 'manual',
  })

  // Un redirect del sito dell'azienda deve restare dentro dr7ai.com/SLUG.
  const luogo = risposta.headers.get('location')
  if (luogo) {
    const nuove = new Headers(risposta.headers)
    try {
      const l = new URL(luogo, azienda.netlify_url)
      nuove.set('location', `/${azienda.slug}${l.pathname}${l.search}`)
    } catch { /* location relativo: si lascia com'e' */ }
    return new Response(risposta.body, { status: risposta.status, headers: nuove })
  }

  return risposta
}

export const config = { path: '/*' }
