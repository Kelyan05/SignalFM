import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {BrowserRouter} from "react-router-dom"
import './css/index.css'
import App from './App.jsx'
import Api from './services/api.js'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>    
    <App />
    <Api />
    </BrowserRouter>
  </StrictMode>
)
