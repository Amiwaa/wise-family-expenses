'use client'

import { useEffect, useState } from 'react'

export default function PWAChecker() {
  const [pwaStatus, setPwaStatus] = useState<{
    manifest: boolean
    serviceWorker: boolean
    installable: boolean
    displayMode: string
  } | null>(null)

  useEffect(() => {
    const checkPWA = async () => {
      const status = {
        manifest: false,
        serviceWorker: false,
        installable: false,
        displayMode: 'browser',
      }

      // Check manifest
      try {
        const manifestResponse = await fetch('/manifest.json')
        if (manifestResponse.ok) {
          const manifest = await manifestResponse.json()
          status.manifest = true
          status.displayMode = manifest.display || 'browser'
        }
      } catch (e) {
        console.error('Manifest check failed:', e)
      }

      // Check service worker
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.getRegistration()
          status.serviceWorker = !!registration
        } catch (e) {
          console.error('Service worker check failed:', e)
        }
      }

      // Check if installable
      if ('serviceWorker' in navigator && status.serviceWorker && status.manifest) {
        status.installable = true
      }

      setPwaStatus(status)
      
      // Log to console for debugging
      console.log('PWA Status:', status)
      console.log('Service Worker Registered:', status.serviceWorker)
      console.log('Manifest Found:', status.manifest)
      console.log('Display Mode:', status.displayMode)
    }

    checkPWA()
  }, [])

  // Only show in development or if there's an issue
  if (process.env.NODE_ENV === 'production') {
    return null
  }

  if (!pwaStatus) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg border text-sm z-50 max-w-xs">
      <h3 className="font-bold mb-2">PWA Status</h3>
      <div className="space-y-1">
        <div>Manifest: {pwaStatus.manifest ? '✅' : '❌'}</div>
        <div>Service Worker: {pwaStatus.serviceWorker ? '✅' : '❌'}</div>
        <div>Installable: {pwaStatus.installable ? '✅' : '❌'}</div>
        <div>Display: {pwaStatus.displayMode}</div>
      </div>
    </div>
  )
}

