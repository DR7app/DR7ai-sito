// Portale istanze — elenco, scheda e creazione di un'azienda.
import type { Handler } from '@netlify/functions'
import { operatore, registro, registroPronto, risposta, registraAzione, slugDaNome, SLUG_RISERVATI } from './utils/portal'
import { registraPassi, PASSI, stampoDisponibile } from './utils/passi'

const handler: Handler = async (event) => {
  const origin = event.headers.origin || event.headers.Origin
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: {}, body: '' }

  const auth = await operatore(event)
  if (!auth.ok) return auth.risposta
  const { op } = auth

  const pronto = await registroPronto()
  if (!pronto.pronto) {
    return risposta(200, {
      migrazione_mancante: true,
      messaggio: 'Registro non ancora creato: esegui supabase/migrations/20260831_portal.sql nel progetto del portale.',
      dettaglio: pronto.motivo,
    }, origin)
  }

  const db = registro()

  // ── Scheda di una azienda ────────────────────────────────────────────────
  if (event.httpMethod === 'GET' && event.queryStringParameters?.id) {
    const id = event.queryStringParameters.id
    const { data: istanza } = await db.from('portal_instances').select('*').eq('id', id).maybeSingle()
    if (!istanza) return risposta(404, { error: 'Azienda non trovata.' }, origin)
    const { data: passi } = await db.from('portal_steps').select('*').eq('instance_id', id).order('ordine')
    const { data: audit } = await db.from('portal_audit').select('*').eq('instance_id', id).order('quando', { ascending: false }).limit(50)
    // Le chiavi non escono di qui: si dice solo se ci sono.
    const { data: segreti } = await db.from('portal_instance_secrets').select('instance_id').eq('instance_id', id).maybeSingle()
    return risposta(200, { istanza, passi: passi || [], audit: audit || [], chiavi_presenti: !!segreti }, origin)
  }

  // ── Elenco ───────────────────────────────────────────────────────────────
  if (event.httpMethod === 'GET') {
    const { data } = await db.from('portal_instances')
      .select('id, slug, ragione_sociale, email_titolare, citta, stato, netlify_url, supabase_ref, created_at, attivata_at')
      .order('created_at', { ascending: false })
    return risposta(200, {
      istanze: data || [],
      passi_previsti: PASSI.map(p => ({ chiave: p.chiave, etichetta: p.etichetta })),
      stampo: stampoDisponibile(),
    }, origin)
  }

  // ── Creazione ────────────────────────────────────────────────────────────
  if (event.httpMethod === 'POST') {
    let b: Record<string, string> = {}
    try { b = JSON.parse(event.body || '{}') } catch { /* corpo non valido */ }

    const ragione = (b.ragione_sociale || '').trim()
    const email = (b.email_titolare || '').trim().toLowerCase()
    if (!ragione) return risposta(400, { error: 'Manca la ragione sociale.' }, origin)
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return risposta(400, { error: 'Indirizzo del titolare non valido.' }, origin)

    const slug = (b.slug || slugDaNome(ragione)).toUpperCase()
    if (!/^[A-Z0-9][A-Z0-9-]{1,30}[A-Z0-9]$/.test(slug)) {
      return risposta(400, { error: `Indirizzo "${slug}" non valido: da 3 a 32 caratteri, lettere, cifre e trattini.` }, origin)
    }
    if (SLUG_RISERVATI.has(slug)) {
      return risposta(400, { error: `"${slug}" e riservato al sito: scegline un altro.` }, origin)
    }
    const { data: gia } = await db.from('portal_instances').select('id').eq('slug', slug).maybeSingle()
    if (gia) return risposta(409, { error: `dr7ai.com/${slug} e gia assegnato.` }, origin)

    // Senza lo stampo della piattaforma non si comincia nemmeno: meglio un
    // rifiuto chiaro adesso che un'azienda ferma a meta' fra dieci minuti.
    const stampo = stampoDisponibile()
    if (!stampo.pronto) {
      return risposta(503, {
        error: `Stampo della piattaforma non disponibile: ${stampo.motivo} Ripubblica dr7ai.com con SUPABASE_ACCESS_TOKEN e SUPABASE_PROD_REF impostati.`,
      }, origin)
    }

    const { data: creata, error } = await db.from('portal_instances').insert({
      slug,
      ragione_sociale: ragione,
      email_titolare: email,
      telefono_titolare: (b.telefono_titolare || '').trim() || null,
      partita_iva: (b.partita_iva || '').trim() || null,
      citta: (b.citta || '').trim() || null,
      note: (b.note || '').trim() || null,
      supabase_regione: b.regione || 'eu-west-1',
      creata_da: op.email,
      stato: 'da_creare',
    }).select().single()
    if (error) return risposta(500, { error: error.message }, origin)

    await registraPassi(creata.id)
    await registraAzione({
      azione: 'azienda_creata', attore: op.email, instanceId: creata.id, slug,
      messaggio: `${ragione} — dr7ai.com/${slug}`,
      parametri: { email_titolare: email, regione: creata.supabase_regione },
    })

    // Si avvia subito: l'operaio lavora in sottofondo, il cron lo richiama.
    const base = process.env.URL || 'https://dr7ai.com'
    fetch(`${base}/.netlify/functions/portal-worker-background`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instanceId: creata.id }),
    }).catch(() => { /* il cron riprendera' */ })

    return risposta(201, { istanza: creata }, origin)
  }

  return risposta(405, { error: 'Metodo non consentito.' }, origin)
}

export { handler }
