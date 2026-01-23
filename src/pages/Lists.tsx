import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLists } from '../hooks/useLists'

export function Lists() {
  const { user, signOut } = useAuth()
  const { lists, loading, error, createList, deleteList } = useLists()
  const [newListName, setNewListName] = useState('')
  const [creating, setCreating] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)

  const formatDateTime = (date: Date) => {
    const day = date.getDate()
    const month = date.toLocaleString('en', { month: 'short' })
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${day} ${month}, ${hours}:${minutes}`
  }

  const todayDate = formatDateTime(new Date())

  const handleShowCreateForm = () => {
    setNewListName(todayDate)
    setShowCreateForm(true)
  }

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault()

    setCreating(true)
    const { error } = await createList(newListName.trim() || undefined)

    if (!error) {
      setNewListName('')
      setShowCreateForm(false)
    }

    setCreating(false)
  }

  const handleDeleteList = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    await deleteList(id)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Segnase</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:inline">
              {user?.email}
            </span>
            <Link
              to="/settings"
              className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              Settings
            </Link>
            <button
              onClick={signOut}
              className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-md mx-auto p-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">My Lists</h2>
          {!showCreateForm && (
            <button
              onClick={handleShowCreateForm}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              New list
            </button>
          )}
        </div>

        {/* Create list form */}
        {showCreateForm && (
          <form onSubmit={handleCreateList} className="mb-6">
            <div className="flex gap-2">
              <input
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="List name"
                autoFocus
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
              <button
                type="submit"
                disabled={creating}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? '...' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false)
                  setNewListName('')
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                Cancel
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Leave as current date/time or enter a custom name
            </p>
          </form>
        )}

        {/* Error state */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading...</div>
        )}

        {/* Empty state */}
        {!loading && lists.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 mb-4">No lists yet</p>
            {!showCreateForm && (
              <button
                onClick={handleShowCreateForm}
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Create your first list
              </button>
            )}
          </div>
        )}

        {/* Lists */}
        {!loading && lists.length > 0 && (
          <ul className="space-y-2">
            {lists.map((list) => (
              <li
                key={list.id}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
              >
                <div className="flex items-center justify-between p-4">
                  <Link
                    to={`/list/${list.id}`}
                    className="flex-1 font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    {list.name}
                  </Link>
                  <button
                    onClick={() => handleDeleteList(list.id, list.name)}
                    className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 p-1"
                    title="Delete list"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
