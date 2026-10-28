import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Lo stato nascosto delle rivelazioni si accende solo se il JavaScript e'
// partito: senza questa classe la pagina resta leggibile.
document.documentElement.classList.add('reveal-ready')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
