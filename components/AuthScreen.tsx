'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signIn, useSession } from 'next-auth/react'
import { createFamily, getFamilyByEmail } from '@/lib/api'
import { setData, StorageKeys } from '@/lib/storage'

export default function AuthScreen() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [familyName, setFamilyName] = useState('')
  const [memberName, setMemberName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [creatingFamily, setCreatingFamily] = useState(false)
  const [checkingFamily, setCheckingFamily] = useState(false)

  // Redirect if already authenticated
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.email && !checkingFamily && !creatingFamily) {
      checkAndRedirect()
    }
  }, [status, session])

  const checkAndRedirect = async () => {
    if (checkingFamily) return // Prevent multiple calls
    
    setCheckingFamily(true)
    try {
      const email = session?.user?.email
      if (!email) {
        console.log('No email in session')
        setCheckingFamily(false)
        return
      }

      console.log('Checking if user is in a family...', email)
      
      // Check if user is already in a family (API uses authenticated email)
      // Add timeout to prevent hanging (5 seconds should be enough)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout after 5 seconds')), 5000)
      )
      
      const familyData = await Promise.race([
        getFamilyByEmail(),
        timeoutPromise
      ]) as any

      console.log('Family data received:', familyData ? 'Found' : 'Not found')

      if (familyData && familyData.id) {
        setData(StorageKeys.CURRENT_USER, email)
        setData(StorageKeys.FAMILY_ID, familyData.id)
        console.log('Redirecting to dashboard...')
        // Use window.location for reliable navigation after auth
        window.location.href = '/dashboard'
        return
      } else {
        // User is not in a family yet, show family creation form
        console.log('User not in a family, showing creation form')
        setCreatingFamily(true)
      }
    } catch (error: any) {
      console.log('Error checking family:', error?.message || error)
      
      // If it's a timeout or network error, show error message
      if (error?.message?.includes('timeout') || error?.message?.includes('Failed to fetch')) {
        setError('Connection timeout. Please check your internet connection and try again.')
        setCheckingFamily(false)
        return
      }
      
      // If it's a 401/403 error, the user might not be authenticated properly
      if (error?.message?.includes('401') || error?.message?.includes('Authentication')) {
        console.error('Authentication error')
        setError('Authentication error. Please try signing in again.')
        setCheckingFamily(false)
        return
      }
      
      // For 404 or "Family not found", user is not in a family yet
      if (error?.message?.includes('404') || error?.message?.includes('Family not found')) {
        console.log('User not in a family, showing creation form')
        setCreatingFamily(true)
      } else {
        // Other errors - still show creation form as fallback
        console.log('Unknown error, showing creation form as fallback')
        setCreatingFamily(true)
      }
    } finally {
      setCheckingFamily(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError('')
    setLoading(true)
    try {
      await signIn('google', { callbackUrl: '/dashboard' })
    } catch (error: any) {
      console.error('Error signing in:', error)
      setError('Failed to sign in with Google. Please try again.')
      setLoading(false)
    }
  }

  const handleCreateFamily = async () => {
    setError('')
    
    if (!familyName.trim() || !memberName.trim()) {
      setError('Please fill in all fields')
      return
    }

    if (!session?.user?.email) {
      setError('Please sign in with Google first')
      return
    }

    setLoading(true)

    try {
      const result = await createFamily(
        familyName.trim(),
        memberName.trim()
      )

      // Store user info in localStorage for quick access
      setData(StorageKeys.CURRENT_USER, session.user.email)
      setData(StorageKeys.FAMILY_ID, result.familyId)
      
      // Redirect to dashboard
      router.push('/dashboard')
    } catch (error: any) {
      console.error('Error creating family:', error)
      // Show more detailed error message
      const errorMessage = error?.message || 'Failed to create family. Please try again.'
      setError(errorMessage + ' (Check browser console and Vercel logs for details)')
      setLoading(false)
    }
  }

  // Show loading while checking session or checking family
  if (status === 'loading' || checkingFamily) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 mb-2">Loading...</div>
          {checkingFamily && (
            <div className="text-sm text-gray-400">Checking your family...</div>
          )}
        </div>
      </div>
    )
  }

  // Show family creation form if authenticated but not in a family
  if (creatingFamily) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">💰</div>
            <h1 className="text-3xl font-bold text-indigo-600 mb-2">
              Create Your Family
            </h1>
            <p className="text-gray-600">
              Signed in as {session?.user?.email}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>New here?</strong> Create a new family. 
                  <br />
                  <strong>Already a member?</strong> If a family admin added your email ({session?.user?.email}), just sign in - you'll be automatically added to your family!
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Family Name
                </label>
                <input
                  type="text"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter family name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Name
                </label>
                <input
                  type="text"
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter your name"
                  defaultValue={session?.user?.name || ''}
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  <p className="font-semibold mb-1">Error:</p>
                  <p>{error}</p>
                </div>
              )}

              <button
                onClick={handleCreateFamily}
                disabled={loading}
                className="w-full bg-indigo-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Family'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show sign in screen
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">💰</div>
          <h1 className="text-3xl font-bold text-indigo-600 mb-2">
            Wise Family Expenses
          </h1>
          <p className="text-gray-600">
            Track and manage your family finances
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="space-y-4">
            <p className="text-center text-gray-600 mb-4">
              Sign in with Google to get started
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full bg-white border-2 border-gray-300 text-gray-700 font-semibold py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {loading ? 'Signing in...' : 'Continue with Google'}
            </button>

            <p className="text-xs text-center text-gray-500 mt-4">
              By signing in, you agree to use your Google account email for family access. 
              Only family members with verified Google emails can access your family data.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

