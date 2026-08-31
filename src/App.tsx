// dr7ai.com — due cose sotto lo stesso indirizzo:
//   · la vetrina pubblica del prodotto,
//   · /portale, l'area riservata da cui nasce l'istanza di un'altra azienda.
//
// Gli indirizzi delle aziende (dr7ai.com/RENTCAGLIARI) non passano di qui:
// li intercetta il proxy di frontiera prima che React entri in gioco.
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Vetrina from './Vetrina'
import Portale from './portale/Portale'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Vetrina />} />
        <Route path="/portale/*" element={<Portale />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
