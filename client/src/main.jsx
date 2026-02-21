import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { enableContentProtection } from './utils/contentProtection.js'

// Enable protection only outside dev so devtools stay available during development
if (!import.meta.env.DEV) {
  enableContentProtection()
}

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
)