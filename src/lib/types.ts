export type Theme = 'light' | 'dark' | 'system'

export type Profile = {
  id: string
  email: string
  display_name: string | null
  theme_preference: Theme
  created_at: string
  updated_at: string
}

export type List = {
  id: string
  name: string
  notes: string | null
  status: 'active' | 'completed' | 'archived'
  created_by: string
  created_at: string
  share_token: string
}

export type ListMember = {
  list_id: string
  user_id: string
  role: 'owner' | 'editor' | 'viewer'
  joined_at: string
}

export type Item = {
  id: string
  list_id: string
  name: string
  quantity: string | null
  notes: string | null
  checked: boolean
  added_by: string | null
  position: number
  created_at: string
  updated_at: string
  image_url: string | null
}

export type ListInvite = {
  id: string
  list_id: string
  email: string
  invited_by: string
  created_at: string
}
