import React, { useEffect, useState } from 'react'

/* ────────────────────────────────────────────────────────────
   DR7 AI — landing page (Apple-style, IT/EN, mobile-first)
   All copy lives in CONTENT[lang]; a nav toggle switches language.
   ──────────────────────────────────────────────────────────── */

const LOGO = '/dr7-logo.png'

type Lang = 'it' | 'en'

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

// ── UI atoms ──────────────────────────────────────────────────
function Btn({
  children,
  href,
  variant = 'primary',
  full,
}: {
  children: React.ReactNode
  href: string
  variant?: 'primary' | 'ghost'
  full?: boolean
}) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-[15px] font-medium transition-all duration-300 active:scale-[0.97]'
  const styles = {
    primary: 'bg-[#0a84ff] text-white hover:bg-[#0a84ff]/90 shadow-lg shadow-[#0a84ff]/20',
    ghost: 'text-white/90 hover:text-white border border-white/15 hover:border-white/30 backdrop-blur',
  }[variant]
  return (
    <a href={href} className={`${base} ${styles} ${full ? 'w-full sm:w-auto' : ''}`}>
      {children}
    </a>
  )
}

function Section({ children, className = '', id }: { children: React.ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} className={`px-6 ${className}`}>
      <div className="mx-auto max-w-content">{children}</div>
    </section>
  )
}

