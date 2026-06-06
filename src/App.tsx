import React, { useEffect, useState } from 'react'

/* ────────────────────────────────────────────────────────────
   DR7 AI — storytelling landing (Apple-style, IT/EN, mobile-first)
   A scroll-driven narrative: tension → shift → reveal → moments
   → proof → invitation. All copy in CONTENT[lang].
   ──────────────────────────────────────────────────────────── */

const LOGO = '/dr7-logo.png'
type Lang = 'it' | 'en'

// ── Scroll-reveal hook ────────────────────────────────────────
function useReveal(dep: unknown) {
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
      { threshold: 0.15, rootMargin: '0px 0px -10% 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [dep])
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
    'inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-[15px] font-medium transition-all duration-300 active:scale-[0.97]'
  const styles = {
    primary: 'bg-[#0a84ff] text-white hover:bg-[#0a84ff]/90 shadow-lg shadow-[#0a84ff]/25',
    ghost: 'text-white/90 hover:text-white border border-white/15 hover:border-white/30 backdrop-blur',
  }[variant]
  return (
    <a href={href} className={`${base} ${styles} ${full ? 'w-full sm:w-auto' : ''}`}>
      {children}
    </a>
  )
}

// Full-height cinematic moment
function Moment({
  children,
  dark,
  className = '',
  id,
}: {
  children: React.ReactNode
  dark?: boolean
  className?: string
  id?: string
}) {
  return (
    <section
      id={id}
      className={`relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-24 ${
        dark ? 'bg-ink text-white' : 'bg-white text-black'
      } ${className}`}
    >
      <div className="mx-auto w-full max-w-content">{children}</div>
    </section>
  )
}

// ── Moment visuals ────────────────────────────────────────────
function ChatBubble({ side, children, sub }: { side: 'in' | 'out'; children: React.ReactNode; sub?: string }) {
  const out = side === 'out'
  return (
    <div className={`flex ${out ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
          out ? 'rounded-br-md bg-[#0a84ff] text-white' : 'rounded-bl-md bg-white/10 text-white/90'
        }`}
      >
        {children}
        {sub && <div className={`mt-1 text-[10px] ${out ? 'text-white/70' : 'text-white/40'}`}>{sub}</div>}
      </div>
    </div>
  )
}

function PaymentsVisual({ t }: { t: any }) {
  return (
    <div className="mx-auto w-full max-w-sm space-y-3 rounded-3xl border border-white/10 bg-white/[0.03] p-5">
      <ChatBubble side="out" sub="WhatsApp">
        {t.pv.link}
      </ChatBubble>
      <ChatBubble side="in">{t.pv.paid} ✓</ChatBubble>
      <div className="flex items-center justify-between rounded-xl bg-[#28c840]/10 px-4 py-3 text-sm">
        <span className="text-white/70">{t.pv.deposit}</span>
        <span className="font-semibold text-[#28c840]">€ 1.500 ✓</span>
      </div>
    </div>
  )
}

function InvoiceVisual({ t }: { t: any }) {
  return (
    <div className="mx-auto w-full max-w-sm rounded-2xl bg-white p-5 text-black shadow-2xl">
      <div className="flex items-center justify-between border-b border-black/10 pb-3">
        <span className="text-sm font-semibold">{t.iv.title}</span>
        <span className="rounded-full bg-[#28c840]/15 px-2 py-0.5 text-xs font-medium text-[#1a9c33]">{t.iv.status}</span>
      </div>
      <div className="space-y-2 py-4 text-sm">
        <div className="flex justify-between text-black/60"><span>Prime Full Clean</span><span>€ 20,41</span></div>
        <div className="flex justify-between text-black/60"><span>{t.iv.vat}</span><span>€ 4,49</span></div>
        <div className="flex justify-between border-t border-black/10 pt-2 font-semibold"><span>{t.iv.total}</span><span>€ 24,90</span></div>
      </div>
    </div>
  )
}

function ChatAIVisual({ t }: { t: any }) {
  return (
    <div className="mx-auto w-full max-w-sm space-y-3 rounded-3xl border border-white/10 bg-white/[0.03] p-5">
      <ChatBubble side="in" sub="02:14">{t.cv.q}</ChatBubble>
      <ChatBubble side="out" sub={t.cv.ai}>{t.cv.a}</ChatBubble>
    </div>
  )
}

function DocsVisual({ t }: { t: any }) {
  return (
    <div className="mx-auto grid w-full max-w-sm grid-cols-2 gap-3">
      <div className="flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-4xl">🪪</div>
      <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        {t.dv.fields.map((f: string) => (
          <div key={f} className="flex items-center gap-2 text-xs text-white/70">
            <span className="text-[#28c840]">✓</span> {f}
          </div>
        ))}
      </div>
    </div>
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

// ── Content (IT / EN) ─────────────────────────────────────────
const CONTENT = {
  it: {
    nav: { story: 'Storia', pricing: 'Prezzi', faq: 'FAQ', demo: 'Prenota una demo' },
    tension: { h: 'Gestisci il tuo noleggio\ncon assoluta precisione.', sub: 'Una sola piattaforma intelligente per prenotazioni, incassi e fatturazione.' },
    shift: { h: 'E se tutto parlasse\nla stessa lingua?' },
    reveal: {
      eyebrow: 'DR7 AI',
      h: 'Una piattaforma.\nTutto il tuo business.',
      sub: 'Prenotazioni, incassi, fatturazione e WhatsApp automatico — uniti da un’unica intelligenza.',
      cta1: 'Prenota una demo',
      cta2: 'Guarda come funziona',
      frame: 'dr7ai.com · Dashboard',
    },
    moments: {
      payments: { eyebrow: 'Incassi', h: 'Incassi prima ancora\nche il cliente arrivi.', sub: 'Un link Nexi su WhatsApp, cauzione pre-autorizzata, saldo tracciato. Basta rincorrere i pagamenti.' },
      invoice: { eyebrow: 'Fatturazione', h: 'La fattura\nsi scrive da sola.', sub: 'Ogni incasso diventa una fattura inviata al SDI. In automatico. Penali e danni inclusi.' },
      whatsapp: { eyebrow: 'Assistente AI', h: 'Risponde\nanche mentre dormi.', sub: 'Un assistente AI gestisce conferme, promemoria e domande dei clienti. 24 ore su 24.' },
      docs: { eyebrow: 'AI Documenti', h: 'Una foto.\nTutti i dati.', sub: 'Scatta una patente o una carta d’identità: l’AI compila la scheda cliente in pochi secondi.' },
    },
    pv: { link: 'Ecco il link per il pagamento del tuo noleggio 👇', paid: 'Pagamento ricevuto · € 179,00', deposit: 'Cauzione pre-autorizzata' },
    iv: { title: 'Fattura DR7-2026-1484', status: 'Inviata a SDI', vat: 'IVA 22%', total: 'Totale' },
    cv: { q: 'Buonasera, avete una Classe A per domani?', a: 'Sì! Disponibile da domani. Ti invio subito il link per prenotare.', ai: 'DR7 AI · risposta automatica' },
    dv: { fields: ['Nome e cognome', 'Numero patente', 'Scadenza', 'Indirizzo'] },
    integrationsTitle: 'Si integra con gli strumenti che già usi.',
    proofTitle: 'Non è teoria.\nÈ nato in un vero autonoleggio.',
    proofPoints: [
      ['Provato sul campo', 'Usato ogni giorno su prenotazioni, lavaggi e fatture reali — non in laboratorio.'],
      ['Pagamenti veri', 'Nexi, cauzioni pre-autorizzate e invio al SDI testati su transazioni reali.'],
      ['Pensato da chi noleggia', 'Ogni funzione nasce da un problema concreto di chi gestisce una flotta.'],
    ],
    pricing: {
      h2: 'Un prezzo su misura\nper la tua attività.',
      sub: 'Ogni flotta è diversa. Costruiamo il piano giusto in base a veicoli, sedi e volumi — nessun costo nascosto, nessun vincolo.',
      popular: 'Più scelto', custom: 'Su misura', cta: 'Richiedi un preventivo',
      note: 'Nessun costo nascosto. Il prezzo viene definito insieme, in base alla tua flotta, durante la demo.',
      tiers: [
        { name: 'Starter', scope: 'Piccole flotte', features: ['Fino a 10 veicoli', 'Prenotazioni & calendario', 'Pagamenti Nexi Pay-by-Link', 'Schede cliente'], highlight: false },
        { name: 'Pro', scope: 'Flotte in crescita', features: ['Tutto di Starter', 'Fatturazione elettronica SDI', 'Automazioni WhatsApp con AI', 'AI lettura documenti', 'Wallet fedeltà & referral'], highlight: true },
        { name: 'Enterprise', scope: 'Multi-sede & luxury', features: ['Veicoli illimitati', 'Multi-sede', 'API & integrazioni dedicate', 'Supporto prioritario'], highlight: false },
      ],
    },
    faqTitle: 'Domande frequenti',
    faq: [
      ['Posso migrare i miei dati attuali?', 'Sì. Ti aiutiamo a importare clienti, veicoli e prenotazioni esistenti durante l’onboarding, senza fermare l’attività.'],
      ['È conforme alla fatturazione elettronica?', 'Assolutamente. DR7 AI invia le fatture al Sistema di Interscambio (SDI) tramite Aruba, incluse penali e danni, con note di credito.'],
      ['Che supporto offrite?', 'Supporto in italiano e inglese via WhatsApp ed email. I piani Pro ed Enterprise hanno priorità e onboarding dedicato.'],
      ['Esiste una prova gratuita?', 'Sì, puoi provare DR7 AI senza impegno. Prenota una demo e attiviamo il tuo ambiente di prova.'],
      ['I dati sono al sicuro?', 'I dati sono cifrati e ospitati su infrastruttura europea, con backup continui e accessi a permessi/ruoli.'],
    ],
    demo: {
      h2: 'Pronto a digitalizzare\nil tuo noleggio?',
      sub: 'Prenota una demo gratuita. Ti mostriamo DR7 AI sui tuoi numeri reali.',
      nome: 'Nome', azienda: 'Azienda', email: 'Email', telefono: 'Telefono', veicoli: 'Numero di veicoli (facoltativo)',
      send: 'Prenota una demo', sending: 'Invio in corso…',
      okTitle: 'Grazie! Richiesta ricevuta.', okSub: 'Ti contattiamo entro 24 ore per fissare la demo.',
      note: 'Nessun impegno · Risposta entro 24h', err: 'Invio non riuscito. Riprova o scrivici a info@dr7ai.com.',
    },
    footer: { demo: 'Demo', pricing: 'Prezzi', faq: 'FAQ' },
  },
  en: {
    nav: { story: 'Story', pricing: 'Pricing', faq: 'FAQ', demo: 'Book a demo' },
    tension: { h: 'Run your rental business\nwith absolute precision.', sub: 'One intelligent platform for bookings, payments and invoicing.' },
    shift: { h: 'What if it all spoke\nthe same language?' },
    reveal: {
      eyebrow: 'DR7 AI',
      h: 'One platform.\nYour entire business.',
      sub: 'Bookings, payments, invoicing and automated WhatsApp — united by a single intelligence.',
      cta1: 'Book a demo',
      cta2: 'See how it works',
      frame: 'dr7ai.com · Dashboard',
    },
    moments: {
      payments: { eyebrow: 'Payments', h: 'Get paid before the\ncustomer even arrives.', sub: 'A Nexi link on WhatsApp, pre-authorized deposit, balance tracked. Stop chasing payments.' },
      invoice: { eyebrow: 'Invoicing', h: 'The invoice\nwrites itself.', sub: 'Every payment becomes an invoice sent to SDI. Automatically. Penalties and damages included.' },
      whatsapp: { eyebrow: 'AI Assistant', h: 'It answers\neven while you sleep.', sub: 'An AI assistant handles confirmations, reminders and customer questions. 24/7.' },
      docs: { eyebrow: 'AI Documents', h: 'One photo.\nAll the data.', sub: 'Snap a licence or ID: AI fills in the customer profile in seconds.' },
    },
    pv: { link: "Here's the link to pay for your rental 👇", paid: 'Payment received · € 179.00', deposit: 'Deposit pre-authorized' },
    iv: { title: 'Invoice DR7-2026-1484', status: 'Sent to SDI', vat: 'VAT 22%', total: 'Total' },
    cv: { q: 'Hi, do you have an A-Class for tomorrow?', a: "Yes! Available from tomorrow. I'll send you the booking link now.", ai: 'DR7 AI · automatic reply' },
    dv: { fields: ['Full name', 'Licence number', 'Expiry', 'Address'] },
    integrationsTitle: 'Works with the tools you already use.',
    proofTitle: 'Not theory.\nBuilt inside a real rental business.',
    proofPoints: [
      ['Field-tested', 'Used every day on real bookings, washes and invoices — not in a lab.'],
      ['Real payments', 'Nexi, pre-authorized deposits and SDI submission tested on real transactions.'],
      ['Built by operators', 'Every feature comes from a real problem fleet operators face.'],
    ],
    pricing: {
      h2: 'Pricing tailored\nto your business.',
      sub: 'Every fleet is different. We build the right plan around vehicles, locations and volumes — no hidden costs, no lock-in.',
      popular: 'Most popular', custom: 'Custom', cta: 'Request a quote',
      note: 'No hidden costs. Pricing is defined together, based on your fleet, during the demo.',
      tiers: [
        { name: 'Starter', scope: 'Small fleets', features: ['Up to 10 vehicles', 'Bookings & calendar', 'Nexi Pay-by-Link payments', 'Customer profiles'], highlight: false },
        { name: 'Pro', scope: 'Growing fleets', features: ['Everything in Starter', 'SDI e-invoicing', 'AI WhatsApp automation', 'AI document reading', 'Loyalty wallet & referrals'], highlight: true },
        { name: 'Enterprise', scope: 'Multi-site & luxury', features: ['Unlimited vehicles', 'Multi-site', 'Dedicated API & integrations', 'Priority support'], highlight: false },
      ],
    },
    faqTitle: 'Frequently asked questions',
    faq: [
      ['Can I migrate my existing data?', 'Yes. We help you import existing customers, vehicles and bookings during onboarding, without stopping your business.'],
      ['Is it compliant with e-invoicing?', 'Absolutely. DR7 AI sends invoices to the Italian Interchange System (SDI) via Aruba, including penalties and damages, with credit notes.'],
      ['What support do you offer?', 'Support in Italian and English via WhatsApp and email. Pro and Enterprise plans get priority and dedicated onboarding.'],
      ['Is there a free trial?', "Yes, you can try DR7 AI with no commitment. Book a demo and we'll set up your trial environment."],
      ['Is my data safe?', 'Data is encrypted and hosted on European infrastructure, with continuous backups and role-based access.'],
    ],
    demo: {
      h2: 'Ready to digitalize\nyour rental business?',
      sub: "Book a free demo. We'll show you DR7 AI on your real numbers.",
      nome: 'Name', azienda: 'Company', email: 'Email', telefono: 'Phone', veicoli: 'Number of vehicles (optional)',
      send: 'Book a demo', sending: 'Sending…',
      okTitle: 'Thank you! Request received.', okSub: "We'll contact you within 24 hours to schedule the demo.",
      note: 'No commitment · Reply within 24h', err: 'Sending failed. Please retry or email us at info@dr7ai.com.',
    },
    footer: { demo: 'Demo', pricing: 'Pricing', faq: 'FAQ' },
  },
} as const

const INTEGRATIONS = ['Nexi', 'Aruba · SDI', 'WhatsApp', 'Google Analytics', 'Supabase']

// ── Navbar ────────────────────────────────────────────────────
function Navbar({ lang, setLang, t }: { lang: Lang; setLang: (l: Lang) => void; t: (typeof CONTENT)['it'] }) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${scrolled ? 'bg-black/70 backdrop-blur-xl border-b border-white/5' : 'bg-transparent'}`}>
      <nav className="mx-auto flex max-w-content items-center justify-between px-6 h-14">
        <a href="#top" className="flex items-center">
          <img src={LOGO} alt="DR7 AI" className="h-10 sm:h-11 w-auto" />
        </a>
        <div className="hidden sm:flex items-center gap-6">
          <a href="#prezzi" className="text-[13px] text-white/70 hover:text-white transition-colors">{t.nav.pricing}</a>
          <a href="#faq" className="text-[13px] text-white/70 hover:text-white transition-colors">{t.nav.faq}</a>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-full border border-white/15 p-0.5 text-xs">
            {(['it', 'en'] as Lang[]).map((l) => (
              <button key={l} onClick={() => setLang(l)} className={`rounded-full px-2.5 py-1 font-medium uppercase transition ${lang === l ? 'bg-white text-black' : 'text-white/60 hover:text-white'}`}>
                {l}
              </button>
            ))}
          </div>
          <a href="#demo" className="rounded-full bg-[#0a84ff] px-4 py-2 text-[13px] font-medium text-white transition hover:bg-[#0a84ff]/90">
            {t.nav.demo}
          </a>
        </div>
      </nav>
    </header>
  )
}

// ── A capability "moment" (full screen, headline + visual) ────
function CapabilityMoment({ m, dark, visual, id }: { m: { eyebrow: string; h: string; sub: string }; dark: boolean; visual: React.ReactNode; id?: string }) {
  return (
    <Moment dark={dark} id={id}>
      <div className="mx-auto grid max-w-5xl items-center gap-12 md:grid-cols-2">
        <div className="reveal text-center md:text-left">
          <p className="text-sm font-semibold uppercase tracking-widest text-[#0a84ff]">{m.eyebrow}</p>
          <h2 className={`mt-4 whitespace-pre-line text-3xl sm:text-5xl md:text-6xl font-semibold leading-[1.05] tracking-tight ${dark ? '' : 'text-black'}`}>
            {m.h}
          </h2>
          <p className={`mx-auto md:mx-0 mt-6 max-w-md text-lg leading-relaxed ${dark ? 'text-white/55' : 'text-black/55'}`}>{m.sub}</p>
        </div>
        <div className="reveal">{visual}</div>
      </div>
    </Moment>
  )
}

// ── App ───────────────────────────────────────────────────────
export default function App() {
  const [lang, setLang] = useState<Lang>('it')
  const t = CONTENT[lang]
  useReveal(lang)
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

      {/* ACT 1 — TENSION */}
      <Moment dark>
        <div className="reveal text-center">
          <h1 className="mx-auto max-w-4xl whitespace-pre-line text-4xl sm:text-6xl md:text-7xl font-semibold leading-[1.05] tracking-tightest text-white/90">
            {t.tension.h}
          </h1>
          <p className="mx-auto mt-7 max-w-xl text-lg sm:text-xl leading-relaxed text-white/40">{t.tension.sub}</p>
        </div>
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce text-white/30">↓</div>
      </Moment>

      {/* ACT 2 — SHIFT */}
      <Moment dark className="bg-gradient-to-b from-ink via-[#0b1220] to-ink">
        <div className="reveal text-center">
          <h2 className="mx-auto max-w-4xl whitespace-pre-line text-4xl sm:text-6xl md:text-7xl font-semibold leading-[1.05] tracking-tightest">
            <span className="bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent">{t.shift.h}</span>
          </h2>
        </div>
      </Moment>

      {/* ACT 3 — REVEAL (product) */}
      <Moment dark id="prodotto" className="min-h-0 py-28 sm:py-36">
        <div className="reveal text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#0a84ff]">{t.reveal.eyebrow}</p>
          <h2 className="mx-auto mt-5 max-w-4xl whitespace-pre-line text-4xl sm:text-6xl md:text-7xl font-semibold leading-[1.05] tracking-tightest">
            {t.reveal.h}
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg sm:text-xl leading-relaxed text-white/60">{t.reveal.sub}</p>
          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Btn href="#demo" full>{t.reveal.cta1}</Btn>
            <Btn href="#payments" variant="ghost" full>{t.reveal.cta2}</Btn>
          </div>
        </div>
        <div className="reveal mt-16 sm:mt-20">
          <div className="relative mx-auto w-full max-w-5xl">
            <div className="absolute -inset-8 -z-10 rounded-[40px] bg-gradient-to-tr from-[#0a84ff]/25 via-cyan-400/10 to-transparent blur-3xl" />
            <div className="overflow-hidden rounded-2xl border border-white/10 shadow-2xl shadow-black/60">
              <div className="flex items-center gap-2 border-b border-white/5 bg-[#1a1a1c] px-4 py-3">
                <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
                <span className="h-3 w-3 rounded-full bg-[#28c840]" />
                <span className="ml-3 text-xs text-white/40">{t.reveal.frame}</span>
              </div>
              <img src="/dashboard.png" alt="Dashboard DR7 AI" className="block w-full" />
            </div>
          </div>
        </div>
      </Moment>

      {/* ACT 4 — MOMENTS */}
      <CapabilityMoment id="payments" m={t.moments.payments} dark={false} visual={<div className="rounded-3xl bg-ink p-5"><PaymentsVisual t={t} /></div>} />
      <CapabilityMoment m={t.moments.invoice} dark visual={<InvoiceVisual t={t} />} />
      <CapabilityMoment m={t.moments.whatsapp} dark={false} visual={<div className="rounded-3xl bg-ink p-5"><ChatAIVisual t={t} /></div>} />
      <CapabilityMoment m={t.moments.docs} dark visual={<DocsVisual t={t} />} />

      {/* INTEGRATIONS */}
      <section className="bg-ink px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-content text-center reveal">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white/80">{t.integrationsTitle}</h2>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            {INTEGRATIONS.map((i) => (
              <span key={i} className="rounded-full border border-white/10 bg-white/[0.03] px-5 py-2.5 text-sm text-white/70">{i}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ACT 5 — PROOF */}
      <Moment dark className="min-h-0 py-28 sm:py-36">
        <h2 className="reveal mx-auto max-w-3xl whitespace-pre-line text-center text-3xl sm:text-5xl md:text-6xl font-semibold tracking-tight">
          {t.proofTitle}
        </h2>
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          {t.proofPoints.map(([title, body]) => (
            <div key={title} className="reveal rounded-3xl border border-white/10 bg-white/[0.03] p-7">
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-white/55">{body}</p>
            </div>
          ))}
        </div>
      </Moment>

      {/* ACT 6 — INVITATION: pricing */}
      <section id="prezzi" className="bg-white text-black px-6 py-28 sm:py-36">
        <div className="mx-auto max-w-content">
          <div className="text-center reveal">
            <h2 className="mx-auto max-w-2xl whitespace-pre-line text-3xl sm:text-5xl md:text-6xl font-semibold tracking-tight">{t.pricing.h2}</h2>
            <p className="mt-5 mx-auto max-w-2xl text-lg text-black/50">{t.pricing.sub}</p>
          </div>
          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
            {t.pricing.tiers.map((p) => (
              <div key={p.name} className={`reveal rounded-3xl p-8 transition-transform duration-300 hover:-translate-y-1 ${p.highlight ? 'bg-ink text-white shadow-2xl ring-2 ring-[#0a84ff]' : 'bg-[#f5f5f7] text-black'}`}>
                {p.highlight && <span className="mb-4 inline-block rounded-full bg-[#0a84ff] px-3 py-1 text-xs font-semibold">{t.pricing.popular}</span>}
                <h3 className="text-xl font-semibold">{p.name}</h3>
                <p className={`mt-1 text-sm ${p.highlight ? 'text-white/50' : 'text-black/50'}`}>{p.scope}</p>
                <div className="mt-6"><span className="text-3xl font-semibold tracking-tight">{t.pricing.custom}</span></div>
                <a href="#demo" className={`mt-6 block rounded-full py-3 text-center text-[15px] font-medium transition-colors ${p.highlight ? 'bg-[#0a84ff] text-white hover:bg-[#0a84ff]/90' : 'bg-black text-white hover:bg-black/80'}`}>
                  {t.pricing.cta}
                </a>
                <ul className="mt-7 space-y-3 text-[15px]">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-3"><span className="text-[#0a84ff]">✓</span><span className={p.highlight ? 'text-white/80' : 'text-black/70'}>{f}</span></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-black/40">{t.pricing.note}</p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-white text-black px-6 pb-28 sm:pb-36">
        <div className="mx-auto max-w-content">
          <h2 className="mb-10 text-center text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight reveal">{t.faqTitle}</h2>
          <Faq items={t.faq} />
        </div>
      </section>

      {/* DEMO */}
      <section id="demo" className="relative overflow-hidden px-6 py-28 sm:py-36 bg-gradient-to-b from-ink via-[#0b1220] to-ink">
        <div className="absolute left-1/2 top-0 -z-0 h-96 w-96 -translate-x-1/2 rounded-full bg-[#0a84ff]/20 blur-[120px]" />
        <div className="relative mx-auto max-w-3xl text-center reveal">
          <h2 className="mx-auto max-w-2xl whitespace-pre-line text-3xl sm:text-5xl md:text-6xl font-semibold tracking-tight">{t.demo.h2}</h2>
          <p className="mt-5 text-lg text-white/60">{t.demo.sub}</p>
          {demoSent ? (
            <div className="mx-auto mt-10 max-w-xl rounded-2xl border border-[#28c840]/30 bg-[#28c840]/10 p-8 text-center">
              <div className="text-3xl text-[#28c840]">✓</div>
              <p className="mt-3 text-lg font-medium text-white">{t.demo.okTitle}</p>
              <p className="mt-1 text-sm text-white/60">{t.demo.okSub}</p>
            </div>
          ) : (
            <form name="demo" method="POST" data-netlify="true" netlify-honeypot="bot-field" onSubmit={handleDemoSubmit} className="mx-auto mt-10 grid max-w-xl grid-cols-1 gap-3 text-left sm:grid-cols-2">
              <input type="hidden" name="form-name" value="demo" />
              <p className="hidden"><label>Non compilare: <input name="bot-field" /></label></p>
              <input required name="nome" placeholder={t.demo.nome} className="input" />
              <input required name="azienda" placeholder={t.demo.azienda} className="input" />
              <input required type="email" name="email" placeholder={t.demo.email} className="input" />
              <input required name="telefono" type="tel" placeholder={t.demo.telefono} className="input" />
              <input name="veicoli" placeholder={t.demo.veicoli} className="input sm:col-span-2" />
              <button type="submit" disabled={demoSending} className="sm:col-span-2 mt-2 rounded-full bg-[#0a84ff] py-3.5 text-[15px] font-medium text-white transition-all hover:bg-[#0a84ff]/90 active:scale-[0.98] disabled:opacity-60">
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
          <img src={LOGO} alt="DR7 AI" className="h-10 w-auto" />
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-white/50">
            <a href="#prezzi" className="hover:text-white">{t.footer.pricing}</a>
            <a href="#faq" className="hover:text-white">{t.footer.faq}</a>
            <a href="#demo" className="hover:text-white">{t.footer.demo}</a>
            <a href="mailto:info@dr7ai.com" className="hover:text-white">info@dr7ai.com</a>
          </div>
          <div className="text-sm text-white/30">© 2026 DR7 AI</div>
        </div>
      </footer>
    </div>
  )
}
