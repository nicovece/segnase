import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import './index.css'
import App from './App'

// Fix iOS PWA standalone mode input focus bug
// Adding a touch listener "wakes up" iOS touch handling
if ('standalone' in navigator || window.matchMedia('(display-mode: standalone)').matches) {
  document.addEventListener('touchstart', () => {}, { passive: true })
}

function AppWithTheme() {
  const { profile } = useAuth()
  return (
    <ThemeProvider initialTheme={profile?.theme_preference}>
      <App />
    </ThemeProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AppWithTheme />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