// ── Content (IT / EN) ─────────────────────────────────────────
const CONTENT = {
  it: {
    nav: { features: 'Funzionalità', integrations: 'Integrazioni', pricing: 'Prezzi', faq: 'FAQ', demo: 'Prenota una demo' },
    hero: {
      badge: 'Powered by AI',
      h1a: 'Il gestionale del tuo noleggio.',
      h1b: 'Reinventato con l’AI.',
      sub: 'Prenotazioni, incassi, fatturazione elettronica e WhatsApp automatico — in un’unica piattaforma intelligente. Per autonoleggi, centri lavaggio e mobilità.',
      cta1: 'Prenota una demo',
      cta2: 'Scopri come funziona',
      trust: 'Fatturazione SDI · Pagamenti Nexi · Automazioni WhatsApp AI',
      frame: 'dr7ai.com · Dashboard',
    },
    intro: {
      eyebrow: 'Una sola piattaforma',
      h2: 'Tutto il tuo business.\nIn un unico posto, finalmente.',
      sub: 'Basta fogli Excel, chat WhatsApp sparse e POS separati. DR7 AI unisce operatività, incassi e fisco in un flusso unico — automatizzato dall’intelligenza artificiale.',
    },
    featuresTitle: 'Tutto ciò che serve per gestire — e far crescere — la tua attività.',
    features: [
      { icon: 'calendar', title: 'Prenotazioni & Calendario', body: 'Noleggi, lavaggi e officina in un unico calendario. Disponibilità in tempo reale e zero doppie prenotazioni.' },
      { icon: 'card', title: 'Pagamenti & Cauzioni', body: 'Pay-by-Link Nexi, pre-autorizzazioni, addebiti ricorrenti e wallet a credito. Incassi prima ancora che il cliente arrivi.' },
      { icon: 'invoice', title: 'Fatturazione Elettronica', body: 'Fatture verso SDI in automatico — anche per penali e danni. Basta copia-incolla con il commercialista.' },
      { icon: 'chat', title: 'Automazioni WhatsApp AI', body: 'Conferme, link di pagamento e promemoria partono da soli. Un assistente AI risponde ai clienti 24/7.' },
      { icon: 'doc', title: 'AI per i documenti', body: "Scatta una foto di patente o carta d'identità: l'AI legge e compila i dati del cliente in pochi secondi." },
      { icon: 'car', title: 'Flotta, CRM & Fedeltà', body: 'Veicoli, scadenze, fornitori, schede cliente e wallet fedeltà. Tutto collegato, tutto sotto controllo.' },
    ],
    spot1: {
      eyebrow: 'Fatturazione',
      h2: 'Fatturazione elettronica, finalmente senza pensieri.',
      body: 'Ogni pagamento incassato diventa una fattura inviata al SDI in automatico — noleggi, lavaggi, penali e danni inclusi. Note di credito con un clic. Il tuo commercialista ti ringrazierà.',
      bullets: ['Invio automatico ad Aruba / SDI', 'Fatture per penali e danni', 'Note di credito integrate'],
      invTitle: 'Fattura DR7-2026-1484',
      invStatus: 'Inviata a SDI',
      invVat: 'IVA 22%',
      invTotal: 'Totale',
    },
    spot2: {
      eyebrow: 'Incassi',
      h2: 'Incassi automatici. Anche mentre dormi.',
      body: 'Invii un link di pagamento su WhatsApp con un tocco. Il cliente paga, DR7 AI registra l’incasso, emette la fattura e invia la conferma — tutto da solo. Tu controlli solo il risultato.',
      steps: [
        ['Link di pagamento inviato', 'WhatsApp · 2 min fa'],
        ['Pagamento ricevuto', '€ 179,00 · Nexi'],
        ['Fattura generata', 'Automatica'],
        ['Conferma inviata al cliente', 'WhatsApp'],
      ],
    },
    howTitle: 'Operativo in tre passi.',
    how: [
      ['01', 'Configura flotta e servizi', 'Aggiungi veicoli, lavaggi e listini. Ti guidiamo noi nell’onboarding.'],
      ['02', 'Il cliente prenota e paga', 'Prenotazione online, link Nexi su WhatsApp, cauzione pre-autorizzata.'],
      ['03', 'L’AI pensa al resto', 'Fattura, conferma, promemoria e documenti: tutto automatico.'],
    ],
    integrationsTitle: 'Si integra con gli strumenti che già usi.',
    pricing: {
      h2: 'Un prezzo su misura per la tua attività.',
      sub: 'Ogni flotta è diversa. Costruiamo il piano giusto in base a veicoli, sedi e volumi — nessun costo nascosto, nessun vincolo.',
      popular: 'Più scelto',
      custom: 'Su misura',
      cta: 'Richiedi un preventivo',
      note: 'Nessun costo nascosto. Il prezzo viene definito insieme, in base alla tua flotta, durante la demo.',
      tiers: [
        { name: 'Starter', scope: 'Piccole flotte', features: ['Fino a 10 veicoli', 'Prenotazioni & calendario', 'Pagamenti Nexi Pay-by-Link', 'Schede cliente'], highlight: false },
        { name: 'Pro', scope: 'Flotte in crescita', features: ['Tutto di Starter', 'Fatturazione elettronica SDI', 'Automazioni WhatsApp con AI', 'AI lettura documenti', 'Wallet fedeltà & referral'], highlight: true },
        { name: 'Enterprise', scope: 'Multi-sede & luxury', features: ['Veicoli illimitati', 'Multi-sede', 'API & integrazioni dedicate', 'Supporto prioritario'], highlight: false },
      ],
    },
    testimonialsTitle: 'Chi gestisce con DR7 AI non torna più indietro.',
    testimonials: [
      ['“Incasso prima ancora che il cliente arrivi in sede. Le insolvenze sono sparite.”', 'Marco R.', 'Autonoleggio · Cagliari'],
      ['“Le fatture partono da sole verso SDI. Ho ridotto le ore in amministrazione del 70%.”', 'Giulia M.', 'Rent & Wash · Olbia'],
      ['“L’assistente WhatsApp risponde ai clienti di notte. Sembra di avere un dipendente in più.”', 'Andrea P.', 'Supercar Rental · Milano'],
    ],
    faqTitle: 'Domande frequenti',
    faq: [
      ['Posso migrare i miei dati attuali?', 'Sì. Ti aiutiamo a importare clienti, veicoli e prenotazioni esistenti durante l’onboarding, senza fermare l’attività.'],
      ['È conforme alla fatturazione elettronica?', 'Assolutamente. DR7 AI invia le fatture al Sistema di Interscambio (SDI) tramite Aruba, incluse penali e danni, con note di credito.'],
      ['Che supporto offrite?', 'Supporto in italiano e inglese via WhatsApp ed email. I piani Pro ed Enterprise hanno priorità e onboarding dedicato.'],
      ['Esiste una prova gratuita?', 'Sì, puoi provare DR7 AI senza impegno. Prenota una demo e attiviamo il tuo ambiente di prova.'],
      ['I dati sono al sicuro?', 'I dati sono cifrati e ospitati su infrastruttura europea, con backup continui e accessi a permessi/ruoli.'],
      ['Funziona con più sedi?', 'Sì. Il piano Enterprise gestisce più sedi e flotte da un’unica dashboard.'],
    ],
    demo: {
      h2: 'Pronto a digitalizzare il tuo noleggio?',
      sub: 'Prenota una demo gratuita. Ti mostriamo DR7 AI sui tuoi numeri reali.',
      nome: 'Nome',
      azienda: 'Azienda',
      email: 'Email',
      telefono: 'Telefono',
      veicoli: 'Numero di veicoli (facoltativo)',
      send: 'Prenota una demo',
      sending: 'Invio in corso…',
      okTitle: 'Grazie! Richiesta ricevuta.',
      okSub: 'Ti contattiamo entro 24 ore per fissare la demo.',
      note: 'Nessun impegno · Risposta entro 24h',
      err: 'Invio non riuscito. Riprova o scrivici a info@dr7ai.com.',
    },
    footer: { features: 'Funzionalità', pricing: 'Prezzi', faq: 'FAQ', demo: 'Demo' },
  },
  en: {
    nav: { features: 'Features', integrations: 'Integrations', pricing: 'Pricing', faq: 'FAQ', demo: 'Book a demo' },
    hero: {
      badge: 'Powered by AI',
      h1a: 'The OS for your rental business.',
      h1b: 'Reinvented with AI.',
      sub: 'Bookings, payments, e-invoicing and automated WhatsApp — in one intelligent platform. Built for car rental, car wash and mobility businesses.',
      cta1: 'Book a demo',
      cta2: 'See how it works',
      trust: 'E-invoicing · Nexi payments · AI WhatsApp automation',
      frame: 'dr7ai.com · Dashboard',
    },
    intro: {
      eyebrow: 'One single platform',
      h2: 'Your entire business.\nFinally in one place.',
      sub: 'No more spreadsheets, scattered WhatsApp chats and separate POS. DR7 AI unifies operations, payments and tax in one flow — automated by AI.',
    },
    featuresTitle: 'Everything you need to run — and grow — your business.',
    features: [
      { icon: 'calendar', title: 'Bookings & Calendar', body: 'Rentals, car washes and workshop in one calendar. Real-time availability and zero double bookings.' },
      { icon: 'card', title: 'Payments & Deposits', body: 'Nexi Pay-by-Link, pre-authorizations, recurring charges and credit wallet. Get paid before the customer even arrives.' },
      { icon: 'invoice', title: 'E-invoicing', body: 'Invoices sent to SDI automatically — including penalties and damages. No more copy-paste with your accountant.' },
      { icon: 'chat', title: 'AI WhatsApp Automation', body: 'Confirmations, payment links and reminders send themselves. An AI assistant answers customers 24/7.' },
      { icon: 'doc', title: 'AI for documents', body: "Snap a photo of a driving licence or ID: AI reads it and fills in the customer's details in seconds." },
      { icon: 'car', title: 'Fleet, CRM & Loyalty', body: 'Vehicles, deadlines, suppliers, customer profiles and a loyalty wallet. All connected, all under control.' },
    ],
    spot1: {
      eyebrow: 'Invoicing',
      h2: 'E-invoicing, finally effortless.',
      body: 'Every payment collected becomes an invoice sent to SDI automatically — rentals, car washes, penalties and damages included. Credit notes in one click. Your accountant will thank you.',
      bullets: ['Automatic sending to Aruba / SDI', 'Invoices for penalties and damages', 'Built-in credit notes'],
      invTitle: 'Invoice DR7-2026-1484',
      invStatus: 'Sent to SDI',
      invVat: 'VAT 22%',
      invTotal: 'Total',
    },
    spot2: {
      eyebrow: 'Payments',
      h2: 'Get paid automatically. Even while you sleep.',
      body: 'Send a payment link on WhatsApp with one tap. The customer pays, DR7 AI records the payment, issues the invoice and sends the confirmation — all on its own. You just watch the result.',
      steps: [
        ['Payment link sent', 'WhatsApp · 2 min ago'],
        ['Payment received', '€ 179.00 · Nexi'],
        ['Invoice generated', 'Automatic'],
        ['Confirmation sent to customer', 'WhatsApp'],
      ],
    },
    howTitle: 'Up and running in three steps.',
    how: [
      ['01', 'Set up fleet & services', 'Add vehicles, washes and price lists. We guide you through onboarding.'],
      ['02', 'Customers book & pay', 'Online booking, Nexi link on WhatsApp, pre-authorized deposit.'],
      ['03', 'AI handles the rest', 'Invoicing, confirmations, reminders and documents: all automatic.'],
    ],
    integrationsTitle: 'Works with the tools you already use.',
    pricing: {
      h2: 'Pricing tailored to your business.',
      sub: 'Every fleet is different. We build the right plan around vehicles, locations and volumes — no hidden costs, no lock-in.',
      popular: 'Most popular',
      custom: 'Custom',
      cta: 'Request a quote',
      note: 'No hidden costs. Pricing is defined together, based on your fleet, during the demo.',
      tiers: [
        { name: 'Starter', scope: 'Small fleets', features: ['Up to 10 vehicles', 'Bookings & calendar', 'Nexi Pay-by-Link payments', 'Customer profiles'], highlight: false },
        { name: 'Pro', scope: 'Growing fleets', features: ['Everything in Starter', 'SDI e-invoicing', 'AI WhatsApp automation', 'AI document reading', 'Loyalty wallet & referrals'], highlight: true },
        { name: 'Enterprise', scope: 'Multi-site & luxury', features: ['Unlimited vehicles', 'Multi-site', 'Dedicated API & integrations', 'Priority support'], highlight: false },
      ],
    },
    testimonialsTitle: "Once you run on DR7 AI, you don't go back.",
    testimonials: [
      ['“I get paid before the customer even reaches the office. No-shows and unpaid balances are gone.”', 'Marco R.', 'Car rental · Cagliari'],
      ['“Invoices go to SDI on their own. I cut admin hours by 70%.”', 'Giulia M.', 'Rent & Wash · Olbia'],
      ['“The WhatsApp assistant answers customers at night. It’s like having an extra employee.”', 'Andrea P.', 'Supercar Rental · Milan'],
    ],
    faqTitle: 'Frequently asked questions',
    faq: [
      ['Can I migrate my existing data?', 'Yes. We help you import existing customers, vehicles and bookings during onboarding, without stopping your business.'],
      ['Is it compliant with e-invoicing?', 'Absolutely. DR7 AI sends invoices to the Italian Interchange System (SDI) via Aruba, including penalties and damages, with credit notes.'],
      ['What support do you offer?', 'Support in Italian and English via WhatsApp and email. Pro and Enterprise plans get priority and dedicated onboarding.'],
      ['Is there a free trial?', "Yes, you can try DR7 AI with no commitment. Book a demo and we'll set up your trial environment."],
      ['Is my data safe?', 'Data is encrypted and hosted on European infrastructure, with continuous backups and role-based access.'],
      ['Does it work across multiple locations?', 'Yes. The Enterprise plan manages multiple sites and fleets from a single dashboard.'],
    ],
    demo: {
      h2: 'Ready to digitalize your rental business?',
      sub: "Book a free demo. We'll show you DR7 AI on your real numbers.",
      nome: 'Name',
      azienda: 'Company',
      email: 'Email',
      telefono: 'Phone',
      veicoli: 'Number of vehicles (optional)',
      send: 'Book a demo',
      sending: 'Sending…',
      okTitle: 'Thank you! Request received.',
      okSub: "We'll contact you within 24 hours to schedule the demo.",
      note: 'No commitment · Reply within 24h',
      err: 'Sending failed. Please retry or email us at info@dr7ai.com.',
    },
    footer: { features: 'Features', pricing: 'Pricing', faq: 'FAQ', demo: 'Demo' },
  },
} as const

