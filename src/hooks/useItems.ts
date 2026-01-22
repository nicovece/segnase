import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Item } from '../lib/types'

export function useItems(listId: string) {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchItems = async () => {
    setLoading(true)
    setError(null)

    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('list_id', listId)
      .order('position', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) {
      setError(error.message)
    } else {
      setItems(data || [])
    }

    setLoading(false)
  }

  useEffect(() => {
    if (listId) {
      fetchItems()
    }
  }, [listId])

  // Real-time subscription
  useEffect(() => {
    if (!listId) return

    const channel = supabase
      .channel(`items-${listId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'items',
          filter: `list_id=eq.${listId}`,
        },
        (payload) => {
          setItems((prev) => {
            // Avoid duplicates (in case we already added it optimistically)
            if (prev.some((item) => item.id === payload.new.id)) return prev
            return [...prev, payload.new as Item]
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'items',
          filter: `list_id=eq.${listId}`,
        },
        (payload) => {
          setItems((prev) =>
            prev.map((item) =>
              item.id === payload.new.id ? (payload.new as Item) : item
            )
          )
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'items',
          filter: `list_id=eq.${listId}`,
        },
        (payload) => {
          setItems((prev) => prev.filter((item) => item.id !== payload.old.id))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [listId])

  const addItem = async (name: string, quantity?: string, notes?: string) => {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: new Error('Not authenticated') }
    }

    // Get max position
    const maxPosition = items.length > 0
      ? Math.max(...items.map(i => i.position)) + 1
      : 0

    const { data, error } = await supabase
      .from('items')
      .insert({
        list_id: listId,
        name,
        quantity: quantity || null,
        notes: notes || null,
        added_by: user.id,
        position: maxPosition,
      })
      .select()
      .single()

    if (error) {
      return { error }
    }

    setItems((prev) => [...prev, data])
    return { data, error: null }
  }

  const updateItem = async (id: string, updates: Partial<Pick<Item, 'name' | 'quantity' | 'notes' | 'checked'>>) => {
    const { data, error } = await supabase
      .from('items')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return { error }
    }

    setItems((prev) => prev.map((item) => (item.id === id ? data : item)))
    return { data, error: null }
  }

  const toggleItem = async (id: string) => {
    const item = items.find((i) => i.id === id)
    if (!item) return { error: new Error('Item not found') }

    return updateItem(id, { checked: !item.checked })
  }

  const deleteItem = async (id: string) => {
    const { error } = await supabase
      .from('items')
      .delete()
      .eq('id', id)

    if (error) {
      return { error }
    }

    setItems((prev) => prev.filter((item) => item.id !== id))
    return { error: null }
  }

  return {
    items,
    loading,
    error,
    addItem,
    updateItem,
    toggleItem,
    deleteItem,
    refetch: fetchItems,
  }
}
