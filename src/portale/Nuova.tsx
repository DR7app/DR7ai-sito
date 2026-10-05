// Creazione di un'azienda.
//
// Si scrive il nome, e l'indirizzo dr7ai.com/NOME si compone da solo. Serve
// anche l'indirizzo del titolare, perche' e' lui a ricevere l'accesso e a
// prendere il posto della direzione DR7 dentro il gestionale.
import { useMemo, useState } from 'react'
import { chiama, type Istanza } from './cliente'

const RISERVATI = new Set([
  'API', 'PORTALE', 'PORTAL', 'ADMIN', 'ASSETS', 'STATIC', 'PUBLIC', 'DOCS',
  'LOGIN', 'DEMO', 'PLATFORM', 'WWW', 'APP', 'NETLIFY', 'FAVICON', 'ROBOTS',
])

/** Stessa regola del server: se cambia una, cambia l'altra. */
function slugDaNome(nome: string): string {
  return (nome || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/\b(S\.?R\.?L\.?|S\.?P\.?A\.?|S\.?N\.?C\.?|S\.?A\.?S\.?|SOCIETA)\b/g, '')
    .replace(/[^A-Z0-9]+/g, '')
    .slice(0, 32)
}

const REGIONI = [
  { id: 'eu-west-1',    label: 'Irlanda (eu-west-1)' },
  { id: 'eu-central-1', label: 'Francoforte (eu-central-1)' },
  { id: 'eu-west-2',    label: 'Londra (eu-west-2)' },
  { id: 'eu-west-3',    label: 'Parigi (eu-west-3)' },
]

