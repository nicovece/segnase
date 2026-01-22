import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useList } from '../hooks/useList'
import { useItems } from '../hooks/useItems'
import type { Item } from '../lib/types'

function ItemRow({
  item,
  onToggle,
  onDelete,
}: {
  item: Item
  onToggle: () => void
  onDelete: () => void
}) {
  return (
    <li className={`flex items-start gap-3 p-3 bg-white border border-gray-200 rounded-lg ${item.checked ? 'opacity-60' : ''}`}>
      <button
        onClick={onToggle}
        className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
          item.checked
            ? 'bg-blue-600 border-blue-600 text-white'
            : 'border-gray-300 hover:border-blue-500'
        }`}
      >
        {item.checked && (
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className={`font-medium ${item.checked ? 'line-through text-gray-500' : 'text-gray-900'}`}>
            {item.name}
          </span>
          {item.quantity && (
            <span className="text-sm text-gray-500">
              {item.quantity}
            </span>
          )}
        </div>
        {item.notes && (
          <p className="text-sm text-gray-500 mt-0.5">{item.notes}</p>
        )}
      </div>

      <button
        onClick={onDelete}
        className="text-gray-400 hover:text-red-600 p-1 flex-shrink-0"
        title="Delete item"
      >
        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </li>
  )
}

function AddItemForm({ onAdd }: { onAdd: (name: string, quantity?: string, notes?: string) => Promise<void> }) {
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('')
  const [showDetails, setShowDetails] = useState(false)
  const [notes, setNotes] = useState('')
  const [adding, setAdding] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setAdding(true)
    await onAdd(name.trim(), quantity.trim() || undefined, notes.trim() || undefined)
    setName('')
    setQuantity('')
    setNotes('')
    setShowDetails(false)
    setAdding(false)
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6">
      <div className="flex gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Add item..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          className={`px-3 py-2 border rounded-lg ${showDetails ? 'border-blue-500 text-blue-600' : 'border-gray-300 text-gray-600'} hover:border-blue-500`}
          title="Add details"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
        <button
          type="submit"
          disabled={adding || !name.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {adding ? '...' : 'Add'}
        </button>
      </div>

      {showDetails && (
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="Quantity (e.g., 2 liters)"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
          />
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
          />
        </div>
      )}
    </form>
  )
}

export function List() {
  const { id } = useParams<{ id: string }>()
  const { list, loading: listLoading, error: listError, archiveList, activateList, refetch: refetchList } = useList(id!)
  const { items, loading: itemsLoading, error: itemsError, addItem, toggleItem, deleteItem } = useItems(id!)
  const [showShareModal, setShowShareModal] = useState(false)
  const [copied, setCopied] = useState(false)

  const loading = listLoading || itemsLoading
  const error = listError || itemsError

  const handleAddItem = async (name: string, quantity?: string, notes?: string) => {
    await addItem(name, quantity, notes)
    // Refetch list to get updated status (in case trigger changed it)
    refetchList()
  }

  const handleToggleItem = async (itemId: string) => {
    await toggleItem(itemId)
    // Refetch list to get updated status
    refetchList()
  }

  const handleDeleteItem = async (itemId: string) => {
    await deleteItem(itemId)
    refetchList()
  }

  const handleArchive = async () => {
    await archiveList()
  }

  const handleActivate = async () => {
    await activateList()
  }

  const shareUrl = list ? `${window.location.origin}/join/${list.share_token}` : ''

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (error || !list) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-md mx-auto">
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4">
            {error || 'List not found'}
          </div>
          <Link to="/" className="text-blue-600 hover:underline">
            Back to lists
          </Link>
        </div>
      </div>
    )
  }

  const uncheckedItems = items.filter((i) => !i.checked)
  const checkedItems = items.filter((i) => i.checked)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-gray-600 hover:text-gray-900">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">{list.name}</h1>
              {list.notes && (
                <p className="text-sm text-gray-500">{list.notes}</p>
              )}
            </div>
            <button
              onClick={() => setShowShareModal(true)}
              className="p-2 text-gray-500 hover:text-blue-600"
              title="Share list"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              list.status === 'completed'
                ? 'bg-green-100 text-green-700'
                : list.status === 'archived'
                ? 'bg-gray-100 text-gray-600'
                : 'bg-blue-100 text-blue-700'
            }`}>
              {list.status}
            </span>
          </div>
        </div>
      </header>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-sm w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Share list</h2>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Anyone with this link can join and edit this list.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm text-gray-600"
              />
              <button
                onClick={handleCopyLink}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 text-sm"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="max-w-md mx-auto p-4">
        {/* Status actions */}
        {list.status === 'archived' ? (
          <div className="mb-4 p-3 bg-gray-100 rounded-lg flex items-center justify-between">
            <span className="text-sm text-gray-600">This list is archived</span>
            <button
              onClick={handleActivate}
              className="text-sm text-blue-600 hover:underline font-medium"
            >
              Restore
            </button>
          </div>
        ) : (
          <div className="mb-4 flex justify-end">
            <button
              onClick={handleArchive}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Archive list
            </button>
          </div>
        )}

        {/* Add item form - only show if not archived */}
        {list.status !== 'archived' && (
          <AddItemForm onAdd={handleAddItem} />
        )}

        {/* Items list */}
        {items.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No items yet. Add your first item above.
          </div>
        ) : (
          <div className="space-y-6">
            {/* Unchecked items */}
            {uncheckedItems.length > 0 && (
              <ul className="space-y-2">
                {uncheckedItems.map((item) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    onToggle={() => handleToggleItem(item.id)}
                    onDelete={() => handleDeleteItem(item.id)}
                  />
                ))}
              </ul>
            )}

            {/* Checked items */}
            {checkedItems.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  Checked ({checkedItems.length})
                </h3>
                <ul className="space-y-2">
                  {checkedItems.map((item) => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      onToggle={() => handleToggleItem(item.id)}
                      onDelete={() => handleDeleteItem(item.id)}
                    />
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