const INTEGRATIONS = ['Nexi', 'Aruba · SDI', 'WhatsApp', 'Google Analytics', 'Supabase']

// ── Navbar ────────────────────────────────────────────────────
function Navbar({ lang, setLang, t }: { lang: Lang; setLang: (l: Lang) => void; t: (typeof CONTENT)['it'] }) {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  const links: [string, string][] = [
    [t.nav.features, '#funzionalita'],
    [t.nav.integrations, '#integrazioni'],
    [t.nav.pricing, '#prezzi'],
    [t.nav.faq, '#faq'],
  ]
  const LangToggle = () => (
    <div className="flex items-center rounded-full border border-white/15 p-0.5 text-xs">
      {(['it', 'en'] as Lang[]).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`rounded-full px-2.5 py-1 font-medium uppercase transition ${
            lang === l ? 'bg-white text-black' : 'text-white/60 hover:text-white'
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  )
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
            <a key={href} href={href} className="text-[13px] text-white/70 hover:text-white transition-colors">
              {label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-4">
          <LangToggle />
          <Btn href="#demo">{t.nav.demo}</Btn>
        </div>

        <button
          aria-label="Menu"
          onClick={() => setOpen((v) => !v)}
          className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-full"
        >
          <div className="space-y-1.5">
            <span className={`block h-0.5 w-6 bg-white transition-transform ${open ? 'translate-y-2 rotate-45' : ''}`} />
            <span className={`block h-0.5 w-6 bg-white transition-opacity ${open ? 'opacity-0' : ''}`} />
            <span className={`block h-0.5 w-6 bg-white transition-transform ${open ? '-translate-y-2 -rotate-45' : ''}`} />
          </div>
        </button>
      </nav>

      <div className={`md:hidden overflow-hidden transition-[max-height] duration-500 ease-in-out ${open ? 'max-h-96' : 'max-h-0'}`}>
        <div className="px-6 pb-6 pt-2 flex flex-col gap-1">
          {links.map(([label, href]) => (
            <a key={href} href={href} onClick={() => setOpen(false)} className="py-3 text-lg text-white/80 hover:text-white border-b border-white/5">
              {label}
            </a>
          ))}
          <div className="flex items-center justify-between pt-4">
            <LangToggle />
            <Btn href="#demo">{t.nav.demo}</Btn>
          </div>
        </div>
      </div>
    </header>
  )
}

// ── FAQ accordion ─────────────────────────────────────────────
function Faq({ items }: { items: readonly (readonly [string, string])[] }) {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <div className="mx-auto max-w-3xl divide-y divide-black/10">
      {items.map(([q, a], i) => (
        <div key={i} className="py-2">
          <button onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center justify-between gap-4 py-4 text-left">
            <span className="text-lg font-medium text-black">{q}</span>
            <span className={`shrink-0 text-2xl text-black/40 transition-transform duration-300 ${open === i ? 'rotate-45' : ''}`}>+</span>
          </button>
          <div className={`overflow-hidden transition-[max-height] duration-500 ease-in-out ${open === i ? 'max-h-60' : 'max-h-0'}`}>
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
  const [lang, setLang] = useState<Lang>('it')
  const t = CONTENT[lang]
  const [demoSent, setDemoSent] = useState(false)
  const [demoSending, setDemoSending] = useState(false)

  async function handleDemoSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const body = new URLSearchParams(new FormData(form) as any).toString()
    setDemoSending(true)
    try {
      await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body })
      setDemoSent(true)
      form.reset()
    } catch {
      alert(t.demo.err)
    } finally {
      setDemoSending(false)
    }
  }

  return (
    <div id="top" className="bg-ink text-white antialiased">
      <Navbar lang={lang} setLang={setLang} t={t} />

      {/* HERO */}
      <Section className="pt-32 pb-20 sm:pt-44 sm:pb-28 text-center">
        <div className="reveal">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 text-[13px] text-white/60">
            <span className="h-1.5 w-1.5 rounded-full bg-[#0a84ff]" /> {t.hero.badge}
          </span>
          <h1 className="mx-auto mt-7 max-w-4xl text-5xl sm:text-6xl md:text-7xl font-semibold leading-[1.05] tracking-tightest">
            {t.hero.h1a}
            <br />
            <span className="bg-gradient-to-r from-white to-white/50 bg-clip-text text-transparent">{t.hero.h1b}</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg sm:text-xl leading-relaxed text-white/60">{t.hero.sub}</p>
          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Btn href="#demo" full>{t.hero.cta1}</Btn>
            <Btn href="#funzionalita" variant="ghost" full>{t.hero.cta2}</Btn>
          </div>
          <p className="mt-5 text-[13px] text-white/40">{t.hero.trust}</p>
        </div>

        <div className="mt-16 sm:mt-20">
          <div className="relative mx-auto w-full max-w-5xl reveal">
            <div className="absolute -inset-8 -z-10 rounded-[40px] bg-gradient-to-tr from-[#0a84ff]/25 via-cyan-400/10 to-transparent blur-3xl" />
            <div className="overflow-hidden rounded-2xl border border-white/10 shadow-2xl shadow-black/60">
              <div className="flex items-center gap-2 border-b border-white/5 bg-[#1a1a1c] px-4 py-3">
                <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
                <span className="h-3 w-3 rounded-full bg-[#28c840]" />
                <span className="ml-3 text-xs text-white/40">{t.hero.frame}</span>
              </div>
              <img src="/dashboard.png" alt="Dashboard DR7 AI" className="block w-full" />
            </div>
          </div>
        </div>
      </Section>

      {/* INTRO */}
      <section className="bg-white text-black px-6 py-24 sm:py-36">
        <div className="mx-auto max-w-content text-center reveal">
          <p className="text-sm font-semibold uppercase tracking-widest text-[#0a84ff]">{t.intro.eyebrow}</p>
          <h2 className="mx-auto mt-4 max-w-4xl whitespace-pre-line text-4xl sm:text-5xl md:text-6xl font-semibold leading-tight tracking-tight">
            {t.intro.h2}
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg sm:text-xl leading-relaxed text-black/50">{t.intro.sub}</p>
        </div>
      </section>

      {/* FEATURES */}
      <section id="funzionalita" className="bg-[#f5f5f7] text-black px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-content">
          <h2 className="max-w-3xl text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight reveal">{t.featuresTitle}</h2>
          <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {t.features.map((f) => (
              <div key={f.title} className="reveal rounded-3xl bg-white p-7 shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl">
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

      {/* SPOTLIGHT 1 */}
      <section className="bg-ink px-6 py-24 sm:py-36">
        <div className="mx-auto grid max-w-content items-center gap-12 md:grid-cols-2">
          <div className="reveal">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#0a84ff]">{t.spot1.eyebrow}</p>
            <h2 className="mt-4 text-4xl sm:text-5xl font-semibold tracking-tight leading-tight">{t.spot1.h2}</h2>
            <p className="mt-6 text-lg leading-relaxed text-white/60">{t.spot1.body}</p>
            <ul className="mt-6 space-y-3 text-[15px] text-white/70">
              {t.spot1.bullets.map((b) => (
                <li key={b} className="flex items-center gap-3"><span className="text-[#28c840]">✓</span> {b}</li>
              ))}
            </ul>
          </div>
          <div className="reveal rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <div className="rounded-xl bg-white p-5 text-black shadow-2xl">
              <div className="flex items-center justify-between border-b border-black/10 pb-3">
                <span className="text-sm font-semibold">{t.spot1.invTitle}</span>
                <span className="rounded-full bg-[#28c840]/15 px-2 py-0.5 text-xs font-medium text-[#1a9c33]">{t.spot1.invStatus}</span>
              </div>
              <div className="space-y-2 py-4 text-sm">
                <div className="flex justify-between text-black/60"><span>Prime Full Clean</span><span>€ 20,41</span></div>
                <div className="flex justify-between text-black/60"><span>{t.spot1.invVat}</span><span>€ 4,49</span></div>
                <div className="flex justify-between border-t border-black/10 pt-2 font-semibold"><span>{t.spot1.invTotal}</span><span>€ 24,90</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SPOTLIGHT 2 */}
      <section className="bg-white text-black px-6 py-24 sm:py-36">
        <div className="mx-auto grid max-w-content items-center gap-12 md:grid-cols-2">
          <div className="reveal order-2 md:order-1 rounded-3xl bg-[#f5f5f7] p-8">
            <div className="space-y-3">
              {t.spot2.steps.map(([title, sub], i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0a84ff]/10 text-[#0a84ff]">✓</span>
                  <div>
                    <div className="text-sm font-medium">{title}</div>
                    <div className="text-xs text-black/40">{sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="reveal order-1 md:order-2">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#0a84ff]">{t.spot2.eyebrow}</p>
            <h2 className="mt-4 text-4xl sm:text-5xl font-semibold tracking-tight leading-tight">{t.spot2.h2}</h2>
            <p className="mt-6 text-lg leading-relaxed text-black/55">{t.spot2.body}</p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-[#f5f5f7] text-black px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-content text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight reveal">{t.howTitle}</h2>
          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-8">
            {t.how.map(([n, title, body]) => (
              <div key={n} className="reveal">
                <div className="text-5xl font-semibold text-[#0a84ff]/30">{n}</div>
                <h3 className="mt-4 text-xl font-semibold tracking-tight">{title}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-black/55">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INTEGRATIONS */}
      <section id="integrazioni" className="bg-ink px-6 py-24 sm:py-28">
        <div className="mx-auto max-w-content text-center reveal">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">{t.integrationsTitle}</h2>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            {INTEGRATIONS.map((i) => (
              <span key={i} className="rounded-full border border-white/10 bg-white/[0.03] px-6 py-3 text-[15px] text-white/70">{i}</span>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="prezzi" className="bg-white text-black px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-content">
          <div className="text-center reveal">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight">{t.pricing.h2}</h2>
            <p className="mt-4 mx-auto max-w-2xl text-lg text-black/50">{t.pricing.sub}</p>
          </div>
          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
            {t.pricing.tiers.map((p) => (
              <div
                key={p.name}
                className={`reveal rounded-3xl p-8 transition-transform duration-300 hover:-translate-y-1 ${
                  p.highlight ? 'bg-ink text-white shadow-2xl ring-2 ring-[#0a84ff]' : 'bg-[#f5f5f7] text-black'
                }`}
              >
                {p.highlight && (
                  <span className="mb-4 inline-block rounded-full bg-[#0a84ff] px-3 py-1 text-xs font-semibold">{t.pricing.popular}</span>
                )}
                <h3 className="text-xl font-semibold">{p.name}</h3>
                <p className={`mt-1 text-sm ${p.highlight ? 'text-white/50' : 'text-black/50'}`}>{p.scope}</p>
                <div className="mt-6">
                  <span className="text-3xl font-semibold tracking-tight">{t.pricing.custom}</span>
                </div>
                <a
                  href="#demo"
                  className={`mt-6 block rounded-full py-3 text-center text-[15px] font-medium transition-colors ${
                    p.highlight ? 'bg-[#0a84ff] text-white hover:bg-[#0a84ff]/90' : 'bg-black text-white hover:bg-black/80'
                  }`}
                >
                  {t.pricing.cta}
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
          <p className="mt-8 text-center text-sm text-black/40">{t.pricing.note}</p>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="bg-ink px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-content">
          <h2 className="max-w-2xl text-3xl sm:text-4xl font-semibold tracking-tight reveal">{t.testimonialsTitle}</h2>
          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
            {t.testimonials.map(([q, n, r]) => (
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

      {/* FAQ */}
      <section id="faq" className="bg-white text-black px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-content">
          <h2 className="mb-10 text-center text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight reveal">{t.faqTitle}</h2>
          <Faq items={t.faq} />
        </div>
      </section>

      {/* DEMO */}
      <section id="demo" className="relative overflow-hidden px-6 py-24 sm:py-32 bg-gradient-to-b from-ink via-[#0b1220] to-ink">
        <div className="absolute left-1/2 top-0 -z-0 h-96 w-96 -translate-x-1/2 rounded-full bg-[#0a84ff]/20 blur-[120px]" />
        <div className="relative mx-auto max-w-3xl text-center reveal">
          <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight">{t.demo.h2}</h2>
          <p className="mt-5 text-lg text-white/60">{t.demo.sub}</p>

          {demoSent ? (
            <div className="mx-auto mt-10 max-w-xl rounded-2xl border border-[#28c840]/30 bg-[#28c840]/10 p-8 text-center">
              <div className="text-3xl text-[#28c840]">✓</div>
              <p className="mt-3 text-lg font-medium text-white">{t.demo.okTitle}</p>
              <p className="mt-1 text-sm text-white/60">{t.demo.okSub}</p>
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
              <input required name="nome" placeholder={t.demo.nome} className="input" />
              <input required name="azienda" placeholder={t.demo.azienda} className="input" />
              <input required type="email" name="email" placeholder={t.demo.email} className="input" />
              <input required name="telefono" type="tel" placeholder={t.demo.telefono} className="input" />
              <input name="veicoli" placeholder={t.demo.veicoli} className="input sm:col-span-2" />
              <button
                type="submit"
                disabled={demoSending}
                className="sm:col-span-2 mt-2 rounded-full bg-[#0a84ff] py-3.5 text-[15px] font-medium text-white transition-all hover:bg-[#0a84ff]/90 active:scale-[0.98] disabled:opacity-60"
              >
                {demoSending ? t.demo.sending : t.demo.send}
              </button>
            </form>
          )}
          <p className="mt-4 text-xs text-white/40">{t.demo.note}</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 bg-ink px-6 py-14">
        <div className="mx-auto flex max-w-content flex-col items-center gap-6 sm:flex-row sm:justify-between">
          <div className="flex items-center">
            <img src={LOGO} alt="DR7 AI" className="h-10 w-auto" />
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-white/50">
            <a href="#funzionalita" className="hover:text-white">{t.footer.features}</a>
            <a href="#prezzi" className="hover:text-white">{t.footer.pricing}</a>
            <a href="#faq" className="hover:text-white">{t.footer.faq}</a>
            <a href="#demo" className="hover:text-white">{t.footer.demo}</a>
          </div>
          <div className="text-sm text-white/30">© 2026 DR7 AI</div>
        </div>
      </footer>
    </div>
  )
}
