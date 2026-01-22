import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Login } from './pages/Login'
import { Register } from './pages/Register'

// Placeholder - we'll build this in the next step
function Lists() {
  const { user, signOut } = useAuth()
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">My Lists</h1>
        <p className="text-gray-600 mb-4">Logged in as: {user?.email}</p>
        <button
          onClick={signOut}
          className="text-blue-600 hover:underline text-sm"
        >
          Sign out
        </button>
        <p className="mt-8 text-gray-500 text-sm">Lists page coming next...</p>
      </div>
    </div>
  )
}

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <Login />}
      />
      <Route
        path="/register"
        element={user ? <Navigate to="/" replace /> : <Register />}
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Lists />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App
