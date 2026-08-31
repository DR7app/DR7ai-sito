// dr7ai.com/portale — l'area da cui nasce l'istanza di una nuova azienda.
//
// Tre schermate: l'elenco delle aziende, la creazione, la scheda con
// l'avanzamento passo per passo.
import { useEffect, useState } from 'react'
import { supabase, configurato, chiama, type Istanza } from './cliente'
import Accesso from './Accesso'
import Elenco from './Elenco'
import Nuova from './Nuova'
import Scheda from './Scheda'

type Vista = { nome: 'elenco' } | { nome: 'nuova' } | { nome: 'scheda'; id: string }

export default function Portale() {
  const [pronto, setPronto] = useState(false)
  const [email, setEmail] = useState<string | null>(null)
  const [vista, setVista] = useState<Vista>({ nome: 'elenco' })
  const [istanze, setIstanze] = useState<Istanza[]>([])
  const [migrazioneMancante, setMigrazioneMancante] = useState<string | null>(null)
  const [stampoMancante, setStampoMancante] = useState<string | null>(null)
  const [errore, setErrore] = useState<string | null>(null)

  useEffect(() => {
    if (!configurato || !supabase) { setPronto(true); return }
    supabase.auth.getSession().then(({ data }) => {
      setEmail(data.session?.user?.email ?? null)
      setPronto(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setEmail(s?.user?.email ?? null))
    return () => sub.subscription.unsubscribe()
  }, [])

  async function ricarica() {
    try {
      const r = await chiama<{
        istanze: Istanza[]; migrazione_mancante?: boolean; messaggio?: string
        stampo?: { pronto: boolean; motivo?: string }
      }>('portal-instances')
      if (r.migrazione_mancante) { setMigrazioneMancante(r.messaggio || 'Registro non creato.'); return }
      setMigrazioneMancante(null)
      setStampoMancante(r.stampo && !r.stampo.pronto ? (r.stampo.motivo || 'Stampo non disponibile.') : null)
      setIstanze(r.istanze || [])
      setErrore(null)
    } catch (e) {
      setErrore((e as Error).message)
    }
  }

  useEffect(() => { if (email) ricarica() }, [email])

  if (!pronto) return <Centro>Caricamento...</Centro>

  if (!configurato) {
    return (
      <Centro>
        <p className="text-white/90 font-medium mb-2">Portale non configurato</p>
        <p className="text-white/50 text-sm max-w-md">
          Mancano <code className="text-white/70">VITE_PORTAL_SUPABASE_URL</code> e{' '}
          <code className="text-white/70">VITE_PORTAL_SUPABASE_ANON_KEY</code> fra le variabili del sito.
        </p>
      </Centro>
    )
  }

  if (!email) return <Accesso />

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <header className="border-b border-white/10">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between gap-4">
          <button onClick={() => setVista({ nome: 'elenco' })} className="flex items-center gap-3 group">
            <img src="/dr7-logo.png" alt="" className="h-7 w-auto" />
            <span className="text-sm font-medium text-white/70 group-hover:text-white transition-colors">
              Portale istanze
            </span>
          </button>
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/40 hidden sm:inline">{email}</span>
            <button
              onClick={() => supabase!.auth.signOut()}
              className="text-xs text-white/50 hover:text-white transition-colors px-3 py-1.5 rounded-lg border border-white/10"
            >
              Esci
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 py-8">
        {migrazioneMancante && (
          <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
            <p className="text-sm text-amber-200 font-medium">Registro non ancora creato</p>
            <p className="text-xs text-amber-200/70 mt-1">{migrazioneMancante}</p>
          </div>
        )}
        {stampoMancante && (
          <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
            <p className="text-sm text-amber-200 font-medium">Stampo della piattaforma non disponibile</p>
            <p className="text-xs text-amber-200/70 mt-1">
              {stampoMancante} Finche manca non si possono creare aziende. Ripubblica dr7ai.com con{' '}
              <code>SUPABASE_ACCESS_TOKEN</code> e <code>SUPABASE_PROD_REF</code> fra le variabili del sito.
            </p>
          </div>
        )}
        {errore && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
            <p className="text-sm text-red-200">{errore}</p>
          </div>
        )}

        {vista.nome === 'elenco' && (
          <Elenco
            istanze={istanze}
            onNuova={() => setVista({ nome: 'nuova' })}
            onApri={id => setVista({ nome: 'scheda', id })}
            onRicarica={ricarica}
          />
        )}
        {vista.nome === 'nuova' && (
          <Nuova
            istanzeEsistenti={istanze}
            onAnnulla={() => setVista({ nome: 'elenco' })}
            onCreata={async id => { await ricarica(); setVista({ nome: 'scheda', id }) }}
          />
        )}
        {vista.nome === 'scheda' && (
          <Scheda id={vista.id} onIndietro={() => { ricarica(); setVista({ nome: 'elenco' }) }} />
        )}
      </main>
    </div>
  )
}

function Centro({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white grid place-items-center px-5">
      <div className="text-center">{children}</div>
    </div>
  )
}
