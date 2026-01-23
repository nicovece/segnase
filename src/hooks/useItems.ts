import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Item } from '../lib/types'
import { uploadItemImage, deleteItemImage, deleteAllItemImages } from '../lib/imageUpload'

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

  const addItem = async (name: string, quantity?: string, notes?: string, imageFile?: File) => {
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

    // Upload image if provided
    let imageUrl: string | null = null
    if (imageFile) {
      const { url, error: uploadError } = await uploadItemImage(imageFile, data.id)
      if (uploadError) {
        console.error('Failed to upload image:', uploadError)
      } else {
        imageUrl = url
        // Update item with image URL
        const { error: updateError } = await supabase
          .from('items')
          .update({ image_url: imageUrl })
          .eq('id', data.id)

        if (!updateError) {
          data.image_url = imageUrl
        }
      }
    }

    setItems((prev) => [...prev, data])
    return { data, error: null }
  }

  const updateItem = async (id: string, updates: Partial<Pick<Item, 'name' | 'quantity' | 'notes' | 'checked' | 'image_url'>>) => {
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
    // Delete images from storage first
    await deleteAllItemImages(id)

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

  const uploadImage = async (itemId: string, imageFile: File) => {
    const { url, error: uploadError } = await uploadItemImage(imageFile, itemId)
    if (uploadError) {
      return { error: uploadError }
    }

    return updateItem(itemId, { image_url: url })
  }

  const removeImage = async (itemId: string) => {
    const item = items.find((i) => i.id === itemId)
    if (!item?.image_url) {
      return { error: null }
    }

    const { error: deleteError } = await deleteItemImage(item.image_url)
    if (deleteError) {
      console.error('Failed to delete image from storage:', deleteError)
    }

    return updateItem(itemId, { image_url: null })
  }

  return {
    items,
    loading,
    error,
    addItem,
    updateItem,
    toggleItem,
    deleteItem,
    uploadImage,
    removeImage,
    refetch: fetchItems,
  }
}
