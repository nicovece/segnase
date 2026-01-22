import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'

// Placeholder pages - we'll build these next
function Login() {
  return <div className="p-4">Login page (coming next)</div>
}

function Register() {
  return <div className="p-4">Register page (coming next)</div>
}

function Lists() {
  const { user, signOut } = useAuth()
  return (
    <div className="p-4">
      <p>Logged in as: {user?.email}</p>
      <button onClick={signOut} className="mt-2 text-blue-600 underline">
        Sign out
      </button>
    </div>
  )
}

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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
