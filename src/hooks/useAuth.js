import {
  useEffect,
  useState,
} from 'react'

import { supabase } from '../lib/supabase'

export function useAuth() {
  const [
    session,
    setSession,
  ] = useState(null)

  const [
    profile,
    setProfile,
  ] = useState(null)

  const [
    loading,
    setLoading,
  ] = useState(true)

  useEffect(() => {
    let mounted = true

    async function loadInitialSession() {
      const {
        data: {
          session:
            initialSession,
        },
      } =
        await supabase.auth.getSession()

      if (!mounted) {
        return
      }

      setSession(
        initialSession,
      )

      if (
        initialSession?.user
      ) {
        await loadProfile(
          initialSession.user,
        )
      }

      if (mounted) {
        setLoading(false)
      }
    }

    async function loadProfile(user) {
      const {
        data,
        error,
      } = await supabase
        .from('profiles')
        .select(
          'id, name, email, role',
        )
        .eq(
          'id',
          user.id,
        )
        .single()

      if (!mounted) {
        return
      }

      if (error) {
        console.error(
          'Could not load profile:',
          error,
        )

        setProfile({
          id: user.id,

          name:
            user.user_metadata
              ?.name ||
            user.email?.split(
              '@',
            )[0] ||
            'Player',

          email:
            user.email || '',

          role: 'player',
        })

        return
      }

      setProfile(data)
    }

    loadInitialSession()

    const {
      data: {
        subscription,
      },
    } =
      supabase.auth.onAuthStateChange(
        async (
          _event,
          newSession,
        ) => {
          setSession(
            newSession,
          )

          if (
            newSession?.user
          ) {
            await loadProfile(
              newSession.user,
            )
          } else {
            setProfile(null)
          }

          if (mounted) {
            setLoading(false)
          }
        },
      )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const isAdmin =
    profile?.role === 'admin'

  return {
    session,
    profile,
    isAdmin,
    loading,
  }
}