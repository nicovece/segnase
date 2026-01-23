import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { List } from '../lib/types'

export function useLists() {
  const [lists, setLists] = useState<List[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLists = async () => {
    setLoading(true)
    setError(null)

    const { data, error } = await supabase
      .from('lists')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
    } else {
      setLists(data || [])
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchLists()
  }, [])

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('lists')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'lists',
        },
        (payload) => {
          setLists((prev) => {
            if (prev.some((list) => list.id === payload.new.id)) return prev
            return [payload.new as List, ...prev]
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'lists',
        },
        (payload) => {
          setLists((prev) =>
            prev.map((list) =>
              list.id === payload.new.id ? (payload.new as List) : list
            )
          )
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'lists',
        },
        (payload) => {
          setLists((prev) => prev.filter((list) => list.id !== payload.old.id))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const createList = async (name?: string) => {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: new Error('Not authenticated') }
    }

    // Default to current date/time if no name provided
    const formatDateTime = (date: Date) => {
      const day = date.getDate()
      const month = date.toLocaleString('en', { month: 'short' })
      const hours = date.getHours().toString().padStart(2, '0')
      const minutes = date.getMinutes().toString().padStart(2, '0')
      return `${day} ${month}, ${hours}:${minutes}`
    }
    const listName = name?.trim() || formatDateTime(new Date())

    const { data, error } = await supabase
      .from('lists')
      .insert({ name: listName, created_by: user.id })
      .select()
      .single()

    if (error) {
      return { error }
    }

    setLists((prev) => [data, ...prev])
    return { data, error: null }
  }

  const deleteList = async (id: string) => {
    const { error } = await supabase
      .from('lists')
      .delete()
      .eq('id', id)

    if (error) {
      return { error }
    }

    setLists((prev) => prev.filter((list) => list.id !== id))
    return { error: null }
  }

  return {
    lists,
    loading,
    error,
    createList,
    deleteList,
    refetch: fetchLists,
  }
}
