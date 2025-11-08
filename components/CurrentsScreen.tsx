'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getData, StorageKeys, deleteTransaction } from '@/lib/storage'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'

export default function CurrentsScreen() {
  const [currents, setCurrents] = useState<any[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    const currentsData = getData(StorageKeys.CURRENTS) || []
    setCurrents(currentsData)
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this entry?')) {
      deleteTransaction('current', id)
      loadData()
    }
  }

  const sortedCurrents = [...currents].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  const totalAmount = currents.reduce(
    (sum, c) => sum + (parseFloat(c.amount) || 0),
    0
  )

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-indigo-600 text-white p-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-white">
            ←
          </Link>
          <h1 className="text-xl font-bold">Current Account</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Summary Card */}
        <div className="bg-blue-50 rounded-xl p-4">
          <p className="text-xs text-gray-600 mb-1">Current Account Balance</p>
          <p className="text-3xl font-bold text-gray-900">{formatCurrency(totalAmount)}</p>
          <p className="text-xs text-gray-500 mt-1">
            {currents.length} entr{currents.length !== 1 ? 'ies' : 'y'}
          </p>
        </div>

        {/* Currents List */}
        {sortedCurrents.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <p className="text-gray-500 mb-2">No current account entries</p>
            <p className="text-sm text-gray-400">
              Tap the + button to add your first entry
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedCurrents.map((current) => (
              <div key={current.id} className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 mb-1">
                      {current.description || 'No description'}
                    </p>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          current.type === 'credit'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {current.type === 'credit' ? 'Credit' : 'Debit'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {format(new Date(current.createdAt), 'MMM dd, yyyy')}
                      </span>
                    </div>
                    {current.addedBy && (
                      <p className="text-xs text-gray-400 italic">
                        Added by {current.addedBy}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <p
                      className={`text-xl font-bold ${
                        current.type === 'credit' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {current.type === 'credit' ? '+' : '-'}
                      {formatCurrency(parseFloat(current.amount || 0))}
                    </p>
                    <div className="flex gap-1">
                      <Link
                        href={`/add-transaction?type=current&edit=${current.id}`}
                        className="p-1 text-gray-400 hover:text-indigo-600"
                      >
                        ✏️
                      </Link>
                      <button
                        onClick={() => handleDelete(current.id)}
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
        href="/add-transaction?type=current"
        className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-lg flex items-center justify-center text-2xl hover:bg-indigo-700 transition-colors z-50"
      >
        +
      </Link>
    </div>
  )
}



