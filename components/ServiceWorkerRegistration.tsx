'use client'

import { useEffect } from 'react'

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    // Only register service worker in production (not in development)
    // In development, next-pwa is disabled, so sw.js won't exist
    if (typeof window === 'undefined') {
      return // Server-side rendering
    }

    // Check if service worker is supported
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Workers are not supported in this browser.')
      return
    }

    // Only register if we're not in development mode
    // In Next.js, we can check if we're on localhost
    const isLocalhost = window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1' ||
                        window.location.hostname.startsWith('192.168.')
    
    if (isLocalhost) {
      console.log('Skipping service worker registration in development/localhost')
      return
    }

    // Register service worker
    const registerSW = async () => {
      try {
        // First, check if the service worker file exists
        const swResponse = await fetch('/sw.js', { method: 'HEAD' })
        if (!swResponse.ok) {
          console.warn('Service worker file not found. PWA may not be enabled.')
          return
        }

        // Register the service worker
        const registration = await navigator.serviceWorker.register('/sw.js', { 
          scope: '/' 
        })

        console.log('✅ Service Worker registered successfully:', registration.scope)
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('🔄 New service worker available. Reload to update.')
              }
            })
          }
        })

        // Periodic update check (every hour)
        setInterval(() => {
          registration.update()
        }, 60 * 60 * 1000)
      } catch (error: any) {
        console.error('❌ Service Worker registration failed:', error)
        console.error('Error details:', error.message)
      }
    }

    // Wait a bit for the page to load before registering
    // This ensures all resources are loaded
    const timeoutId = setTimeout(() => {
      registerSW()
    }, 1000)

    // Also try to register immediately
    registerSW()

    // Listen for service worker controller changes
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('🔄 Service Worker controller changed')
    })

    return () => {
      clearTimeout(timeoutId)
    }
  }, [])

  return null // This component doesn't render anything
}

