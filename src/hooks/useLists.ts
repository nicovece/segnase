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

  const createList = async (name?: string) => {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: new Error('Not authenticated') }
    }

    // Default to today's date if no name provided
    const listName = name?.trim() || new Date().toLocaleDateString()

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
