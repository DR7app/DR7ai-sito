// La scheda di un azienda: a che punto e la creazione, cosa e andato storto,
// e le poche azioni che si possono fare a mano. Nessuna e distruttiva.
import { useCallback, useEffect, useState } from 'react'
import { chiama, quando, durata, type Istanza, type Passo, type RigaAudit } from './cliente'
import { Stato } from './Elenco'

interface Risposta {
  istanza: Istanza
  passi: Passo[]
  audit: RigaAudit[]
  chiavi_presenti: boolean
}

const SEGNI: Record<Passo['stato'], { segno: string; classe: string }> = {
  riuscito:  { segno: '✓', classe: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10' },
  in_corso:  { segno: '⟳', classe: 'text-sky-400 border-sky-400/30 bg-sky-400/10 animate-pulse' },
  in_attesa: { segno: '·', classe: 'text-white/30 border-white/15' },
  fallito:   { segno: '!', classe: 'text-red-400 border-red-400/30 bg-red-400/10' },
  saltato:   { segno: '–', classe: 'text-white/25 border-white/10' },
}

export default function Scheda({ id, onIndietro }: { id: string; onIndietro: () => void }) {
  const [d, setD] = useState<Risposta | null>(null)
  const [errore, setErrore] = useState<string | null>(null)
  const [occupato, setOccupato] = useState<string | null>(null)
  const [messaggio, setMessaggio] = useState<string | null>(null)
  const [link, setLink] = useState<string | null>(null)
  const [verifiche, setVerifiche] = useState<Record<string, string> | null>(null)

  const carica = useCallback(async () => {
    try { setD(await chiama<Risposta>('portal-instances', { query: { id } })); setErrore(null) }
    catch (e) { setErrore((e as Error).message) }
  }, [id])

  useEffect(() => { carica() }, [carica])

  // Finche' la creazione e in corso la scheda si aggiorna da sola.
  useEffect(() => {
    if (!d) return
    if (!['da_creare', 'in_creazione'].includes(d.istanza.stato)) return
    const t = setInterval(carica, 5000)
    return () => clearInterval(t)
  }, [d, carica])

  async function azione(nome: string, extra: Record<string, string> = {}) {
    setOccupato(nome); setMessaggio(null); setLink(null); setVerifiche(null)
    try {
      const r = await chiama<any>('portal-actions', {
        metodo: 'POST', corpo: { azione: nome, instanceId: id, ...extra },
      })
      if (r.link) setLink(r.link)
      if (r.esiti) setVerifiche(r.esiti)
      if (r.messaggio) setMessaggio(r.messaggio)
      await carica()
    } catch (e) { setErrore((e as Error).message) }
    setOccupato(null)
  }

  if (errore && !d) return <p className="text-sm text-red-300">{errore}</p>
  if (!d) return <p className="text-sm text-white/40">Caricamento...</p>

  const { istanza, passi } = d
  const fatti = passi.filter(p => p.stato === 'riuscito').length
  const bloccato = passi.find(p => p.stato === 'fallito')
  const inCorso = ['da_creare', 'in_creazione'].includes(istanza.stato)

  return (
    <div>
      <button onClick={onIndietro} className="text-xs text-white/40 hover:text-white/70 mb-6 transition-colors">
        ← Torna all elenco
      </button>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <h1 className="text-xl font-medium">{istanza.ragione_sociale}</h1>
            <Stato stato={istanza.stato} />
          </div>
          <a href={`/${istanza.slug}`} target="_blank" rel="noreferrer"
             className="text-sm font-mono text-white/50 hover:text-white transition-colors">
            dr7ai.com/{istanza.slug} ↗
          </a>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(istanza.stato === 'errore' || inCorso) && (
            <Bottone onClick={() => azione('riprendi')} occupato={occupato === 'riprendi'} principale>
              Riprendi
            </Bottone>
          )}
          {istanza.stato === 'attiva' && (
            <>
              <Bottone onClick={() => azione('link_accesso')} occupato={occupato === 'link_accesso'} principale>
                Link di accesso
              </Bottone>
              <Bottone onClick={() => azione('sospendi')} occupato={occupato === 'sospendi'}>Sospendi</Bottone>
            </>
          )}
          {istanza.stato === 'sospesa' && (
            <Bottone onClick={() => azione('riattiva')} occupato={occupato === 'riattiva'} principale>Riattiva</Bottone>
          )}
          <Bottone onClick={() => azione('verifica')} occupato={occupato === 'verifica'}>Verifica</Bottone>
        </div>
      </div>

      {messaggio && <Avviso tono="neutro">{messaggio}</Avviso>}
      {errore && <Avviso tono="errore">{errore}</Avviso>}

      {link && (
        <Avviso tono="ok">
          <p className="font-medium mb-1.5">Link di accesso per {istanza.email_titolare}</p>
          <p className="text-xs opacity-70 mb-2">Vale una volta sola e non viene salvato: se lo perdi, generane un altro.</p>
          <input readOnly value={link} onFocus={e => e.currentTarget.select()}
                 className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-xs font-mono" />
        </Avviso>
      )}

      {verifiche && (
        <Avviso tono="neutro">
          {Object.entries(verifiche).map(([k, v]) => (
            <p key={k} className="text-xs"><span className="opacity-50 capitalize">{k}:</span> {v}</p>
          ))}
        </Avviso>
      )}

      {bloccato && (
        <Avviso tono="errore">
          <p className="font-medium mb-1">Fermo su: {bloccato.etichetta}</p>
          <p className="text-xs opacity-80 font-mono break-words">{bloccato.errore}</p>
          <button onClick={() => azione('ripeti_passo', { passo: bloccato.chiave })}
                  className="mt-2.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs transition-colors">
            Ripeti questo passo
          </button>
        </Avviso>
      )}

      <div className="grid lg:grid-cols-[1fr,20rem] gap-6 items-start">
        {/* ── Avanzamento ─────────────────────────────────────────────── */}
        <section className="rounded-2xl border border-white/10 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
            <h2 className="text-sm font-medium">Creazione</h2>
            <span className="text-xs text-white/40">{fatti} di {passi.length}</span>
          </div>
          <ol>
            {passi.map(p => {
              const s = SEGNI[p.stato]
              return (
                <li key={p.chiave} className="flex gap-3 px-4 py-3 border-b border-white/5 last:border-0">
                  <span className={`shrink-0 w-5 h-5 mt-0.5 rounded-md border grid place-items-center text-[11px] ${s.classe}`}>
                    {s.segno}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm ${p.stato === 'riuscito' ? 'text-white/80' : p.stato === 'fallito' ? 'text-red-300' : 'text-white/50'}`}>
                      {p.etichetta}
                    </p>
                    {p.messaggio && <p className="text-xs text-white/35 mt-0.5">{p.messaggio}</p>}
                    {p.errore && <p className="text-xs text-red-300/70 mt-0.5 font-mono break-words">{p.errore}</p>}
                  </div>
                  {p.durata_ms != null && <span className="text-xs text-white/25 shrink-0">{durata(p.durata_ms)}</span>}
                </li>
              )
            })}
          </ol>
          {inCorso && (
            <p className="px-4 py-2.5 text-xs text-white/35 border-t border-white/10 bg-white/[0.02]">
              In corso. La pagina si aggiorna da sola, puoi anche chiuderla.
            </p>
          )}
        </section>

        {/* ── Riquadro tecnico ────────────────────────────────────────── */}
        <aside className="space-y-4">
          <Riquadro titolo="Azienda">
            <Riga etichetta="Titolare" valore={istanza.email_titolare} />
            {istanza.telefono_titolare && <Riga etichetta="Telefono" valore={istanza.telefono_titolare} />}
            {istanza.partita_iva && <Riga etichetta="Partita IVA" valore={istanza.partita_iva} />}
            {istanza.citta && <Riga etichetta="Citta" valore={istanza.citta} />}
            <Riga etichetta="Creata" valore={quando(istanza.created_at)} />
            {istanza.creata_da && <Riga etichetta="Da" valore={istanza.creata_da} />}
          </Riquadro>

          <Riquadro titolo="Piattaforma">
            <Riga etichetta="Database" valore={istanza.supabase_ref || '—'} mono />
            <Riga etichetta="Dove" valore={istanza.supabase_regione || '—'} />
            <Riga etichetta="Struttura" valore={istanza.schema_istruzioni ? `${istanza.schema_istruzioni} istruzioni` : '—'} />
            <Riga etichetta="Versione" valore={istanza.schema_versione || '—'} />
            <Riga etichetta="Chiavi" valore={d.chiavi_presenti ? 'Al sicuro sul server' : 'Mancanti'} />
            <p className="text-xs text-white/25 pt-2 leading-relaxed">
              Le chiavi non passano mai da questa pagina.
            </p>
          </Riquadro>

          <Riquadro titolo="Interventi">
            {d.audit.length === 0 && <p className="text-xs text-white/30">Nessuno.</p>}
            {d.audit.slice(0, 12).map(a => (
              <div key={a.id} className="py-1.5 border-b border-white/5 last:border-0">
                <p className={`text-xs ${a.esito === 'errore' ? 'text-red-300' : 'text-white/60'}`}>{a.messaggio || a.azione}</p>
                <p className="text-[11px] text-white/25">
                  {quando(a.quando)} · {a.automatico ? 'automatico' : a.attore}
                </p>
              </div>
            ))}
          </Riquadro>
        </aside>
      </div>
    </div>
  )
}

function Bottone({ children, onClick, occupato, principale }: {
  children: React.ReactNode; onClick: () => void; occupato?: boolean; principale?: boolean
}) {
  return (
    <button onClick={onClick} disabled={occupato}
      className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-colors disabled:opacity-50 ${
        principale ? 'bg-white text-black hover:bg-white/90'
                   : 'border border-white/15 text-white/60 hover:text-white'}`}>
      {occupato ? 'Attendere...' : children}
    </button>
  )
}

function Avviso({ tono, children }: { tono: 'ok' | 'errore' | 'neutro'; children: React.ReactNode }) {
  const c = tono === 'ok' ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-100'
          : tono === 'errore' ? 'border-red-500/30 bg-red-500/10 text-red-100'
          : 'border-white/10 bg-white/[0.03] text-white/70'
  return <div className={`mb-6 rounded-xl border px-4 py-3 text-sm ${c}`}>{children}</div>
}

function Riquadro({ titolo, children }: { titolo: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 overflow-hidden">
      <div className="px-4 py-2.5 border-b border-white/10 bg-white/[0.02]">
        <h3 className="text-xs font-medium text-white/50">{titolo}</h3>
      </div>
      <div className="px-4 py-3">{children}</div>
    </div>
  )
}

function Riga({ etichetta, valore, mono }: { etichetta: string; valore: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-3 py-1">
      <span className="text-xs text-white/35 shrink-0">{etichetta}</span>
      <span className={`text-xs text-white/70 text-right break-all ${mono ? 'font-mono' : ''}`}>{valore}</span>
    </div>
  )
}
