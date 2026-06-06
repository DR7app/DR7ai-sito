import React, { useEffect, useState } from 'react'

/* ────────────────────────────────────────────────────────────
   DR7 AI — landing page (Apple-style, Italian, mobile-first)
   Single-file for easy editing in AI Studio. Sections are plain
   components; scroll-reveal via .reveal class + IntersectionObserver.
   ──────────────────────────────────────────────────────────── */

const LOGO = '/dr7-logo.png'

// ── Scroll-reveal hook ────────────────────────────────────────
function useReveal() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('.reveal'))
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('is-visible'))
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible')
            io.unobserve(e.target)
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])
}

// ── Small UI atoms ────────────────────────────────────────────
function Btn({
  children,
  href,
  variant = 'primary',
  full,
}: {
  children: React.ReactNode
  href: string
  variant?: 'primary' | 'ghost' | 'light'
  full?: boolean
}) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-[15px] font-medium transition-all duration-300 active:scale-[0.97]'
  const styles = {
    primary: 'bg-[#0a84ff] text-white hover:bg-[#0a84ff]/90 shadow-lg shadow-[#0a84ff]/20',
    ghost: 'text-white/90 hover:text-white border border-white/15 hover:border-white/30 backdrop-blur',
    light: 'bg-white text-black hover:bg-white/90',
  }[variant]
  return (
    <a href={href} className={`${base} ${styles} ${full ? 'w-full sm:w-auto' : ''}`}>
      {children}
    </a>
  )
}

function Section({
  children,
  className = '',
  id,
}: {
  children: React.ReactNode
  className?: string
  id?: string
}) {
  return (
    <section id={id} className={`px-6 ${className}`}>
      <div className="mx-auto max-w-content">{children}</div>
    </section>
  )
}

