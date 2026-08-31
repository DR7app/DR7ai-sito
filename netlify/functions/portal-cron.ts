// Portale istanze — il richiamo periodico.
//
// Creare un'azienda richiede piu' giri: il database ci mette minuti a
// partire, la compilazione altrettanto. Questo cron rimette al lavoro
// l'operaio finche' non ha finito. Non fa nulla se non c'e' niente in corso.
import type { Handler } from '@netlify/functions'
import { registro } from './utils/portal'

const handler: Handler = async () => {
  // Portale non ancora configurato: il cron non ha niente da fare, senza errori.
  if (!process.env.PORTAL_SUPABASE_URL || !process.env.PORTAL_SUPABASE_SERVICE_ROLE_KEY) {
    return { statusCode: 200, body: JSON.stringify({ saltato: true, motivo: 'registro non configurato' }) }
  }
  const { data, error } = await registro().from('portal_instances')
    .select('id, slug').in('stato', ['da_creare', 'in_creazione']).order('created_at').limit(3)
  if (error) return { statusCode: 200, body: JSON.stringify({ saltato: true, motivo: error.message }) }
  if (!data?.length) return { statusCode: 200, body: JSON.stringify({ niente_da_fare: true }) }

  const base = process.env.URL || 'https://dr7ai.com'
  for (const r of data) {
    // Funzione background: risponde subito 202 e continua per conto suo.
    await fetch(`${base}/.netlify/functions/portal-worker-background`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instanceId: r.id }),
    }).catch(() => { /* il prossimo giro riprova */ })
  }
  return { statusCode: 200, body: JSON.stringify({ riprese: data.map(r => r.slug) }) }
}

export { handler }
