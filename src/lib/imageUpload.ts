import { supabase } from './supabase'

const BUCKET_NAME = 'item-images'
const MAX_WIDTH = 1200
const MAX_HEIGHT = 1200
const JPEG_QUALITY = 0.8

export async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    img.onload = () => {
      let { width, height } = img

      // Calculate new dimensions maintaining aspect ratio
      if (width > MAX_WIDTH || height > MAX_HEIGHT) {
        const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }

      canvas.width = width
      canvas.height = height

      if (!ctx) {
        reject(new Error('Failed to get canvas context'))
        return
      }

      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to compress image'))
          }
        },
        'image/jpeg',
        JPEG_QUALITY
      )
    }

    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = URL.createObjectURL(file)
  })
}

export async function uploadItemImage(
  file: File,
  itemId: string
): Promise<{ url: string | null; error: Error | null }> {
  try {
    const compressed = await compressImage(file)
    const fileName = `${itemId}/${Date.now()}.jpg`

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, compressed, {
        contentType: 'image/jpeg',
        upsert: false,
      })

    if (uploadError) {
      return { url: null, error: uploadError }
    }

    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName)

    return { url: urlData.publicUrl, error: null }
  } catch (err) {
    return { url: null, error: err as Error }
  }
}

export async function deleteItemImage(
  imageUrl: string
): Promise<{ error: Error | null }> {
  try {
    // Extract path from URL
    const url = new URL(imageUrl)
    const pathParts = url.pathname.split(`/${BUCKET_NAME}/`)
    if (pathParts.length < 2) {
      return { error: new Error('Invalid image URL') }
    }

    const filePath = pathParts[1]

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath])

    if (error) {
      return { error }
    }

    return { error: null }
  } catch (err) {
    return { error: err as Error }
  }
}

export async function deleteAllItemImages(
  itemId: string
): Promise<{ error: Error | null }> {
  try {
    const { data: files, error: listError } = await supabase.storage
      .from(BUCKET_NAME)
      .list(itemId)

    if (listError) {
      return { error: listError }
    }

    if (!files || files.length === 0) {
      return { error: null }
    }

    const filePaths = files.map((file) => `${itemId}/${file.name}`)

    const { error: deleteError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove(filePaths)

    if (deleteError) {
      return { error: deleteError }
    }

    return { error: null }
  } catch (err) {
    return { error: err as Error }
  }
}
