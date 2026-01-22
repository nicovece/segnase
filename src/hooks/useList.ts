import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { List } from '../lib/types'

export function useList(listId: string) {
  const [list, setList] = useState<List | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchList = async () => {
    setLoading(true)
    setError(null)

    const { data, error } = await supabase
      .from('lists')
      .select('*')
      .eq('id', listId)
      .single()

    if (error) {
      setError(error.message)
    } else {
      setList(data)
    }

    setLoading(false)
  }

  useEffect(() => {
    if (listId) {
      fetchList()
    }
  }, [listId])

  const updateList = async (updates: Partial<Pick<List, 'name' | 'notes' | 'status'>>) => {
    const { data, error } = await supabase
      .from('lists')
      .update(updates)
      .eq('id', listId)
      .select()
      .single()

    if (error) {
      return { error }
    }

    setList(data)
    return { data, error: null }
  }

  const archiveList = async () => {
    return updateList({ status: 'archived' })
  }

  const activateList = async () => {
    return updateList({ status: 'active' })
  }

  return {
    list,
    loading,
    error,
    updateList,
    archiveList,
    activateList,
    refetch: fetchList,
  }
}