// ── Navbar (sticky, blur, mobile hamburger) ───────────────────
function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  const links = [
    ['Funzionalità', '#funzionalita'],
    ['Integrazioni', '#integrazioni'],
    ['Prezzi', '#prezzi'],
    ['FAQ', '#faq'],
  ]
  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled || open ? 'bg-black/70 backdrop-blur-xl border-b border-white/5' : 'bg-transparent'
      }`}
    >
      <nav className="mx-auto flex max-w-content items-center justify-between px-6 h-14">
        <a href="#top" className="flex items-center">
          <img src={LOGO} alt="DR7 AI" className="h-10 sm:h-11 w-auto" />
        </a>

        <div className="hidden md:flex items-center gap-8">
          {links.map(([label, href]) => (
            <a
              key={href}
              href={href}
              className="text-[13px] text-white/70 hover:text-white transition-colors"
            >
              {label}
            </a>
          ))}
        </div>

        <div className="hidden md:block">
          <Btn href="#demo">Prenota una demo</Btn>
        </div>

        {/* Hamburger */}
        <button
          aria-label="Menu"
          onClick={() => setOpen((v) => !v)}
          className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-full"
        >
          <div className="space-y-1.5">
            <span
              className={`block h-0.5 w-6 bg-white transition-transform ${open ? 'translate-y-2 rotate-45' : ''}`}
            />
            <span className={`block h-0.5 w-6 bg-white transition-opacity ${open ? 'opacity-0' : ''}`} />
            <span
              className={`block h-0.5 w-6 bg-white transition-transform ${open ? '-translate-y-2 -rotate-45' : ''}`}
            />
          </div>
        </button>
      </nav>

      {/* Mobile menu */}
      <div
        className={`md:hidden overflow-hidden transition-[max-height] duration-500 ease-in-out ${
          open ? 'max-h-96' : 'max-h-0'
        }`}
      >
        <div className="px-6 pb-6 pt-2 flex flex-col gap-1">
          {links.map(([label, href]) => (
            <a
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="py-3 text-lg text-white/80 hover:text-white border-b border-white/5"
            >
              {label}
            </a>
          ))}
          <div className="pt-4">
            <Btn href="#demo" full>
              Prenota una demo
            </Btn>
          </div>
        </div>
      </div>
    </header>
  )
}

// ── Dashboard mockup (pure CSS, premium look) ─────────────────
type MockTab = 'panoramica' | 'prenotazioni' | 'flotta' | 'cauzioni'
const MOCK_TABS: { id: MockTab; label: string }[] = [
  { id: 'panoramica', label: 'Panoramica' },
  { id: 'prenotazioni', label: 'Prenotazioni' },
  { id: 'flotta', label: 'Flotta' },
  { id: 'cauzioni', label: 'Cauzioni' },
]

function Badge({ children, tone }: { children: React.ReactNode; tone: 'green' | 'amber' | 'slate' | 'blue' }) {
  const tones = {
    green: 'bg-[#28c840]/15 text-[#28c840]',
    amber: 'bg-amber-400/15 text-amber-300',
    slate: 'bg-white/10 text-white/50',
    blue: 'bg-[#0a84ff]/15 text-[#3ea0ff]',
  }[tone]
  return <span className={`rounded px-1.5 py-0.5 text-[9px] font-semibold ${tones}`}>{children}</span>
}

function DashboardMock() {
  const [tab, setTab] = useState<MockTab>('panoramica')
  return (
    <div className="relative mx-auto w-full max-w-4xl reveal">
      <div className="absolute -inset-8 -z-10 rounded-[40px] bg-gradient-to-tr from-[#0a84ff]/20 via-cyan-400/10 to-transparent blur-3xl" />
      <div className="rounded-2xl border border-white/10 bg-[#111113] shadow-2xl shadow-black/60 overflow-hidden">
        {/* window bar */}
        <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
          <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
          <span className="h-3 w-3 rounded-full bg-[#28c840]" />
          <span className="ml-3 text-xs text-white/40">dr7ai.com · Console</span>
          <span className="ml-auto hidden items-center gap-1.5 text-[10px] text-[#28c840] sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-[#28c840] animate-pulse" /> Live
          </span>
        </div>

        <div className="grid grid-cols-12">
          {/* nav: horizontal scroll on mobile, sidebar on desktop */}
          <div className="col-span-12 sm:col-span-3 sm:p-5">
            <div className="flex gap-2 overflow-x-auto border-b border-white/5 p-3 sm:flex-col sm:overflow-visible sm:border-0 sm:p-0">
              {MOCK_TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`whitespace-nowrap rounded-lg px-3 py-2 text-left text-xs transition ${
                    tab === t.id ? 'bg-[#0a84ff]/20 text-white' : 'text-white/50 hover:text-white/80'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* main */}
          <div className="col-span-12 sm:col-span-9 p-4 sm:p-5">
            <div key={tab} className="animate-fade-in space-y-3">
              {tab === 'panoramica' && (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      ['Incassato oggi', '€ 4.280'],
                      ['Da saldare', '€ 870'],
                      ['Prenotazioni', '23'],
                    ].map(([k, v]) => (
                      <div key={k} className="rounded-xl bg-white/[0.04] p-3">
                        <div className="text-[10px] uppercase tracking-wide text-white/40">{k}</div>
                        <div className="mt-1 text-base font-semibold sm:text-xl">{v}</div>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl bg-white/[0.04] p-4">
                    <div className="mb-3 flex items-end justify-between">
                      <span className="text-xs text-white/50">Incassi settimanali</span>
                      <span className="text-xs text-[#28c840]">+18%</span>
                    </div>
                    <div className="flex h-24 items-end gap-2">
                      {[40, 65, 50, 80, 60, 95, 75].map((h, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-t bg-gradient-to-t from-[#0a84ff]/40 to-[#0a84ff]"
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}

              {tab === 'prenotazioni' && (
                <div className="overflow-hidden rounded-xl bg-white/[0.04]">
                  {[
                    ['Ferrari 296 GTB', 'Simone M. · 05–06 Giu', '€ 179', 'In corso', 'green'],
                    ['Mercedes A45S', 'Michael M. · 01–03 Giu', '€ 558', 'Da saldare', 'amber'],
                    ['Audi RS3', 'Klaus G. · 03–06 Giu', '€ 240', 'Chiuso', 'slate'],
                  ].map(([car, meta, price, status, tone], i) => (
                    <div
                      key={i}
                      className={`flex items-center justify-between p-3.5 text-xs ${i < 2 ? 'border-b border-white/5' : ''}`}
                    >
                      <div>
                        <div className="font-semibold text-white">{car}</div>
                        <div className="mt-0.5 text-[10px] text-white/40">{meta}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-white">{price}</div>
                        <div className="mt-0.5">
                          <Badge tone={tone as 'green' | 'amber' | 'slate'}>{status}</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {tab === 'flotta' && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {[
                    ['Ferrari 296 GTB', 85, 'Prenotato', 'amber', 'bg-amber-400'],
                    ['Mercedes A45S', 98, 'In strada', 'green', 'bg-[#28c840]'],
                    ['Audi RS3', 45, 'Disponibile', 'blue', 'bg-[#0a84ff]'],
                  ].map(([car, fuel, status, tone, bar], i) => (
                    <div key={i} className="space-y-3 rounded-xl bg-white/[0.04] p-3.5 text-xs">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-white">{car}</span>
                        <Badge tone={tone as 'green' | 'amber' | 'blue'}>{status}</Badge>
                      </div>
                      <div>
                        <div className="mb-1 flex justify-between text-[10px] text-white/40">
                          <span>Carburante</span>
                          <span>{fuel}%</span>
                        </div>
                        <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
                          <div className={`h-full ${bar}`} style={{ width: `${fuel}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {tab === 'cauzioni' && (
                <div className="space-y-2.5">
                  {[
                    ['Pre-autorizzazione · Ferrari 296', 'Visa · trattenuta', '€ 5.000', 'blue'],
                    ['Fattura SDI · DR7-2026-1484', 'Trasmessa ad Agenzia Entrate', '€ 24,90', 'green'],
                  ].map(([title, meta, amount, tone], i) => (
                    <div key={i} className="flex items-center justify-between rounded-xl bg-white/[0.04] p-3.5 text-xs">
                      <div className="flex items-center gap-3">
                        <span
                          className={`h-2 w-2 rounded-full ${tone === 'green' ? 'bg-[#28c840]' : 'bg-[#0a84ff]'}`}
                        />
                        <div>
                          <div className="font-semibold text-white">{title}</div>
                          <div className="mt-0.5 text-[10px] text-white/40">{meta}</div>
                        </div>
                      </div>
                      <div className="font-semibold text-white">{amount}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <p className="mt-4 text-center text-xs text-white/30">Demo interattiva — tocca le sezioni</p>
    </div>
  )
}

// ── Feature data ──────────────────────────────────────────────
const FEATURES = [
  {
    icon: 'calendar',
    title: 'Prenotazioni & Calendario',
    body: 'Noleggi, lavaggi e officina in un unico calendario. Disponibilità in tempo reale e zero doppie prenotazioni.',
  },
  {
    icon: 'card',
    title: 'Pagamenti & Cauzioni',
    body: 'Pay-by-Link Nexi, pre-autorizzazioni, addebiti ricorrenti e wallet a credito. Incassi prima ancora che il cliente arrivi.',
  },
  {
    icon: 'invoice',
    title: 'Fatturazione Elettronica',
    body: 'Fatture verso SDI in automatico — anche per penali e danni. Basta copia-incolla con il commercialista.',
  },
  {
    icon: 'chat',
    title: 'Automazioni WhatsApp AI',
    body: 'Conferme, link di pagamento e promemoria partono da soli. Un assistente AI risponde ai clienti 24/7.',
  },
  {
    icon: 'doc',
    title: 'AI per i documenti',
    body: "Scatta una foto di patente o carta d'identità: l'AI legge e compila i dati del cliente in pochi secondi.",
  },
  {
    icon: 'car',
    title: 'Flotta, CRM & Fedeltà',
    body: 'Veicoli, scadenze, fornitori, schede cliente e wallet fedeltà. Tutto collegato, tutto sotto controllo.',
  },
]

// ── Feature icons (minimal line SVGs, no emojis) ──────────────
function FeatureIcon({ name }: { name: string }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }
  const paths: Record<string, React.ReactNode> = {
    calendar: (
      <>
        <rect x="3" y="4.5" width="18" height="16" rx="2" />
        <path d="M3 9h18M8 2.5v4M16 2.5v4" />
      </>
    ),
    card: (
      <>
        <rect x="2.5" y="5" width="19" height="14" rx="2" />
        <path d="M2.5 10h19M6 15h4" />
      </>
    ),
    invoice: (
      <>
        <path d="M6 2.5h8l4 4v15H6z" />
        <path d="M14 2.5v4h4M9 12h6M9 16h6M9 8h2" />
      </>
    ),
    chat: (
      <>
        <path d="M4 5h16v11H9l-4 3v-3H4z" />
        <path d="M8 10h.01M12 10h.01M16 10h.01" />
      </>
    ),
    doc: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M8 8h8M8 12h8M8 16h5" />
      </>
    ),
    car: (
      <>
        <path d="M3 13l2-5a2 2 0 0 1 1.9-1.3h10.2A2 2 0 0 1 19 8l2 5v5h-3v-2H6v2H3z" />
        <circle cx="7.5" cy="16" r="1.3" />
        <circle cx="16.5" cy="16" r="1.3" />
      </>
    ),
  }
  return (
    <svg {...common} aria-hidden="true">
      {paths[name] ?? null}
    </svg>
  )
}

const INTEGRATIONS = ['Nexi', 'Aruba · SDI', 'WhatsApp', 'Google Analytics', 'Supabase']

const PRICING = [
  {
    name: 'Starter',
    price: '€49',
    period: '/mese',
    tagline: 'Per iniziare a digitalizzare.',
    features: ['Fino a 10 veicoli', 'Prenotazioni & calendario', 'Pagamenti Nexi Pay-by-Link', 'Schede cliente'],
    highlight: false,
  },
  {
    name: 'Pro',
    price: '€99',
    period: '/mese',
    tagline: 'Il più scelto dai noleggi.',
    features: [
      'Tutto di Starter',
      'Fatturazione elettronica SDI',
      'Automazioni WhatsApp con AI',
      'AI lettura documenti',
      'Wallet fedeltà & referral',
    ],
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 'Su misura',
    period: '',
    tagline: 'Multi-sede e flotte grandi.',
    features: ['Veicoli illimitati', 'Multi-sede', 'API & integrazioni dedicate', 'Supporto prioritario'],
    highlight: false,
  },
]

const FAQS = [
  ['Posso migrare i miei dati attuali?', 'Sì. Ti aiutiamo a importare clienti, veicoli e prenotazioni esistenti durante l’onboarding, senza fermare l’attività.'],
  ['È conforme alla fatturazione elettronica?', 'Assolutamente. DR7 AI invia le fatture al Sistema di Interscambio (SDI) tramite Aruba, incluse penali e danni, con note di credito.'],
  ['Che supporto offrite?', 'Supporto in italiano via WhatsApp ed email. I piani Pro ed Enterprise hanno priorità e onboarding dedicato.'],
  ['Esiste una prova gratuita?', 'Sì, puoi provare DR7 AI senza impegno. Prenota una demo e attiviamo il tuo ambiente di prova.'],
  ['I dati sono al sicuro?', 'I dati sono cifrati e ospitati su infrastruttura europea, con backup continui e accessi a permessi/ruoli.'],
  ['Funziona con più sedi?', 'Sì. Il piano Enterprise gestisce più sedi e flotte da un’unica dashboard.'],
]

// ── FAQ accordion ─────────────────────────────────────────────
function Faq() {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <div className="mx-auto max-w-3xl divide-y divide-black/10">
      {FAQS.map(([q, a], i) => (
        <div key={i} className="py-2">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full items-center justify-between gap-4 py-4 text-left"
          >
            <span className="text-lg font-medium text-black">{q}</span>
            <span
              className={`shrink-0 text-2xl text-black/40 transition-transform duration-300 ${
                open === i ? 'rotate-45' : ''
              }`}
            >
              +
            </span>
          </button>
          <div
            className={`overflow-hidden transition-[max-height] duration-500 ease-in-out ${
              open === i ? 'max-h-60' : 'max-h-0'
            }`}
          >
            <p className="pb-5 pr-8 text-[17px] leading-relaxed text-black/60">{a}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── App ───────────────────────────────────────────────────────
export default function App() {
  useReveal()
  const [demoSent, setDemoSent] = useState(false)
  const [demoSending, setDemoSending] = useState(false)

  async function handleDemoSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const body = new URLSearchParams(new FormData(form) as any).toString()
    setDemoSending(true)
    try {
      // Netlify Forms: POST the encoded data back to the site root.
      await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      })
      setDemoSent(true)
      form.reset()
    } catch {
      alert('Invio non riuscito. Riprova o scrivici a info@dr7ai.com.')
    } finally {
      setDemoSending(false)
    }
  }

  return (
    <div id="top" className="bg-ink text-white antialiased">
      <Navbar />

      {/* HERO */}
      <Section className="pt-32 pb-20 sm:pt-44 sm:pb-28 text-center">
        <div className="reveal">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 text-[13px] text-white/60">
            <span className="h-1.5 w-1.5 rounded-full bg-[#0a84ff]" /> Powered by AI
          </span>
          <h1 className="mx-auto mt-7 max-w-4xl text-5xl sm:text-6xl md:text-7xl font-semibold leading-[1.05] tracking-tightest">
            Il gestionale del tuo noleggio.
            <br />
            <span className="bg-gradient-to-r from-white to-white/50 bg-clip-text text-transparent">
              Reinventato con l’AI.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg sm:text-xl leading-relaxed text-white/60">
            Prenotazioni, incassi, fatturazione elettronica e WhatsApp automatico — in un’unica
            piattaforma intelligente. Per autonoleggi, centri lavaggio e mobilità.
          </p>
          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Btn href="#demo" full>
              Prenota una demo
            </Btn>
            <Btn href="#funzionalita" variant="ghost" full>
              Scopri come funziona
            </Btn>
          </div>
          <p className="mt-5 text-[13px] text-white/40">
            Fatturazione SDI · Pagamenti Nexi · Automazioni WhatsApp AI
          </p>
        </div>

        <div className="mt-16 sm:mt-20">
          <div className="relative mx-auto w-full max-w-5xl reveal">
            <div className="absolute -inset-8 -z-10 rounded-[40px] bg-gradient-to-tr from-[#0a84ff]/25 via-cyan-400/10 to-transparent blur-3xl" />
            <div className="overflow-hidden rounded-2xl border border-white/10 shadow-2xl shadow-black/60">
              <div className="flex items-center gap-2 border-b border-white/5 bg-[#1a1a1c] px-4 py-3">
                <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
                <span className="h-3 w-3 rounded-full bg-[#28c840]" />
                <span className="ml-3 text-xs text-white/40">dr7ai.com · Dashboard</span>
              </div>
              <img src="/dashboard.png" alt="Dashboard DR7 AI" className="block w-full" />
            </div>
          </div>
        </div>
      </Section>

      {/* INTRO STATEMENT (white) */}
      <section className="bg-white text-black px-6 py-24 sm:py-36">
        <div className="mx-auto max-w-content text-center reveal">
          <p className="text-sm font-semibold uppercase tracking-widest text-[#0a84ff]">Una sola piattaforma</p>
          <h2 className="mx-auto mt-4 max-w-4xl text-4xl sm:text-5xl md:text-6xl font-semibold leading-tight tracking-tight">
            Tutto il tuo business.
            <br />
            In un unico posto, finalmente.
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg sm:text-xl leading-relaxed text-black/50">
            Basta fogli Excel, chat WhatsApp sparse e POS separati. DR7 AI unisce operatività,
            incassi e fisco in un flusso unico — automatizzato dall’intelligenza artificiale.
          </p>
        </div>
      </section>

      {/* FEATURES (light grey) */}
      <section id="funzionalita" className="bg-[#f5f5f7] text-black px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-content">
          <h2 className="max-w-3xl text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight reveal">
            Tutto ciò che serve per gestire — e far crescere — la tua attività.
          </h2>
          <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="reveal rounded-3xl bg-white p-7 shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#0a84ff]/10 text-[#0a84ff]">
                  <FeatureIcon name={f.icon} />
                </div>
                <h3 className="mt-5 text-xl font-semibold tracking-tight">{f.title}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-black/55">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SPOTLIGHT 1 — Fattura (black) */}
      <section className="bg-ink px-6 py-24 sm:py-36">
        <div className="mx-auto grid max-w-content items-center gap-12 md:grid-cols-2">
          <div className="reveal">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#0a84ff]">Fatturazione</p>
            <h2 className="mt-4 text-4xl sm:text-5xl font-semibold tracking-tight leading-tight">
              Fatturazione elettronica, finalmente senza pensieri.
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-white/60">
              Ogni pagamento incassato diventa una fattura inviata al SDI in automatico — noleggi,
              lavaggi, penali e danni inclusi. Note di credito con un clic. Il tuo commercialista ti
              ringrazierà.
            </p>
            <ul className="mt-6 space-y-3 text-[15px] text-white/70">
              {['Invio automatico ad Aruba / SDI', 'Fatture per penali e danni', 'Note di credito integrate'].map(
                (t) => (
                  <li key={t} className="flex items-center gap-3">
                    <span className="text-[#28c840]">✓</span> {t}
                  </li>
                ),
              )}
            </ul>
          </div>
          <div className="reveal rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <div className="rounded-xl bg-white p-5 text-black shadow-2xl">
              <div className="flex items-center justify-between border-b border-black/10 pb-3">
                <span className="text-sm font-semibold">Fattura DR7-2026-1484</span>
                <span className="rounded-full bg-[#28c840]/15 px-2 py-0.5 text-xs font-medium text-[#1a9c33]">
                  Inviata a SDI
                </span>
              </div>
              <div className="space-y-2 py-4 text-sm">
                <div className="flex justify-between text-black/60">
                  <span>Prime Full Clean</span>
                  <span>€ 20,41</span>
                </div>
                <div className="flex justify-between text-black/60">
                  <span>IVA 22%</span>
                  <span>€ 4,49</span>
                </div>
                <div className="flex justify-between border-t border-black/10 pt-2 font-semibold">
                  <span>Totale</span>
                  <span>€ 24,90</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SPOTLIGHT 2 — Pagamenti (white) */}
      <section className="bg-white text-black px-6 py-24 sm:py-36">
        <div className="mx-auto grid max-w-content items-center gap-12 md:grid-cols-2">
          <div className="reveal order-2 md:order-1 rounded-3xl bg-[#f5f5f7] p-8">
            <div className="space-y-3">
              {[
                ['Link di pagamento inviato', 'WhatsApp · 2 min fa'],
                ['Pagamento ricevuto', '€ 179,00 · Nexi'],
                ['Fattura generata', 'Automatica'],
                ['Conferma inviata al cliente', 'WhatsApp'],
              ].map(([t, s], i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0a84ff]/10 text-[#0a84ff]">
                    ✓
                  </span>
                  <div>
                    <div className="text-sm font-medium">{t}</div>
                    <div className="text-xs text-black/40">{s}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="reveal order-1 md:order-2">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#0a84ff]">Incassi</p>
            <h2 className="mt-4 text-4xl sm:text-5xl font-semibold tracking-tight leading-tight">
              Incassi automatici. Anche mentre dormi.
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-black/55">
              Invii un link di pagamento su WhatsApp con un tocco. Il cliente paga, DR7 AI registra
              l’incasso, emette la fattura e invia la conferma — tutto da solo. Tu controlli solo il
              risultato.
            </p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS (light grey) */}
      <section className="bg-[#f5f5f7] text-black px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-content text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight reveal">
            Operativo in tre passi.
          </h2>
          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              ['01', 'Configura flotta e servizi', 'Aggiungi veicoli, lavaggi e listini. Ti guidiamo noi nell’onboarding.'],
              ['02', 'Il cliente prenota e paga', 'Prenotazione online, link Nexi su WhatsApp, cauzione pre-autorizzata.'],
              ['03', 'L’AI pensa al resto', 'Fattura, conferma, promemoria e documenti: tutto automatico.'],
            ].map(([n, t, b]) => (
              <div key={n} className="reveal">
                <div className="text-5xl font-semibold text-[#0a84ff]/30">{n}</div>
                <h3 className="mt-4 text-xl font-semibold tracking-tight">{t}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-black/55">{b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INTEGRATIONS (black) */}
      <section id="integrazioni" className="bg-ink px-6 py-24 sm:py-28">
        <div className="mx-auto max-w-content text-center reveal">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            Si integra con gli strumenti che già usi.
          </h2>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            {INTEGRATIONS.map((i) => (
              <span
                key={i}
                className="rounded-full border border-white/10 bg-white/[0.03] px-6 py-3 text-[15px] text-white/70"
              >
                {i}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING (white) */}
      <section id="prezzi" className="bg-white text-black px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-content">
          <div className="text-center reveal">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight">
              Un piano per ogni dimensione.
            </h2>
            <p className="mt-4 text-lg text-black/50">Senza vincoli. Disdici quando vuoi.</p>
          </div>
          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
            {PRICING.map((p) => (
              <div
                key={p.name}
                className={`reveal rounded-3xl p-8 transition-transform duration-300 hover:-translate-y-1 ${
                  p.highlight
                    ? 'bg-ink text-white shadow-2xl ring-2 ring-[#0a84ff]'
                    : 'bg-[#f5f5f7] text-black'
                }`}
              >
                {p.highlight && (
                  <span className="mb-4 inline-block rounded-full bg-[#0a84ff] px-3 py-1 text-xs font-semibold">
                    Più scelto
                  </span>
                )}
                <h3 className="text-xl font-semibold">{p.name}</h3>
                <p className={`mt-1 text-sm ${p.highlight ? 'text-white/50' : 'text-black/50'}`}>
                  {p.tagline}
                </p>
                <div className="mt-6 flex items-end gap-1">
                  <span className="text-4xl font-semibold tracking-tight">{p.price}</span>
                  <span className={`mb-1 text-sm ${p.highlight ? 'text-white/50' : 'text-black/50'}`}>
                    {p.period}
                  </span>
                </div>
                <a
                  href="#demo"
                  className={`mt-6 block rounded-full py-3 text-center text-[15px] font-medium transition-colors ${
                    p.highlight ? 'bg-[#0a84ff] text-white hover:bg-[#0a84ff]/90' : 'bg-black text-white hover:bg-black/80'
                  }`}
                >
                  Prenota una demo
                </a>
                <ul className="mt-7 space-y-3 text-[15px]">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-3">
                      <span className="text-[#0a84ff]">✓</span>
                      <span className={p.highlight ? 'text-white/80' : 'text-black/70'}>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-black/40">
            Prezzi indicativi IVA esclusa. Personalizziamo il piano sulla tua flotta.
          </p>
        </div>
      </section>

      {/* TESTIMONIALS (black) */}
      <section className="bg-ink px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-content">
          <h2 className="max-w-2xl text-3xl sm:text-4xl font-semibold tracking-tight reveal">
            Chi gestisce con DR7 AI non torna più indietro.
          </h2>
          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              ['“Incasso prima ancora che il cliente arrivi in sede. Le insolvenze sono sparite.”', 'Marco R.', 'Autonoleggio · Cagliari'],
              ['“Le fatture partono da sole verso SDI. Ho ridotto le ore in amministrazione del 70%.”', 'Giulia M.', 'Rent & Wash · Olbia'],
              ['“L’assistente WhatsApp risponde ai clienti di notte. Sembra di avere un dipendente in più.”', 'Andrea P.', 'Supercar Rental · Milano'],
            ].map(([q, n, r]) => (
              <div key={n} className="reveal rounded-3xl border border-white/10 bg-white/[0.03] p-7">
                <p className="text-lg leading-relaxed text-white/85">{q}</p>
                <div className="mt-6">
                  <div className="text-sm font-semibold">{n}</div>
                  <div className="text-sm text-white/40">{r}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ (white) */}
      <section id="faq" className="bg-white text-black px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-content">
          <h2 className="mb-10 text-center text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight reveal">
            Domande frequenti
          </h2>
          <Faq />
        </div>
      </section>

      {/* CTA + DEMO FORM (gradient black) */}
      <section
        id="demo"
        className="relative overflow-hidden px-6 py-24 sm:py-32 bg-gradient-to-b from-ink via-[#0b1220] to-ink"
      >
        <div className="absolute left-1/2 top-0 -z-0 h-96 w-96 -translate-x-1/2 rounded-full bg-[#0a84ff]/20 blur-[120px]" />
        <div className="relative mx-auto max-w-3xl text-center reveal">
          <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight">
            Pronto a digitalizzare il tuo noleggio?
          </h2>
          <p className="mt-5 text-lg text-white/60">
            Prenota una demo gratuita. Ti mostriamo DR7 AI sui tuoi numeri reali.
          </p>

          {demoSent ? (
            <div className="mx-auto mt-10 max-w-xl rounded-2xl border border-[#28c840]/30 bg-[#28c840]/10 p-8 text-center">
              <div className="text-3xl text-[#28c840]">✓</div>
              <p className="mt-3 text-lg font-medium text-white">Grazie! Richiesta ricevuta.</p>
              <p className="mt-1 text-sm text-white/60">Ti contattiamo entro 24 ore per fissare la demo.</p>
            </div>
          ) : (
            <form
              name="demo"
              method="POST"
              data-netlify="true"
              netlify-honeypot="bot-field"
              onSubmit={handleDemoSubmit}
              className="mx-auto mt-10 grid max-w-xl grid-cols-1 gap-3 text-left sm:grid-cols-2"
            >
              <input type="hidden" name="form-name" value="demo" />
              <p className="hidden">
                <label>Non compilare: <input name="bot-field" /></label>
              </p>
              <input required name="nome" placeholder="Nome" className="input" />
              <input required name="azienda" placeholder="Azienda" className="input" />
              <input required type="email" name="email" placeholder="Email" className="input" />
              <input required name="telefono" type="tel" placeholder="Telefono" className="input" />
              <input name="veicoli" placeholder="Numero di veicoli (facoltativo)" className="input sm:col-span-2" />
              <button
                type="submit"
                disabled={demoSending}
                className="sm:col-span-2 mt-2 rounded-full bg-[#0a84ff] py-3.5 text-[15px] font-medium text-white transition-all hover:bg-[#0a84ff]/90 active:scale-[0.98] disabled:opacity-60"
              >
                {demoSending ? 'Invio in corso…' : 'Prenota una demo'}
              </button>
            </form>
          )}
          <p className="mt-4 text-xs text-white/40">Nessun impegno · Risposta entro 24h</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 bg-ink px-6 py-14">
        <div className="mx-auto flex max-w-content flex-col items-center gap-6 sm:flex-row sm:justify-between">
          <div className="flex items-center">
            <img src={LOGO} alt="DR7 AI" className="h-10 w-auto" />
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-white/50">
            <a href="#funzionalita" className="hover:text-white">Funzionalità</a>
            <a href="#prezzi" className="hover:text-white">Prezzi</a>
            <a href="#faq" className="hover:text-white">FAQ</a>
            <a href="#demo" className="hover:text-white">Demo</a>
          </div>
          <div className="text-sm text-white/30">© 2026 DR7 AI</div>
        </div>
      </footer>
    </div>
  )
}
