import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import AdminDashboard from './pages/admin/Dashboard'
import Clients from './pages/admin/Clients'
import NewClient from './pages/admin/NewClient'
import ClientDetail from './pages/admin/ClientDetail'
import ClientPortalDashboard from './pages/client/Dashboard'

function AppRoutes() {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={profile?.role === 'client' ? '/portal' : '/admin'} /> : <Login />} />

      {/* Admin / Team routes */}
      <Route path="/admin" element={<ProtectedRoute requireTeam><Layout /></ProtectedRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="clients" element={<Clients />} />
        <Route path="clients/new" element={<NewClient />} />
        <Route path="clients/:id" element={<ClientDetail />} />
        {/* These routes reuse ClientDetail with different default tabs */}
        <Route path="time" element={<AdminDashboard />} />
        <Route path="milestones" element={<AdminDashboard />} />
        <Route path="tasks" element={<AdminDashboard />} />
        <Route path="actions" element={<AdminDashboard />} />
        <Route path="comments" element={<AdminDashboard />} />
        <Route path="sessions" element={<AdminDashboard />} />
        <Route path="links" element={<AdminDashboard />} />
      </Route>

      {/* Client portal routes */}
      <Route path="/portal" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<ClientPortalDashboard />} />
        <Route path="milestones" element={<ClientPortalDashboard />} />
        <Route path="tasks" element={<ClientPortalDashboard />} />
        <Route path="actions" element={<ClientPortalDashboard />} />
        <Route path="sessions" element={<ClientPortalDashboard />} />
        <Route path="links" element={<ClientPortalDashboard />} />
        <Route path="comments" element={<ClientPortalDashboard />} />
      </Route>

      {/* Default redirect */}
      <Route path="*" element={<Navigate to={user ? (profile?.role === 'client' ? '/portal' : '/admin') : '/login'} />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
