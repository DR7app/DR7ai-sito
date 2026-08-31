// Portale istanze — le azioni che si possono fare a mano.
//
// Nessuna e' distruttiva: non si cancellano progetti, non si svuotano
// database. Sospendere chiude l'indirizzo, non tocca i dati dell'azienda.
import type { Handler } from '@netlify/functions'
import { operatore, registro, risposta, registraAzione, mascheraTesto, impronta } from './utils/portal'
import { createClient } from '@supabase/supabase-js'
import * as sb from './utils/supabaseManagement'
import * as nl from './utils/netlifyApi'

const AZIONI = new Set([
  'riprendi',            // rimette al lavoro l'operaio
  'ripeti_passo',        // riporta un passo in attesa e riparte
  'sospendi',            // chiude dr7ai.com/SLUG, i dati restano
  'riattiva',
  'verifica',            // controlla che database e sito rispondano davvero
  'link_accesso',        // genera il link una volta sola, non lo registra
])

const handler: Handler = async (event) => {
  const origin = event.headers.origin || event.headers.Origin
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: {}, body: '' }
  if (event.httpMethod !== 'POST') return risposta(405, { error: 'Metodo non consentito.' }, origin)

  const auth = await operatore(event)
  if (!auth.ok) return auth.risposta
  const { op } = auth

  let b: Record<string, string> = {}
  try { b = JSON.parse(event.body || '{}') } catch { /* corpo non valido */ }
  const azione = b.azione || ''
  const id = b.instanceId || ''
  if (!AZIONI.has(azione)) return risposta(400, { error: `Azione "${azione}" non prevista.` }, origin)
  if (!id) return risposta(400, { error: 'Manca l azienda.' }, origin)

  const db = registro()
  const { data: istanza } = await db.from('portal_instances').select('*').eq('id', id).maybeSingle()
  if (!istanza) return risposta(404, { error: 'Azienda non trovata.' }, origin)

  const t0 = Date.now()
  const base = process.env.URL || 'https://dr7ai.com'

  try {
    switch (azione) {
      case 'riprendi': {
        await db.from('portal_instances').update({ stato: 'in_creazione' }).eq('id', id)
        fetch(`${base}/.netlify/functions/portal-worker-background`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ instanceId: id }),
        }).catch(() => { /* il cron riprendera' */ })
        await registraAzione({ azione: 'riprendi', attore: op.email, instanceId: id, slug: istanza.slug,
          messaggio: 'Creazione ripresa.', durataMs: Date.now() - t0 })
        return risposta(200, { ok: true, messaggio: 'Ripreso. I passi gia riusciti non vengono rifatti.' }, origin)
      }

      case 'ripeti_passo': {
        const chiave = b.passo || ''
        if (!chiave) return risposta(400, { error: 'Manca il passo.' }, origin)
        await db.from('portal_steps').update({ stato: 'in_attesa', errore: null })
          .eq('instance_id', id).eq('chiave', chiave)
        await db.from('portal_instances').update({ stato: 'in_creazione' }).eq('id', id)
        fetch(`${base}/.netlify/functions/portal-worker-background`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ instanceId: id }),
        }).catch(() => { /* il cron riprendera' */ })
        await registraAzione({ azione: 'ripeti_passo', attore: op.email, instanceId: id, slug: istanza.slug,
          messaggio: `Passo "${chiave}" rimesso in coda.`, parametri: { passo: chiave }, durataMs: Date.now() - t0 })
        return risposta(200, { ok: true, messaggio: `Passo "${chiave}" rimesso in coda.` }, origin)
      }

      case 'sospendi': {
        const motivo = (b.motivo || '').trim() || 'Sospensione richiesta dal portale.'
        await db.from('portal_instances').update({ stato: 'sospesa', sospesa_motivo: motivo }).eq('id', id)
        await registraAzione({ azione: 'sospendi', attore: op.email, instanceId: id, slug: istanza.slug,
          messaggio: motivo, durataMs: Date.now() - t0 })
        return risposta(200, { ok: true, messaggio: `dr7ai.com/${istanza.slug} non risponde piu. I dati dell azienda restano dove sono.` }, origin)
      }

      case 'riattiva': {
        await db.from('portal_instances').update({ stato: 'attiva', sospesa_motivo: null }).eq('id', id)
        await registraAzione({ azione: 'riattiva', attore: op.email, instanceId: id, slug: istanza.slug,
          messaggio: 'Indirizzo riaperto.', durataMs: Date.now() - t0 })
        return risposta(200, { ok: true, messaggio: `dr7ai.com/${istanza.slug} e di nuovo raggiungibile.` }, origin)
      }

      case 'link_accesso': {
        // Il link vale una volta sola e porta il titolare a scegliere la sua
        // password. Non viene salvato: ne' qui, ne' nell'audit, ne' nei log.
        const { data: seg } = await db.from('portal_instance_secrets')
          .select('supabase_service_key').eq('instance_id', id).maybeSingle()
        if (!seg?.supabase_service_key) return risposta(400, { error: 'Chiavi dell azienda non disponibili.' }, origin)
        if (!istanza.supabase_url) return risposta(400, { error: 'Database non ancora creato.' }, origin)

        const admin = createClient(istanza.supabase_url, seg.supabase_service_key, { auth: { persistSession: false } })
        const { data: link, error: e } = await admin.auth.admin.generateLink({
          type: 'recovery',
          email: String(istanza.email_titolare).toLowerCase(),
        })
        if (e) return risposta(500, { error: mascheraTesto(e.message) }, origin)

        await registraAzione({ azione: 'link_accesso', attore: op.email, instanceId: id, slug: istanza.slug,
          messaggio: `Link di accesso generato per ${istanza.email_titolare}.`, durataMs: Date.now() - t0 })
        return risposta(200, {
          ok: true,
          link: link?.properties?.action_link || null,
          avviso: 'Vale una volta sola. Non viene salvato: se lo perdi, generane un altro.',
        }, origin)
      }

      case 'verifica': {
        const esiti: Record<string, string> = {}

        if (istanza.supabase_ref) {
          try {
            const r = await sb.esegui(istanza.supabase_ref,
              "select count(*)::int as tabelle from information_schema.tables where table_schema = 'public'")
            const n = (r as { tabelle: number }[])[0]?.tabelle ?? 0
            esiti.database = `${n} tabelle presenti.`
          } catch (e) { esiti.database = `Non risponde: ${mascheraTesto((e as Error).message).slice(0, 200)}` }
        } else esiti.database = 'Non ancora creato.'

        if (istanza.netlify_site_id) {
          try {
            const d = await nl.ultimoDeploy(istanza.netlify_site_id)
            esiti.sito = d ? `Ultima pubblicazione: ${d.state}.` : 'Nessuna pubblicazione.'
          } catch (e) { esiti.sito = `Non raggiungibile: ${mascheraTesto((e as Error).message).slice(0, 200)}` }
        } else esiti.sito = 'Non ancora creato.'

        if (istanza.netlify_url) {
          try {
            const res = await fetch(istanza.netlify_url, { method: 'GET' })
            esiti.indirizzo = `Risponde ${res.status}.`
          } catch { esiti.indirizzo = 'Non risponde.' }
        }

        const { data: seg } = await db.from('portal_instance_secrets').select('supabase_anon_key').eq('instance_id', id).maybeSingle()
        esiti.chiavi = seg?.supabase_anon_key ? `Presenti (${impronta(seg.supabase_anon_key)}).` : 'Mancanti.'

        await registraAzione({ azione: 'verifica', attore: op.email, instanceId: id, slug: istanza.slug,
          messaggio: Object.values(esiti).join(' '), durataMs: Date.now() - t0 })
        return risposta(200, { ok: true, esiti }, origin)
      }
    }
  } catch (err) {
    const messaggio = mascheraTesto((err as Error)?.message || String(err))
    await registraAzione({ azione, attore: op.email, instanceId: id, slug: istanza.slug,
      esito: 'errore', messaggio, durataMs: Date.now() - t0 })
    return risposta(500, { error: messaggio }, origin)
  }

  return risposta(400, { error: 'Azione non gestita.' }, origin)
}

export { handler }
