/**
 * @fileoverview Application entry point and root setup.
 * 
 * This is the main entry file for the React application. It sets up the root element,
 * wraps the app in StrictMode for development checks, and configures HashRouter
 * for client-side routing. HashRouter is used for compatibility with static hosting
 * environments that don't support server-side routing.
 * 
 * Initializes IndexedDB persistence layer for offline functionality and PWA support.
 * 
 * @module main
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'
import { mockDb } from './mockDb.ts'

// Initialize the database from IndexedDB before rendering
mockDb.initialize().then(() => {
  // Find the root DOM element and render the React application
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <HashRouter>
        <App />
      </HashRouter>
    </StrictMode>,
  )
}).catch((error) => {
  console.error('Failed to initialize database:', error)
  // Render app anyway with in-memory data only
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <HashRouter>
        <App />
      </HashRouter>
    </StrictMode>,
  )
})
