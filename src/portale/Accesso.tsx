// Accesso al portale. Chi entra non e' ancora abilitato a fare niente: il
// server ricontrolla l'indirizzo in portal_admins a ogni chiamata.
import { useState } from 'react'
import { supabase } from './cliente'

export default function Accesso() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errore, setErrore] = useState<string | null>(null)
  const [attesa, setAttesa] = useState(false)

  async function entra(e: React.FormEvent) {
    e.preventDefault()
    setAttesa(true); setErrore(null)
    const { error } = await supabase!.auth.signInWithPassword({ email: email.trim().toLowerCase(), password })
    if (error) setErrore('Indirizzo o password non validi.')
    setAttesa(false)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white grid place-items-center px-5">
      <form onSubmit={entra} className="w-full max-w-sm">
        <img src="/dr7-logo.png" alt="DR7 AI" className="h-9 w-auto mx-auto mb-8" />
        <h1 className="text-lg font-medium text-center mb-1">Portale istanze</h1>
        <p className="text-xs text-white/40 text-center mb-8">Area riservata</p>

        <label className="block text-xs text-white/50 mb-1.5">Indirizzo</label>
        <input
          type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus
          className="w-full mb-4 px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm
                     focus:outline-none focus:border-white/30 transition-colors"
        />

        <label className="block text-xs text-white/50 mb-1.5">Password</label>
        <input
          type="password" value={password} onChange={e => setPassword(e.target.value)} required
          className="w-full mb-6 px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm
                     focus:outline-none focus:border-white/30 transition-colors"
        />

        {errore && <p className="text-xs text-red-400 mb-4">{errore}</p>}

        <button
          type="submit" disabled={attesa}
          className="w-full py-2.5 rounded-xl bg-white text-black text-sm font-medium
                     hover:bg-white/90 disabled:opacity-50 transition-colors"
        >
          {attesa ? 'Verifica...' : 'Entra'}
        </button>
      </form>
    </div>
  )
}
