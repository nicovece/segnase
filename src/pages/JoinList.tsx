import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function JoinList() {
  const { token } = useParams<{ token: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'joining' | 'success' | 'error' | 'already_member'>('loading')
  const [listName, setListName] = useState<string | null>(null)
  const [listId, setListId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token || !user) return

    const joinList = async () => {
      // Find list by share token
      const { data: list, error: listError } = await supabase
        .from('lists')
        .select('id, name')
        .eq('share_token', token)
        .single()

      if (listError || !list) {
        setError('Invalid or expired share link')
        setStatus('error')
        return
      }

      setListName(list.name)
      setListId(list.id)

      // Check if already a member
      const { data: existingMember } = await supabase
        .from('list_members')
        .select('list_id')
        .eq('list_id', list.id)
        .eq('user_id', user.id)
        .single()

      if (existingMember) {
        setStatus('already_member')
        return
      }

      // Join the list as editor
      setStatus('joining')
      const { error: joinError } = await supabase
        .from('list_members')
        .insert({
          list_id: list.id,
          user_id: user.id,
          role: 'editor',
        })

      if (joinError) {
        setError(joinError.message)
        setStatus('error')
        return
      }

      setStatus('success')
    }

    joinList()
  }, [token, user])

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-sm w-full bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Join a List</h1>
          <p className="text-gray-600 mb-4">Sign in to join this shared list</p>
          <Link
            to={`/login?redirect=/join/${token}`}
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700"
          >
            Sign in
          </Link>
          <p className="text-sm text-gray-500 mt-3">
            Don't have an account?{' '}
            <Link to={`/register?redirect=/join/${token}`} className="text-blue-600 hover:underline">
              Register
            </Link>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-sm w-full bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
        {status === 'loading' && (
          <>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Finding list...</h1>
            <p className="text-gray-500">Please wait</p>
          </>
        )}

        {status === 'joining' && (
          <>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Joining "{listName}"</h1>
            <p className="text-gray-500">Please wait...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Joined "{listName}"!</h1>
            <p className="text-gray-600 mb-4">You can now view and edit this list</p>
            <button
              onClick={() => navigate(`/list/${listId}`)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700"
            >
              Open list
            </button>
          </>
        )}

        {status === 'already_member' && (
          <>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Already a member</h1>
            <p className="text-gray-600 mb-4">You're already part of "{listName}"</p>
            <button
              onClick={() => navigate(`/list/${listId}`)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700"
            >
              Open list
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Couldn't join list</h1>
            <p className="text-red-600 mb-4">{error}</p>
            <Link
              to="/"
              className="inline-block bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200"
            >
              Go to my lists
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
