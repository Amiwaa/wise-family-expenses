'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { setData, StorageKeys } from '@/lib/storage'

const teasers = [
  {
    title: 'Track Family Expenses',
    description: 'Easily categorize and track all your family expenses in one place',
    icon: '💰',
  },
  {
    title: 'Manage Savings',
    description: 'Keep track of your savings goals and progress',
    icon: '💵',
  },
  {
    title: 'Family Collaboration',
    description: 'Add multiple family members to track expenses together',
    icon: '👨‍👩‍👧‍👦',
  },
  {
    title: 'Custom Categories',
    description: 'Create your own expense and savings categories',
    icon: '📊',
  },
]

export default function WelcomeScreen() {
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(0)
  const [dontShowAgain, setDontShowAgain] = useState(false)

  const handleNext = () => {
    if (currentPage < teasers.length - 1) {
      setCurrentPage(currentPage + 1)
    } else {
      handleFinish()
    }
  }

  const handleSkip = () => {
    handleFinish()
  }

  const handleFinish = () => {
    if (dontShowAgain) {
      setData(StorageKeys.HAS_LAUNCHED, 'true')
    }
    // Reload to let parent component re-evaluate routing
    window.location.href = '/auth'
  }

  return (
    <div className="min-h-screen gradient-primary flex flex-col">
      <div className="flex-1 flex items-center justify-center px-10">
        <div className="text-center">
          <div className="w-32 h-32 mx-auto mb-8 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-6xl">{teasers[currentPage].icon}</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-5">
            {teasers[currentPage].title}
          </h1>
          <p className="text-lg text-white/90 leading-relaxed">
            {teasers[currentPage].description}
          </p>
        </div>
      </div>

      <div className="flex justify-center gap-2 mb-6">
        {teasers.map((_, index) => (
          <div
            key={index}
            className={`h-2 rounded-full transition-all ${
              index === currentPage
                ? 'w-6 bg-white'
                : 'w-2 bg-white/40'
            }`}
          />
        ))}
      </div>

      <div className="px-5 pb-10">
        <div className="flex items-center justify-center mb-6">
          <input
            type="checkbox"
            id="dontShow"
            checked={dontShowAgain}
            onChange={(e) => setDontShowAgain(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <label
            htmlFor="dontShow"
            className="ml-2 text-white text-sm cursor-pointer"
          >
            Don't show this again
          </label>
        </div>

        <div className="flex gap-3">
          {currentPage < teasers.length - 1 && (
            <button
              onClick={handleSkip}
              className="flex-1 py-3 px-4 text-white font-medium rounded-lg hover:bg-white/10 transition-colors"
            >
              Skip
            </button>
          )}
          <button
            onClick={handleNext}
            className="flex-2 bg-white text-indigo-600 font-bold py-3 px-6 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {currentPage === teasers.length - 1 ? 'Get Started' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}

