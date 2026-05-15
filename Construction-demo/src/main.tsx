/**
 * @fileoverview Application entry point and root setup.
 * 
 * This is the main entry file for the React application. It sets up the root element,
 * wraps the app in StrictMode for development checks, and configures HashRouter
 * for client-side routing. HashRouter is used for compatibility with static hosting
 * environments that don't support server-side routing.
 * 
 * @module main
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'

// Find the root DOM element and render the React application
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
)
