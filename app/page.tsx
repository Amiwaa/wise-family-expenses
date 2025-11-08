'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { getData, StorageKeys } from '@/lib/storage'
import WelcomeScreen from '@/components/WelcomeScreen'
import AuthScreen from '@/components/AuthScreen'
import DashboardScreen from '@/components/DashboardScreen'

export default function Home() {
  const { data: session, status } = useSession()
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initializeApp = () => {
      try {
        const hasLaunched = getData(StorageKeys.HAS_LAUNCHED)
        setIsFirstLaunch(hasLaunched === null)
        setLoading(false)
      } catch (error) {
        console.error('Error initializing app:', error)
        setIsFirstLaunch(true)
        setLoading(false)
      }
    }

    initializeApp()
  }, [])

  // Show loading while checking session and app state
  if (loading || status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center gradient-primary">
        <div className="text-white text-2xl font-bold">Loading...</div>
      </div>
    )
  }

  // Show welcome screen on first launch
  if (isFirstLaunch) {
    return <WelcomeScreen />
  }

  // Show auth screen if not authenticated, otherwise show dashboard
  // AuthScreen will handle redirecting authenticated users who aren't in a family yet
  if (status !== 'authenticated') {
    return <AuthScreen />
  }

  return <DashboardScreen />
}

