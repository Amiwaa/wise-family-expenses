'use client'

import { useEffect, useState } from 'react'

export default function PWACheckPage() {
  const [status, setStatus] = useState<{
    manifest: boolean
    serviceWorker: boolean
    serviceWorkerControlling: boolean
    installable: boolean
    displayMode: string
    errors: string[]
  }>({
    manifest: false,
    serviceWorker: false,
    serviceWorkerControlling: false,
    installable: false,
    displayMode: 'unknown',
    errors: [],
  })

  useEffect(() => {
    const checkPWA = async () => {
      const errors: string[] = []
      let manifest = false
      let serviceWorker = false
      let serviceWorkerControlling = false
      let installable = false
      let displayMode = 'unknown'

      // Check manifest
      try {
        const manifestResponse = await fetch('/manifest.json')
        if (manifestResponse.ok) {
          const manifestData = await manifestResponse.json()
          manifest = true
          displayMode = manifestData.display || 'browser'
          
          // Validate required fields
          if (!manifestData.name) errors.push('Manifest missing "name"')
          if (!manifestData.short_name) errors.push('Manifest missing "short_name"')
          if (!manifestData.icons || manifestData.icons.length === 0) {
            errors.push('Manifest missing icons')
          }
          if (!manifestData.start_url) errors.push('Manifest missing "start_url"')
        } else {
          errors.push(`Manifest not found (${manifestResponse.status})`)
        }
      } catch (e: any) {
        errors.push(`Manifest check failed: ${e.message}`)
      }

      // Check service worker
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.getRegistration()
          serviceWorker = !!registration
          if (!serviceWorker) {
            errors.push('Service worker not registered')
          } else {
            // Check if service worker is controlling the page
            serviceWorkerControlling = !!navigator.serviceWorker.controller
            if (!serviceWorkerControlling) {
              errors.push('Service worker registered but not controlling the page. Try reloading the page.')
            }
            // Check service worker state
            if (registration.active) {
              console.log('Service Worker state: active')
              if (!serviceWorkerControlling) {
                console.log('⚠️ Service Worker is active but not controlling. Page needs reload.')
              }
            } else if (registration.waiting) {
              errors.push('Service worker is waiting. It may need to be activated.')
            } else if (registration.installing) {
              errors.push('Service worker is installing. Wait for it to activate.')
            }
          }
        } catch (e: any) {
          errors.push(`Service worker check failed: ${e.message}`)
        }
      } else {
        errors.push('Service Worker API not supported')
      }

      // Check if installable
      // For proper installation, service worker must be registered AND controlling the page
      if (manifest && serviceWorker && serviceWorkerControlling) {
        installable = true
      } else if (manifest && serviceWorker && !serviceWorkerControlling) {
        errors.push('Service worker is registered but not controlling. Reload the page to activate it.')
      }

      setStatus({
        manifest,
        serviceWorker,
        serviceWorkerControlling,
        installable,
        displayMode,
        errors,
      })
    }

    checkPWA()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-4">PWA Status Check</h1>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <span className="font-semibold">Manifest</span>
            <span className={status.manifest ? 'text-green-600' : 'text-red-600'}>
              {status.manifest ? '✅ Found' : '❌ Not Found'}
            </span>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <span className="font-semibold">Service Worker</span>
            <span className={status.serviceWorker ? 'text-green-600' : 'text-red-600'}>
              {status.serviceWorker ? '✅ Registered' : '❌ Not Registered'}
            </span>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <span className="font-semibold">Service Worker Controlling</span>
            <span className={status.serviceWorkerControlling ? 'text-green-600' : 'text-yellow-600'}>
              {status.serviceWorkerControlling ? '✅ Yes' : '⚠️ No (reload page)'}
            </span>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <span className="font-semibold">Display Mode</span>
            <span className="text-blue-600">{status.displayMode}</span>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <span className="font-semibold">Installable</span>
            <span className={status.installable ? 'text-green-600' : 'text-red-600'}>
              {status.installable ? '✅ Yes' : '❌ No'}
            </span>
          </div>

          {status.errors.length > 0 && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h2 className="font-semibold text-red-800 mb-2">Issues Found:</h2>
              <ul className="list-disc list-inside text-red-700 space-y-1">
                {status.errors.map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {status.installable && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800">
                ✅ Your PWA is properly configured! You should be able to install it as a standalone app (not just a shortcut).
              </p>
            </div>
          )}

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h2 className="font-semibold text-blue-800 mb-2">How to Install:</h2>
            <ol className="list-decimal list-inside text-blue-700 space-y-1">
              <li>Open the browser menu (three dots ☰)</li>
              <li>Tap "Add to Home screen" or "Install app"</li>
              <li>If it creates a shortcut instead of an app, the service worker may not be active yet</li>
              <li>Try refreshing the page and waiting a few seconds for the service worker to register</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}

