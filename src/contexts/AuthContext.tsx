import { createContext, useContext, useEffect, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Profile } from '../lib/types'

type AuthContextType = {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Pick<Profile, 'display_name' | 'theme_preference'>>) => Promise<{ error: Error | null }>
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>
  deleteAccount: () => Promise<{ error: Error | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch user profile
  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (!error && data) {
      setProfile(data as Profile)
    }
    return data as Profile | null
  }

  // Process pending email invites for a user
  const processPendingInvites = async (user: User) => {
    if (!user.email) return

    // Find invites for this email
    const { data: invites } = await supabase
      .from('list_invites')
      .select('id, list_id')
      .eq('email', user.email.toLowerCase())

    if (!invites || invites.length === 0) return

    // Add user to each list and delete the invite
    for (const invite of invites) {
      // Check if already a member
      const { data: existing } = await supabase
        .from('list_members')
        .select('list_id')
        .eq('list_id', invite.list_id)
        .eq('user_id', user.id)
        .single()

      if (!existing) {
        // Add as editor
        await supabase
          .from('list_members')
          .insert({
            list_id: invite.list_id,
            user_id: user.id,
            role: 'editor',
          })
      }

      // Delete the invite
      await supabase
        .from('list_invites')
        .delete()
        .eq('id', invite.id)
    }
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        await fetchProfile(session.user.id)
        processPendingInvites(session.user)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          await fetchProfile(session.user.id)
          // Process invites on sign in
          if (event === 'SIGNED_IN') {
            processPendingInvites(session.user)
          }
        } else {
          setProfile(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password })
    return { error }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  const signOut = async () => {
    setProfile(null)
    await supabase.auth.signOut()
  }

  const updateProfile = async (updates: Partial<Pick<Profile, 'display_name' | 'theme_preference'>>) => {
    if (!user) return { error: new Error('Not authenticated') }

    const { error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', user.id)

    if (!error) {
      setProfile(prev => prev ? { ...prev, ...updates } : null)
    }

    return { error }
  }

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    return { error }
  }

  const deleteAccount = async () => {
    if (!user) return { error: new Error('Not authenticated') }

    // Delete user's data first (lists they own, etc.)
    // Note: RLS policies should cascade delete list_members when lists are deleted
    // But we need to delete lists owned by this user
    const { error: listsError } = await supabase
      .from('lists')
      .delete()
      .eq('created_by', user.id)

    if (listsError) {
      return { error: listsError }
    }

    // Remove from list_members (where they're not owner)
    await supabase
      .from('list_members')
      .delete()
      .eq('user_id', user.id)

    // Delete profile
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', user.id)

    if (profileError) {
      return { error: profileError }
    }

    // Sign out (this won't delete the auth user, but they won't be able to use the app)
    // Note: Deleting auth.users requires admin access or a server function
    await supabase.auth.signOut()

    return { error: null }
  }

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      loading,
      signUp,
      signIn,
      signOut,
      updateProfile,
      updatePassword,
      deleteAccount
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
