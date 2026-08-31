// Le aziende a cui e' stata consegnata una copia della piattaforma.
import { quando, type Istanza, type StatoIstanza } from './cliente'

const STATI: Record<StatoIstanza, { label: string; classe: string }> = {
  da_creare:    { label: 'In coda',       classe: 'text-white/50 border-white/15' },
  in_creazione: { label: 'In creazione',  classe: 'text-sky-300 border-sky-400/30 bg-sky-400/10' },
  attiva:       { label: 'Attiva',        classe: 'text-emerald-300 border-emerald-400/30 bg-emerald-400/10' },
  sospesa:      { label: 'Sospesa',       classe: 'text-amber-300 border-amber-400/30 bg-amber-400/10' },
  errore:       { label: 'Da rivedere',   classe: 'text-red-300 border-red-400/30 bg-red-400/10' },
  archiviata:   { label: 'Archiviata',    classe: 'text-white/30 border-white/10' },
}

export function Stato({ stato }: { stato: StatoIstanza }) {
  const s = STATI[stato] || STATI.da_creare
  return <span className={`inline-block px-2 py-0.5 rounded-md border text-xs ${s.classe}`}>{s.label}</span>
}

export default function Elenco({
  istanze, onNuova, onApri, onRicarica,
}: {
  istanze: Istanza[]
  onNuova: () => void
  onApri: (id: string) => void
  onRicarica: () => void
}) {
  const attive = istanze.filter(i => i.stato === 'attiva').length
  const inCorso = istanze.filter(i => ['da_creare', 'in_creazione'].includes(i.stato)).length
  const daRivedere = istanze.filter(i => i.stato === 'errore').length

  return (
    <div>
      <div className="flex items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-xl font-medium mb-1">Aziende</h1>
          <p className="text-sm text-white/40">
            {istanze.length === 0 ? 'Nessuna azienda creata.' : (
              <>
                {attive} attive
                {inCorso > 0 && <> · {inCorso} in creazione</>}
                {daRivedere > 0 && <> · <span className="text-red-300">{daRivedere} da rivedere</span></>}
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onRicarica}
            className="px-3 py-2 rounded-xl border border-white/10 text-xs text-white/50 hover:text-white transition-colors">
            Aggiorna
          </button>
          <button onClick={onNuova}
            className="px-4 py-2 rounded-xl bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors">
            Nuova azienda
          </button>
        </div>
      </div>

      {istanze.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-6 py-12 text-center">
          <p className="text-sm text-white/60 mb-1.5">Nessuna azienda</p>
          <p className="text-xs text-white/35 max-w-sm mx-auto leading-relaxed">
            Scrivi il nome di un azienda e la sua piattaforma nasce da sola: database, sito,
            configurazione di partenza e accesso del titolare.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02]">
                  <Th>Azienda</Th><Th>Indirizzo</Th><Th>Titolare</Th><Th>Stato</Th><Th>Creata</Th>
                </tr>
              </thead>
              <tbody>
                {istanze.map(i => (
                  <tr key={i.id} onClick={() => onApri(i.id)}
                      className="border-b border-white/5 last:border-0 hover:bg-white/[0.03] cursor-pointer transition-colors">
                    <Td>
                      <span className="text-white">{i.ragione_sociale}</span>
                      {i.citta && <span className="text-white/30 text-xs block">{i.citta}</span>}
                    </Td>
                    <Td><span className="font-mono text-xs text-white/60">dr7ai.com/{i.slug}</span></Td>
                    <Td><span className="text-white/50 text-xs">{i.email_titolare}</span></Td>
                    <Td><Stato stato={i.stato} /></Td>
                    <Td><span className="text-white/35 text-xs">{quando(i.created_at)}</span></Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left px-4 py-2.5 text-xs font-medium text-white/40">{children}</th>
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3 align-top">{children}</td>
}
