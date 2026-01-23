import { createContext, useContext, useEffect, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

type AuthContextType = {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

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
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        processPendingInvites(session.user)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        // Process invites on sign in
        if (event === 'SIGNED_IN' && session?.user) {
          processPendingInvites(session.user)
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
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
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
