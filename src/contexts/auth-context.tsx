'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface Profile {
  id: string
  telegram_id?: number
  full_name?: string
  username?: string
  avatar_url?: string
  timezone?: string
  language?: string
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName: string) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<void>
  signInWithTelegram: (telegramId: number, telegramData?: any) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  // Load initial session
  useEffect(() => {
    const getInitialSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error) {
        console.error('Error getting session:', error)
      } else {
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          await loadProfile(session.user.id)
        }
      }

      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: any, session: any) => {
        console.log('Auth state changed:', event, session?.user?.id)

        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          await loadProfile(session.user.id)
        } else {
          setProfile(null)
        }

        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const loadProfile = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error && error.code !== 'PGRST116') { // Not found error
        console.error('Error loading profile:', error)
        return
      }

      setProfile(profile)
    } catch (error) {
      console.error('Error in loadProfile:', error)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      const { toast } = await import('@/components/ui/toast')
      toast({
        title: "ورود موفق",
        description: "به داشبورد خود خوش آمدید!",
        variant: "success",
      })
    } catch (error) {
      console.error('Sign in error:', error)
      const { toast } = await import('@/components/ui/toast')
      toast({
        title: "خطا در ورود",
        description: error instanceof Error ? error.message : "خطای نامشخص",
        variant: "destructive",
      })
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (error) throw error

      const { toast } = await import('@/components/ui/toast')
      toast({
        title: "ثبت‌نام موفق",
        description: "لطفا ایمیل خود را بررسی کنید",
        variant: "success",
      })
    } catch (error) {
      console.error('Sign up error:', error)
      const { toast } = await import('@/components/ui/toast')
      toast({
        title: "خطا در ثبت‌نام",
        description: error instanceof Error ? error.message : "خطای نامشخص",
        variant: "destructive",
      })
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()

      if (error) throw error

      const { toast } = await import('@/components/ui/toast')
      toast({
        title: "خروج موفق",
        description: "تا دیدار بعدی!",
        variant: "success",
      })
    } catch (error) {
      console.error('Sign out error:', error)
      const { toast } = await import('@/components/ui/toast')
      toast({
        title: "خطا در خروج",
        description: error instanceof Error ? error.message : "خطای نامشخص",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) throw new Error('No user logged in')

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...updates,
          updated_at: new Date().toISOString(),
        })

      if (error) throw error

      // Reload profile
      await loadProfile(user.id)

      const { toast } = await import('@/components/ui/toast')
      toast({
        title: "پروفایل بروزرسانی شد",
        description: "تغییرات شما ذخیره گردید",
        variant: "success",
      })
    } catch (error) {
      console.error('Update profile error:', error)
      const { toast } = await import('@/components/ui/toast')
      toast({
        title: "خطا در بروزرسانی",
        description: error instanceof Error ? error.message : "خطای نامشخص",
        variant: "destructive",
      })
      throw error
    }
  }

  const signInWithTelegram = async (telegramId: number, telegramData?: any) => {
    try {
      setLoading(true)

      // Check if user already exists
      let { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('telegram_id', telegramId)
        .single()

      let userId: string

      if (existingProfile) {
        userId = existingProfile.id
      } else {
        // Create new user account
        const email = `telegram_${telegramId}@taskbot.local`
        const password = `telegram_${telegramId}_${Date.now()}`

        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              telegram_id: telegramId,
              full_name: telegramData?.first_name || 'Telegram User',
              username: telegramData?.username,
            },
          },
        })

        if (authError) throw authError

        userId = authData.user!.id

        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            telegram_id: telegramId,
            full_name: telegramData?.first_name || 'Telegram User',
            username: telegramData?.username,
          })

        if (profileError) throw profileError
      }

      // Sign in the user
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: `telegram_${telegramId}@taskbot.local`,
        password: `telegram_${telegramId}_${Date.now()}`,
      })

      if (signInError) throw signInError

    } catch (error) {
      console.error('Telegram sign in error:', error)
      const { toast } = await import('@/components/ui/toast')
      toast({
        title: "خطا در ورود با تلگرام",
        description: error instanceof Error ? error.message : "خطای نامشخص",
        variant: "destructive",
      })
      throw error
    } finally {
      setLoading(false)
    }
  }

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    signInWithTelegram,
  }

  return (
    <AuthContext.Provider value={value}>
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

// Hook for checking authentication status
export function useRequireAuth() {
  const { user, loading } = useAuth()

  if (loading) {
    return { loading: true, user: null }
  }

  if (!user) {
    throw new Error('Authentication required')
  }

  return { loading: false, user }
}
