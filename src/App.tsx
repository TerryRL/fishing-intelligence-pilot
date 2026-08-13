import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { AppDataProvider } from './contexts/AppDataContext'
import { useAuth } from './contexts/AuthContext'
import BottomNav from './components/BottomNav'
import SyncIndicator from './components/SyncIndicator'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import StartFishingPage from './pages/StartFishingPage'
import ActiveFishingPage from './pages/ActiveFishingPage'
import QuickCatchPage from './pages/QuickCatchPage'
import ChangeLurePage from './pages/ChangeLurePage'
import TacklePage from './pages/TacklePage'
import TripsPage from './pages/TripsPage'
import TripDetailPage from './pages/TripDetailPage'
import InsightsPage from './pages/InsightsPage'
import RecommendPage from './pages/RecommendPage'
import MapPage from './pages/MapPage'
import SettingsPage from './pages/SettingsPage'

function LoadingScreen() {
  return <div className="splash"><div className="fish-logo">FI</div><h1>Fishing Intelligence</h1><p>Loading your fishing history…</p></div>
}

function ConfigRequired() {
  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="fish-logo">FI</div>
        <h1>Connect Supabase</h1>
        <p>This pilot needs a Supabase project before it can store accounts and fishing data.</p>
        <ol className="setup-list">
          <li>Copy <code>.env.example</code> to <code>.env.local</code>.</li>
          <li>Add your Supabase project URL and publishable key.</li>
          <li>Apply the migration in <code>supabase/migrations</code>.</li>
          <li>Restart the development server.</li>
        </ol>
        <p className="muted">The repository README contains the exact setup steps.</p>
      </div>
    </div>
  )
}

function ProtectedLayout() {
  const { user } = useAuth()
  const location = useLocation()
  if (!user) return <Navigate to="/login" replace />

  const immersive = ['/fish', '/catch', '/change-lure', '/start'].includes(location.pathname)

  return (
    <AppDataProvider>
      <div className="app-frame">
        <main className={immersive ? 'app-main immersive' : 'app-main'}>
          <Outlet />
        </main>
        {!immersive && <BottomNav />}
        <SyncIndicator />
      </div>
    </AppDataProvider>
  )
}

export default function App() {
  const { configured, loading, user } = useAuth()
  if (!configured) return <ConfigRequired />
  if (loading) return <LoadingScreen />

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/start" element={<StartFishingPage />} />
        <Route path="/fish" element={<ActiveFishingPage />} />
        <Route path="/catch" element={<QuickCatchPage />} />
        <Route path="/change-lure" element={<ChangeLurePage />} />
        <Route path="/tackle" element={<TacklePage />} />
        <Route path="/trips" element={<TripsPage />} />
        <Route path="/trips/:id" element={<TripDetailPage />} />
        <Route path="/insights" element={<InsightsPage />} />
        <Route path="/recommend" element={<RecommendPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