export default function Nuova({
  istanzeEsistenti, onAnnulla, onCreata,
}: {
  istanzeEsistenti: Istanza[]
  onAnnulla: () => void
  onCreata: (id: string) => void
}) {
  const [ragione, setRagione] = useState('')
  const [slugManuale, setSlugManuale] = useState('')
  const [email, setEmail] = useState('')
  const [telefono, setTelefono] = useState('')
  const [piva, setPiva] = useState('')
  const [citta, setCitta] = useState('')
  const [regione, setRegione] = useState('eu-west-1')
  const [note, setNote] = useState('')
  const [attesa, setAttesa] = useState(false)
  const [errore, setErrore] = useState<string | null>(null)

  const slug = (slugManuale || slugDaNome(ragione)).toUpperCase()

  const problema = useMemo(() => {
    if (!ragione.trim()) return null
    if (slug.length < 3) return 'Il nome e troppo corto per ricavarne un indirizzo.'
    if (!/^[A-Z0-9][A-Z0-9-]{1,30}[A-Z0-9]$/.test(slug)) return 'Solo lettere, cifre e trattini.'
    if (RISERVATI.has(slug)) return `"${slug}" e riservato al sito.`
    if (istanzeEsistenti.some(i => i.slug === slug)) return `dr7ai.com/${slug} e gia assegnato.`
    return null
  }, [slug, ragione, istanzeEsistenti])

  async function crea(e: React.FormEvent) {
    e.preventDefault()
    if (problema) return
    setAttesa(true); setErrore(null)
    try {
      const r = await chiama<{ istanza: Istanza }>('portal-instances', {
        metodo: 'POST',
        corpo: {
          ragione_sociale: ragione.trim(),
          slug,
          email_titolare: email.trim().toLowerCase(),
          telefono_titolare: telefono.trim(),
          partita_iva: piva.trim(),
          citta: citta.trim(),
          note: note.trim(),
          regione,
        },
      })
      onCreata(r.istanza.id)
    } catch (err) {
      setErrore((err as Error).message)
      setAttesa(false)
    }
  }

  return (
    <div>
      <button onClick={onAnnulla} className="text-xs text-white/40 hover:text-white/70 mb-6 transition-colors">
        ← Torna all elenco
      </button>

      <h1 className="text-xl font-display font-normal mb-1">Nuova azienda</h1>
      <p className="text-sm text-white/40 mb-8 max-w-2xl leading-relaxed">
        Viene creata una copia completa della piattaforma: stessa struttura, stessi automatismi,
        nessun dato di altre aziende. Database, sito e accesso del titolare nascono da soli.
      </p>

      <form onSubmit={crea} className="max-w-2xl space-y-5">
        <Campo etichetta="Nome dell azienda" obbligatorio>
          <input
            value={ragione} onChange={e => setRagione(e.target.value)} required autoFocus
            placeholder="Es. Autonoleggio Sardo S.r.l."
            className={input}
          />
        </Campo>

        {/* L'indirizzo si vede mentre si scrive: nessuna sorpresa dopo. */}
        {ragione.trim() && (
          <div className={`rounded-xl border px-4 py-3 ${problema ? 'border-red-500/30 bg-red-500/10' : 'border-white/10 bg-white/5'}`}>
            <p className="text-xs text-white/40 mb-1">Indirizzo dell azienda</p>
            <p className={`text-sm font-mono ${problema ? 'text-red-300' : 'text-white'}`}>
              dr7ai.com/{slug || '…'}
            </p>
            {problema && <p className="text-xs text-red-300/80 mt-1.5">{problema}</p>}
          </div>
        )}

        <Campo etichetta="Indirizzo diverso (facoltativo)">
          <input
            value={slugManuale} onChange={e => setSlugManuale(e.target.value.toUpperCase())}
            placeholder={slugDaNome(ragione) || 'NOMEAZIENDA'}
            className={`${input} font-mono`}
          />
        </Campo>

        <div className="h-px bg-white/10" />

        <Campo etichetta="E-mail del titolare" obbligatorio
               aiuto="Riceve l accesso da direzione. Prende il posto degli indirizzi DR7 dentro la piattaforma.">
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className={input} />
        </Campo>

        <div className="grid sm:grid-cols-2 gap-5">
          <Campo etichetta="Telefono"><input value={telefono} onChange={e => setTelefono(e.target.value)} className={input} /></Campo>
          <Campo etichetta="Partita IVA"><input value={piva} onChange={e => setPiva(e.target.value)} className={input} /></Campo>
          <Campo etichetta="Citta"><input value={citta} onChange={e => setCitta(e.target.value)} className={input} /></Campo>
          <Campo etichetta="Dove tenere i dati">
            <select value={regione} onChange={e => setRegione(e.target.value)} className={input}>
              {REGIONI.map(r => <option key={r.id} value={r.id} className="bg-[#141414]">{r.label}</option>)}
            </select>
          </Campo>
        </div>

        <Campo etichetta="Note"><textarea value={note} onChange={e => setNote(e.target.value)} rows={2} className={input} /></Campo>

        {errore && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
            <p className="text-sm text-red-200">{errore}</p>
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit" disabled={attesa || !!problema || !ragione.trim() || !email.trim()}
            className="px-5 py-2.5 rounded-xl bg-white text-black text-sm font-medium
                       hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {attesa ? 'Creazione avviata...' : 'Crea l azienda'}
          </button>
          <button type="button" onClick={onAnnulla} className="text-sm text-white/40 hover:text-white/70 transition-colors">
            Annulla
          </button>
        </div>

        <p className="text-xs text-white/30 leading-relaxed pt-2">
          La creazione dura qualche minuto e prosegue anche se chiudi questa pagina.
          Puoi seguirla passo per passo dalla scheda dell azienda.
        </p>
      </form>
    </div>
  )
}

const input =
  'w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white ' +
  'placeholder:text-white/25 focus:outline-none focus:border-white/30 transition-colors'

function Campo({ etichetta, obbligatorio, aiuto, children }: {
  etichetta: string; obbligatorio?: boolean; aiuto?: string; children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-xs text-white/50 mb-1.5">
        {etichetta}{obbligatorio && <span className="text-white/30"> ·  obbligatorio</span>}
      </label>
      {children}
      {aiuto && <p className="text-xs text-white/30 mt-1.5 leading-relaxed">{aiuto}</p>}
    </div>
  )
}
