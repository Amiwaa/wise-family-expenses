'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getData, StorageKeys, deleteTransaction } from '@/lib/storage'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'

export default function SavingsScreen() {
  const [savings, setSavings] = useState<any[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    const savingsData = getData(StorageKeys.SAVINGS) || []
    setSavings(savingsData)
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this savings entry?')) {
      deleteTransaction('saving', id)
      loadData()
    }
  }

  const sortedSavings = [...savings].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  const totalAmount = savings.reduce(
    (sum, s) => sum + (parseFloat(s.amount) || 0),
    0
  )

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-indigo-600 text-white p-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-white">
            ←
          </Link>
          <h1 className="text-xl font-bold">Savings</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Summary Card */}
        <div className="bg-green-50 rounded-xl p-4">
          <p className="text-xs text-gray-600 mb-1">Total Savings</p>
          <p className="text-3xl font-bold text-gray-900">{formatCurrency(totalAmount)}</p>
          <p className="text-xs text-gray-500 mt-1">
            {savings.length} entr{savings.length !== 1 ? 'ies' : 'y'}
          </p>
        </div>

        {/* Savings List */}
        {sortedSavings.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <p className="text-gray-500 mb-2">No savings recorded</p>
            <p className="text-sm text-gray-400">
              Tap the + button to add your first savings entry
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedSavings.map((saving) => (
              <div key={saving.id} className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 mb-1">
                      {saving.description || 'No description'}
                    </p>
                    <p className="text-xs text-gray-500 mb-1">
                      {format(new Date(saving.createdAt), 'MMM dd, yyyy')}
                      {saving.addedBy && ` • Added by ${saving.addedBy}`}
                    </p>
                    {saving.goal && (
                      <p className="text-xs text-indigo-600 font-medium">
                        Goal: {formatCurrency(parseFloat(saving.goal || 0))}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-xl font-bold text-green-600">
                      {formatCurrency(parseFloat(saving.amount || 0))}
                    </p>
                    <div className="flex gap-1">
                      <Link
                        href={`/add-transaction?type=saving&edit=${saving.id}`}
                        className="p-1 text-gray-400 hover:text-indigo-600"
                      >
                        ✏️
                      </Link>
                      <button
                        onClick={() => handleDelete(saving.id)}
                        className="p-1 text-gray-400 hover:text-red-600"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Link
        href="/add-transaction?type=saving"
        className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-lg flex items-center justify-center text-2xl hover:bg-indigo-700 transition-colors z-50"
      >
        +
      </Link>
    </div>
  )
}



