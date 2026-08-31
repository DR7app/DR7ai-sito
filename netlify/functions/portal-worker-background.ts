// Portale istanze — l'operaio che esegue i passi.
//
// Funzione "background": Netlify le concede fino a 15 minuti. Quando il tempo
// sta per finire si ferma di sua iniziativa e lascia il lavoro dov'e': il
// giro successivo riprende dal primo passo non ancora riuscito.
//
// Nessun passo viene rieseguito se e' gia' riuscito. E' la stessa regola
// anti-doppione del System Control: ripetere non deve mai raddoppiare.
import type { Handler } from '@netlify/functions'
import { registro, registraAzione, mascheraTesto } from './utils/portal'
import { PASSI, type Contesto } from './utils/passi'

const BUDGET_MS = 13 * 60 * 1000   // si lascia margine sui 15 minuti concessi

async function lavora(instanceId: string): Promise<void> {
  const t0 = Date.now()
  const tempoResiduoMs = () => BUDGET_MS - (Date.now() - t0)
  const db = registro()

  const { data: istanza } = await db.from('portal_instances').select('*').eq('id', instanceId).maybeSingle()
  if (!istanza) return
  if (['attiva', 'archiviata'].includes(istanza.stato)) return

  await db.from('portal_instances').update({ stato: 'in_creazione', updated_at: new Date().toISOString() }).eq('id', instanceId)

  const { data: segretiRiga } = await db.from('portal_instance_secrets').select('*').eq('instance_id', instanceId).maybeSingle()
  const segreti: Record<string, any> = { ...(segretiRiga || {}) }
  let corrente: Record<string, any> = { ...istanza }

  for (const passo of PASSI) {
    const { data: riga } = await db.from('portal_steps')
      .select('*').eq('instance_id', instanceId).eq('chiave', passo.chiave).maybeSingle()
    if (riga?.stato === 'riuscito' || riga?.stato === 'saltato') continue

    if (tempoResiduoMs() < 30_000) return   // il cron richiamera'

    const inizio = Date.now()
    await db.from('portal_steps').update({
      stato: 'in_corso', tentativi: (riga?.tentativi || 0) + 1,
      iniziato_at: new Date().toISOString(), errore: null,
    }).eq('instance_id', instanceId).eq('chiave', passo.chiave)

    const ctx: Contesto = {
      istanza: corrente,
      segreti,
      tempoResiduoMs,
      nota: async (msg: string) => {
        await db.from('portal_steps').update({ messaggio: msg })
          .eq('instance_id', instanceId).eq('chiave', passo.chiave)
      },
    }

    try {
      const esito = await passo.esegui(ctx)

      if (esito.istanza && Object.keys(esito.istanza).length) {
        await db.from('portal_instances')
          .update({ ...esito.istanza, updated_at: new Date().toISOString() }).eq('id', instanceId)
        corrente = { ...corrente, ...esito.istanza }
      }
      if (esito.segreti && Object.keys(esito.segreti).length) {
        await db.from('portal_instance_secrets')
          .upsert({ instance_id: instanceId, ...esito.segreti, updated_at: new Date().toISOString() },
                  { onConflict: 'instance_id' })
        Object.assign(segreti, esito.segreti)
      }

      await db.from('portal_steps').update({
        stato: 'riuscito', messaggio: esito.messaggio, errore: null,
        dati: esito.dati || {}, finito_at: new Date().toISOString(), durata_ms: Date.now() - inizio,
      }).eq('instance_id', instanceId).eq('chiave', passo.chiave)

      await registraAzione({
        azione: `passo:${passo.chiave}`, automatico: true, instanceId, slug: corrente.slug,
        esito: 'ok', messaggio: esito.messaggio, durataMs: Date.now() - inizio,
      })
    } catch (err) {
      const messaggio = mascheraTesto((err as Error)?.message || String(err))

      // "IN_ATTESA" non e' un fallimento: e' un passo che ha bisogno di piu'
      // tempo (il database che parte, la compilazione che gira). Torna in
      // attesa e il giro successivo lo riprende.
      const inAttesa = messaggio.startsWith('IN_ATTESA')
      await db.from('portal_steps').update({
        stato: inAttesa ? 'in_attesa' : 'fallito',
        messaggio: inAttesa ? messaggio.replace('IN_ATTESA:', '').trim() : riga?.messaggio || null,
        errore: inAttesa ? null : messaggio.slice(0, 2000),
        finito_at: new Date().toISOString(), durata_ms: Date.now() - inizio,
      }).eq('instance_id', instanceId).eq('chiave', passo.chiave)

      if (!inAttesa) {
        await db.from('portal_instances')
          .update({ stato: 'errore', updated_at: new Date().toISOString() }).eq('id', instanceId)
        await registraAzione({
          azione: `passo:${passo.chiave}`, automatico: true, instanceId, slug: corrente.slug,
          esito: 'errore', messaggio, durataMs: Date.now() - inizio,
        })
      }
      return   // ci si ferma al primo intoppo: non si prosegue su basi incerte
    }
  }

  // Tutti i passi riusciti.
  const { data: mancanti } = await db.from('portal_steps')
    .select('chiave').eq('instance_id', instanceId).neq('stato', 'riuscito')
  if (!mancanti || !mancanti.length) {
    await db.from('portal_instances').update({
      stato: 'attiva', attivata_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }).eq('id', instanceId)
    await registraAzione({
      azione: 'istanza_attiva', automatico: true, instanceId, slug: corrente.slug,
      messaggio: `https://dr7ai.com/${corrente.slug} e attivo.`,
    })
  }
}

const handler: Handler = async (event) => {
  let instanceId = ''
  try { instanceId = JSON.parse(event.body || '{}').instanceId || '' } catch { /* corpo vuoto */ }

  if (instanceId) {
    await lavora(instanceId)
    return { statusCode: 200, body: JSON.stringify({ ok: true }) }
  }

  // Senza id: si riprendono tutte le aziende rimaste a meta'.
  const { data } = await registro().from('portal_instances')
    .select('id').in('stato', ['da_creare', 'in_creazione']).order('created_at').limit(3)
  for (const r of data || []) await lavora(r.id)
  return { statusCode: 200, body: JSON.stringify({ ok: true, riprese: (data || []).length }) }
}

export { handler }
